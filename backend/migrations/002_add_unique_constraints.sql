-- Migration: 002_add_unique_constraints

-- Add unique constraint to prevent duplicate books in the same list
CREATE UNIQUE INDEX IF NOT EXISTS idx_list_books_unique_book 
ON list_books(list_id, book_id) 
WHERE deleted_at IS NULL;

-- Add unique constraint for user email (should already exist from table creation)
-- This is a safety measure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END;
$$;
