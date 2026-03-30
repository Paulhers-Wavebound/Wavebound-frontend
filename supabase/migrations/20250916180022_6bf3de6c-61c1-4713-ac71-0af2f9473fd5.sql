-- Standardize sub-genre variations across all video tables

-- Standardize in tiktok_videos_all table
UPDATE tiktok_videos_all 
SET sub_genre = CASE
  -- Standardize Indie variations to "Indie-Pop"
  WHEN sub_genre ILIKE '%indie-pop%' OR sub_genre ILIKE '%indie%' THEN REPLACE(REPLACE(REPLACE(sub_genre, 'Indie-pop', 'Indie-Pop'), 'indie-pop', 'Indie-Pop'), 'Indie', 'Indie-Pop')
  -- Standardize Dream Pop variations
  WHEN sub_genre ILIKE '%dream pop%' THEN REPLACE(sub_genre, 'Dream pop', 'Dream Pop')
  -- Remove JSON array brackets and quotes for cleaner format
  WHEN sub_genre LIKE '[%]' THEN REPLACE(REPLACE(REPLACE(sub_genre, '["', ''), '"]', ''), '","', ', ')
  ELSE sub_genre
END
WHERE sub_genre IS NOT NULL;

-- Additional cleanup: standardize comma-separated values and remove quotes
UPDATE tiktok_videos_all 
SET sub_genre = REPLACE(REPLACE(REPLACE(sub_genre, '"', ''), '[', ''), ']', '')
WHERE sub_genre ILIKE '%[%' OR sub_genre ILIKE '%"%';

-- Clean up extra spaces and normalize separators
UPDATE tiktok_videos_all 
SET sub_genre = REGEXP_REPLACE(TRIM(sub_genre), '\s*,\s*', ', ', 'g')
WHERE sub_genre IS NOT NULL;

-- Standardize in semi-viral_videos_90days table
UPDATE "semi-viral_videos_90days" 
SET sub_genre = CASE
  -- Standardize Indie variations to "Indie-Pop"
  WHEN sub_genre ILIKE '%indie-pop%' OR sub_genre ILIKE '%indie%' THEN REPLACE(REPLACE(REPLACE(sub_genre, 'Indie-pop', 'Indie-Pop'), 'indie-pop', 'Indie-Pop'), 'Indie', 'Indie-Pop')
  -- Standardize Dream Pop variations
  WHEN sub_genre ILIKE '%dream pop%' THEN REPLACE(sub_genre, 'Dream pop', 'Dream Pop')
  -- Remove JSON array brackets and quotes for cleaner format
  WHEN sub_genre LIKE '[%]' THEN REPLACE(REPLACE(REPLACE(sub_genre, '["', ''), '"]', ''), '","', ', ')
  ELSE sub_genre
END
WHERE sub_genre IS NOT NULL;

-- Additional cleanup for semi-viral table
UPDATE "semi-viral_videos_90days" 
SET sub_genre = REPLACE(REPLACE(REPLACE(sub_genre, '"', ''), '[', ''), ']', '')
WHERE sub_genre ILIKE '%[%' OR sub_genre ILIKE '%"%';

-- Clean up extra spaces and normalize separators
UPDATE "semi-viral_videos_90days" 
SET sub_genre = REGEXP_REPLACE(TRIM(sub_genre), '\s*,\s*', ', ', 'g')
WHERE sub_genre IS NOT NULL;

-- Standardize in viral_videos_90-180days table
UPDATE "viral_videos_90-180days" 
SET sub_genre = CASE
  -- Standardize Indie variations to "Indie-Pop"
  WHEN sub_genre ILIKE '%indie-pop%' OR sub_genre ILIKE '%indie%' THEN REPLACE(REPLACE(REPLACE(sub_genre, 'Indie-pop', 'Indie-Pop'), 'indie-pop', 'Indie-Pop'), 'Indie', 'Indie-Pop')
  -- Standardize Dream Pop variations
  WHEN sub_genre ILIKE '%dream pop%' THEN REPLACE(sub_genre, 'Dream pop', 'Dream Pop')
  -- Remove JSON array brackets and quotes for cleaner format
  WHEN sub_genre LIKE '[%]' THEN REPLACE(REPLACE(REPLACE(sub_genre, '["', ''), '"]', ''), '","', ', ')
  ELSE sub_genre
END
WHERE sub_genre IS NOT NULL;

-- Additional cleanup for viral table
UPDATE "viral_videos_90-180days" 
SET sub_genre = REPLACE(REPLACE(REPLACE(sub_genre, '"', ''), '[', ''), ']', '')
WHERE sub_genre ILIKE '%[%' OR sub_genre ILIKE '%"%';

-- Clean up extra spaces and normalize separators
UPDATE "viral_videos_90-180days" 
SET sub_genre = REGEXP_REPLACE(TRIM(sub_genre), '\s*,\s*', ', ', 'g')
WHERE sub_genre IS NOT NULL;