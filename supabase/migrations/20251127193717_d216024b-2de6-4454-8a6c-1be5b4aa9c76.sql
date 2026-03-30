-- Drop the restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Anyone can view profile data" ON public."Analysis Profile 1 - Profiles";

-- Create a PERMISSIVE SELECT policy (default behavior when AS PERMISSIVE is not specified or explicitly set)
CREATE POLICY "Public can view profile data"
ON public."Analysis Profile 1 - Profiles"
FOR SELECT
TO public
USING (true);