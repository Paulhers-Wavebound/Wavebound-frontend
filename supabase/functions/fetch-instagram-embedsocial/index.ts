import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EMBEDSOCIAL_API_KEY = 'es0602bc5a7860441849e61990ecad6c';
const CACHE_DURATION_HOURS = 24;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { shortcode, videoId } = await req.json();

    if (!shortcode) {
      return new Response(
        JSON.stringify({ error: 'Missing shortcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedData } = await supabase
      .from('oembed_cache')
      .select('thumbnail_url, updated_at')
      .eq('video_id', `ig_${videoId}`)
      .maybeSingle();

    if (cachedData?.thumbnail_url && cachedData.updated_at) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      const cacheMaxAge = CACHE_DURATION_HOURS * 60 * 60 * 1000;
      
      if (cacheAge < cacheMaxAge) {
        console.log('✅ Using cached Instagram thumbnail:', cachedData.thumbnail_url);
        return new Response(
          JSON.stringify({ thumbnail_url: cachedData.thumbnail_url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 1: Try EmbedSocial feeds API first
    console.log('🔍 Fetching feeds from EmbedSocial API');
    try {
      const feedsResponse = await fetch(
        'https://embedsocial.com/api/v1/feeds',
        {
          headers: {
            'Authorization': `Bearer ${EMBEDSOCIAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (feedsResponse.ok) {
        const feedsData = await feedsResponse.json();
        console.log('✅ Feeds data:', JSON.stringify(feedsData).substring(0, 200));

        // Find an Instagram feed
        const instagramFeed = feedsData?.data?.find((feed: any) => 
          feed.type === 'instagram' || feed.source === 'instagram'
        ) || feedsData?.data?.[0];

        if (instagramFeed?.id) {
          console.log('📋 Using feed ID:', instagramFeed.id);

          // Step 2: Fetch media from the feed
          const mediaResponse = await fetch(
            `https://embedsocial.com/api/v1/feeds/${instagramFeed.id}/media`,
            {
              headers: {
                'Authorization': `Bearer ${EMBEDSOCIAL_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            console.log('✅ Media data received, items:', mediaData?.data?.length || 0);

            // Find the media item matching our shortcode
            const mediaItem = mediaData?.data?.find((item: any) => 
              item.permalink?.includes(shortcode) || 
              item.shortcode === shortcode ||
              item.id === shortcode
            );

            const thumbnailUrl = mediaItem?.thumbnail_url || mediaItem?.media_url || mediaItem?.image_url || null;

            if (thumbnailUrl) {
              // Cache and return
              await supabase
                .from('oembed_cache')
                .upsert({
                  video_id: `ig_${videoId}`,
                  thumbnail_url: thumbnailUrl,
                  author_name: mediaItem?.username || null,
                  updated_at: new Date().toISOString()
                });

              console.log('✅ Fetched from EmbedSocial:', thumbnailUrl);
              return new Response(
                JSON.stringify({ thumbnail_url: thumbnailUrl }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    } catch (embedError) {
      console.warn('⚠️ EmbedSocial API failed, falling back to oEmbed:', embedError);
    }

    // Fallback to Instagram's public oEmbed
    console.log('🔄 Using Instagram oEmbed fallback');
    const instagramUrl = `https://www.instagram.com/reel/${shortcode}/`;
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(instagramUrl)}`;
    
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      console.error('❌ Instagram oEmbed error:', response.status);
      return new Response(
        JSON.stringify({ thumbnail_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const thumbnailUrl = data?.thumbnail_url || null;

    if (thumbnailUrl) {
      // Cache the result
      await supabase
        .from('oembed_cache')
        .upsert({
          video_id: `ig_${videoId}`,
          thumbnail_url: thumbnailUrl,
          author_name: data?.author_name || null,
          updated_at: new Date().toISOString()
        });

      console.log('✅ Fetched from oEmbed fallback:', thumbnailUrl);
    }

    return new Response(
      JSON.stringify({ thumbnail_url: thumbnailUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in fetch-instagram-embedsocial:', error);
    return new Response(
      JSON.stringify({ error: error.message, thumbnail_url: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
