-- Create audit logs table for file access tracking
CREATE TABLE IF NOT EXISTS public.file_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('download', 'share', 'view', 'delete')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.file_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and file owners can view audit logs
CREATE POLICY "Users can view audit logs for their files"
ON public.file_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_audit_logs.file_id
    AND files.user_id = auth.uid()
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.file_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_file_audit_logs_file_id ON public.file_audit_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_audit_logs_user_id ON public.file_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_audit_logs_created_at ON public.file_audit_logs(created_at DESC);