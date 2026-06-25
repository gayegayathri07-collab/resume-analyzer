-- Create the analyses table for storing resume analysis results
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL DEFAULT 'anonymous@example.com',
  resume_name TEXT NOT NULL DEFAULT 'resume.pdf',
  ats_score INTEGER NOT NULL,
  job_description TEXT NOT NULL,
  matched_keywords TEXT[] DEFAULT '{}',
  missing_keywords TEXT[] DEFAULT '{}',
  suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for anonymous usage)
CREATE POLICY "Allow public insert" ON analyses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own analyses
CREATE POLICY "Allow users to read own analyses" ON analyses
  FOR SELECT
  TO public
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_email ON analyses (user_email);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
