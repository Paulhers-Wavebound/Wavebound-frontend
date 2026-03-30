-- Update all genre entries that contain "Pop" to standardize them to "Pop"
UPDATE tiktok_videos_all 
SET genre = 'Pop'
WHERE genre IS NOT NULL 
  AND (
    genre ILIKE '%pop%' 
    OR genre ILIKE '%Pop%'
  );

-- Also update the semi-viral videos table
UPDATE "semi-viral_videos_90days"
SET genre = 'Pop'
WHERE genre IS NOT NULL 
  AND (
    genre ILIKE '%pop%' 
    OR genre ILIKE '%Pop%'
  );

-- Also update the viral videos table  
UPDATE "viral_videos_90-180days"
SET genre = 'Pop'
WHERE genre IS NOT NULL 
  AND (
    genre ILIKE '%pop%' 
    OR genre ILIKE '%Pop%'
  );