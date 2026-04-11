-- RPC: get_artist_sound_velocity — thin wrapper around artist_sound_velocity view
-- Returns per-artist sound velocity data filtered by label_id
-- Used by Content & Social Dashboard roster table to show "Top Sound" column

CREATE OR REPLACE FUNCTION get_artist_sound_velocity(p_label_id uuid)
RETURNS TABLE (
  artist_handle text,
  top_sound_title text,
  top_sound_new_ugc bigint,
  top_sound_total_ugc bigint,
  velocity text,
  this_week_total_new_ugc bigint,
  sounds_tracked bigint
) AS $$
  SELECT v.artist_handle, v.top_sound_title, v.top_sound_new_ugc,
         v.top_sound_total_ugc, v.velocity, v.this_week_total_new_ugc, v.sounds_tracked
  FROM artist_sound_velocity v
  WHERE v.label_id = p_label_id;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_artist_sound_velocity(uuid) TO authenticated;
