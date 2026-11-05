package book

import (
	"encoding/json"
	"errors"
	"time"
)

var (
	ErrNotFound               = errors.New("book not found")
	ErrDescriptionUnavailable = errors.New("book description provider is unavailable")
	ErrCoverUnavailable       = errors.New("book cover provider is unavailable")
)

// Book is the catalog representation returned by Scripd's API.
type Book struct {
	ID             string    `json:"id"`
	OpenLibraryKey string    `json:"open_library_key"`
	ISBN13         *string   `json:"isbn13,omitempty"`
	Title          string    `json:"title"`
	Subtitle       *string   `json:"subtitle,omitempty"`
	Authors        []string  `json:"authors"`
	CoverURL       *string   `json:"cover_url,omitempty"`
	PublishedYear  *int      `json:"published_year,omitempty"`
	Description    *string   `json:"description,omitempty"`
	OpenLibraryURL string    `json:"open_library_url"`
	MetadataSynced time.Time `json:"metadata_synced_at"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ImportedBook is normalized metadata returned by a catalog provider.
type ImportedBook struct {
	OpenLibraryKey string
	ISBN13         *string
	Title          string
	Subtitle       *string
	Authors        []string
	CoverURL       *string
	PublishedYear  *int
	RawMetadata    json.RawMessage
}

type ProviderSearch struct {
	Books []ImportedBook
	Total int
}

// DescriptionLookup identifies an edition or work whose overview is missing.
type DescriptionLookup struct {
	Title   string
	Authors []string
	ISBN13  string
}

// DescriptionResult contains a plain-text synopsis and the catalog that supplied it.
type DescriptionResult struct {
	Description string `json:"description"`
	Source      string `json:"source"`
}

// DescriptionCacheEntry stores positive and short-lived negative lookups.
type DescriptionCacheEntry struct {
	LookupKey   string
	Title       string
	Authors     []string
	ISBN13      string
	Description string
	Source      string
	ExpiresAt   time.Time
}
