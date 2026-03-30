import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tiktokUrl } = await req.json();

    if (!tiktokUrl) {
      return new Response(
        JSON.stringify({ error: 'tiktokUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate that this is actually a TikTok URL
    const isTikTokUrl = tiktokUrl.includes('tiktok.com');
    if (!isTikTokUrl) {
      console.log('⚠️ Non-TikTok URL provided:', tiktokUrl);
      return new Response(
        JSON.stringify({ 
          error: 'Only TikTok URLs are supported by this oEmbed endpoint',
          url: tiktokUrl,
          isNonTikTok: true
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Photo carousel URLs: TikTok oEmbed returns thumbnail but not full embed HTML
    const isPhotoCarousel = tiktokUrl.includes('/photo/');
    if (isPhotoCarousel) {
      console.log('📸 Fetching oEmbed thumbnail for photo carousel URL');
    }

    // Fetch oEmbed data from TikTok
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`
    );

    if (!response.ok) {
      console.error('TikTok oEmbed API error:', response.status, 'for URL:', tiktokUrl);
      
      // Return a fallback response instead of throwing an error
      // This prevents breaking the UI when videos are deleted/unavailable
      return new Response(
        JSON.stringify({ 
          thumbnail_url: null, // Signal that thumbnail fetch failed
          author_name: null,
          embed_html: null,
          error: `Video unavailable (${response.status})`,
          fallback: true
        }),
        { 
          status: 200, // Return 200 so client can handle gracefully
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-tiktok-oembed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
