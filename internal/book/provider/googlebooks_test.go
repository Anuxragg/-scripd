package provider

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSecureImageURL(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Google books with curl and zoom 1 upgrades to zoom 0 and no edge",
			input:    "http://books.google.com/books/content?id=s1gVAAAAYAAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
			expected: "https://books.google.com/books/content?id=s1gVAAAAYAAJ&img=1&printsec=frontcover&source=gbs_api&zoom=0",
		},
		{
			name:     "Google books already secure with zoom 5",
			input:    "https://books.google.com/books/content?id=xyz&zoom=5&edge=curl",
			expected: "https://books.google.com/books/content?id=xyz&zoom=0",
		},
		{
			name:     "Non google books URL preserved with HTTPS",
			input:    "http://covers.openlibrary.org/b/id/12345-L.jpg",
			expected: "https://covers.openlibrary.org/b/id/12345-L.jpg",
		},
		{
			name:     "Invalid URL returns empty",
			input:    "not a url",
			expected: "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := secureImageURL(tc.input)
			require.Equal(t, tc.expected, got)
		})
	}
}

