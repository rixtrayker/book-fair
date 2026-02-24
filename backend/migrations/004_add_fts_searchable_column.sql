-- Migration: 004_add_fts_searchable_column
-- Full-text search support for books table

-- Add searchable tsvector column to books table (without publisher subquery)
-- Weights: A (highest) = title, isbn | B = author
ALTER TABLE books
ADD COLUMN IF NOT EXISTS searchable tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(isbn, '')), 'A')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_books_searchable_gin ON books USING GIN (searchable);

-- Add comment for documentation
COMMENT ON COLUMN books.searchable IS 'Full-text search vector with weights: A=title,isbn; B=author';
