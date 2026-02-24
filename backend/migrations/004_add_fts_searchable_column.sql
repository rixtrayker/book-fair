-- Migration: 004_add_fts_searchable_column
-- Requires: PostgreSQL 12+ for GENERATED ALWAYS AS ... STORED

-- Add searchable tsvector column to books table
-- This is a generated column that auto-updates when source columns change
-- Weights: A (highest) = title, isbn | B = author | C = publisher
-- Uses 'simple' config for multilingual support (Arabic + English)

ALTER TABLE books
ADD COLUMN IF NOT EXISTS searchable tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(
        (SELECT name FROM publishers WHERE publishers.id = books.publisher_id), 
        ''
    )), 'C') ||
    setweight(to_tsvector('simple', coalesce(isbn, '')), 'A')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_books_searchable_gin ON books USING GIN (searchable);

-- Note: The generated column automatically backfills existing rows
-- No separate data migration needed

-- Add comment for documentation
COMMENT ON COLUMN books.searchable IS 'Full-text search vector with weights: A=title,isbn; B=author; C=publisher';
