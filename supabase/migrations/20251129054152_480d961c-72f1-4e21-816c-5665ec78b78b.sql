-- Add expiration column for shareable links
ALTER TABLE public.files 
ADD COLUMN share_expires_at timestamp with time zone DEFAULT NULL;

-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;

-- Create updated policy that checks share link expiration
CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR (
    is_shareable = true 
    AND (share_expires_at IS NULL OR share_expires_at > now())
  )
);

-- Create index for faster shareable token lookups
CREATE INDEX IF NOT EXISTS idx_files_shareable_token ON public.files(shareable_token) WHERE is_shareable = true;