package provider

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/scripd-app/scripd/internal/book"
)

const googleBooksEndpoint = "https://www.googleapis.com/books/v1/volumes"

var (
	googleScriptStylePattern = regexp.MustCompile(`(?is)<(script|style)[^>]*>.*?</(script|style)>`)
	googleTagPattern         = regexp.MustCompile(`<[^>]*>`)
	googleWhitespacePattern  = regexp.MustCompile(`\s+`)
	googleNonWordPattern     = regexp.MustCompile(`[^a-z0-9]+`)
)

type GoogleBooks struct {
	client *http.Client
	apiKey string
}

func NewGoogleBooks(client *http.Client, apiKey string) *GoogleBooks {
	if client == nil {
		client = &http.Client{Timeout: 6 * time.Second}
	}
	return &GoogleBooks{client: client, apiKey: strings.TrimSpace(apiKey)}
}

func (p *GoogleBooks) Lookup(ctx context.Context, lookup book.DescriptionLookup) (book.DescriptionResult, error) {
	if p.apiKey == "" {
		return book.DescriptionResult{}, book.ErrDescriptionUnavailable
	}

	if isbn := normalizeISBN(lookup.ISBN13); len(isbn) == 13 {
		items, err := p.search(ctx, "isbn:"+isbn)
		if err != nil {
			return book.DescriptionResult{}, err
		}
		for _, item := range items {
			if hasISBN(item.VolumeInfo.IndustryIdentifiers, isbn) {
				if description := cleanDescription(item.VolumeInfo.Description); description != "" {
					return book.DescriptionResult{Description: description, Source: "google_books"}, nil
				}
			}
		}
	}

	query := "intitle:\"" + escapeGoogleQuery(lookup.Title) + "\""
	if len(lookup.Authors) > 0 && strings.TrimSpace(lookup.Authors[0]) != "" {
		query += " inauthor:\"" + escapeGoogleQuery(lookup.Authors[0]) + "\""
	}
	items, err := p.search(ctx, query)
	if err != nil {
		return book.DescriptionResult{}, err
	}
	for _, item := range items {
		if !matchesBook(lookup, item.VolumeInfo) {
			continue
		}
		if description := cleanDescription(item.VolumeInfo.Description); description != "" {
			return book.DescriptionResult{Description: description, Source: "google_books"}, nil
		}
	}

	return book.DescriptionResult{Source: "google_books"}, nil
}

func (p *GoogleBooks) LookupCover(ctx context.Context, lookup book.DescriptionLookup) (string, error) {
	if p.apiKey == "" {
		return "", book.ErrCoverUnavailable
	}

	isbn := normalizeISBN(lookup.ISBN13)
	if len(isbn) == 13 {
		items, err := p.search(ctx, "isbn:"+isbn)
		if err != nil {
			return "", err
		}
		for _, item := range items {
			if hasISBN(item.VolumeInfo.IndustryIdentifiers, isbn) {
				if coverURL := googleVolumeCover(item); coverURL != "" {
					return coverURL, nil
				}
			}
		}
	}

	if strings.TrimSpace(lookup.Title) == "" {
		return "", book.ErrCoverUnavailable
	}
	query := "intitle:\"" + escapeGoogleQuery(lookup.Title) + "\""
	if len(lookup.Authors) > 0 && strings.TrimSpace(lookup.Authors[0]) != "" {
		query += " inauthor:\"" + escapeGoogleQuery(lookup.Authors[0]) + "\""
	}
	items, err := p.search(ctx, query)
	if err != nil {
		return "", err
	}
	for _, item := range items {
		if matchesBook(lookup, item.VolumeInfo) {
			if coverURL := googleVolumeCover(item); coverURL != "" {
				return coverURL, nil
			}
		}
	}

	return "", book.ErrCoverUnavailable
}

func googleVolumeCover(item googleVolume) string {
	for _, candidate := range []string{
		item.VolumeInfo.ImageLinks.ExtraLarge,
		item.VolumeInfo.ImageLinks.Large,
		item.VolumeInfo.ImageLinks.Medium,
		item.VolumeInfo.ImageLinks.Small,
		item.VolumeInfo.ImageLinks.Thumbnail,
		item.VolumeInfo.ImageLinks.SmallThumbnail,
	} {
		if coverURL := secureImageURL(candidate); coverURL != "" {
			return coverURL
		}
	}
	return ""
}

func (p *GoogleBooks) search(ctx context.Context, query string) ([]googleVolume, error) {
	endpoint, err := url.Parse(googleBooksEndpoint)
	if err != nil {
		return nil, fmt.Errorf("parse Google Books endpoint: %w", err)
	}
	values := endpoint.Query()
	values.Set("q", query)
	values.Set("maxResults", "5")
	values.Set("printType", "books")
	values.Set("key", p.apiKey)
	endpoint.RawQuery = values.Encode()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("create Google Books request: %w", err)
	}
	request.Header.Set("Accept", "application/json")
	response, err := p.client.Do(request)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, err
		}
		return nil, fmt.Errorf("request Google Books: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Books returned HTTP %d", response.StatusCode)
	}
	var result struct {
		Items []googleVolume `json:"items"`
	}
	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode Google Books response: %w", err)
	}
	return result.Items, nil
}

type googleVolume struct {
	VolumeInfo googleVolumeInfo `json:"volumeInfo"`
}

type googleVolumeInfo struct {
	Title               string                     `json:"title"`
	Authors             []string                   `json:"authors"`
	Description         string                     `json:"description"`
	IndustryIdentifiers []googleIndustryIdentifier `json:"industryIdentifiers"`
	ImageLinks          googleImageLinks           `json:"imageLinks"`
}

type googleImageLinks struct {
	SmallThumbnail string `json:"smallThumbnail"`
	Thumbnail      string `json:"thumbnail"`
	Small          string `json:"small"`
	Medium         string `json:"medium"`
	Large          string `json:"large"`
	ExtraLarge     string `json:"extraLarge"`
}

type googleIndustryIdentifier struct {
	Type       string `json:"type"`
	Identifier string `json:"identifier"`
}

func hasISBN(identifiers []googleIndustryIdentifier, isbn string) bool {
	for _, identifier := range identifiers {
		candidate := normalizeISBNIdentifier(identifier.Identifier)
		if candidate == isbn || isbn13FromISBN10(candidate) == isbn {
			return true
		}
	}
	return false
}

func normalizeISBNIdentifier(value string) string {
	var normalized strings.Builder
	for index, char := range value {
		if char >= '0' && char <= '9' {
			normalized.WriteRune(char)
		} else if (char == 'x' || char == 'X') && index == len(value)-1 {
			normalized.WriteByte('X')
		}
	}
	return normalized.String()
}

func isbn13FromISBN10(isbn10 string) string {
	if len(isbn10) != 10 {
		return ""
	}
	base := "978" + isbn10[:9]
	sum := 0
	for index, digit := range base {
		value := int(digit - '0')
		if index%2 == 1 {
			value *= 3
		}
		sum += value
	}
	checkDigit := (10 - sum%10) % 10
	return fmt.Sprintf("%s%d", base, checkDigit)
}

func secureImageURL(value string) string {
	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return ""
	}
	parsed.Scheme = "https"
	if strings.EqualFold(parsed.Hostname(), "books.google.com") {
		query := parsed.Query()
		if query.Has("zoom") {
			query.Set("zoom", "6")
			parsed.RawQuery = query.Encode()
		}
	}
	return parsed.String()
}

func matchesBook(lookup book.DescriptionLookup, volume googleVolumeInfo) bool {
	wantedTitle := normalizeTitle(lookup.Title)
	gotTitle := normalizeTitle(volume.Title)
	if wantedTitle == "" || gotTitle == "" || !similarTitle(wantedTitle, gotTitle) {
		return false
	}
	if len(lookup.Authors) == 0 {
		return wantedTitle == gotTitle
	}
	for _, wanted := range lookup.Authors {
		wanted = normalizeTitle(wanted)
		for _, got := range volume.Authors {
			got = normalizeTitle(got)
			if wanted != "" && got != "" && (wanted == got || strings.Contains(wanted, got) || strings.Contains(got, wanted)) {
				return true
			}
		}
	}
	return false
}

func similarTitle(a, b string) bool {
	if a == b {
		return true
	}
	shorter, longer := a, b
	if len(shorter) > len(longer) {
		shorter, longer = longer, shorter
	}
	return strings.HasPrefix(longer, shorter+" ") && len(longer)-len(shorter) <= 48
}

func normalizeTitle(value string) string {
	return strings.TrimSpace(googleWhitespacePattern.ReplaceAllString(googleNonWordPattern.ReplaceAllString(strings.ToLower(value), " "), " "))
}

func normalizeISBN(value string) string {
	var digits strings.Builder
	for _, char := range value {
		if char >= '0' && char <= '9' {
			digits.WriteRune(char)
		}
	}
	return digits.String()
}

func escapeGoogleQuery(value string) string {
	return strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(value), `\`, `\\`), `"`, `\"`)
}

func cleanDescription(value string) string {
	value = html.UnescapeString(value)
	value = googleScriptStylePattern.ReplaceAllString(value, " ")
	value = googleTagPattern.ReplaceAllString(value, " ")
	value = googleWhitespacePattern.ReplaceAllString(value, " ")
	value = strings.TrimSpace(value)
	runes := []rune(value)
	if len(runes) > 20000 {
		value = string(runes[:20000])
	}
	return value
}
