package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
	"github.com/scripd-app/scripd/internal/book"
	"github.com/scripd-app/scripd/internal/book/service"
	platformmiddleware "github.com/scripd-app/scripd/internal/platform/middleware"
	"github.com/scripd-app/scripd/internal/platform/response"
)

const bookRequestTimeout = 15 * time.Second

type bookService interface {
	Search(context.Context, string, int, int) (service.SearchPage, error)
	GetByID(context.Context, string) (book.Book, error)
}

type descriptionService interface {
	GetDescription(context.Context, book.DescriptionLookup) (book.DescriptionResult, error)
}

type coverService interface {
	GetCover(context.Context, book.DescriptionLookup) (string, error)
}

type Handler struct {
	service bookService
	log     zerolog.Logger
}

func New(service bookService, log zerolog.Logger) *Handler {
	return &Handler{service: service, log: log}
}

func (h *Handler) RegisterRoutes(router chi.Router) {
	router.Route("/books", func(books chi.Router) {
		books.With(platformmiddleware.RateLimit(30, time.Minute)).Get("/search", h.Search)
		books.With(platformmiddleware.RateLimit(30, time.Minute)).Get("/description", h.Description)
		books.With(platformmiddleware.RateLimit(30, time.Minute)).Get("/cover", h.Cover)
		books.Get("/{bookID}", h.Get)
	})
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	query, ok := singleQueryValue(r, "q")
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "search query is invalid")
		return
	}
	page, ok := queryInt(r, "page", 1)
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "search pagination is invalid")
		return
	}
	limit, ok := queryInt(r, "limit", service.DefaultLimit)
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "search pagination is invalid")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), bookRequestTimeout)
	defer cancel()
	result, err := h.service.Search(ctx, query, page, limit)
	if err != nil {
		h.writeFailure(w, r, err)
		return
	}
	if result.Source == "local_catalog" {
		h.log.Warn().Str("request_id", requestID(r)).Msg("Open Library unavailable; serving local book search results")
	}
	books := result.Books
	if books == nil {
		books = []book.Book{}
	}
	response.WriteJSONWithMeta(w, http.StatusOK, books, map[string]any{
		"page": result.Page, "limit": result.Limit, "total": result.Total,
		"has_more": result.HasMore, "source": result.Source,
	})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), bookRequestTimeout)
	defer cancel()
	result, err := h.service.GetByID(ctx, chi.URLParam(r, "bookID"))
	if err != nil {
		h.writeFailure(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) Description(w http.ResponseWriter, r *http.Request) {
	title, ok := singleQueryValue(r, "title")
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book title is invalid")
		return
	}
	values := r.URL.Query()["author"]
	authors := make([]string, 0, len(values))
	for _, value := range values {
		authors = append(authors, strings.TrimSpace(value))
	}
	isbn13, ok := singleOptionalQueryValue(r, "isbn13")
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book ISBN is invalid")
		return
	}
	descriptions, ok := h.service.(descriptionService)
	if !ok {
		h.writeFailure(w, r, service.ErrDescriptionUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), bookRequestTimeout)
	defer cancel()
	result, err := descriptions.GetDescription(ctx, book.DescriptionLookup{
		Title: title, Authors: authors, ISBN13: isbn13,
	})
	if err != nil {
		h.writeFailure(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) Cover(w http.ResponseWriter, r *http.Request) {
	title, ok := singleOptionalQueryValue(r, "title")
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book title is invalid")
		return
	}
	isbn13, ok := singleOptionalQueryValue(r, "isbn13")
	if !ok {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book ISBN is invalid")
		return
	}
	authorValues := r.URL.Query()["author"]
	if len(authorValues) > 5 {
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book authors are invalid")
		return
	}
	authors := make([]string, len(authorValues))
	for index, author := range authorValues {
		authors[index] = strings.TrimSpace(author)
	}
	covers, ok := h.service.(coverService)
	if !ok {
		h.writeFailure(w, r, service.ErrCoverUnavailable)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), bookRequestTimeout)
	defer cancel()
	coverURL, err := covers.GetCover(ctx, book.DescriptionLookup{
		Title: title, Authors: authors, ISBN13: isbn13,
	})
	if err != nil {
		h.writeFailure(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]string{"cover_url": coverURL})
}

func (h *Handler) writeFailure(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		response.WriteError(w, r, http.StatusGatewayTimeout, "request_timeout", "book catalog request timed out")
	case errors.Is(err, service.ErrInvalidInput):
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "search values are invalid")
	case errors.Is(err, service.ErrInvalidDescription):
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book description lookup values are invalid")
	case errors.Is(err, service.ErrInvalidCoverLookup):
		response.WriteError(w, r, http.StatusBadRequest, "invalid_request", "book ISBN is invalid")
	case errors.Is(err, service.ErrCoverUnavailable):
		response.WriteError(w, r, http.StatusNotFound, "cover_unavailable", "no matching book cover is available")
	case errors.Is(err, service.ErrNotFound):
		response.WriteError(w, r, http.StatusNotFound, "not_found", "book not found")
	case errors.Is(err, service.ErrCatalogUnavailable):
		w.Header().Set("Retry-After", "5")
		response.WriteError(w, r, http.StatusServiceUnavailable, "catalog_unavailable", "book search is temporarily unavailable")
	case errors.Is(err, service.ErrDescriptionUnavailable):
		w.Header().Set("Retry-After", "5")
		response.WriteError(w, r, http.StatusServiceUnavailable, "description_unavailable", "book overview lookup is temporarily unavailable")
	default:
		h.log.Error().Err(err).Str("request_id", requestID(r)).Msg("book catalog request failed")
		response.WriteError(w, r, http.StatusInternalServerError, "internal_error", "an unexpected error occurred")
	}
}

func singleOptionalQueryValue(r *http.Request, key string) (string, bool) {
	values, exists := r.URL.Query()[key]
	if !exists {
		return "", true
	}
	if len(values) != 1 {
		return "", false
	}
	return strings.TrimSpace(values[0]), true
}

func singleQueryValue(r *http.Request, key string) (string, bool) {
	values, exists := r.URL.Query()[key]
	if !exists || len(values) != 1 {
		return "", false
	}
	return strings.TrimSpace(values[0]), true
}

func queryInt(r *http.Request, key string, fallback int) (int, bool) {
	values, exists := r.URL.Query()[key]
	if !exists {
		return fallback, true
	}
	if len(values) != 1 || strings.TrimSpace(values[0]) == "" {
		return 0, false
	}
	value, err := strconv.Atoi(values[0])
	return value, err == nil
}

func requestID(r *http.Request) string {
	return chimiddleware.GetReqID(r.Context())
}
