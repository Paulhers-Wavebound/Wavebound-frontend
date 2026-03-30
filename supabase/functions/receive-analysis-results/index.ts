import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    
    console.log('=== RAW WEBHOOK PAYLOAD ===');
    console.log('Is Array:', Array.isArray(rawBody));
    console.log('Full payload:', JSON.stringify(rawBody, null, 2));
    console.log('=== END RAW PAYLOAD ===');

    let video_id, category_style, genre, sub_genre, hooks_captions, status;
    
    // Handle array format with single analysis object
    if (Array.isArray(rawBody) && rawBody.length > 0) {
      console.log('📦 Array format detected, extracting data from first element');
      const analysisData = rawBody[0];
      
      // Extract video_id from the payload directly
      video_id = analysisData.video_id;
      
      if (!video_id) {
        // Fallback to URL query params
        const url = new URL(req.url);
        video_id = url.searchParams.get('video_id');
      }
      
      if (!video_id) {
        throw new Error('video_id is required in payload or query params');
      }
      
      // Check if new nested format (visual_analysis + audio_analysis)
      if (analysisData.visual_analysis && analysisData.audio_analysis) {
        console.log('🎨 New nested format detected (visual_analysis + audio_analysis)');
        
        // Extract categories from visual_analysis
        category_style = analysisData.visual_analysis.main_categories;
        
        // Extract genre and sub_genre from audio_analysis as JSON strings
        genre = typeof analysisData.audio_analysis.genre === 'object'
          ? JSON.stringify(analysisData.audio_analysis.genre)
          : analysisData.audio_analysis.genre;
        
        sub_genre = typeof analysisData.audio_analysis.sub_genre === 'object'
          ? JSON.stringify(analysisData.audio_analysis.sub_genre)
          : analysisData.audio_analysis.sub_genre;
        
        // Set status based on presence of content_plan
        status = analysisData.content_plan && analysisData.content_plan.length > 0 ? 'completed' : 'processing';
        
        // Store the complete analysis in hooks_captions
        hooks_captions = [{
          visual_analysis: analysisData.visual_analysis,
          audio_analysis: analysisData.audio_analysis,
          content_plan: analysisData.content_plan || []
        }];
        
        console.log('📝 Video analysis received (new format):', {
          categories: category_style,
          subCategories: analysisData.visual_analysis.sub_categories,
          contentPlanLength: analysisData.content_plan?.length,
          bpm: analysisData.audio_analysis?.technical_feedback?.tempo_bpm,
          hasConfidence: !!analysisData.visual_analysis.confidence
        });
      } else {
        // Old flat format
        console.log('📦 Old flat array format');
        
        // Extract categories (comma-separated strings)
        category_style = analysisData.main_categories;
        
        // Extract genre and sub_genre as JSON strings (they're objects with scores)
        genre = typeof analysisData.genre === 'object' 
          ? JSON.stringify(analysisData.genre)
          : analysisData.genre;
        
        sub_genre = typeof analysisData.sub_genre === 'object'
          ? JSON.stringify(analysisData.sub_genre)
          : analysisData.sub_genre;
        
        // Set status based on presence of content_plan
        status = analysisData.content_plan && analysisData.content_plan.length > 0 ? 'completed' : 'processing';
        
        // Store the complete analysis in hooks_captions
        hooks_captions = [{
          main_categories: analysisData.main_categories,
          sub_categories: analysisData.sub_categories,
          confidence: analysisData.confidence,
          candidates: analysisData.candidates,
          dropped_for_rules: analysisData.dropped_for_rules,
          bpm: analysisData.bpm,
          genre: analysisData.genre,
          sub_genre: analysisData.sub_genre,
          mood: analysisData.mood,
          instruments: analysisData.instruments,
          voices: analysisData.voices,
          emotional_profile: analysisData.emotional_profile,
          technical_feedback: analysisData.technical_feedback,
          lyric_analysis: analysisData.lyric_analysis,
          content_plan: analysisData.content_plan || []
        }];
        
        console.log('📝 Video analysis received:', {
          categories: category_style,
          subCategories: analysisData.sub_categories,
          contentPlanLength: hooks_captions[0].content_plan?.length,
          bpm: analysisData.bpm,
          hasConfidence: !!analysisData.confidence
        });
      }
    } else {
      // Old format - direct object or n8n object-with-index format
      console.log('📦 Object format detected');
      ({ video_id, category_style, genre, sub_genre, hooks_captions, status } = rawBody as any);

      // Handle n8n format where the actual analysis is nested under key "0"
      if (!category_style && !genre && !sub_genre && !hooks_captions && (rawBody as any)['0']) {
        const analysisData = (rawBody as any)['0'];
        
        // Check if new nested format (visual_analysis + audio_analysis)
        if (analysisData.visual_analysis && analysisData.audio_analysis) {
          console.log('🎨 New nested format detected in "0" key (visual_analysis + audio_analysis)');
          
          // Extract categories from visual_analysis
          category_style = analysisData.visual_analysis.main_categories;
          
          // Extract genre and sub_genre from audio_analysis as JSON strings
          genre = typeof analysisData.audio_analysis.genre === 'object'
            ? JSON.stringify(analysisData.audio_analysis.genre)
            : analysisData.audio_analysis.genre;
          
          sub_genre = typeof analysisData.audio_analysis.sub_genre === 'object'
            ? JSON.stringify(analysisData.audio_analysis.sub_genre)
            : analysisData.audio_analysis.sub_genre;
          
          // Set status based on presence of content_plan
          status = analysisData.content_plan && analysisData.content_plan.length > 0 ? 'completed' : 'processing';
          
          // Store the complete analysis in hooks_captions
          hooks_captions = [{
            visual_analysis: analysisData.visual_analysis,
            audio_analysis: analysisData.audio_analysis,
            content_plan: analysisData.content_plan || []
          }];
          
          console.log('📝 Video analysis normalized from "0" object (new format):', {
            categories: category_style,
            subCategories: analysisData.visual_analysis.sub_categories,
            contentPlanLength: analysisData.content_plan?.length,
            bpm: analysisData.audio_analysis?.technical_feedback?.tempo_bpm,
            hasConfidence: !!analysisData.visual_analysis.confidence,
          });
        } else {
          // Old flat format in "0" key
          console.log('📦 Old flat format in "0" key');

          // Extract categories (comma-separated strings)
          category_style = analysisData.main_categories;

          // Extract genre and sub_genre as JSON strings (they're objects with scores)
          genre = typeof analysisData.genre === 'object'
            ? JSON.stringify(analysisData.genre)
            : analysisData.genre;

          sub_genre = typeof analysisData.sub_genre === 'object'
            ? JSON.stringify(analysisData.sub_genre)
            : analysisData.sub_genre;

          // Set status based on presence of content_plan
          status = analysisData.content_plan && analysisData.content_plan.length > 0 ? 'completed' : 'processing';

          // Store the complete analysis in hooks_captions
          hooks_captions = [{
            main_categories: analysisData.main_categories,
            sub_categories: analysisData.sub_categories,
            confidence: analysisData.confidence,
            candidates: analysisData.candidates,
            dropped_for_rules: analysisData.dropped_for_rules,
            bpm: analysisData.bpm,
            genre: analysisData.genre,
            sub_genre: analysisData.sub_genre,
            mood: analysisData.mood,
            instruments: analysisData.instruments,
            voices: analysisData.voices,
            emotional_profile: analysisData.emotional_profile,
            technical_feedback: analysisData.technical_feedback,
            lyric_analysis: analysisData.lyric_analysis,
            content_plan: analysisData.content_plan || [],
          }];

          console.log('📝 Video analysis normalized from object format:', {
            categories: category_style,
            subCategories: analysisData.sub_categories,
            contentPlanLength: hooks_captions[0].content_plan?.length,
            bpm: analysisData.bpm,
            hasConfidence: !!analysisData.confidence,
          });
        }
      }
    }

    console.log('=== PROCESSED DATA ===');
    console.log('video_id:', video_id);
    console.log('category_style:', category_style);
    console.log('genre:', JSON.stringify(genre));
    console.log('sub_genre:', JSON.stringify(sub_genre));
    console.log('hooks_captions:', JSON.stringify(hooks_captions));
    console.log('=== END PROCESSED ===');

    // Extract genre and sub_genre from hooks_captions if not provided at top level
    if (Array.isArray(hooks_captions) && hooks_captions.length > 0) {
      const firstItem = hooks_captions[0];
      
      // If genre not provided at top level, extract from hooks_captions
      if (!genre && firstItem.genre) {
        genre = firstItem.genre;
        console.log('Extracted genre from hooks_captions:', JSON.stringify(genre));
      }
      
      // If sub_genre not provided at top level, extract from hooks_captions
      if (!sub_genre && firstItem.sub_genre) {
        sub_genre = firstItem.sub_genre;
        console.log('Extracted sub_genre from hooks_captions:', JSON.stringify(sub_genre));
      }
      
      // If category_style not provided, try to derive from genre
      if (!category_style && genre) {
        category_style = Object.keys(genre).join(', ');
        console.log('Derived category_style from genre:', category_style);
      }
    }

    if (!video_id) {
      return new Response(JSON.stringify({ error: 'video_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user_id from video
    const { data: video, error: videoError } = await supabase
      .from('user_uploaded_videos')
      .select('user_id')
      .eq('id', video_id)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if hooks_captions has content (could be string or array)
    const hasHooks = hooks_captions && (
      (typeof hooks_captions === 'string' && hooks_captions.trim().length > 0) ||
      (Array.isArray(hooks_captions) && hooks_captions.length > 0)
    );
    
    // Only mark as completed if all required fields are present
    const isComplete = category_style && genre && hasHooks;
    const newStatus = isComplete ? 'completed' : 'processing';

    console.log('Update status:', { 
      isComplete, 
      newStatus, 
      hasCategory: !!category_style, 
      hasGenre: !!genre,
      hasSubGenre: !!sub_genre,
      hasHooks,
      hooksType: typeof hooks_captions 
    });

    // Update analysis results (not upsert, just update the existing record)
    const { error: updateError } = await supabase
      .from('video_analysis_results')
      .update({
        status: newStatus,
        category_style,
        genre,
        sub_genre: sub_genre || null,
        hooks_captions: hooks_captions || [],
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', video_id);

    if (updateError) {
      console.error('Error updating results:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analysis results saved successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in receive-analysis-results:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});