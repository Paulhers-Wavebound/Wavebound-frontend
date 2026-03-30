-- Fix storage policies to allow anon users to upload thumbnails
DROP POLICY IF EXISTS "Service role can insert thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete thumbnails" ON storage.objects;

-- Allow anonymous users to upload thumbnails (needed for the browser-based processor)
CREATE POLICY "Anyone can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can update thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can delete thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'thumbnails');