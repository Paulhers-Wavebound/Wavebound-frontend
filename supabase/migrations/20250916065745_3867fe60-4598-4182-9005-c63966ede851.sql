-- Fix the security warning for the function search path
CREATE OR REPLACE FUNCTION public.update_thumbnail_url(p_video_id bigint, p_thumbnail_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.media_assets_gif_thumbnail 
    SET thumbnail_url = p_thumbnail_url
    WHERE video_id = p_video_id;
    
    -- If no existing record, insert a new one
    IF NOT FOUND THEN
        INSERT INTO public.media_assets_gif_thumbnail (video_id, thumbnail_url)
        VALUES (p_video_id, p_thumbnail_url);
    END IF;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;