-- Remove the broad policy that lets any authenticated user see all profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Keep only the policy that restricts users to their own profile
-- "Users can view their own profile details" already exists with (auth.uid() = user_id)