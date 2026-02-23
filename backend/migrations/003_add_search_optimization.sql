-- Migration: 003_add_search_optimization

-- Create GIN index for full-text search on books (PostgreSQL specific)
-- For Arabic text search, we use the simple configuration
CREATE INDEX IF NOT EXISTS idx_books_title_gin ON books USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_books_author_gin ON books USING gin(to_tsvector('simple', author));

-- Add trigram extension for similarity search (useful for fuzzy matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING gin(author gin_trgm_ops);
