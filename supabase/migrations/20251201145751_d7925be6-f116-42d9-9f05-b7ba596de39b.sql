-- Add sharing columns to folders table
ALTER TABLE public.folders 
ADD COLUMN is_shareable boolean DEFAULT false,
ADD COLUMN shareable_token uuid DEFAULT extensions.uuid_generate_v4(),
ADD COLUMN share_expires_at timestamp with time zone,
ADD COLUMN share_password_hash text;

-- Create index for shareable token lookups
CREATE INDEX idx_folders_shareable_token ON public.folders(shareable_token) WHERE is_shareable = true;