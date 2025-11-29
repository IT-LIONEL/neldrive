-- Update RLS policy to REQUIRE expiration for all shared files (no indefinite sharing)
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;

CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR (
    is_shareable = true 
    AND share_expires_at IS NOT NULL 
    AND share_expires_at > now()
  )
);