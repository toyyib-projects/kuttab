-- Create PDF uploads table
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, storage_path)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_user_id ON pdf_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_book_id ON pdf_uploads(book_id);
CREATE INDEX IF NOT EXISTS idx_pdf_uploads_created_at ON pdf_uploads(created_at);

-- Enable RLS
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own PDF uploads"
  ON pdf_uploads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF uploads"
  ON pdf_uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF uploads"
  ON pdf_uploads
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF uploads"
  ON pdf_uploads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update books table to include pdf_uploaded_at column
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
