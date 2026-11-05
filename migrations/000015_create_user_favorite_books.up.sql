CREATE TABLE user_favorite_books (
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    open_library_key text NOT NULL,
    title text NOT NULL,
    authors text[] NOT NULL DEFAULT '{}',
    cover_url text,
    published_year smallint,
    position smallint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_favorite_books_primary_key PRIMARY KEY (user_id, open_library_key),
    CONSTRAINT user_favorite_books_position_unique UNIQUE (user_id, position),
    CONSTRAINT user_favorite_books_position_range CHECK (position BETWEEN 0 AND 3),
    CONSTRAINT user_favorite_books_work_key_format CHECK (open_library_key ~ '^/works/OL[0-9]+W$'),
    CONSTRAINT user_favorite_books_title_nonempty CHECK (length(trim(title)) > 0),
    CONSTRAINT user_favorite_books_year_range CHECK (published_year IS NULL OR published_year BETWEEN 0 AND 9999)
);
