-- Migration to add quiz result columns to signups table
-- Run this in your Neon database SQL editor

-- Add archetype column (stores the quiz result type: insider, archivist, analyst, contrarian, intuitive, jokester)
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS archetype VARCHAR(50);

-- Add star_sign column (stores the star sign they selected)
ALTER TABLE signups 
ADD COLUMN IF NOT EXISTS star_sign VARCHAR(20);

-- Optional: Add index for querying by archetype
CREATE INDEX IF NOT EXISTS idx_signups_archetype ON signups(archetype);

-- Optional: Add index for querying by star sign
CREATE INDEX IF NOT EXISTS idx_signups_star_sign ON signups(star_sign);

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'signups'
ORDER BY ordinal_position;

