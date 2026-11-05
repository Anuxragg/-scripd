package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/scripd-app/scripd/internal/book"
)

type Postgres struct {
	pool *pgxpool.Pool
}

func NewPostgres(pool *pgxpool.Pool) *Postgres {
	return &Postgres{pool: pool}
}

const bookColumns = `id, COALESCE(open_library_key, ''), isbn13, title, subtitle, authors,
       cover_url, published_year, description, metadata_synced_at, created_at, updated_at`

const upsertBookSQL = `
INSERT INTO books (
    open_library_key, isbn13, title, subtitle, authors, cover_url, published_year,
    raw_metadata, metadata_synced_at
)
VALUES ($1, NULLIF($2, ''), $3, NULLIF($4, ''), $5, NULLIF($6, ''), $7, $8::jsonb, now())
ON CONFLICT (open_library_key) WHERE open_library_key IS NOT NULL
DO UPDATE SET
    isbn13 = COALESCE(books.isbn13, EXCLUDED.isbn13),
    title = EXCLUDED.title,
    subtitle = COALESCE(EXCLUDED.subtitle, books.subtitle),
    authors = CASE WHEN cardinality(EXCLUDED.authors) > 0 THEN EXCLUDED.authors ELSE books.authors END,
    cover_url = COALESCE(EXCLUDED.cover_url, books.cover_url),
    published_year = COALESCE(EXCLUDED.published_year, books.published_year),
    raw_metadata = EXCLUDED.raw_metadata,
    metadata_synced_at = now(),
    updated_at = now()
RETURNING ` + bookColumns

func (p *Postgres) Upsert(ctx context.Context, imported book.ImportedBook) (book.Book, error) {
	var isbn13 string
	if imported.ISBN13 != nil {
		isbn13 = *imported.ISBN13
	}
	var subtitle, coverURL string
	if imported.Subtitle != nil {
		subtitle = *imported.Subtitle
	}
	if imported.CoverURL != nil {
		coverURL = *imported.CoverURL
	}
	var publishedYear any
	if imported.PublishedYear != nil {
		publishedYear = *imported.PublishedYear
	}
	metadata := imported.RawMetadata
	if len(metadata) == 0 {
		metadata = []byte("{}")
	}
	authors := imported.Authors
	if authors == nil {
		authors = []string{}
	}

	result, err := p.upsert(ctx, imported, authors, isbn13, subtitle, coverURL, publishedYear, metadata)
	if err == nil {
		return result, nil
	}
	var postgresError *pgconn.PgError
	if !errors.As(err, &postgresError) || postgresError.Code != "23505" || postgresError.ConstraintName != "books_isbn13_unique" || isbn13 == "" {
		return book.Book{}, fmt.Errorf("upsert book: %w", err)
	}

	// An ISBN can refer to an edition that Open Library associates with another work.
	// The work key remains canonical, so retry the import without that edition-level identifier.
	result, err = p.upsert(ctx, imported, authors, "", subtitle, coverURL, publishedYear, metadata)
	if err != nil {
		return book.Book{}, fmt.Errorf("upsert book without conflicting ISBN: %w", err)
	}
	return result, nil
}

func (p *Postgres) upsert(ctx context.Context, imported book.ImportedBook, authors []string, isbn13, subtitle, coverURL string, publishedYear any, metadata []byte) (book.Book, error) {
	var result book.Book
	err := scanBook(p.pool.QueryRow(ctx, upsertBookSQL,
		imported.OpenLibraryKey, isbn13, imported.Title, subtitle, authors,
		coverURL, publishedYear, metadata,
	), &result)
	return result, err
}

func (p *Postgres) SearchLocal(ctx context.Context, query string, page, limit int) ([]book.Book, int, error) {
	totalQuery := `SELECT count(*) FROM books WHERE ` + searchVectorSQL + ` @@ plainto_tsquery('simple', $1)`
	var total int
	if err := p.pool.QueryRow(ctx, totalQuery, query).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count local book search: %w", err)
	}
	searchQuery := `SELECT ` + bookColumns + ` FROM books
        WHERE ` + searchVectorSQL + ` @@ plainto_tsquery('simple', $1)
        ORDER BY ts_rank(` + searchVectorSQL + `, plainto_tsquery('simple', $1)) DESC, lower(title), id
        LIMIT $2 OFFSET $3`
	rows, err := p.pool.Query(ctx, searchQuery, query, limit, (page-1)*limit)
	if err != nil {
		return nil, 0, fmt.Errorf("search local catalog: %w", err)
	}
	defer rows.Close()
	books := make([]book.Book, 0, min(limit, total))
	for rows.Next() {
		var result book.Book
		if err := scanBook(rows, &result); err != nil {
			return nil, 0, fmt.Errorf("scan local book: %w", err)
		}
		books = append(books, result)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("read local book search: %w", err)
	}
	return books, total, nil
}

func (p *Postgres) GetByID(ctx context.Context, id string) (book.Book, error) {
	var result book.Book
	err := scanBook(p.pool.QueryRow(ctx, `SELECT `+bookColumns+` FROM books WHERE id = $1`, id), &result)
	if errors.Is(err, pgx.ErrNoRows) {
		return book.Book{}, book.ErrNotFound
	}
	if err != nil {
		return book.Book{}, fmt.Errorf("get book by ID: %w", err)
	}
	return result, nil
}

func (p *Postgres) GetDescriptionCache(ctx context.Context, lookupKey string) (book.DescriptionCacheEntry, bool, error) {
	var result book.DescriptionCacheEntry
	err := p.pool.QueryRow(ctx, `
		SELECT lookup_key, title, authors, COALESCE(isbn13, ''), description, source, expires_at
		FROM book_description_cache
		WHERE lookup_key = $1 AND expires_at > now()
	`, lookupKey).Scan(
		&result.LookupKey, &result.Title, &result.Authors, &result.ISBN13,
		&result.Description, &result.Source, &result.ExpiresAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		_, _ = p.pool.Exec(ctx, `
			WITH expired AS (
				SELECT ctid FROM book_description_cache
				WHERE expires_at <= now()
				ORDER BY expires_at
				LIMIT 100
			)
			DELETE FROM book_description_cache AS cache
			USING expired
			WHERE cache.ctid = expired.ctid
		`)
		return book.DescriptionCacheEntry{}, false, nil
	}
	if err != nil {
		return book.DescriptionCacheEntry{}, false, fmt.Errorf("get book description cache: %w", err)
	}
	return result, true, nil
}

func (p *Postgres) UpsertDescriptionCache(ctx context.Context, entry book.DescriptionCacheEntry) error {
	if entry.Authors == nil {
		entry.Authors = []string{}
	}
	_, err := p.pool.Exec(ctx, `
		INSERT INTO book_description_cache (
			lookup_key, title, authors, isbn13, description, source, expires_at
		)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7)
		ON CONFLICT (lookup_key) DO UPDATE SET
			title = EXCLUDED.title,
			authors = EXCLUDED.authors,
			isbn13 = EXCLUDED.isbn13,
			description = EXCLUDED.description,
			source = EXCLUDED.source,
			fetched_at = now(),
			expires_at = EXCLUDED.expires_at
	`, entry.LookupKey, entry.Title, entry.Authors, entry.ISBN13, entry.Description, entry.Source, entry.ExpiresAt)
	if err != nil {
		return fmt.Errorf("upsert book description cache: %w", err)
	}
	return nil
}

type rowScanner interface {
	Scan(...any) error
}

func scanBook(row rowScanner, result *book.Book) error {
	var isbn13, subtitle, coverURL, description pgtype.Text
	var publishedYear pgtype.Int2
	if err := row.Scan(
		&result.ID, &result.OpenLibraryKey, &isbn13, &result.Title, &subtitle,
		&result.Authors, &coverURL, &publishedYear, &description,
		&result.MetadataSynced, &result.CreatedAt, &result.UpdatedAt,
	); err != nil {
		return err
	}
	if isbn13.Valid {
		value := strings.TrimSpace(isbn13.String)
		if value != "" {
			result.ISBN13 = &value
		}
	}
	if subtitle.Valid && subtitle.String != "" {
		value := subtitle.String
		result.Subtitle = &value
	}
	if coverURL.Valid && coverURL.String != "" {
		value := coverURL.String
		result.CoverURL = &value
	}
	if publishedYear.Valid {
		value := int(publishedYear.Int16)
		result.PublishedYear = &value
	}
	if description.Valid && description.String != "" {
		value := description.String
		result.Description = &value
	}
	if result.Authors == nil {
		result.Authors = []string{}
	}
	if result.OpenLibraryKey != "" {
		result.OpenLibraryURL = "https://openlibrary.org/works/" + result.OpenLibraryKey
	}
	return nil
}

const searchVectorSQL = `to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(books_authors_search_text(authors), ''))`
