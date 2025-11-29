-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.file_audit_logs;

-- Create restrictive policy: users can only log actions on their own files
CREATE POLICY "Users can log actions on their own files" 
ON public.file_audit_logs 
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.files 
    WHERE files.id = file_audit_logs.file_id 
    AND files.user_id = auth.uid()
  )
);

-- Also add DELETE policy for profiles (GDPR compliance)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);