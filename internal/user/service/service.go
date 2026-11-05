package service

import (
	"context"
	"net/url"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/scripd-app/scripd/internal/user"
)

var usernamePattern = regexp.MustCompile(`^[A-Za-z0-9_]{3,30}$`)
var openLibraryWorkPattern = regexp.MustCompile(`^OL[0-9]+W$`)

const (
	MaximumDisplayName = 80
	MaximumBio         = 500
)

type Store interface {
	GetByUsername(ctx context.Context, username string) (user.PublicProfile, error)
	GetByID(ctx context.Context, id string) (user.PublicProfile, error)
	Update(ctx context.Context, id string, input user.UpdateProfileInput) (user.PublicProfile, error)
	AddFavoriteBook(ctx context.Context, userID string, input user.FavoriteBookInput) (user.FavoriteBook, error)
	RemoveFavoriteBook(ctx context.Context, userID, openLibraryKey string) error
	GetStats(ctx context.Context, userID string) (user.ProfileStats, error)
}

type Service struct {
	store Store
}

func New(store Store) *Service {
	return &Service{store: store}
}

func (s *Service) GetProfile(ctx context.Context, username string) (user.PublicProfile, error) {
	username = strings.TrimSpace(username)
	if !usernamePattern.MatchString(username) {
		return user.PublicProfile{}, user.ErrNotFound
	}
	return s.store.GetByUsername(ctx, username)
}

func (s *Service) GetStats(ctx context.Context, username string) (user.ProfileStats, error) {
	profile, err := s.GetProfile(ctx, username)
	if err != nil {
		return user.ProfileStats{}, err
	}
	return s.store.GetStats(ctx, profile.ID)
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, input user.UpdateProfileInput) (user.PublicProfile, error) {
	if strings.TrimSpace(userID) == "" {
		return user.PublicProfile{}, user.ErrInvalidInput
	}

	if input.Username != nil {
		trimmed := strings.ToLower(strings.TrimSpace(*input.Username))
		if !usernamePattern.MatchString(trimmed) {
			return user.PublicProfile{}, user.ErrInvalidInput
		}
		input.Username = &trimmed
	}

	if input.DisplayName != nil {
		trimmed := strings.TrimSpace(*input.DisplayName)
		if utf8.RuneCountInString(trimmed) > MaximumDisplayName {
			return user.PublicProfile{}, user.ErrInvalidInput
		}
		input.DisplayName = &trimmed
	}

	if input.Bio != nil {
		trimmed := strings.TrimSpace(*input.Bio)
		if utf8.RuneCountInString(trimmed) > MaximumBio {
			return user.PublicProfile{}, user.ErrInvalidInput
		}
		input.Bio = &trimmed
	}

	if input.AvatarURL != nil {
		trimmed := strings.TrimSpace(*input.AvatarURL)
		if trimmed != "" {
			u, err := url.Parse(trimmed)
			if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
				return user.PublicProfile{}, user.ErrInvalidInput
			}
		}
		input.AvatarURL = &trimmed
	}

	return s.store.Update(ctx, userID, input)
}

func (s *Service) AddFavoriteBook(ctx context.Context, userID string, input user.FavoriteBookInput) (user.FavoriteBook, error) {
	if strings.TrimSpace(userID) == "" {
		return user.FavoriteBook{}, user.ErrInvalidInput
	}

	openLibraryKey, validKey := normalizeOpenLibraryWorkKey(input.OpenLibraryKey)
	input.Title = strings.TrimSpace(input.Title)
	if !validKey || input.Title == "" || utf8.RuneCountInString(input.Title) > 500 {
		return user.FavoriteBook{}, user.ErrInvalidInput
	}
	input.OpenLibraryKey = openLibraryKey
	if len(input.Authors) > 10 {
		return user.FavoriteBook{}, user.ErrInvalidInput
	}
	authors := make([]string, 0, len(input.Authors))
	for _, author := range input.Authors {
		name := strings.TrimSpace(author)
		if utf8.RuneCountInString(name) > 200 {
			return user.FavoriteBook{}, user.ErrInvalidInput
		}
		if name != "" {
			authors = append(authors, name)
		}
	}
	input.Authors = authors
	input.CoverURL = strings.TrimSpace(input.CoverURL)
	if input.CoverURL != "" {
		parsedURL, err := url.Parse(input.CoverURL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") || parsedURL.Host == "" {
			return user.FavoriteBook{}, user.ErrInvalidInput
		}
	}
	if input.PublishedYear != nil && (*input.PublishedYear < 0 || *input.PublishedYear > 9999) {
		return user.FavoriteBook{}, user.ErrInvalidInput
	}

	return s.store.AddFavoriteBook(ctx, userID, input)
}

func (s *Service) RemoveFavoriteBook(ctx context.Context, userID, openLibraryKey string) error {
	if strings.TrimSpace(userID) == "" {
		return user.ErrInvalidInput
	}
	normalizedKey, validKey := normalizeOpenLibraryWorkKey(openLibraryKey)
	if !validKey {
		return user.ErrInvalidInput
	}
	return s.store.RemoveFavoriteBook(ctx, userID, normalizedKey)
}

func normalizeOpenLibraryWorkKey(key string) (string, bool) {
	key = strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(key), "/works/"))
	if !openLibraryWorkPattern.MatchString(key) {
		return "", false
	}
	return "/works/" + key, true
}
