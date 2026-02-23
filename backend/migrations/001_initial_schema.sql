-- Migration: 001_initial_schema
-- This is the initial schema migration for reference
-- The actual tables are created in database.ts initDatabase()

-- Add any additional constraints or indexes here that weren't in initial setup

-- Ensure all tables have updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
             AND table_name IN ('users', 'books', 'lists', 'list_books', 'orders', 'publishers', 'collector_offers')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;
