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
    const { reelUrl } = await req.json();

    if (!reelUrl) {
      return new Response(
        JSON.stringify({ error: 'reelUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate that this is actually an Instagram URL
    const isInstagramUrl = reelUrl.includes('instagram.com');
    if (!isInstagramUrl) {
      console.log('⚠️ Non-Instagram URL provided:', reelUrl);
      return new Response(
        JSON.stringify({ 
          error: 'Only Instagram URLs are supported by this oEmbed endpoint',
          url: reelUrl,
          isNonInstagram: true
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📸 Fetching oEmbed data for Instagram Reel:', reelUrl);

    // Fetch oEmbed data from Instagram
    // Note: Instagram oEmbed doesn't require access_token for public posts
    const response = await fetch(
      `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(reelUrl)}`
    );

    if (!response.ok) {
      console.error('Instagram oEmbed API error:', response.status, 'for URL:', reelUrl);
      
      // Return a fallback response instead of throwing an error
      // This prevents breaking the UI when reels are deleted/unavailable
      return new Response(
        JSON.stringify({ 
          thumbnail_url: null,
          author_name: null,
          html: null,
          error: `Reel unavailable (${response.status})`,
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
    console.error('Error in fetch-instagram-oembed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
