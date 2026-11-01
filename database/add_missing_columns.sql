-- =====================================================
-- Add Missing Columns to session_answers Table
-- =====================================================

-- Add the missing communication-specific columns
ALTER TABLE public.session_answers 
ADD COLUMN IF NOT EXISTS vocabulary_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS communication_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pronunciation_score DECIMAL(5,2);

-- Update the updated_at column to have a trigger if it doesn't exist
ALTER TABLE public.session_answers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS set_updated_at_session_answers ON public.session_answers;

CREATE TRIGGER set_updated_at_session_answers
  BEFORE UPDATE ON public.session_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verify the columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'session_answers' 
  AND column_name IN ('vocabulary_score', 'communication_score', 'pronunciation_score')
ORDER BY column_name;

-- Success message
SELECT 'Missing columns added successfully!' as result;