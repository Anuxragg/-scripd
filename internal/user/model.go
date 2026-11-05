package user

import (
	"errors"
	"time"
)

var (
	ErrNotFound             = errors.New("user not found")
	ErrInvalidInput         = errors.New("invalid user input")
	ErrUsernameInUse        = errors.New("username is already in use")
	ErrFavoriteLimitReached = errors.New("favorite book limit reached")
)

type PublicProfile struct {
	ID            string         `json:"id"`
	Username      string         `json:"username"`
	DisplayName   string         `json:"display_name"`
	Bio           string         `json:"bio"`
	AvatarURL     string         `json:"avatar_url"`
	FavoriteBooks []FavoriteBook `json:"favorite_books"`
	CreatedAt     time.Time      `json:"created_at"`
}

type FavoriteBook struct {
	OpenLibraryKey string   `json:"open_library_key"`
	Title          string   `json:"title"`
	Authors        []string `json:"authors"`
	CoverURL       string   `json:"cover_url"`
	PublishedYear  *int     `json:"published_year,omitempty"`
	Position       int      `json:"position"`
}

type FavoriteBookInput struct {
	OpenLibraryKey string
	Title          string
	Authors        []string
	CoverURL       string
	PublishedYear  *int
}

type ProfileStats struct {
	BooksRead        int `json:"books_read"`
	CurrentlyReading int `json:"currently_reading"`
	WantToRead       int `json:"want_to_read"`
	ReviewsCount     int `json:"reviews_count"`
}

type UpdateProfileInput struct {
	Username    *string `json:"username"`
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
}
