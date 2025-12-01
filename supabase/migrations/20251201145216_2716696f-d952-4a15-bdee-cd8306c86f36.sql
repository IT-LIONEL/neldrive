-- Add password protection for folders
ALTER TABLE public.folders 
ADD COLUMN is_locked boolean DEFAULT false,
ADD COLUMN password_hash text DEFAULT NULL;