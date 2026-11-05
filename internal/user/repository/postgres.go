package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/scripd-app/scripd/internal/user"
)

type Postgres struct {
	pool *pgxpool.Pool
}

func NewPostgres(pool *pgxpool.Pool) *Postgres {
	return &Postgres{pool: pool}
}

const userProfileFields = `
	id, username, coalesce(display_name, ''), coalesce(bio, ''), coalesce(avatar_url, ''), created_at,
	COALESCE((
		SELECT jsonb_agg(jsonb_build_object(
			'open_library_key', favorite.open_library_key,
			'title', favorite.title,
			'authors', favorite.authors,
			'cover_url', COALESCE(favorite.cover_url, ''),
			'published_year', favorite.published_year,
			'position', favorite.position
		) ORDER BY favorite.position)
		FROM user_favorite_books favorite
		WHERE favorite.user_id = users.id
	), '[]'::jsonb)
`

func scanProfile(row pgx.Row) (user.PublicProfile, error) {
	var p user.PublicProfile
	var favoriteBooksJSON []byte
	err := row.Scan(&p.ID, &p.Username, &p.DisplayName, &p.Bio, &p.AvatarURL, &p.CreatedAt, &favoriteBooksJSON)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return user.PublicProfile{}, user.ErrNotFound
		}
		return user.PublicProfile{}, err
	}
	if p.DisplayName == "" {
		p.DisplayName = p.Username
	}
	if err := json.Unmarshal(favoriteBooksJSON, &p.FavoriteBooks); err != nil {
		return user.PublicProfile{}, fmt.Errorf("decode favorite books: %w", err)
	}
	if p.FavoriteBooks == nil {
		p.FavoriteBooks = []user.FavoriteBook{}
	}
	return p, nil
}

func (p *Postgres) GetByUsername(ctx context.Context, username string) (user.PublicProfile, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT `+userProfileFields+`
		FROM users
		WHERE lower(username) = lower($1)`,
		strings.TrimSpace(username),
	)
	return scanProfile(row)
}

func (p *Postgres) GetByID(ctx context.Context, id string) (user.PublicProfile, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT `+userProfileFields+`
		FROM users
		WHERE id = $1`,
		strings.TrimSpace(id),
	)
	return scanProfile(row)
}

func (p *Postgres) Update(ctx context.Context, id string, input user.UpdateProfileInput) (user.PublicProfile, error) {
	tag, err := p.pool.Exec(ctx, `
		UPDATE users
		SET username = coalesce($1, username),
		    display_name = coalesce($2, display_name),
		    bio = coalesce($3, bio),
		    avatar_url = coalesce($4, avatar_url),
		    updated_at = now()
		WHERE id = $5`,
		input.Username, input.DisplayName, input.Bio, input.AvatarURL, strings.TrimSpace(id),
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" &&
			(pgErr.ConstraintName == "users_username_key" || pgErr.ConstraintName == "users_username_lower_unique") {
			return user.PublicProfile{}, user.ErrUsernameInUse
		}
		return user.PublicProfile{}, fmt.Errorf("update user profile: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return user.PublicProfile{}, user.ErrNotFound
	}
	return p.GetByID(ctx, id)
}

func (p *Postgres) AddFavoriteBook(ctx context.Context, userID string, input user.FavoriteBookInput) (user.FavoriteBook, error) {
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return user.FavoriteBook{}, fmt.Errorf("begin favorite book update: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var foundUserID string
	err = tx.QueryRow(ctx, `SELECT id::text FROM users WHERE id = $1::uuid FOR UPDATE`, strings.TrimSpace(userID)).Scan(&foundUserID)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.FavoriteBook{}, user.ErrNotFound
	}
	if err != nil {
		return user.FavoriteBook{}, fmt.Errorf("lock user for favorite book update: %w", err)
	}

	existing, err := scanFavoriteBook(tx.QueryRow(ctx, `
		SELECT open_library_key, title, authors, COALESCE(cover_url, ''), published_year, position
		FROM user_favorite_books
		WHERE user_id = $1::uuid AND open_library_key = $2`, foundUserID, input.OpenLibraryKey))
	if err == nil {
		if err := tx.Commit(ctx); err != nil {
			return user.FavoriteBook{}, fmt.Errorf("commit favorite book lookup: %w", err)
		}
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return user.FavoriteBook{}, fmt.Errorf("check existing favorite book: %w", err)
	}

	var position int
	err = tx.QueryRow(ctx, `
		SELECT candidate.position
		FROM generate_series(0, 3) AS candidate(position)
		WHERE NOT EXISTS (
			SELECT 1 FROM user_favorite_books favorite
			WHERE favorite.user_id = $1::uuid AND favorite.position = candidate.position
		)
		ORDER BY CASE WHEN candidate.position = (
			SELECT max(favorite.position) + 1
			FROM user_favorite_books favorite
			WHERE favorite.user_id = $1::uuid
		) THEN 0 ELSE 1 END, candidate.position
		LIMIT 1`, foundUserID).Scan(&position)
	if errors.Is(err, pgx.ErrNoRows) {
		return user.FavoriteBook{}, user.ErrFavoriteLimitReached
	}
	if err != nil {
		return user.FavoriteBook{}, fmt.Errorf("find favorite book position: %w", err)
	}

	added, err := scanFavoriteBook(tx.QueryRow(ctx, `
		INSERT INTO user_favorite_books (
			user_id, open_library_key, title, authors, cover_url, published_year, position
		)
		VALUES ($1::uuid, $2, $3, $4, NULLIF($5, ''), $6, $7)
		RETURNING open_library_key, title, authors, COALESCE(cover_url, ''), published_year, position`,
		foundUserID, input.OpenLibraryKey, input.Title, input.Authors, input.CoverURL, input.PublishedYear, position,
	))
	if err != nil {
		return user.FavoriteBook{}, fmt.Errorf("add favorite book: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return user.FavoriteBook{}, fmt.Errorf("commit favorite book update: %w", err)
	}
	return added, nil
}

func scanFavoriteBook(row pgx.Row) (user.FavoriteBook, error) {
	var favorite user.FavoriteBook
	err := row.Scan(
		&favorite.OpenLibraryKey, &favorite.Title, &favorite.Authors, &favorite.CoverURL,
		&favorite.PublishedYear, &favorite.Position,
	)
	if err != nil {
		return user.FavoriteBook{}, err
	}
	if favorite.Authors == nil {
		favorite.Authors = []string{}
	}
	return favorite, nil
}

func (p *Postgres) RemoveFavoriteBook(ctx context.Context, userID, openLibraryKey string) error {
	tag, err := p.pool.Exec(ctx, `
		DELETE FROM user_favorite_books
		WHERE user_id = $1::uuid AND open_library_key = $2`,
		strings.TrimSpace(userID), openLibraryKey,
	)
	if err != nil {
		return fmt.Errorf("remove favorite book: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return user.ErrNotFound
	}
	return nil
}

func (p *Postgres) GetStats(ctx context.Context, userID string) (user.ProfileStats, error) {
	var stats user.ProfileStats
	err := p.pool.QueryRow(ctx, `
		SELECT
			coalesce(count(*) FILTER (WHERE r.status = 'read'), 0),
			coalesce(count(*) FILTER (WHERE r.status = 'reading'), 0),
			coalesce(count(*) FILTER (WHERE r.status = 'want_to_read'), 0),
			(SELECT coalesce(count(*), 0) FROM reviews WHERE user_id = $1)
		FROM reads AS r
		WHERE r.user_id = $1`,
		strings.TrimSpace(userID),
	).Scan(&stats.BooksRead, &stats.CurrentlyReading, &stats.WantToRead, &stats.ReviewsCount)
	if err != nil {
		return user.ProfileStats{}, fmt.Errorf("get profile stats: %w", err)
	}
	return stats, nil
}
