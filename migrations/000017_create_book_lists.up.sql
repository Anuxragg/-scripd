CREATE TABLE book_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    is_private boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT book_lists_title_nonempty CHECK (length(trim(title)) > 0 AND length(title) <= 100),
    CONSTRAINT book_lists_description_length CHECK (description IS NULL OR length(description) <= 1000)
);

CREATE INDEX book_lists_user_created_idx ON book_lists (user_id, created_at DESC);

CREATE TABLE book_list_items (
    list_id uuid NOT NULL REFERENCES book_lists (id) ON DELETE CASCADE,
    book_id uuid NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    position integer NOT NULL DEFAULT 0,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT book_list_items_pk PRIMARY KEY (list_id, book_id),
    CONSTRAINT book_list_items_notes_length CHECK (notes IS NULL OR length(notes) <= 1000)
);

CREATE INDEX book_list_items_list_position_idx ON book_list_items (list_id, position ASC, created_at ASC);
CREATE INDEX book_list_items_book_idx ON book_list_items (book_id);

-- Enable Row Level Security (RLS)
ALTER TABLE book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_list_items ENABLE ROW LEVEL SECURITY;
