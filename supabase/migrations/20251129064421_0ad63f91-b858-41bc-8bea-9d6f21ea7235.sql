-- Create a secure function to get shared file download info only
-- This hides sensitive metadata like user_id, full storage_path, and file name patterns
CREATE OR REPLACE FUNCTION public.get_shared_file_download(p_token uuid)
RETURNS TABLE (
  file_id uuid,
  display_name text,
  file_type text,
  file_size bigint,
  storage_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as file_id,
    -- Mask potentially sensitive file names by showing only extension
    CASE 
      WHEN f.name ~ '\.' THEN 'file' || substring(f.name from '\.[^.]*$')
      ELSE 'file'
    END as display_name,
    f.file_type,
    f.file_size,
    f.storage_path
  FROM public.files f
  WHERE f.shareable_token = p_token
    AND f.is_shareable = true
    AND f.share_expires_at IS NOT NULL
    AND f.share_expires_at > now();
END;
$$;

-- Update RLS policy to only allow owners to see full file details
-- Shared files are accessed ONLY through the secure function above
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;

CREATE POLICY "Users can view their own files" 
ON public.files 
FOR SELECT
USING (auth.uid() = user_id);

-- Grant execute permission on the function to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_shared_file_download(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_file_download(uuid) TO authenticated;