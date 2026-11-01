-- Add resume related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS resume_text TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS suggested_questions JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.profiles.resume_text IS 'Extracted text content from the user resume';
COMMENT ON COLUMN public.profiles.resume_url IS 'URL to the uploaded resume file in storage';
COMMENT ON COLUMN public.profiles.suggested_questions IS 'AI generated interview questions based on the resume';
