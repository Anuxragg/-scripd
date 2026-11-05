CREATE TABLE book_description_cache (
    lookup_key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    isbn13 TEXT,
    description TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX book_description_cache_expires_at_idx
    ON book_description_cache (expires_at);

ALTER TABLE book_description_cache ENABLE ROW LEVEL SECURITY;
