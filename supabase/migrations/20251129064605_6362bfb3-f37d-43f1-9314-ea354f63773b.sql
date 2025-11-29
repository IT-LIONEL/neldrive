-- Update profiles RLS policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Only authenticated users can view profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can only see their own profile for sensitive data
CREATE POLICY "Users can view their own profile details" 
ON public.profiles 
FOR SELECT
USING (auth.uid() = user_id);