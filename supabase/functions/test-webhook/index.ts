import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id } = await req.json();

    if (!video_id) {
      return new Response(JSON.stringify({ error: 'video_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // The exact payload structure you showed me
    const testPayload = [
      {
        "main_categories": "Selfie Lip-Sync, Hook Statement",
        "sub_categories": "",
        "confidence": {
          "main_categories": {
            "Selfie Lip-Sync": {
              "score": 0.85,
              "reason": "The video is a phone-quality, selfie-style clip focusing on the person's face and vibe while outdoors in the snow."
            },
            "Hook Statement": {
              "score": 0.99,
              "reason": "A persistent text overlay reading \"I'm getting sued by artemas for this, Is it worth the drama?\" is present for the entire video."
            }
          },
          "sub_categories": {}
        },
        "video_id": video_id,
        "bpm": 165,
        "genre": {
          "Electronic": 0.95,
          "Alternative": 0.85,
          "Rock": 0.75
        },
        "sub_genre": {
          "Dark-pop": 0.9,
          "Synth-pop": 0.85,
          "Industrial": 0.7
        },
        "mood": {
          "Energetic": 1,
          "Aggressive": 0.9,
          "Epic": 0.7,
          "Scary": 0.4,
          "Ethereal": 0.2,
          "Sad": 0.1
        },
        "instruments": {
          "Synth": 1,
          "Drum Kit": 1,
          "Percussion": 0.6,
          "Bass Guitar": 0.4,
          "Electric Guitar": 0.2
        },
        "voices": {
          "predominant_gender": "Male",
          "confidence": 0.9,
          "presence_profile": "High"
        },
        "emotional_profile": {
          "profile": "Negative",
          "dynamics": "High",
          "energy_level": "High",
          "energy_dynamics": "Low"
        },
        "technical_feedback": {
          "tempo_bpm": 165,
          "key": null,
          "quality": "High production quality with a dense and powerful mix. The track is heavily compressed for maximum loudness.",
          "effects": "Prominent use of distortion on synth leads, reverb on vocals, and side-chain compression on synth pads."
        },
        "lyric_analysis": {
          "transcription": "Keep it on track, you're meant to stay in place. Girl I know you're lost, you'll never be the same. I'll pray to god but there's no escape. Let the blood track for the devil in our veins.",
          "themes": [
            "Darkness",
            "Entrapment",
            "Desperation",
            "Loss of Innocence"
          ],
          "sentiment": "Negative",
          "confidence": 0.95,
          "language": "English"
        },
        "content_plan": [
          {
            "day": 1,
            "video_id": 128,
            "hook": "I'm getting sued by artemas for this",
            "content_idea": "Create an edit-style video using a trending artist's name in the hook to catch attention. The content should be fast-paced and visually engaging to match the energetic and aggressive mood of the song."
          },
          {
            "day": 2,
            "video_id": 702,
            "hook": "Why am I Feeling this I've never felt before",
            "content_idea": "Make a video that showcases the production process of a song, with a hook that describes a powerful and new emotion. This content is for an audience that appreciates the technical aspects of music production and connects with epic, emotional soundscapes."
          },
          {
            "day": 3,
            "video_id": 559,
            "hook": "Crazy how only the person in the friend group with the best music taste gonna find this:",
            "content_idea": "Record a pro-camera lip-sync video with a hook that makes the viewer feel like they are part of an exclusive group. This content is designed to be shared and to make people feel like they are discovering something new and cool."
          },
          {
            "day": 4,
            "video_id": 339,
            "hook": "Guess what? You're the first person in you school that knows about this song (which makes you the cooles imo💅)",
            "content_idea": "Create a video with a hook that tells the viewer they are among the first to discover a new song. Combine this with AI-generated visuals to create a unique and shareable experience that appeals to a younger, trend-setting audience."
          },
          {
            "day": 5,
            "video_id": 149,
            "hook": "None provided",
            "content_idea": "Post a video that is a cover of a popular song in a completely different style. The video should be visually appealing and edited to match the high-energy, aggressive, and epic nature of your cover. Since there's no hook, the visual and sonic transformation will be the main draw."
          },
          {
            "day": 6,
            "video_id": 196,
            "hook": "None provided",
            "content_idea": "Create a video showcasing a super slowed-down, unreleased version of a song. Use visuals that match the atmospheric and energetic vibe of the track. This type of content appeals to fans who are eager for exclusive content and enjoy different takes on familiar songs."
          },
          {
            "day": 7,
            "video_id": 670,
            "hook": "None provided",
            "content_idea": "Post a video with visually stunning, nostalgic, and lo-fi visuals that match the mood of the instrumental track. The content should be calming yet energetic, perfect for an audience that enjoys chill, electronic music with a retro feel."
          }
        ]
      }
    ];

    console.log('🧪 Sending test payload to webhook for video_id:', video_id);

    // Call the receive-analysis-results function
    const webhookUrl = `https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/receive-analysis-results`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    console.log('✅ Webhook response:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      webhookResponse: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
