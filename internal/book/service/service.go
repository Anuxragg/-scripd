package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/scripd-app/scripd/internal/book"
)

var (
	ErrInvalidInput           = errors.New("invalid book search input")
	ErrInvalidDescription     = errors.New("invalid book description lookup")
	ErrInvalidCoverLookup     = errors.New("invalid book cover lookup")
	ErrCatalogUnavailable     = errors.New("book catalog is unavailable")
	ErrDescriptionUnavailable = book.ErrDescriptionUnavailable
	ErrCoverUnavailable       = book.ErrCoverUnavailable
	ErrNotFound               = book.ErrNotFound
	bookIDPattern             = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
)

const (
	DefaultLimit = 12
	MaximumLimit = 20
	MaximumPage  = 1000
)

type provider interface {
	Search(context.Context, string, int, int) (book.ProviderSearch, error)
}

type repository interface {
	Upsert(context.Context, book.ImportedBook) (book.Book, error)
	SearchLocal(context.Context, string, int, int) ([]book.Book, int, error)
	GetByID(context.Context, string) (book.Book, error)
}

type descriptionProvider interface {
	Lookup(context.Context, book.DescriptionLookup) (book.DescriptionResult, error)
}

type coverProvider interface {
	LookupCover(context.Context, book.DescriptionLookup) (string, error)
}

type descriptionCacheRepository interface {
	GetDescriptionCache(context.Context, string) (book.DescriptionCacheEntry, bool, error)
	UpsertDescriptionCache(context.Context, book.DescriptionCacheEntry) error
}

type Service struct {
	provider            provider
	repository          repository
	descriptionProvider descriptionProvider
	coverProvider       coverProvider
	coverCacheMu        sync.Mutex
	coverCache          map[string]coverCacheEntry
}

type coverCacheEntry struct {
	url       string
	expiresAt time.Time
}

type SearchPage struct {
	Books   []book.Book
	Page    int
	Limit   int
	Total   int
	HasMore bool
	Source  string
}

func New(provider provider, repository repository, descriptionProviders ...descriptionProvider) *Service {
	service := &Service{provider: provider, repository: repository, coverCache: make(map[string]coverCacheEntry)}
	if len(descriptionProviders) > 0 {
		service.descriptionProvider = descriptionProviders[0]
		service.coverProvider, _ = descriptionProviders[0].(coverProvider)
	}
	return service
}

func (s *Service) Search(ctx context.Context, query string, page, limit int) (SearchPage, error) {
	query = strings.Join(strings.Fields(query), " ")
	if utf8.RuneCountInString(query) < 2 || utf8.RuneCountInString(query) > 120 || page < 1 || page > MaximumPage || limit < 1 || limit > MaximumLimit {
		return SearchPage{}, ErrInvalidInput
	}

	providerResult, providerErr := s.provider.Search(ctx, query, page, limit)
	if providerErr != nil {
		localBooks, localTotal, localErr := s.repository.SearchLocal(ctx, query, page, limit)
		if localErr != nil {
			return SearchPage{}, fmt.Errorf("search local catalog after provider failure: %w", localErr)
		}
		if localTotal == 0 {
			return SearchPage{}, ErrCatalogUnavailable
		}
		return SearchPage{
			Books: localBooks, Page: page, Limit: limit, Total: localTotal,
			HasMore: page*limit < localTotal, Source: "local_catalog",
		}, nil
	}

	books := make([]book.Book, 0, len(providerResult.Books))
	seen := make(map[string]struct{}, len(providerResult.Books))
	for _, imported := range providerResult.Books {
		if _, exists := seen[imported.OpenLibraryKey]; exists {
			continue
		}
		seen[imported.OpenLibraryKey] = struct{}{}
		persisted, err := s.repository.Upsert(ctx, imported)
		if err != nil {
			return SearchPage{}, fmt.Errorf("persist Open Library book: %w", err)
		}
		books = append(books, persisted)
	}
	total := providerResult.Total
	if total < 0 {
		total = 0
	}
	return SearchPage{
		Books: books, Page: page, Limit: limit, Total: total,
		HasMore: page*limit < total, Source: "open_library",
	}, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (book.Book, error) {
	if !bookIDPattern.MatchString(id) {
		return book.Book{}, ErrNotFound
	}
	result, err := s.repository.GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return book.Book{}, ErrNotFound
	}
	if err != nil {
		return book.Book{}, fmt.Errorf("get book from catalog: %w", err)
	}
	return result, nil
}

func (s *Service) GetDescription(ctx context.Context, lookup book.DescriptionLookup) (book.DescriptionResult, error) {
	lookup.Title = strings.Join(strings.Fields(lookup.Title), " ")
	if utf8.RuneCountInString(lookup.Title) < 2 || utf8.RuneCountInString(lookup.Title) > 240 || len(lookup.Authors) > 5 {
		return book.DescriptionResult{}, ErrInvalidDescription
	}
	for index, author := range lookup.Authors {
		author = strings.Join(strings.Fields(author), " ")
		if utf8.RuneCountInString(author) == 0 || utf8.RuneCountInString(author) > 120 {
			return book.DescriptionResult{}, ErrInvalidDescription
		}
		lookup.Authors[index] = author
	}
	rawISBN := strings.TrimSpace(lookup.ISBN13)
	lookup.ISBN13 = normalizeISBN13(rawISBN)
	if rawISBN != "" && len(lookup.ISBN13) != 13 {
		return book.DescriptionResult{}, ErrInvalidDescription
	}
	if s.descriptionProvider == nil {
		return book.DescriptionResult{}, ErrDescriptionUnavailable
	}

	key := descriptionLookupKey(lookup)
	if cache, ok := s.repository.(descriptionCacheRepository); ok {
		cached, found, err := cache.GetDescriptionCache(ctx, key)
		if err != nil {
			return book.DescriptionResult{}, fmt.Errorf("get cached book description: %w", err)
		}
		if found {
			return book.DescriptionResult{Description: cached.Description, Source: cached.Source}, nil
		}
	}

	result, err := s.descriptionProvider.Lookup(ctx, lookup)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return book.DescriptionResult{}, err
		}
		return book.DescriptionResult{}, fmt.Errorf("%w: %w", ErrDescriptionUnavailable, err)
	}
	result.Description = strings.TrimSpace(result.Description)
	if result.Source == "" {
		result.Source = "google_books"
	}
	if cache, ok := s.repository.(descriptionCacheRepository); ok {
		lifetime := 30 * 24 * time.Hour
		if result.Description == "" {
			lifetime = 12 * time.Hour
		}
		entry := book.DescriptionCacheEntry{
			LookupKey: key, Title: lookup.Title, Authors: lookup.Authors,
			ISBN13: lookup.ISBN13, Description: result.Description,
			Source: result.Source, ExpiresAt: time.Now().Add(lifetime),
		}
		if err := cache.UpsertDescriptionCache(ctx, entry); err != nil {
			return book.DescriptionResult{}, fmt.Errorf("cache book description: %w", err)
		}
	}
	return result, nil
}

func (s *Service) GetCover(ctx context.Context, lookup book.DescriptionLookup) (string, error) {
	lookup.Title = strings.Join(strings.Fields(lookup.Title), " ")
	if utf8.RuneCountInString(lookup.Title) > 240 || (lookup.ISBN13 == "" && utf8.RuneCountInString(lookup.Title) < 2) || len(lookup.Authors) > 5 {
		return "", ErrInvalidCoverLookup
	}
	for index, author := range lookup.Authors {
		author = strings.Join(strings.Fields(author), " ")
		if utf8.RuneCountInString(author) == 0 || utf8.RuneCountInString(author) > 120 {
			return "", ErrInvalidCoverLookup
		}
		lookup.Authors[index] = author
	}
	rawISBN := strings.TrimSpace(lookup.ISBN13)
	lookup.ISBN13 = normalizeISBN13(rawISBN)
	if rawISBN != "" && len(lookup.ISBN13) != 13 {
		return "", ErrInvalidCoverLookup
	}
	if s.coverProvider == nil {
		return "", ErrCoverUnavailable
	}

	cacheKey := descriptionLookupKey(lookup)
	now := time.Now()
	s.coverCacheMu.Lock()
	if cached, ok := s.coverCache[cacheKey]; ok && now.Before(cached.expiresAt) {
		s.coverCacheMu.Unlock()
		if cached.url == "" {
			return "", ErrCoverUnavailable
		}
		return cached.url, nil
	}
	s.coverCacheMu.Unlock()

	coverURL, err := s.coverProvider.LookupCover(ctx, lookup)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return "", err
		}
		s.cacheCover(cacheKey, "", 15*time.Minute)
		return "", ErrCoverUnavailable
	}
	if strings.TrimSpace(coverURL) == "" {
		s.cacheCover(cacheKey, "", 15*time.Minute)
		return "", ErrCoverUnavailable
	}
	s.cacheCover(cacheKey, coverURL, 24*time.Hour)
	return coverURL, nil
}

func (s *Service) cacheCover(key, coverURL string, lifetime time.Duration) {
	s.coverCacheMu.Lock()
	s.coverCache[key] = coverCacheEntry{url: coverURL, expiresAt: time.Now().Add(lifetime)}
	s.coverCacheMu.Unlock()
}

func normalizeISBN13(value string) string {
	var digits strings.Builder
	for _, char := range value {
		if char >= '0' && char <= '9' {
			digits.WriteRune(char)
		} else if char != '-' && char != ' ' {
			return ""
		}
	}
	return digits.String()
}

func descriptionLookupKey(lookup book.DescriptionLookup) string {
	if lookup.ISBN13 != "" {
		return "isbn:" + lookup.ISBN13
	}
	authors := make([]string, 0, len(lookup.Authors))
	for _, author := range lookup.Authors {
		authors = append(authors, strings.ToLower(strings.Join(strings.Fields(author), " ")))
	}
	sort.Strings(authors)
	value := strings.ToLower(strings.Join(strings.Fields(lookup.Title), " ")) + "\x00" + strings.Join(authors, "\x00")
	digest := sha256.Sum256([]byte(value))
	return "title:" + hex.EncodeToString(digest[:])
}
