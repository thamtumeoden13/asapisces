-- Add new columns to companions table for transcript data
ALTER TABLE companions 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS transcript_data JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_companions_type ON companions(type);
CREATE INDEX IF NOT EXISTS idx_companions_author_type ON companions(author, type);

-- Add comment for documentation
COMMENT ON COLUMN companions.type IS 'Type of companion: general, transcript, etc.';
COMMENT ON COLUMN companions.transcript_data IS 'JSON data containing processed transcript information';
