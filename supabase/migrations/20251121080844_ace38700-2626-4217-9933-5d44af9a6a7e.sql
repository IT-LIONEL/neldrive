-- Add offline access column to files table
ALTER TABLE files ADD COLUMN is_offline boolean DEFAULT false;