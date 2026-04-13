export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      __cleanup_dedup_artist_map: {
        Row: {
          dupe_id: string | null
          keep_id: string | null
        }
        Insert: {
          dupe_id?: string | null
          keep_id?: string | null
        }
        Update: {
          dupe_id?: string | null
          keep_id?: string | null
        }
        Relationships: []
      }
      __cleanup_dedup_case_map: {
        Row: {
          dupe_id: string | null
          keep_id: string | null
        }
        Insert: {
          dupe_id?: string | null
          keep_id?: string | null
        }
        Update: {
          dupe_id?: string | null
          keep_id?: string | null
        }
        Relationships: []
      }
      "0.1. Table 1 - Profile - TikTok": {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_saves: number | null
          avg_shares: number | null
          avg_views: number | null
          created_at: string
          gender: string | null
          handle: string | null
          id: number
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_saves: number | null
          median_shares: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: number | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          created_at?: string
          gender?: string | null
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: number | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          created_at?: string
          gender?: string | null
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: number | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 1 - Profile - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 1 - Profile - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 1.1 - Profile - PC - TikTok": {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_views: number | null
          created_at: string
          handle: string | null
          id: number
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_url: string | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 1.1 - Profile - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 1.1 - Profile - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 1.2 - Profile - Instagram": {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_views: number | null
          created_at: string
          gender: string | null
          handle: string | null
          id: number
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_url: string | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          gender?: string | null
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string
          gender?: string | null
          handle?: string | null
          id?: number
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 2 - Profile - Instagram_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 2 - Profile - Instagram_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 2 - Video - TikTok": {
        Row: {
          author_id: number | null
          caption: string | null
          comment_sentiment: string | null
          comments_raw: Json | null
          created_at: string
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number
          language: string | null
          performance_multiplier: string | null
          post_id: string | null
          red_flags: Json | null
          replicable_elements: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_saves: number | null
          video_shares: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
          virality_type: string | null
        }
        Insert: {
          author_id?: number | null
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Update: {
          author_id?: number | null
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Relationships: []
      }
      "0.1. Table 2.1 - PC - TikTok": {
        Row: {
          caption: string | null
          created_at: string
          date_posted: string | null
          hashtags: string | null
          id: number
          language: string | null
          performance_multiplier: string | null
          photo_comments: number | null
          photo_likes: number | null
          photo_saves: number | null
          photo_views: number | null
          post_id: number | null
          post_url: string | null
          viral_score: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          photo_comments?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_views?: number | null
          post_id?: number | null
          post_url?: string | null
          viral_score?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          photo_comments?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_views?: number | null
          post_id?: number | null
          post_url?: string | null
          viral_score?: number | null
        }
        Relationships: []
      }
      "0.1. Table 2.2 - Video - Reels": {
        Row: {
          caption: string | null
          comment_sentiment: string | null
          comments_raw: Json | null
          created_at: string
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number
          language: string | null
          performance_multiplier: string | null
          post_id: string | null
          red_flags: Json | null
          replay_rate: number | null
          replicable_elements: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
          virality_type: string | null
        }
        Insert: {
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replay_rate?: number | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Update: {
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replay_rate?: number | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Relationships: []
      }
      "0.1. Table 3 - Sound - TikTok": {
        Row: {
          audio_url_128k: string | null
          created_at: string
          duration: number | null
          emotinal_profile: Json | null
          genre: string | null
          id: number
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 6 - Sound - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 6 - Sound - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 3.1 - Sound - PC - TikTok": {
        Row: {
          audio_url_128k: string | null
          created_at: string
          emotinal_profile: Json | null
          genre: string | null
          id: number
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sound_url: string | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 6.1 - Sound - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 6.1 - Sound - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 3.2 - Sound - Reels": {
        Row: {
          audio_url_128k: string | null
          created_at: string
          duration: number | null
          emotinal_profile: Json | null
          genre: string | null
          id: number
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sound_url: string | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 7 - Sound - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 7 - Sound - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 4 - Assets - TikTok": {
        Row: {
          created_at: string
          id: number
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "01. Table 8 - Assets - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "01. Table 8 - Assets - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 4.1 - Assets - PC - TikTok": {
        Row: {
          created_at: string
          id: number
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 8.1 - Assets - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 8.1 - Assets - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 4.2 - Assets - Reels": {
        Row: {
          created_at: string
          id: number
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 8 - Assets - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 8 - Assets - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 5 - Ai - TikTok": {
        Row: {
          candidates: string | null
          content_style: string | null
          content_style_confidence: string | null
          context: string | null
          created_at: string
          description: string | null
          effort: string | null
          evidence_pointers: string | null
          hook: string | null
          id: number
          label_reasons: string | null
          sub_style: string | null
          video_id: number | null
        }
        Insert: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number
          label_reasons?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Update: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number
          label_reasons?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 9 - Video - Ai Analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 9 - Video - Ai Analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 5.1 - Ai - PC - TikTok": {
        Row: {
          created_at: string
          effort: string | null
          gender: string | null
          hook: string | null
          hook_confidence: string | null
          hook_text: string | null
          id: number
          language: string | null
          photo_c_id: number | null
          transcribed_text: string | null
        }
        Insert: {
          created_at?: string
          effort?: string | null
          gender?: string | null
          hook?: string | null
          hook_confidence?: string | null
          hook_text?: string | null
          id?: number
          language?: string | null
          photo_c_id?: number | null
          transcribed_text?: string | null
        }
        Update: {
          created_at?: string
          effort?: string | null
          gender?: string | null
          hook?: string | null
          hook_confidence?: string | null
          hook_text?: string | null
          id?: number
          language?: string | null
          photo_c_id?: number | null
          transcribed_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 10 - Ai Analysis - Reels_duplicate_photo_c_id_fkey"
            columns: ["photo_c_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 10 - Ai Analysis - Reels_duplicate_photo_c_id_fkey"
            columns: ["photo_c_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 5.2 - Ai - Reels": {
        Row: {
          candidates: string | null
          content_style: string | null
          content_style_confidence: string | null
          context: string | null
          created_at: string
          description: string | null
          effort: string | null
          evidence_pointers: string | null
          hook: string | null
          id: number
          label_reasons: string | null
          "social_context_&_mood": string | null
          sub_style: string | null
          video_id: number | null
        }
        Insert: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number
          label_reasons?: string | null
          "social_context_&_mood"?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Update: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number
          label_reasons?: string | null
          "social_context_&_mood"?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 10 - Video - Ai Analysis - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 10 - Video - Ai Analysis - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      "0.1. Table 6 - Analysis & Data": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      "0.1. Table 7 - H-I-T-L - TikTok": {
        Row: {
          artist_handle: string | null
          author_avatar_url: string | null
          author_bio: string | null
          author_followers: number | null
          author_id: string | null
          author_nickname: string | null
          author_unique_id: string | null
          author_verified: boolean | null
          caption: string | null
          collect_count: number | null
          comment_count: number | null
          comment_sentiment: string | null
          comments_raw: Json | null
          Confidence: number | null
          content_type: string | null
          created_at: string
          creator_avg_comments: number | null
          creator_avg_engagement: number | null
          creator_avg_likes: number | null
          creator_avg_saves: number | null
          creator_avg_shares: number | null
          creator_avg_views: number | null
          creator_median_comments: number | null
          creator_median_engagement: number | null
          creator_median_likes: number | null
          creator_median_saves: number | null
          creator_median_shares: number | null
          creator_median_views: number | null
          date_posted: string | null
          duration_seconds: number | null
          gemini_analysis: Json | null
          hashtags: string | null
          id: number
          image_urls: string | null
          is_ad: boolean | null
          is_author_artist: boolean | null
          language: string | null
          like_count: number | null
          location_created: string | null
          music_author: string | null
          music_id: string | null
          music_name: string | null
          performance_multiplier: string | null
          play_count: number | null
          post_id: string | null
          Reasoning: string | null
          red_flags: Json | null
          replicable_elements: string | null
          scrape_category: string | null
          scrape_query: string | null
          share_count: number | null
          Status: string | null
          tiktok_video_id: string | null
          URL: string | null
          video_cover_url: string | null
          video_download_url: string | null
          viral_score: number | null
          virality_type: string | null
          web_url: string | null
        }
        Insert: {
          artist_handle?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_saves?: number | null
          creator_avg_shares?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_saves?: number | null
          creator_median_shares?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number
          image_urls?: string | null
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          share_count?: number | null
          Status?: string | null
          tiktok_video_id?: string | null
          URL?: string | null
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Update: {
          artist_handle?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_saves?: number | null
          creator_avg_shares?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_saves?: number | null
          creator_median_shares?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number
          image_urls?: string | null
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          share_count?: number | null
          Status?: string | null
          tiktok_video_id?: string | null
          URL?: string | null
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Relationships: []
      }
      "0.1. Table 7.2 - H-I-T-L - Instagram": {
        Row: {
          author_avatar_url: string | null
          author_bio: string | null
          author_followers: number | null
          author_full_name: string | null
          author_id: string | null
          author_username: string | null
          author_verified: boolean | null
          caption: string | null
          comment_count: number | null
          comment_sentiment: string | null
          comments_raw: Json | null
          Confidence: number | null
          content_type: string | null
          created_at: string
          creator_avg_comments: number | null
          creator_avg_engagement: number | null
          creator_avg_likes: number | null
          creator_avg_views: number | null
          creator_median_comments: number | null
          creator_median_engagement: number | null
          creator_median_likes: number | null
          creator_median_views: number | null
          date_posted: string | null
          duration_seconds: number | null
          gemini_analysis: Json | null
          hashtags: string | null
          id: number
          instagram_media_id: string | null
          is_paid_partnership: boolean | null
          language: string | null
          like_count: number | null
          location_name: string | null
          music_artist_name: string | null
          music_audio_id: string | null
          music_song_name: string | null
          performance_multiplier: string | null
          play_count: number | null
          post_id: string | null
          Reasoning: string | null
          red_flags: Json | null
          replicable_elements: string | null
          scrape_category: string | null
          scrape_query: string | null
          shortcode: string | null
          Status: string | null
          URL: string | null
          uses_original_audio: boolean | null
          video_cover_url: string | null
          video_download_url: string | null
          view_count: number | null
          viral_score: number | null
          virality_type: string | null
          web_url: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_full_name?: string | null
          author_id?: string | null
          author_username?: string | null
          author_verified?: boolean | null
          caption?: string | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number
          instagram_media_id?: string | null
          is_paid_partnership?: boolean | null
          language?: string | null
          like_count?: number | null
          location_name?: string | null
          music_artist_name?: string | null
          music_audio_id?: string | null
          music_song_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          shortcode?: string | null
          Status?: string | null
          URL?: string | null
          uses_original_audio?: boolean | null
          video_cover_url?: string | null
          video_download_url?: string | null
          view_count?: number | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_full_name?: string | null
          author_id?: string | null
          author_username?: string | null
          author_verified?: boolean | null
          caption?: string | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number
          instagram_media_id?: string | null
          is_paid_partnership?: boolean | null
          language?: string | null
          like_count?: number | null
          location_name?: string | null
          music_artist_name?: string | null
          music_audio_id?: string | null
          music_song_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          shortcode?: string | null
          Status?: string | null
          URL?: string | null
          uses_original_audio?: boolean | null
          video_cover_url?: string | null
          video_download_url?: string | null
          view_count?: number | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Relationships: []
      }
      "Analysis Profile 1 - Profiles": {
        Row: {
          created_at: string
          handle: string | null
          id: number
          profile_avatar: string | null
          profile_bio: string | null
          profile_followers: number | null
          profile_following: number | null
          profile_likes: number | null
          profile_nickname: string | null
          profile_posts: number | null
          profile_url: string | null
          stats: Json | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: number
          profile_avatar?: string | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_following?: number | null
          profile_likes?: number | null
          profile_nickname?: string | null
          profile_posts?: number | null
          profile_url?: string | null
          stats?: Json | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: number
          profile_avatar?: string | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_following?: number | null
          profile_likes?: number | null
          profile_nickname?: string | null
          profile_posts?: number | null
          profile_url?: string | null
          stats?: Json | null
          verified?: boolean | null
        }
        Relationships: []
      }
      "Analysis Profile 2 - analysis_jobs": {
        Row: {
          available_videos: number | null
          created_at: string
          exclude_pinned: boolean | null
          handle: string | null
          id: number
          profile_id: number | null
          status: string | null
          total_videos: number | null
        }
        Insert: {
          available_videos?: number | null
          created_at?: string
          exclude_pinned?: boolean | null
          handle?: string | null
          id?: number
          profile_id?: number | null
          status?: string | null
          total_videos?: number | null
        }
        Update: {
          available_videos?: number | null
          created_at?: string
          exclude_pinned?: boolean | null
          handle?: string | null
          id?: number
          profile_id?: number | null
          status?: string | null
          total_videos?: number | null
        }
        Relationships: []
      }
      "Analysis Profile 3 - video_analysis": {
        Row: {
          caption: string | null
          content_url: string | null
          created_at: string
          id: number
          job_id: number | null
          performance_multiplier: string | null
          post_comments: string | null
          post_likes: number | null
          post_saves: number | null
          post_shares: number | null
          post_time_date: string | null
          post_views: number | null
          profile_id: number | null
          sound_id: number | null
          Status: string | null
          video_id: number | null
          video_url: string | null
          video_url_storage: string | null
          viral_score: number | null
          visual_analysis: string | null
        }
        Insert: {
          caption?: string | null
          content_url?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          performance_multiplier?: string | null
          post_comments?: string | null
          post_likes?: number | null
          post_saves?: number | null
          post_shares?: number | null
          post_time_date?: string | null
          post_views?: number | null
          profile_id?: number | null
          sound_id?: number | null
          Status?: string | null
          video_id?: number | null
          video_url?: string | null
          video_url_storage?: string | null
          viral_score?: number | null
          visual_analysis?: string | null
        }
        Update: {
          caption?: string | null
          content_url?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          performance_multiplier?: string | null
          post_comments?: string | null
          post_likes?: number | null
          post_saves?: number | null
          post_shares?: number | null
          post_time_date?: string | null
          post_views?: number | null
          profile_id?: number | null
          sound_id?: number | null
          Status?: string | null
          video_id?: number | null
          video_url?: string | null
          video_url_storage?: string | null
          viral_score?: number | null
          visual_analysis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Analysis Profile - video_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "Analysis Profile 2 - analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      "Analysis Profile 4 - photo_carousel_analysis": {
        Row: {
          caption: string | null
          content_url: string | null
          created_at: string
          id: number
          job_id: number | null
          performance_multiplier: string | null
          photo_carousel_analysis: string | null
          photo_url: string | null
          post_comments: string | null
          post_id: number | null
          post_likes: number | null
          post_saves: number | null
          post_shares: number | null
          post_time_date: string | null
          post_views: number | null
          profile_id: number | null
          sound_id: string | null
          sound_url: string | null
          Status: string | null
          viral_score: number | null
        }
        Insert: {
          caption?: string | null
          content_url?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          performance_multiplier?: string | null
          photo_carousel_analysis?: string | null
          photo_url?: string | null
          post_comments?: string | null
          post_id?: number | null
          post_likes?: number | null
          post_saves?: number | null
          post_shares?: number | null
          post_time_date?: string | null
          post_views?: number | null
          profile_id?: number | null
          sound_id?: string | null
          sound_url?: string | null
          Status?: string | null
          viral_score?: number | null
        }
        Update: {
          caption?: string | null
          content_url?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          performance_multiplier?: string | null
          photo_carousel_analysis?: string | null
          photo_url?: string | null
          post_comments?: string | null
          post_id?: number | null
          post_likes?: number | null
          post_saves?: number | null
          post_shares?: number | null
          post_time_date?: string | null
          post_views?: number | null
          profile_id?: number | null
          sound_id?: string | null
          sound_url?: string | null
          Status?: string | null
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Analysis Profile - photo_carousel_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "Analysis Profile 2 - analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      "Analysis Profile 5 - sound_analysis": {
        Row: {
          audio_analysis: string | null
          created_at: string
          id: number
          job_id: number | null
          profile_id: number | null
          sound_author: string | null
          sound_coverImage_url: string | null
          sound_id: number | null
          sound_name: string | null
          source_VideoId: string | null
        }
        Insert: {
          audio_analysis?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          profile_id?: number | null
          sound_author?: string | null
          sound_coverImage_url?: string | null
          sound_id?: number | null
          sound_name?: string | null
          source_VideoId?: string | null
        }
        Update: {
          audio_analysis?: string | null
          created_at?: string
          id?: number
          job_id?: number | null
          profile_id?: number | null
          sound_author?: string | null
          sound_coverImage_url?: string | null
          sound_id?: number | null
          sound_name?: string | null
          source_VideoId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Analysis Profile - sound_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "Analysis Profile 2 - analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          anomaly_type: string | null
          context: Json | null
          current_value: number | null
          detected_at: string | null
          entity_id: string | null
          expected_value: number | null
          id: string | null
          metric: string | null
          platform: string | null
          processed: boolean | null
          severity: number | null
        }
        Insert: {
          anomaly_type?: string | null
          context?: Json | null
          current_value?: number | null
          detected_at?: string | null
          entity_id?: string | null
          expected_value?: number | null
          id?: string | null
          metric?: string | null
          platform?: string | null
          processed?: boolean | null
          severity?: number | null
        }
        Update: {
          anomaly_type?: string | null
          context?: Json | null
          current_value?: number | null
          detected_at?: string | null
          entity_id?: string | null
          expected_value?: number | null
          id?: string | null
          metric?: string | null
          platform?: string | null
          processed?: boolean | null
          severity?: number | null
        }
        Relationships: []
      }
      ar_briefs: {
        Row: {
          brief_date: string
          brief_json: Json
          generated_at: string
          headline: string
          id: string
          label_id: string | null
        }
        Insert: {
          brief_date?: string
          brief_json?: Json
          generated_at?: string
          headline?: string
          id?: string
          label_id?: string | null
        }
        Update: {
          brief_date?: string
          brief_json?: Json
          generated_at?: string
          headline?: string
          id?: string
          label_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ar_briefs_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      ar_prospects: {
        Row: {
          ai_narrative: string
          artist_name: string
          assigned_to: string | null
          avatar_url: string | null
          avg_viral_score: number
          comment_intent: Json
          created_at: string
          cross_platform: Json
          deal_status: Json | null
          enrichment_status: string
          entity_id: string | null
          flagged_date: string
          format_alpha: Json
          genre: string | null
          ghost_curve_match: Json | null
          growth_velocity: Json
          id: string
          instagram_handle: string | null
          is_signed: boolean | null
          label_id: string | null
          label_name_detected: string | null
          metrics: Json
          origin_country: string | null
          pipeline_stage: string
          rise_probability: number
          risk_flags: Json
          scoring_status: string
          signability: Json
          source_handle: string
          source_platform: string
          sparkline_data: Json
          spotify_url: string | null
          threshold_status: string
          tiktok_handle: string | null
          total_rag_plays: number
          total_rag_videos: number
          trigger_markets: Json
          unreleased_test: Json | null
          updated_at: string
        }
        Insert: {
          ai_narrative?: string
          artist_name: string
          assigned_to?: string | null
          avatar_url?: string | null
          avg_viral_score?: number
          comment_intent?: Json
          created_at?: string
          cross_platform?: Json
          deal_status?: Json | null
          enrichment_status?: string
          entity_id?: string | null
          flagged_date?: string
          format_alpha?: Json
          genre?: string | null
          ghost_curve_match?: Json | null
          growth_velocity?: Json
          id?: string
          instagram_handle?: string | null
          is_signed?: boolean | null
          label_id?: string | null
          label_name_detected?: string | null
          metrics?: Json
          origin_country?: string | null
          pipeline_stage?: string
          rise_probability?: number
          risk_flags?: Json
          scoring_status?: string
          signability?: Json
          source_handle: string
          source_platform?: string
          sparkline_data?: Json
          spotify_url?: string | null
          threshold_status?: string
          tiktok_handle?: string | null
          total_rag_plays?: number
          total_rag_videos?: number
          trigger_markets?: Json
          unreleased_test?: Json | null
          updated_at?: string
        }
        Update: {
          ai_narrative?: string
          artist_name?: string
          assigned_to?: string | null
          avatar_url?: string | null
          avg_viral_score?: number
          comment_intent?: Json
          created_at?: string
          cross_platform?: Json
          deal_status?: Json | null
          enrichment_status?: string
          entity_id?: string | null
          flagged_date?: string
          format_alpha?: Json
          genre?: string | null
          ghost_curve_match?: Json | null
          growth_velocity?: Json
          id?: string
          instagram_handle?: string | null
          is_signed?: boolean | null
          label_id?: string | null
          label_name_detected?: string | null
          metrics?: Json
          origin_country?: string | null
          pipeline_stage?: string
          rise_probability?: number
          risk_flags?: Json
          scoring_status?: string
          signability?: Json
          source_handle?: string
          source_platform?: string
          sparkline_data?: Json
          spotify_url?: string | null
          threshold_status?: string
          tiktok_handle?: string | null
          total_rag_plays?: number
          total_rag_videos?: number
          trigger_markets?: Json
          unreleased_test?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ar_prospects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ar_prospects_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_alerts: {
        Row: {
          alert_rank: number | null
          alert_type: string | null
          canonical_name: string | null
          data: Json | null
          date: string | null
          detail: string | null
          entity_id: string | null
          priority: number | null
          severity: string | null
          title: string | null
        }
        Insert: {
          alert_rank?: number | null
          alert_type?: string | null
          canonical_name?: string | null
          data?: Json | null
          date?: string | null
          detail?: string | null
          entity_id?: string | null
          priority?: number | null
          severity?: string | null
          title?: string | null
        }
        Update: {
          alert_rank?: number | null
          alert_type?: string | null
          canonical_name?: string | null
          data?: Json | null
          date?: string | null
          detail?: string | null
          entity_id?: string | null
          priority?: number | null
          severity?: string | null
          title?: string | null
        }
        Relationships: []
      }
      artist_audience_footprint: {
        Row: {
          artist_handle: string | null
          canonical_name: string | null
          deezer_fans: number | null
          dominant_platform: string | null
          entity_id: string | null
          fastest_growing_platform: string | null
          genius_followers: number | null
          instagram_followers: number | null
          instagram_growth_7d: number | null
          instagram_growth_pct_7d: number | null
          instagram_posts_count: number | null
          spotify_followers: number | null
          spotify_loyalty_ratio: number | null
          tiktok_followers: number | null
          tiktok_growth_7d: number | null
          tiktok_growth_pct_7d: number | null
          tiktok_total_likes: number | null
          tiktok_video_count: number | null
          total_social_reach: number | null
          wiki_delta_7d: number | null
          wikipedia_pageviews: number | null
          youtube_growth_7d: number | null
          youtube_subscribers: number | null
          youtube_total_views: number | null
        }
        Insert: {
          artist_handle?: string | null
          canonical_name?: string | null
          deezer_fans?: number | null
          dominant_platform?: string | null
          entity_id?: string | null
          fastest_growing_platform?: string | null
          genius_followers?: number | null
          instagram_followers?: number | null
          instagram_growth_7d?: number | null
          instagram_growth_pct_7d?: number | null
          instagram_posts_count?: number | null
          spotify_followers?: number | null
          spotify_loyalty_ratio?: number | null
          tiktok_followers?: number | null
          tiktok_growth_7d?: number | null
          tiktok_growth_pct_7d?: number | null
          tiktok_total_likes?: number | null
          tiktok_video_count?: number | null
          total_social_reach?: number | null
          wiki_delta_7d?: number | null
          wikipedia_pageviews?: number | null
          youtube_growth_7d?: number | null
          youtube_subscribers?: number | null
          youtube_total_views?: number | null
        }
        Update: {
          artist_handle?: string | null
          canonical_name?: string | null
          deezer_fans?: number | null
          dominant_platform?: string | null
          entity_id?: string | null
          fastest_growing_platform?: string | null
          genius_followers?: number | null
          instagram_followers?: number | null
          instagram_growth_7d?: number | null
          instagram_growth_pct_7d?: number | null
          instagram_posts_count?: number | null
          spotify_followers?: number | null
          spotify_loyalty_ratio?: number | null
          tiktok_followers?: number | null
          tiktok_growth_7d?: number | null
          tiktok_growth_pct_7d?: number | null
          tiktok_total_likes?: number | null
          tiktok_video_count?: number | null
          total_social_reach?: number | null
          wiki_delta_7d?: number | null
          wikipedia_pageviews?: number | null
          youtube_growth_7d?: number | null
          youtube_subscribers?: number | null
          youtube_total_views?: number | null
        }
        Relationships: []
      }
      artist_catalog_pulse: {
        Row: {
          artist_handle: string | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          catalog_health: string | null
          catalog_total_streams: number | null
          entity_id: string | null
          fastest_songs: Json | null
          songs_accelerating: number | null
          songs_decelerating: number | null
          songs_steady: number | null
          songs_with_streams: number | null
          top_songs: Json | null
          total_active_songs: number | null
          total_songs: number | null
        }
        Insert: {
          artist_handle?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_health?: string | null
          catalog_total_streams?: number | null
          entity_id?: string | null
          fastest_songs?: Json | null
          songs_accelerating?: number | null
          songs_decelerating?: number | null
          songs_steady?: number | null
          songs_with_streams?: number | null
          top_songs?: Json | null
          total_active_songs?: number | null
          total_songs?: number | null
        }
        Update: {
          artist_handle?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_health?: string | null
          catalog_total_streams?: number | null
          entity_id?: string | null
          fastest_songs?: Json | null
          songs_accelerating?: number | null
          songs_decelerating?: number | null
          songs_steady?: number | null
          songs_with_streams?: number | null
          top_songs?: Json | null
          total_active_songs?: number | null
          total_songs?: number | null
        }
        Relationships: []
      }
      artist_catalog_summary: {
        Row: {
          canonical_name: string | null
          catalog_daily_delta_7d: number | null
          catalog_daily_streams: number | null
          catalog_pct_change_7d: number | null
          catalog_total_streams: number | null
          date: string | null
          entity_id: string | null
          fastest_song_delta: number | null
          fastest_song_name: string | null
          fastest_song_pct: number | null
          songs_accelerating: number | null
          songs_decelerating: number | null
          songs_with_streams: number | null
          top_song_name: string | null
          top_song_streams: number | null
          total_songs: number | null
        }
        Insert: {
          canonical_name?: string | null
          catalog_daily_delta_7d?: number | null
          catalog_daily_streams?: number | null
          catalog_pct_change_7d?: number | null
          catalog_total_streams?: number | null
          date?: string | null
          entity_id?: string | null
          fastest_song_delta?: number | null
          fastest_song_name?: string | null
          fastest_song_pct?: number | null
          songs_accelerating?: number | null
          songs_decelerating?: number | null
          songs_with_streams?: number | null
          top_song_name?: string | null
          top_song_streams?: number | null
          total_songs?: number | null
        }
        Update: {
          canonical_name?: string | null
          catalog_daily_delta_7d?: number | null
          catalog_daily_streams?: number | null
          catalog_pct_change_7d?: number | null
          catalog_total_streams?: number | null
          date?: string | null
          entity_id?: string | null
          fastest_song_delta?: number | null
          fastest_song_name?: string | null
          fastest_song_pct?: number | null
          songs_accelerating?: number | null
          songs_decelerating?: number | null
          songs_with_streams?: number | null
          top_song_name?: string | null
          top_song_streams?: number | null
          total_songs?: number | null
        }
        Relationships: []
      }
      artist_comment_intelligence: {
        Row: {
          analysis_date: string
          artist_handle: string
          artist_perception: Json | null
          audience_profile: Json | null
          collab_mentions: Json | null
          comments_analyzed: number
          comments_total: number
          content_requests: Json | null
          controversy_score: number | null
          created_at: string | null
          engagement_quality: Json | null
          engagement_quality_score: number | null
          entity_id: string
          fan_loyalty_score: number | null
          id: string
          model_used: string | null
          music_demand_score: number | null
          one_line_summary: string | null
          raw_batches: Json | null
          sentiment_map: Json | null
          top_insight: string | null
          viral_narratives: Json | null
        }
        Insert: {
          analysis_date?: string
          artist_handle: string
          artist_perception?: Json | null
          audience_profile?: Json | null
          collab_mentions?: Json | null
          comments_analyzed: number
          comments_total: number
          content_requests?: Json | null
          controversy_score?: number | null
          created_at?: string | null
          engagement_quality?: Json | null
          engagement_quality_score?: number | null
          entity_id: string
          fan_loyalty_score?: number | null
          id?: string
          model_used?: string | null
          music_demand_score?: number | null
          one_line_summary?: string | null
          raw_batches?: Json | null
          sentiment_map?: Json | null
          top_insight?: string | null
          viral_narratives?: Json | null
        }
        Update: {
          analysis_date?: string
          artist_handle?: string
          artist_perception?: Json | null
          audience_profile?: Json | null
          collab_mentions?: Json | null
          comments_analyzed?: number
          comments_total?: number
          content_requests?: Json | null
          controversy_score?: number | null
          created_at?: string | null
          engagement_quality?: Json | null
          engagement_quality_score?: number | null
          entity_id?: string
          fan_loyalty_score?: number | null
          id?: string
          model_used?: string | null
          music_demand_score?: number | null
          one_line_summary?: string | null
          raw_batches?: Json | null
          sentiment_map?: Json | null
          top_insight?: string | null
          viral_narratives?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_comment_intelligence_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_comment_pulse: {
        Row: {
          ai_content_ideas: Json | null
          artist_handle: string | null
          audience_vibe: string | null
          avg_comment_impact_pct: number | null
          canonical_name: string | null
          entity_id: string | null
          fan_energy: number | null
          fan_requests: Json | null
          intent_breakdown: Json | null
          second_comment_text: string | null
          sentiment_date: string | null
          sentiment_score: number | null
          sentiment_signal: string | null
          sentiment_themes: Json | null
          third_comment_text: string | null
          top_comment_likes: number | null
          top_comment_text: string | null
          total_comment_likes: number | null
          total_comments_analyzed: number | null
          total_replies: number | null
          tracked_comments: number | null
        }
        Insert: {
          ai_content_ideas?: Json | null
          artist_handle?: string | null
          audience_vibe?: string | null
          avg_comment_impact_pct?: number | null
          canonical_name?: string | null
          entity_id?: string | null
          fan_energy?: number | null
          fan_requests?: Json | null
          intent_breakdown?: Json | null
          second_comment_text?: string | null
          sentiment_date?: string | null
          sentiment_score?: number | null
          sentiment_signal?: string | null
          sentiment_themes?: Json | null
          third_comment_text?: string | null
          top_comment_likes?: number | null
          top_comment_text?: string | null
          total_comment_likes?: number | null
          total_comments_analyzed?: number | null
          total_replies?: number | null
          tracked_comments?: number | null
        }
        Update: {
          ai_content_ideas?: Json | null
          artist_handle?: string | null
          audience_vibe?: string | null
          avg_comment_impact_pct?: number | null
          canonical_name?: string | null
          entity_id?: string | null
          fan_energy?: number | null
          fan_requests?: Json | null
          intent_breakdown?: Json | null
          second_comment_text?: string | null
          sentiment_date?: string | null
          sentiment_score?: number | null
          sentiment_signal?: string | null
          sentiment_themes?: Json | null
          third_comment_text?: string | null
          top_comment_likes?: number | null
          top_comment_text?: string | null
          total_comment_likes?: number | null
          total_comments_analyzed?: number | null
          total_replies?: number | null
          tracked_comments?: number | null
        }
        Relationships: []
      }
      artist_content_dna: {
        Row: {
          ad_content_pct: number | null
          artist_handle: string | null
          avg_duration_seconds: number | null
          avg_hook_score: number | null
          avg_views: number | null
          avg_viral_score: number | null
          best_format: string | null
          best_format_avg_views: number | null
          best_format_count: number | null
          best_format_vs_median: number | null
          bottom_q_avg_duration: number | null
          bottom_q_avg_hook_score: number | null
          bottom_q_format: string | null
          canonical_name: string | null
          dominant_mood: string | null
          entity_id: string | null
          format_distribution: Json | null
          genre_distribution: Json | null
          median_views: number | null
          mood_distribution: Json | null
          original_sound_pct: number | null
          primary_genre: string | null
          signature_style: string | null
          top_hooks: Json | null
          top_q_avg_duration: number | null
          top_q_avg_hook_score: number | null
          top_q_format: string | null
          videos_analyzed: number | null
          worst_format: string | null
          worst_format_avg_views: number | null
          worst_format_count: number | null
          worst_format_vs_median: number | null
        }
        Insert: {
          ad_content_pct?: number | null
          artist_handle?: string | null
          avg_duration_seconds?: number | null
          avg_hook_score?: number | null
          avg_views?: number | null
          avg_viral_score?: number | null
          best_format?: string | null
          best_format_avg_views?: number | null
          best_format_count?: number | null
          best_format_vs_median?: number | null
          bottom_q_avg_duration?: number | null
          bottom_q_avg_hook_score?: number | null
          bottom_q_format?: string | null
          canonical_name?: string | null
          dominant_mood?: string | null
          entity_id?: string | null
          format_distribution?: Json | null
          genre_distribution?: Json | null
          median_views?: number | null
          mood_distribution?: Json | null
          original_sound_pct?: number | null
          primary_genre?: string | null
          signature_style?: string | null
          top_hooks?: Json | null
          top_q_avg_duration?: number | null
          top_q_avg_hook_score?: number | null
          top_q_format?: string | null
          videos_analyzed?: number | null
          worst_format?: string | null
          worst_format_avg_views?: number | null
          worst_format_count?: number | null
          worst_format_vs_median?: number | null
        }
        Update: {
          ad_content_pct?: number | null
          artist_handle?: string | null
          avg_duration_seconds?: number | null
          avg_hook_score?: number | null
          avg_views?: number | null
          avg_viral_score?: number | null
          best_format?: string | null
          best_format_avg_views?: number | null
          best_format_count?: number | null
          best_format_vs_median?: number | null
          bottom_q_avg_duration?: number | null
          bottom_q_avg_hook_score?: number | null
          bottom_q_format?: string | null
          canonical_name?: string | null
          dominant_mood?: string | null
          entity_id?: string | null
          format_distribution?: Json | null
          genre_distribution?: Json | null
          median_views?: number | null
          mood_distribution?: Json | null
          original_sound_pct?: number | null
          primary_genre?: string | null
          signature_style?: string | null
          top_hooks?: Json | null
          top_q_avg_duration?: number | null
          top_q_avg_hook_score?: number | null
          top_q_format?: string | null
          videos_analyzed?: number | null
          worst_format?: string | null
          worst_format_avg_views?: number | null
          worst_format_count?: number | null
          worst_format_vs_median?: number | null
        }
        Relationships: []
      }
      artist_content_evolution: {
        Row: {
          artist_handle: string | null
          canonical_name: string | null
          dropped_formats: string[] | null
          entity_id: string | null
          format_diversity_prior: number | null
          format_diversity_recent: number | null
          format_shift: boolean | null
          mood_shift: boolean | null
          new_formats: string[] | null
          performance_trend: string | null
          prior_avg_hook_score: number | null
          prior_avg_views: number | null
          prior_avg_viral_score: number | null
          prior_dominant_mood: string | null
          prior_formats: Json | null
          prior_top_format: string | null
          prior_videos: number | null
          recent_avg_hook_score: number | null
          recent_avg_views: number | null
          recent_avg_viral_score: number | null
          recent_dominant_mood: string | null
          recent_formats: Json | null
          recent_top_format: string | null
          recent_videos: number | null
          strategy_label: string | null
          views_change_pct: number | null
        }
        Insert: {
          artist_handle?: string | null
          canonical_name?: string | null
          dropped_formats?: string[] | null
          entity_id?: string | null
          format_diversity_prior?: number | null
          format_diversity_recent?: number | null
          format_shift?: boolean | null
          mood_shift?: boolean | null
          new_formats?: string[] | null
          performance_trend?: string | null
          prior_avg_hook_score?: number | null
          prior_avg_views?: number | null
          prior_avg_viral_score?: number | null
          prior_dominant_mood?: string | null
          prior_formats?: Json | null
          prior_top_format?: string | null
          prior_videos?: number | null
          recent_avg_hook_score?: number | null
          recent_avg_views?: number | null
          recent_avg_viral_score?: number | null
          recent_dominant_mood?: string | null
          recent_formats?: Json | null
          recent_top_format?: string | null
          recent_videos?: number | null
          strategy_label?: string | null
          views_change_pct?: number | null
        }
        Update: {
          artist_handle?: string | null
          canonical_name?: string | null
          dropped_formats?: string[] | null
          entity_id?: string | null
          format_diversity_prior?: number | null
          format_diversity_recent?: number | null
          format_shift?: boolean | null
          mood_shift?: boolean | null
          new_formats?: string[] | null
          performance_trend?: string | null
          prior_avg_hook_score?: number | null
          prior_avg_views?: number | null
          prior_avg_viral_score?: number | null
          prior_dominant_mood?: string | null
          prior_formats?: Json | null
          prior_top_format?: string | null
          prior_videos?: number | null
          recent_avg_hook_score?: number | null
          recent_avg_views?: number | null
          recent_avg_viral_score?: number | null
          recent_dominant_mood?: string | null
          recent_formats?: Json | null
          recent_top_format?: string | null
          recent_videos?: number | null
          strategy_label?: string | null
          views_change_pct?: number | null
        }
        Relationships: []
      }
      artist_format_performance: {
        Row: {
          ad_count: number | null
          artist_handle: string | null
          avg_comments: number | null
          avg_duration_seconds: number | null
          avg_engagement_rate: number | null
          avg_hook_score: number | null
          avg_shares: number | null
          avg_views: number | null
          avg_viral_score: number | null
          best_video_caption: string | null
          best_video_views: number | null
          common_hooks: string[] | null
          common_moods: string[] | null
          content_format: string | null
          entity_id: string | null
          max_views: number | null
          median_views: number | null
          min_views: number | null
          pct_of_total: number | null
          performance_vs_median: number | null
          video_count: number | null
        }
        Insert: {
          ad_count?: number | null
          artist_handle?: string | null
          avg_comments?: number | null
          avg_duration_seconds?: number | null
          avg_engagement_rate?: number | null
          avg_hook_score?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          avg_viral_score?: number | null
          best_video_caption?: string | null
          best_video_views?: number | null
          common_hooks?: string[] | null
          common_moods?: string[] | null
          content_format?: string | null
          entity_id?: string | null
          max_views?: number | null
          median_views?: number | null
          min_views?: number | null
          pct_of_total?: number | null
          performance_vs_median?: number | null
          video_count?: number | null
        }
        Update: {
          ad_count?: number | null
          artist_handle?: string | null
          avg_comments?: number | null
          avg_duration_seconds?: number | null
          avg_engagement_rate?: number | null
          avg_hook_score?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          avg_viral_score?: number | null
          best_video_caption?: string | null
          best_video_views?: number | null
          common_hooks?: string[] | null
          common_moods?: string[] | null
          content_format?: string | null
          entity_id?: string | null
          max_views?: number | null
          median_views?: number | null
          min_views?: number | null
          pct_of_total?: number | null
          performance_vs_median?: number | null
          video_count?: number | null
        }
        Relationships: []
      }
      artist_intel_chunks: {
        Row: {
          action_suggestion: string | null
          action_type: string | null
          actionable: boolean | null
          artist_name: string
          body: string
          chunk_type: string
          confidence: string | null
          created_at: string | null
          entity_id: string
          event_date: string | null
          event_end_date: string | null
          expires_at: string | null
          facts: Json | null
          id: string
          is_active: boolean | null
          relevance: string | null
          research_week: string
          source_urls: string[] | null
          summary: string | null
          surfaced_count: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          action_suggestion?: string | null
          action_type?: string | null
          actionable?: boolean | null
          artist_name: string
          body: string
          chunk_type: string
          confidence?: string | null
          created_at?: string | null
          entity_id: string
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          facts?: Json | null
          id?: string
          is_active?: boolean | null
          relevance?: string | null
          research_week: string
          source_urls?: string[] | null
          summary?: string | null
          surfaced_count?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          action_suggestion?: string | null
          action_type?: string | null
          actionable?: boolean | null
          artist_name?: string
          body?: string
          chunk_type?: string
          confidence?: string | null
          created_at?: string | null
          entity_id?: string
          event_date?: string | null
          event_end_date?: string | null
          expires_at?: string | null
          facts?: Json | null
          id?: string
          is_active?: boolean | null
          relevance?: string | null
          research_week?: string
          source_urls?: string[] | null
          summary?: string | null
          surfaced_count?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      artist_intelligence: {
        Row: {
          artist_brief_html: string | null
          artist_brief_pdf_url: string | null
          artist_handle: string
          artist_name: string | null
          artist_preferences_cumulative: Json | null
          artist_user_id: string | null
          avatar_url: string | null
          avg_engagement_rate: string | null
          avg_views: number | null
          bio: string | null
          brand_document: Json | null
          content_analysis_raw: Json | null
          content_plan_30d_html: string | null
          content_plan_html: string | null
          cost_log: Json | null
          created_at: string | null
          entity_id: string | null
          gif_overrides: Json | null
          id: string
          instagram_data: Json | null
          instagram_followers: number | null
          intelligence_report_html: string | null
          invite_code: string | null
          invite_created_at: string | null
          label_id: string | null
          label_name: string | null
          last_post_date: string | null
          latest_release: Json | null
          lyrics_corpus: Json | null
          monthly_listeners: number | null
          niche_scrape_completed_at: string | null
          niche_scrape_status: string | null
          nickname: string | null
          original_sound_pct: number | null
          plan_review_status: string | null
          post_week_analysis: Json | null
          post_week_analysis_generated_at: string | null
          posting_dates_instagram: Json | null
          posting_dates_tiktok: Json | null
          posting_frequency: number | null
          posting_frequency_days: number | null
          rag_inspiration: Json | null
          rag_inspiration_pool: Json | null
          removed_gifs: Json | null
          research_sources: Json | null
          spotify_followers: number | null
          spotify_popularity: number | null
          spotify_raw_data: Json | null
          status: string | null
          thirty_day_plan_html: string | null
          tiktok_followers: number | null
          tiktok_raw_data: Json | null
          top_cities: Json | null
          total_streams: number | null
          updated_at: string | null
          verified: boolean | null
          video_count: number | null
          web_research_raw: string | null
          weekly_pulse: Json | null
          weekly_pulse_generated_at: string | null
        }
        Insert: {
          artist_brief_html?: string | null
          artist_brief_pdf_url?: string | null
          artist_handle: string
          artist_name?: string | null
          artist_preferences_cumulative?: Json | null
          artist_user_id?: string | null
          avatar_url?: string | null
          avg_engagement_rate?: string | null
          avg_views?: number | null
          bio?: string | null
          brand_document?: Json | null
          content_analysis_raw?: Json | null
          content_plan_30d_html?: string | null
          content_plan_html?: string | null
          cost_log?: Json | null
          created_at?: string | null
          entity_id?: string | null
          gif_overrides?: Json | null
          id?: string
          instagram_data?: Json | null
          instagram_followers?: number | null
          intelligence_report_html?: string | null
          invite_code?: string | null
          invite_created_at?: string | null
          label_id?: string | null
          label_name?: string | null
          last_post_date?: string | null
          latest_release?: Json | null
          lyrics_corpus?: Json | null
          monthly_listeners?: number | null
          niche_scrape_completed_at?: string | null
          niche_scrape_status?: string | null
          nickname?: string | null
          original_sound_pct?: number | null
          plan_review_status?: string | null
          post_week_analysis?: Json | null
          post_week_analysis_generated_at?: string | null
          posting_dates_instagram?: Json | null
          posting_dates_tiktok?: Json | null
          posting_frequency?: number | null
          posting_frequency_days?: number | null
          rag_inspiration?: Json | null
          rag_inspiration_pool?: Json | null
          removed_gifs?: Json | null
          research_sources?: Json | null
          spotify_followers?: number | null
          spotify_popularity?: number | null
          spotify_raw_data?: Json | null
          status?: string | null
          thirty_day_plan_html?: string | null
          tiktok_followers?: number | null
          tiktok_raw_data?: Json | null
          top_cities?: Json | null
          total_streams?: number | null
          updated_at?: string | null
          verified?: boolean | null
          video_count?: number | null
          web_research_raw?: string | null
          weekly_pulse?: Json | null
          weekly_pulse_generated_at?: string | null
        }
        Update: {
          artist_brief_html?: string | null
          artist_brief_pdf_url?: string | null
          artist_handle?: string
          artist_name?: string | null
          artist_preferences_cumulative?: Json | null
          artist_user_id?: string | null
          avatar_url?: string | null
          avg_engagement_rate?: string | null
          avg_views?: number | null
          bio?: string | null
          brand_document?: Json | null
          content_analysis_raw?: Json | null
          content_plan_30d_html?: string | null
          content_plan_html?: string | null
          cost_log?: Json | null
          created_at?: string | null
          entity_id?: string | null
          gif_overrides?: Json | null
          id?: string
          instagram_data?: Json | null
          instagram_followers?: number | null
          intelligence_report_html?: string | null
          invite_code?: string | null
          invite_created_at?: string | null
          label_id?: string | null
          label_name?: string | null
          last_post_date?: string | null
          latest_release?: Json | null
          lyrics_corpus?: Json | null
          monthly_listeners?: number | null
          niche_scrape_completed_at?: string | null
          niche_scrape_status?: string | null
          nickname?: string | null
          original_sound_pct?: number | null
          plan_review_status?: string | null
          post_week_analysis?: Json | null
          post_week_analysis_generated_at?: string | null
          posting_dates_instagram?: Json | null
          posting_dates_tiktok?: Json | null
          posting_frequency?: number | null
          posting_frequency_days?: number | null
          rag_inspiration?: Json | null
          rag_inspiration_pool?: Json | null
          removed_gifs?: Json | null
          research_sources?: Json | null
          spotify_followers?: number | null
          spotify_popularity?: number | null
          spotify_raw_data?: Json | null
          status?: string | null
          thirty_day_plan_html?: string | null
          tiktok_followers?: number | null
          tiktok_raw_data?: Json | null
          top_cities?: Json | null
          total_streams?: number | null
          updated_at?: string | null
          verified?: boolean | null
          video_count?: number | null
          web_research_raw?: string | null
          weekly_pulse?: Json | null
          weekly_pulse_generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_intelligence_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_artist_intelligence_label"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_momentum: {
        Row: {
          acceleration_7d: number | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          catalog_delta_7d: number | null
          date: string | null
          direction: string | null
          entity_id: string | null
          momentum_score: number | null
          primary_streams: number | null
          shazam_pct_7d: number | null
          social_avg_pct_7d: number | null
          streams_pct_7d: number | null
          streams_peak_ratio: number | null
          wiki_z_score: number | null
          zone: string | null
        }
        Insert: {
          acceleration_7d?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_delta_7d?: number | null
          date?: string | null
          direction?: string | null
          entity_id?: string | null
          momentum_score?: number | null
          primary_streams?: number | null
          shazam_pct_7d?: number | null
          social_avg_pct_7d?: number | null
          streams_pct_7d?: number | null
          streams_peak_ratio?: number | null
          wiki_z_score?: number | null
          zone?: string | null
        }
        Update: {
          acceleration_7d?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_delta_7d?: number | null
          date?: string | null
          direction?: string | null
          entity_id?: string | null
          momentum_score?: number | null
          primary_streams?: number | null
          shazam_pct_7d?: number | null
          social_avg_pct_7d?: number | null
          streams_pct_7d?: number | null
          streams_peak_ratio?: number | null
          wiki_z_score?: number | null
          zone?: string | null
        }
        Relationships: []
      }
      artist_onboarding_queue: {
        Row: {
          completed_at: string | null
          entity_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          requested_at: string | null
          requested_by: string | null
          started_at: string | null
          status: string
          task: string
        }
        Insert: {
          completed_at?: string | null
          entity_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          started_at?: string | null
          status?: string
          task: string
        }
        Update: {
          completed_at?: string | null
          entity_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          started_at?: string | null
          status?: string
          task?: string
        }
        Relationships: []
      }
      artist_playlist_intelligence: {
        Row: {
          artist_handle: string | null
          avg_playlist_position: number | null
          best_playlist_name: string | null
          best_playlist_reach: number | null
          best_position_overall: number | null
          best_song: string | null
          canonical_name: string | null
          entity_id: string | null
          high_reach_placements: number | null
          massive_placements: number | null
          overall_reach_tier: string | null
          songs_in_playlists: number | null
          top_playlist_songs: Json | null
          total_playlist_placements: number | null
          total_playlist_reach: number | null
        }
        Insert: {
          artist_handle?: string | null
          avg_playlist_position?: number | null
          best_playlist_name?: string | null
          best_playlist_reach?: number | null
          best_position_overall?: number | null
          best_song?: string | null
          canonical_name?: string | null
          entity_id?: string | null
          high_reach_placements?: number | null
          massive_placements?: number | null
          overall_reach_tier?: string | null
          songs_in_playlists?: number | null
          top_playlist_songs?: Json | null
          total_playlist_placements?: number | null
          total_playlist_reach?: number | null
        }
        Update: {
          artist_handle?: string | null
          avg_playlist_position?: number | null
          best_playlist_name?: string | null
          best_playlist_reach?: number | null
          best_position_overall?: number | null
          best_song?: string | null
          canonical_name?: string | null
          entity_id?: string | null
          high_reach_placements?: number | null
          massive_placements?: number | null
          overall_reach_tier?: string | null
          songs_in_playlists?: number | null
          top_playlist_songs?: Json | null
          total_playlist_placements?: number | null
          total_playlist_reach?: number | null
        }
        Relationships: []
      }
      artist_profiles_instagram: {
        Row: {
          artist_handle: string
          avatar_url: string | null
          avg_comments: number | null
          avg_likes: number | null
          avg_views: number | null
          bio: string | null
          created_at: string
          followers: number | null
          id: string
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          scraped_at: string
          total_posts: number | null
        }
        Insert: {
          artist_handle: string
          avatar_url?: string | null
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          bio?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          scraped_at?: string
          total_posts?: number | null
        }
        Update: {
          artist_handle?: string
          avatar_url?: string | null
          avg_comments?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          bio?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          scraped_at?: string
          total_posts?: number | null
        }
        Relationships: []
      }
      artist_profiles_tiktok: {
        Row: {
          artist_handle: string
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_saves: number | null
          avg_shares: number | null
          avg_views: number | null
          bio: string | null
          created_at: string
          followers: number | null
          id: string
          median_comments: number | null
          median_likes: number | null
          median_saves: number | null
          median_shares: number | null
          median_views: number | null
          scraped_at: string
          total_likes: number | null
          total_videos: number | null
          verified: boolean | null
        }
        Insert: {
          artist_handle: string
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          bio?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          median_comments?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          scraped_at?: string
          total_likes?: number | null
          total_videos?: number | null
          verified?: boolean | null
        }
        Update: {
          artist_handle?: string
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          bio?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          median_comments?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          scraped_at?: string
          total_likes?: number | null
          total_videos?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      artist_rag_content: {
        Row: {
          artist_handle: string
          category: string
          content: string
          created_at: string | null
          embedding: string | null
          fts: unknown
          id: number
          label_id: string | null
          metadata: Json
          source_id: string | null
          source_table: string | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          artist_handle: string
          category: string
          content: string
          created_at?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          label_id?: string | null
          metadata?: Json
          source_id?: string | null
          source_table?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_handle?: string
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          label_id?: string | null
          metadata?: Json
          source_id?: string | null
          source_table?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_score: {
        Row: {
          apple_charting_songs: number | null
          artist_score: number | null
          best_apple_position: number | null
          best_radio_position: number | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          catalog_pct_change_7d: number | null
          catalog_score: number | null
          coverage_score: number | null
          cross_platform_signal: string | null
          date: string | null
          discovery_score: number | null
          dominant_markets: number | null
          entity_id: string | null
          fastest_song_name: string | null
          global_rank: number | null
          health_score: number | null
          hot_songs_count: number | null
          listeners_peak_ratio: number | null
          missing_platforms: string[] | null
          momentum_score: number | null
          platforms_declining: number | null
          platforms_growing: number | null
          platforms_tracked: number | null
          shazam_trend: number | null
          songs_accelerating: number | null
          songs_on_radio: number | null
          sound_spark_score: number | null
          sounds_analyzed: number | null
          spotify_trend: number | null
          tier: string | null
          tiktok_avg_plays: number | null
          tiktok_engagement_rate: number | null
          tiktok_original_sound_pct: number | null
          tiktok_trend: number | null
          tiktok_videos_30d: number | null
          top_song_name: string | null
          total_markets: number | null
          total_radio_audience: number | null
          total_songs: number | null
          trend: string | null
          viral_songs: number | null
          youtube_trend: number | null
        }
        Insert: {
          apple_charting_songs?: number | null
          artist_score?: number | null
          best_apple_position?: number | null
          best_radio_position?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_pct_change_7d?: number | null
          catalog_score?: number | null
          coverage_score?: number | null
          cross_platform_signal?: string | null
          date?: string | null
          discovery_score?: number | null
          dominant_markets?: number | null
          entity_id?: string | null
          fastest_song_name?: string | null
          global_rank?: number | null
          health_score?: number | null
          hot_songs_count?: number | null
          listeners_peak_ratio?: number | null
          missing_platforms?: string[] | null
          momentum_score?: number | null
          platforms_declining?: number | null
          platforms_growing?: number | null
          platforms_tracked?: number | null
          shazam_trend?: number | null
          songs_accelerating?: number | null
          songs_on_radio?: number | null
          sound_spark_score?: number | null
          sounds_analyzed?: number | null
          spotify_trend?: number | null
          tier?: string | null
          tiktok_avg_plays?: number | null
          tiktok_engagement_rate?: number | null
          tiktok_original_sound_pct?: number | null
          tiktok_trend?: number | null
          tiktok_videos_30d?: number | null
          top_song_name?: string | null
          total_markets?: number | null
          total_radio_audience?: number | null
          total_songs?: number | null
          trend?: string | null
          viral_songs?: number | null
          youtube_trend?: number | null
        }
        Update: {
          apple_charting_songs?: number | null
          artist_score?: number | null
          best_apple_position?: number | null
          best_radio_position?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_pct_change_7d?: number | null
          catalog_score?: number | null
          coverage_score?: number | null
          cross_platform_signal?: string | null
          date?: string | null
          discovery_score?: number | null
          dominant_markets?: number | null
          entity_id?: string | null
          fastest_song_name?: string | null
          global_rank?: number | null
          health_score?: number | null
          hot_songs_count?: number | null
          listeners_peak_ratio?: number | null
          missing_platforms?: string[] | null
          momentum_score?: number | null
          platforms_declining?: number | null
          platforms_growing?: number | null
          platforms_tracked?: number | null
          shazam_trend?: number | null
          songs_accelerating?: number | null
          songs_on_radio?: number | null
          sound_spark_score?: number | null
          sounds_analyzed?: number | null
          spotify_trend?: number | null
          tier?: string | null
          tiktok_avg_plays?: number | null
          tiktok_engagement_rate?: number | null
          tiktok_original_sound_pct?: number | null
          tiktok_trend?: number | null
          tiktok_videos_30d?: number | null
          top_song_name?: string | null
          total_markets?: number | null
          total_radio_audience?: number | null
          total_songs?: number | null
          trend?: string | null
          viral_songs?: number | null
          youtube_trend?: number | null
        }
        Relationships: []
      }
      artist_sound_daily: {
        Row: {
          artist_handle: string
          created_at: string | null
          delta_from_previous: number | null
          id: number
          music_id: string
          snapshot_date: string
          user_count: number | null
        }
        Insert: {
          artist_handle: string
          created_at?: string | null
          delta_from_previous?: number | null
          id?: never
          music_id: string
          snapshot_date?: string
          user_count?: number | null
        }
        Update: {
          artist_handle?: string
          created_at?: string | null
          delta_from_previous?: number | null
          id?: never
          music_id?: string
          snapshot_date?: string
          user_count?: number | null
        }
        Relationships: []
      }
      artist_sound_pulse: {
        Row: {
          artist_handle: string | null
          avg_ugc_per_sound: number | null
          date: string | null
          days_tracked: number | null
          label_id: string | null
          label_name: string | null
          latest_snapshot: string | null
          mover_delta_1d: number | null
          mover_id: string | null
          mover_title: string | null
          own_sounds: number | null
          top_sound_id: string | null
          top_sound_title: string | null
          top_sound_ugc: number | null
          total_sounds: number | null
          total_ugc: number | null
          ugc_delta_1d: number | null
          ugc_velocity_7d: number | null
        }
        Insert: {
          artist_handle?: string | null
          avg_ugc_per_sound?: number | null
          date?: string | null
          days_tracked?: number | null
          label_id?: string | null
          label_name?: string | null
          latest_snapshot?: string | null
          mover_delta_1d?: number | null
          mover_id?: string | null
          mover_title?: string | null
          own_sounds?: number | null
          top_sound_id?: string | null
          top_sound_title?: string | null
          top_sound_ugc?: number | null
          total_sounds?: number | null
          total_ugc?: number | null
          ugc_delta_1d?: number | null
          ugc_velocity_7d?: number | null
        }
        Update: {
          artist_handle?: string | null
          avg_ugc_per_sound?: number | null
          date?: string | null
          days_tracked?: number | null
          label_id?: string | null
          label_name?: string | null
          latest_snapshot?: string | null
          mover_delta_1d?: number | null
          mover_id?: string | null
          mover_title?: string | null
          own_sounds?: number | null
          top_sound_id?: string | null
          top_sound_title?: string | null
          top_sound_ugc?: number | null
          total_sounds?: number | null
          total_ugc?: number | null
          ugc_delta_1d?: number | null
          ugc_velocity_7d?: number | null
        }
        Relationships: []
      }
      artist_sound_video_stats: {
        Row: {
          artist_handle: string
          avg_engagement_rate: number | null
          avg_plays: number
          fan_to_artist_ratio: number | null
          fan_videos: number
          id: number
          latest_video_date: string | null
          music_id: string
          original_artist_videos: number
          pages_scraped: number
          scraped_at: string
          snapshot_date: string
          total_plays: number
          total_videos_on_sound: number | null
          unique_creators: number
          video_count: number
          videos_last_30d: number
          videos_last_7d: number
        }
        Insert: {
          artist_handle: string
          avg_engagement_rate?: number | null
          avg_plays?: number
          fan_to_artist_ratio?: number | null
          fan_videos?: number
          id?: never
          latest_video_date?: string | null
          music_id: string
          original_artist_videos?: number
          pages_scraped?: number
          scraped_at?: string
          snapshot_date?: string
          total_plays?: number
          total_videos_on_sound?: number | null
          unique_creators?: number
          video_count?: number
          videos_last_30d?: number
          videos_last_7d?: number
        }
        Update: {
          artist_handle?: string
          avg_engagement_rate?: number | null
          avg_plays?: number
          fan_to_artist_ratio?: number | null
          fan_videos?: number
          id?: never
          latest_video_date?: string | null
          music_id?: string
          original_artist_videos?: number
          pages_scraped?: number
          scraped_at?: string
          snapshot_date?: string
          total_plays?: number
          total_videos_on_sound?: number | null
          unique_creators?: number
          video_count?: number
          videos_last_30d?: number
          videos_last_7d?: number
        }
        Relationships: []
      }
      artist_sounds: {
        Row: {
          album: string | null
          artist_handle: string
          created_at: string | null
          duration: number | null
          id: number
          is_commerce_music: boolean | null
          is_original_sound: boolean | null
          label_id: string | null
          last_tracked_at: string | null
          latest_ugc_count: number | null
          match_reason: string | null
          music_id: string
          needs_si_trigger: boolean | null
          ownership: string | null
          si_job_id: string | null
          sound_author: string | null
          sound_title: string | null
          tracking_enabled: boolean | null
          ugc_count_at_discovery: number | null
        }
        Insert: {
          album?: string | null
          artist_handle: string
          created_at?: string | null
          duration?: number | null
          id?: never
          is_commerce_music?: boolean | null
          is_original_sound?: boolean | null
          label_id?: string | null
          last_tracked_at?: string | null
          latest_ugc_count?: number | null
          match_reason?: string | null
          music_id: string
          needs_si_trigger?: boolean | null
          ownership?: string | null
          si_job_id?: string | null
          sound_author?: string | null
          sound_title?: string | null
          tracking_enabled?: boolean | null
          ugc_count_at_discovery?: number | null
        }
        Update: {
          album?: string | null
          artist_handle?: string
          created_at?: string | null
          duration?: number | null
          id?: never
          is_commerce_music?: boolean | null
          is_original_sound?: boolean | null
          label_id?: string | null
          last_tracked_at?: string | null
          latest_ugc_count?: number | null
          match_reason?: string | null
          music_id?: string
          needs_si_trigger?: boolean | null
          ownership?: string | null
          si_job_id?: string | null
          sound_author?: string | null
          sound_title?: string | null
          tracking_enabled?: boolean | null
          ugc_count_at_discovery?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_sounds_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_sounds_si_job_id_fkey"
            columns: ["si_job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_streaming_pulse: {
        Row: {
          artist_handle: string | null
          canonical_name: string | null
          deezer_fans: number | null
          deezer_fans_delta_7d: number | null
          entity_id: string | null
          kworb_digital_points: number | null
          kworb_digital_rank: number | null
          kworb_global_rank: number | null
          kworb_rank_delta_7d: number | null
          lastfm_listeners: number | null
          lastfm_listeners_delta_7d: number | null
          lastfm_playcount: number | null
          lead_stream_pct: number | null
          spotify_daily_streams: number | null
          spotify_ds_delta_7d: number | null
          spotify_ds_pct_7d: number | null
          spotify_followers: number | null
          spotify_followers_delta_7d: number | null
          spotify_ml_delta_7d: number | null
          spotify_ml_pct_7d: number | null
          spotify_monthly_listeners: number | null
          spotify_peak_listeners: number | null
          spotify_peak_ratio: number | null
          spotify_streams_feature: number | null
          spotify_streams_lead: number | null
          spotify_streams_solo: number | null
          spotify_total_streams: number | null
        }
        Insert: {
          artist_handle?: string | null
          canonical_name?: string | null
          deezer_fans?: number | null
          deezer_fans_delta_7d?: number | null
          entity_id?: string | null
          kworb_digital_points?: number | null
          kworb_digital_rank?: number | null
          kworb_global_rank?: number | null
          kworb_rank_delta_7d?: number | null
          lastfm_listeners?: number | null
          lastfm_listeners_delta_7d?: number | null
          lastfm_playcount?: number | null
          lead_stream_pct?: number | null
          spotify_daily_streams?: number | null
          spotify_ds_delta_7d?: number | null
          spotify_ds_pct_7d?: number | null
          spotify_followers?: number | null
          spotify_followers_delta_7d?: number | null
          spotify_ml_delta_7d?: number | null
          spotify_ml_pct_7d?: number | null
          spotify_monthly_listeners?: number | null
          spotify_peak_listeners?: number | null
          spotify_peak_ratio?: number | null
          spotify_streams_feature?: number | null
          spotify_streams_lead?: number | null
          spotify_streams_solo?: number | null
          spotify_total_streams?: number | null
        }
        Update: {
          artist_handle?: string | null
          canonical_name?: string | null
          deezer_fans?: number | null
          deezer_fans_delta_7d?: number | null
          entity_id?: string | null
          kworb_digital_points?: number | null
          kworb_digital_rank?: number | null
          kworb_global_rank?: number | null
          kworb_rank_delta_7d?: number | null
          lastfm_listeners?: number | null
          lastfm_listeners_delta_7d?: number | null
          lastfm_playcount?: number | null
          lead_stream_pct?: number | null
          spotify_daily_streams?: number | null
          spotify_ds_delta_7d?: number | null
          spotify_ds_pct_7d?: number | null
          spotify_followers?: number | null
          spotify_followers_delta_7d?: number | null
          spotify_ml_delta_7d?: number | null
          spotify_ml_pct_7d?: number | null
          spotify_monthly_listeners?: number | null
          spotify_peak_listeners?: number | null
          spotify_peak_ratio?: number | null
          spotify_streams_feature?: number | null
          spotify_streams_lead?: number | null
          spotify_streams_solo?: number | null
          spotify_total_streams?: number | null
        }
        Relationships: []
      }
      artist_tiktok_profile: {
        Row: {
          avg_comments: number | null
          avg_engagement_rate: number | null
          avg_likes: number | null
          avg_plays: number | null
          avg_posts_per_week: number | null
          avg_saves: number | null
          avg_shares: number | null
          best_video_plays: number | null
          canonical_name: string | null
          commerce_music_pct: number | null
          date: string | null
          days_since_last_post: number | null
          entity_id: string | null
          median_plays: number | null
          original_sound_pct: number | null
          pinned_videos: number | null
          plays_trend_pct: number | null
          posting_consistency: string | null
          tiktok_grade: string | null
          total_plays: number | null
          total_videos: number | null
          unique_sounds_used: number | null
          videos_30d: number | null
          videos_7d: number | null
        }
        Insert: {
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_posts_per_week?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          best_video_plays?: number | null
          canonical_name?: string | null
          commerce_music_pct?: number | null
          date?: string | null
          days_since_last_post?: number | null
          entity_id?: string | null
          median_plays?: number | null
          original_sound_pct?: number | null
          pinned_videos?: number | null
          plays_trend_pct?: number | null
          posting_consistency?: string | null
          tiktok_grade?: string | null
          total_plays?: number | null
          total_videos?: number | null
          unique_sounds_used?: number | null
          videos_30d?: number | null
          videos_7d?: number | null
        }
        Update: {
          avg_comments?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_posts_per_week?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          best_video_plays?: number | null
          canonical_name?: string | null
          commerce_music_pct?: number | null
          date?: string | null
          days_since_last_post?: number | null
          entity_id?: string | null
          median_plays?: number | null
          original_sound_pct?: number | null
          pinned_videos?: number | null
          plays_trend_pct?: number | null
          posting_consistency?: string | null
          tiktok_grade?: string | null
          total_plays?: number | null
          total_videos?: number | null
          unique_sounds_used?: number | null
          videos_30d?: number | null
          videos_7d?: number | null
        }
        Relationships: []
      }
      artist_touring_signal: {
        Row: {
          artist_handle: string | null
          bandsintown_upcoming: number | null
          canonical_name: string | null
          entity_id: string | null
          new_events_announced_7d: number | null
          ticketmaster_upcoming: number | null
          total_upcoming_events: number | null
          touring_status: string | null
        }
        Insert: {
          artist_handle?: string | null
          bandsintown_upcoming?: number | null
          canonical_name?: string | null
          entity_id?: string | null
          new_events_announced_7d?: number | null
          ticketmaster_upcoming?: number | null
          total_upcoming_events?: number | null
          touring_status?: string | null
        }
        Update: {
          artist_handle?: string | null
          bandsintown_upcoming?: number | null
          canonical_name?: string | null
          entity_id?: string | null
          new_events_announced_7d?: number | null
          ticketmaster_upcoming?: number | null
          total_upcoming_events?: number | null
          touring_status?: string | null
        }
        Relationships: []
      }
      artist_videos_instagram: {
        Row: {
          artist_handle: string
          caption: string | null
          created_at: string
          date_posted: string | null
          duration: number | null
          id: number
          sound_title: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_url: string | null
          video_views: number | null
        }
        Insert: {
          artist_handle: string
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          id: number
          sound_title?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
        }
        Update: {
          artist_handle?: string
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          id?: number
          sound_title?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
        }
        Relationships: []
      }
      artist_videos_tiktok: {
        Row: {
          artist_handle: string
          caption: string | null
          created_at: string
          date_posted: string | null
          duration: number | null
          gemini_analysis: Json | null
          hashtags: string | null
          id: number
          is_ad: boolean | null
          is_likely_promoted: boolean | null
          is_original_sound: boolean | null
          language: string | null
          music_id: string | null
          sound_author: string | null
          sound_title: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_id: string | null
          video_likes: number | null
          video_saves: number | null
          video_shares: number | null
          video_url: string | null
          video_views: number | null
        }
        Insert: {
          artist_handle: string
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id: number
          is_ad?: boolean | null
          is_likely_promoted?: boolean | null
          is_original_sound?: boolean | null
          language?: string | null
          music_id?: string | null
          sound_author?: string | null
          sound_title?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_id?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
        }
        Update: {
          artist_handle?: string
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number
          is_ad?: boolean | null
          is_likely_promoted?: boolean | null
          is_original_sound?: boolean | null
          language?: string | null
          music_id?: string | null
          sound_author?: string | null
          sound_title?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_id?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
        }
        Relationships: []
      }
      artist_weekly_intel: {
        Row: {
          artist_name: string
          chunks_extracted: number | null
          created_at: string | null
          entity_id: string
          id: string
          model_used: string | null
          prompt_used: string | null
          raw_text: string
          research_duration_ms: number | null
          research_week: string
          source_urls: string[] | null
        }
        Insert: {
          artist_name: string
          chunks_extracted?: number | null
          created_at?: string | null
          entity_id: string
          id?: string
          model_used?: string | null
          prompt_used?: string | null
          raw_text: string
          research_duration_ms?: number | null
          research_week: string
          source_urls?: string[] | null
        }
        Update: {
          artist_name?: string
          chunks_extracted?: number | null
          created_at?: string | null
          entity_id?: string
          id?: string
          model_used?: string | null
          prompt_used?: string | null
          raw_text?: string
          research_duration_ms?: number | null
          research_week?: string
          source_urls?: string[] | null
        }
        Relationships: []
      }
      assistant_feedback: {
        Row: {
          created_at: string
          feedback_message: string | null
          feedback_type: string
          id: string
          message_content: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_message?: string | null
          feedback_type: string
          id?: string
          message_content?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_message?: string | null
          feedback_type?: string
          id?: string
          message_content?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bio_profiles: {
        Row: {
          bio_name: string | null
          bio_text: string | null
          created_at: string
          id: string
          presave_isrc: string | null
          presave_mode: boolean
          presave_release_date: string | null
          presave_spotify_uri: string | null
          profile_image_url: string | null
          slug: string
          theme_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio_name?: string | null
          bio_text?: string | null
          created_at?: string
          id?: string
          presave_isrc?: string | null
          presave_mode?: boolean
          presave_release_date?: string | null
          presave_spotify_uri?: string | null
          profile_image_url?: string | null
          slug: string
          theme_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio_name?: string | null
          bio_text?: string | null
          created_at?: string
          id?: string
          presave_isrc?: string | null
          presave_mode?: boolean
          presave_release_date?: string | null
          presave_spotify_uri?: string | null
          profile_image_url?: string | null
          slug?: string
          theme_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cached_responses: {
        Row: {
          answer: string
          created_at: string | null
          genre_slug: string
          id: string
          question_key: string
          question_text: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          genre_slug: string
          id?: string
          question_key: string
          question_text: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          genre_slug?: string
          id?: string
          question_key?: string
          question_text?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      calendar_items: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          project_color: string | null
          source_id: number | null
          thumbnail_url: string | null
          time: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          project_color?: string | null
          source_id?: number | null
          thumbnail_url?: string | null
          time?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          project_color?: string | null
          source_id?: number | null
          thumbnail_url?: string | null
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      catalog_intelligence: {
        Row: {
          accelerating_songs: number | null
          best_playlist_followers: number | null
          best_playlist_name: string | null
          best_playlist_song: string | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          catalog_depth_score: number | null
          catalog_pct_change_7d: number | null
          catalog_status: string | null
          catalog_total_streams: number | null
          date: string | null
          decelerating_songs: number | null
          declining_songs: number | null
          entity_id: string | null
          fastest_pct: number | null
          fastest_song: string | null
          fastest_velocity: string | null
          growing_songs: number | null
          new_songs: number | null
          songs_in_playlists: number | null
          songs_large_plus_reach: number | null
          songs_massive_reach: number | null
          songs_tracked: number | null
          songs_with_streams: number | null
          steady_songs: number | null
          top1_song: string | null
          top1_streams: number | null
          top1_velocity: string | null
          top2_song: string | null
          top2_streams: number | null
          top2_velocity: string | null
          top3_song: string | null
          top3_streams: number | null
          top3_velocity: string | null
          total_playlist_placements: number | null
          total_playlist_reach: number | null
          total_songs: number | null
          viral_songs: number | null
        }
        Insert: {
          accelerating_songs?: number | null
          best_playlist_followers?: number | null
          best_playlist_name?: string | null
          best_playlist_song?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_depth_score?: number | null
          catalog_pct_change_7d?: number | null
          catalog_status?: string | null
          catalog_total_streams?: number | null
          date?: string | null
          decelerating_songs?: number | null
          declining_songs?: number | null
          entity_id?: string | null
          fastest_pct?: number | null
          fastest_song?: string | null
          fastest_velocity?: string | null
          growing_songs?: number | null
          new_songs?: number | null
          songs_in_playlists?: number | null
          songs_large_plus_reach?: number | null
          songs_massive_reach?: number | null
          songs_tracked?: number | null
          songs_with_streams?: number | null
          steady_songs?: number | null
          top1_song?: string | null
          top1_streams?: number | null
          top1_velocity?: string | null
          top2_song?: string | null
          top2_streams?: number | null
          top2_velocity?: string | null
          top3_song?: string | null
          top3_streams?: number | null
          top3_velocity?: string | null
          total_playlist_placements?: number | null
          total_playlist_reach?: number | null
          total_songs?: number | null
          viral_songs?: number | null
        }
        Update: {
          accelerating_songs?: number | null
          best_playlist_followers?: number | null
          best_playlist_name?: string | null
          best_playlist_song?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          catalog_depth_score?: number | null
          catalog_pct_change_7d?: number | null
          catalog_status?: string | null
          catalog_total_streams?: number | null
          date?: string | null
          decelerating_songs?: number | null
          declining_songs?: number | null
          entity_id?: string | null
          fastest_pct?: number | null
          fastest_song?: string | null
          fastest_velocity?: string | null
          growing_songs?: number | null
          new_songs?: number | null
          songs_in_playlists?: number | null
          songs_large_plus_reach?: number | null
          songs_massive_reach?: number | null
          songs_tracked?: number | null
          songs_with_streams?: number | null
          steady_songs?: number | null
          top1_song?: string | null
          top1_streams?: number | null
          top1_velocity?: string | null
          top2_song?: string | null
          top2_streams?: number | null
          top2_velocity?: string | null
          top3_song?: string | null
          top3_streams?: number | null
          top3_velocity?: string | null
          total_playlist_placements?: number | null
          total_playlist_reach?: number | null
          total_songs?: number | null
          viral_songs?: number | null
        }
        Relationships: []
      }
      catalog_tiktok_performance: {
        Row: {
          artist_entity_id: string | null
          artist_name: string | null
          avg_tiktok_plays: number | null
          cross_platform_gap: string | null
          date: string | null
          fan_to_artist_ratio: number | null
          fan_videos: number | null
          latest_video_date: string | null
          original_artist_videos: number | null
          song_entity_id: string | null
          song_name: string | null
          spotify_daily_streams: number | null
          spotify_velocity: string | null
          tiktok_engagement_rate: number | null
          tiktok_music_id: string | null
          tiktok_sound_title: string | null
          tiktok_status: string | null
          tiktok_video_count: number | null
          total_tiktok_plays: number | null
          unique_creators: number | null
          videos_last_30d: number | null
          videos_last_7d: number | null
        }
        Insert: {
          artist_entity_id?: string | null
          artist_name?: string | null
          avg_tiktok_plays?: number | null
          cross_platform_gap?: string | null
          date?: string | null
          fan_to_artist_ratio?: number | null
          fan_videos?: number | null
          latest_video_date?: string | null
          original_artist_videos?: number | null
          song_entity_id?: string | null
          song_name?: string | null
          spotify_daily_streams?: number | null
          spotify_velocity?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_music_id?: string | null
          tiktok_sound_title?: string | null
          tiktok_status?: string | null
          tiktok_video_count?: number | null
          total_tiktok_plays?: number | null
          unique_creators?: number | null
          videos_last_30d?: number | null
          videos_last_7d?: number | null
        }
        Update: {
          artist_entity_id?: string | null
          artist_name?: string | null
          avg_tiktok_plays?: number | null
          cross_platform_gap?: string | null
          date?: string | null
          fan_to_artist_ratio?: number | null
          fan_videos?: number | null
          latest_video_date?: string | null
          original_artist_videos?: number | null
          song_entity_id?: string | null
          song_name?: string | null
          spotify_daily_streams?: number | null
          spotify_velocity?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_music_id?: string | null
          tiktok_sound_title?: string | null
          tiktok_status?: string | null
          tiktok_video_count?: number | null
          total_tiktok_plays?: number | null
          unique_creators?: number | null
          videos_last_30d?: number | null
          videos_last_7d?: number | null
        }
        Relationships: []
      }
      chat_jobs: {
        Row: {
          chat_history: Json | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          genre: string | null
          hidden_data: Json | null
          id: string
          instant_reply: string | null
          message: string
          model_used: string | null
          response: string | null
          session_id: string | null
          slug: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          chat_history?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          genre?: string | null
          hidden_data?: Json | null
          id?: string
          instant_reply?: string | null
          message: string
          model_used?: string | null
          response?: string | null
          session_id?: string | null
          slug?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          chat_history?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          genre?: string | null
          hidden_data?: Json | null
          id?: string
          instant_reply?: string | null
          message?: string
          model_used?: string | null
          response?: string | null
          session_id?: string | null
          slug?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chat_type: string
          created_at: string
          id: string
          is_favorite: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_type?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_type?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_anomalies: {
        Row: {
          anomaly_direction: string
          anomaly_type: string
          artist_handle: string
          baseline_avg: number | null
          baseline_median: number | null
          created_at: string | null
          deviation_multiple: number | null
          deviation_pct: number | null
          id: number
          insight_message: string
          label_id: string | null
          metric_name: string
          metric_value: number | null
          previous_value: number | null
          scan_date: string
          seen: boolean | null
          severity: string | null
          video_id: string | null
          video_url: string | null
        }
        Insert: {
          anomaly_direction: string
          anomaly_type: string
          artist_handle: string
          baseline_avg?: number | null
          baseline_median?: number | null
          created_at?: string | null
          deviation_multiple?: number | null
          deviation_pct?: number | null
          id?: never
          insight_message: string
          label_id?: string | null
          metric_name: string
          metric_value?: number | null
          previous_value?: number | null
          scan_date?: string
          seen?: boolean | null
          severity?: string | null
          video_id?: string | null
          video_url?: string | null
        }
        Update: {
          anomaly_direction?: string
          anomaly_type?: string
          artist_handle?: string
          baseline_avg?: number | null
          baseline_median?: number | null
          created_at?: string | null
          deviation_multiple?: number | null
          deviation_pct?: number | null
          id?: never
          insight_message?: string
          label_id?: string | null
          metric_name?: string
          metric_value?: number | null
          previous_value?: number | null
          scan_date?: string
          seen?: boolean | null
          severity?: string | null
          video_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_anomalies_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      content_catalog: {
        Row: {
          artist_handle: string
          artist_id: string | null
          channel_name: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_processed: boolean | null
          label_id: string | null
          metadata: Json | null
          processed_at: string | null
          source_platform: string
          source_url: string
          title: string | null
          transcript: string | null
          transcript_source: string | null
          transcript_timestamps: Json | null
          upload_date: string | null
          video_id: string | null
          view_count: number | null
        }
        Insert: {
          artist_handle: string
          artist_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          label_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          source_platform: string
          source_url: string
          title?: string | null
          transcript?: string | null
          transcript_source?: string | null
          transcript_timestamps?: Json | null
          upload_date?: string | null
          video_id?: string | null
          view_count?: number | null
        }
        Update: {
          artist_handle?: string
          artist_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          label_id?: string | null
          metadata?: Json | null
          processed_at?: string | null
          source_platform?: string
          source_url?: string
          title?: string | null
          transcript?: string | null
          transcript_source?: string | null
          transcript_timestamps?: Json | null
          upload_date?: string | null
          video_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_catalog_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_catalog_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plan_drafts: {
        Row: {
          created_at: string | null
          draft: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          draft: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          draft?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          archived_at: string | null
          created_at: string | null
          id: string
          is_favorite: boolean
          name: string
          plan: Json
          project_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          plan: Json
          project_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          plan?: Json
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_projects: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_segments: {
        Row: {
          artist_handle: string
          catalog_id: string | null
          clip_extracted_at: string | null
          clip_storage_path: string | null
          clip_storage_url: string | null
          content: string
          created_at: string | null
          duration_seconds: number | null
          embedding: string | null
          end_seconds: number
          fan_potential_score: number | null
          fts: unknown
          id: string
          label_id: string | null
          metadata: Json | null
          moment_summary: string
          moment_type: string | null
          speaker: string | null
          start_seconds: number
          transcript_excerpt: string
          visual_confirmed: boolean | null
          visual_description: string | null
        }
        Insert: {
          artist_handle: string
          catalog_id?: string | null
          clip_extracted_at?: string | null
          clip_storage_path?: string | null
          clip_storage_url?: string | null
          content: string
          created_at?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          end_seconds: number
          fan_potential_score?: number | null
          fts?: unknown
          id?: string
          label_id?: string | null
          metadata?: Json | null
          moment_summary: string
          moment_type?: string | null
          speaker?: string | null
          start_seconds: number
          transcript_excerpt: string
          visual_confirmed?: boolean | null
          visual_description?: string | null
        }
        Update: {
          artist_handle?: string
          catalog_id?: string | null
          clip_extracted_at?: string | null
          clip_storage_path?: string | null
          clip_storage_url?: string | null
          content?: string
          created_at?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          end_seconds?: number
          fan_potential_score?: number | null
          fts?: unknown
          id?: string
          label_id?: string | null
          metadata?: Json | null
          moment_summary?: string
          moment_type?: string | null
          speaker?: string | null
          start_seconds?: number
          transcript_excerpt?: string
          visual_confirmed?: boolean | null
          visual_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_segments_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "content_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_platform_arbitrage: {
        Row: {
          arbitrage_insight: string | null
          arbitrage_priority: number | null
          audience_balance: string | null
          canonical_name: string | null
          date: string | null
          entity_id: string | null
          ig_avg_plays: number | null
          ig_cadence: string | null
          ig_engagement: number | null
          ig_follower_growth: number | null
          ig_followers: number | null
          ig_health: string | null
          ig_median_plays: number | null
          ig_posts_30d: number | null
          ig_reels_30d: number | null
          ig_vs_tt_engagement_ratio: number | null
          ig_vs_tt_follower_ratio: number | null
          ig_vs_tt_views_ratio: number | null
          posting_balance_30d: number | null
          posting_gap: string | null
          stronger_platform_engagement: string | null
          stronger_platform_views: string | null
          tt_avg_plays: number | null
          tt_cadence: string | null
          tt_engagement: number | null
          tt_follower_growth: number | null
          tt_followers: number | null
          tt_health: string | null
          tt_median_plays: number | null
          tt_videos_30d: number | null
        }
        Insert: {
          arbitrage_insight?: string | null
          arbitrage_priority?: number | null
          audience_balance?: string | null
          canonical_name?: string | null
          date?: string | null
          entity_id?: string | null
          ig_avg_plays?: number | null
          ig_cadence?: string | null
          ig_engagement?: number | null
          ig_follower_growth?: number | null
          ig_followers?: number | null
          ig_health?: string | null
          ig_median_plays?: number | null
          ig_posts_30d?: number | null
          ig_reels_30d?: number | null
          ig_vs_tt_engagement_ratio?: number | null
          ig_vs_tt_follower_ratio?: number | null
          ig_vs_tt_views_ratio?: number | null
          posting_balance_30d?: number | null
          posting_gap?: string | null
          stronger_platform_engagement?: string | null
          stronger_platform_views?: string | null
          tt_avg_plays?: number | null
          tt_cadence?: string | null
          tt_engagement?: number | null
          tt_follower_growth?: number | null
          tt_followers?: number | null
          tt_health?: string | null
          tt_median_plays?: number | null
          tt_videos_30d?: number | null
        }
        Update: {
          arbitrage_insight?: string | null
          arbitrage_priority?: number | null
          audience_balance?: string | null
          canonical_name?: string | null
          date?: string | null
          entity_id?: string | null
          ig_avg_plays?: number | null
          ig_cadence?: string | null
          ig_engagement?: number | null
          ig_follower_growth?: number | null
          ig_followers?: number | null
          ig_health?: string | null
          ig_median_plays?: number | null
          ig_posts_30d?: number | null
          ig_reels_30d?: number | null
          ig_vs_tt_engagement_ratio?: number | null
          ig_vs_tt_follower_ratio?: number | null
          ig_vs_tt_views_ratio?: number | null
          posting_balance_30d?: number | null
          posting_gap?: string | null
          stronger_platform_engagement?: string | null
          stronger_platform_views?: string | null
          tt_avg_plays?: number | null
          tt_cadence?: string | null
          tt_engagement?: number | null
          tt_follower_growth?: number | null
          tt_followers?: number | null
          tt_health?: string | null
          tt_median_plays?: number | null
          tt_videos_30d?: number | null
        }
        Relationships: []
      }
      cross_platform_signal: {
        Row: {
          canonical_name: string | null
          date: string | null
          deezer_trend: number | null
          entity_id: string | null
          entity_type: string | null
          instagram_trend: number | null
          kworb_rank_trend: number | null
          lastfm_trend: number | null
          platforms_declining: number | null
          platforms_growing: number | null
          platforms_tracked: number | null
          shazam_trend: number | null
          signal: string | null
          spotify_trend: number | null
          tiktok_trend: number | null
          wikipedia_trend: number | null
          youtube_trend: number | null
        }
        Insert: {
          canonical_name?: string | null
          date?: string | null
          deezer_trend?: number | null
          entity_id?: string | null
          entity_type?: string | null
          instagram_trend?: number | null
          kworb_rank_trend?: number | null
          lastfm_trend?: number | null
          platforms_declining?: number | null
          platforms_growing?: number | null
          platforms_tracked?: number | null
          shazam_trend?: number | null
          signal?: string | null
          spotify_trend?: number | null
          tiktok_trend?: number | null
          wikipedia_trend?: number | null
          youtube_trend?: number | null
        }
        Update: {
          canonical_name?: string | null
          date?: string | null
          deezer_trend?: number | null
          entity_id?: string | null
          entity_type?: string | null
          instagram_trend?: number | null
          kworb_rank_trend?: number | null
          lastfm_trend?: number | null
          platforms_declining?: number | null
          platforms_growing?: number | null
          platforms_tracked?: number | null
          shazam_trend?: number | null
          signal?: string | null
          spotify_trend?: number | null
          tiktok_trend?: number | null
          wikipedia_trend?: number | null
          youtube_trend?: number | null
        }
        Relationships: []
      }
      culture_genome_clusters: {
        Row: {
          avg_viral_score: number | null
          centroid: number[] | null
          cluster_id: number
          color: string | null
          computed_at: string | null
          dominant_format: string | null
          dominant_genre: string | null
          dominant_mood: string | null
          id: number
          label: string | null
          layer: string
          member_count: number | null
        }
        Insert: {
          avg_viral_score?: number | null
          centroid?: number[] | null
          cluster_id: number
          color?: string | null
          computed_at?: string | null
          dominant_format?: string | null
          dominant_genre?: string | null
          dominant_mood?: string | null
          id?: number
          label?: string | null
          layer: string
          member_count?: number | null
        }
        Update: {
          avg_viral_score?: number | null
          centroid?: number[] | null
          cluster_id?: number
          color?: string | null
          computed_at?: string | null
          dominant_format?: string | null
          dominant_genre?: string | null
          dominant_mood?: string | null
          id?: number
          label?: string | null
          layer?: string
          member_count?: number | null
        }
        Relationships: []
      }
      culture_genome_nodes: {
        Row: {
          avatar_url: string | null
          cluster_blended: number | null
          cluster_musical: number | null
          cluster_viral: number | null
          cluster_visual: number | null
          computed_at: string | null
          display_name: string
          feature_vector: number[] | null
          id: string
          metadata: Json | null
          node_type: string
          position_blended: number[] | null
          position_musical: number[] | null
          position_viral: number[] | null
          position_visual: number[] | null
          size_score: number | null
          source_id: string
          source_table: string
        }
        Insert: {
          avatar_url?: string | null
          cluster_blended?: number | null
          cluster_musical?: number | null
          cluster_viral?: number | null
          cluster_visual?: number | null
          computed_at?: string | null
          display_name: string
          feature_vector?: number[] | null
          id: string
          metadata?: Json | null
          node_type: string
          position_blended?: number[] | null
          position_musical?: number[] | null
          position_viral?: number[] | null
          position_visual?: number[] | null
          size_score?: number | null
          source_id: string
          source_table: string
        }
        Update: {
          avatar_url?: string | null
          cluster_blended?: number | null
          cluster_musical?: number | null
          cluster_viral?: number | null
          cluster_visual?: number | null
          computed_at?: string | null
          display_name?: string
          feature_vector?: number[] | null
          id?: string
          metadata?: Json | null
          node_type?: string
          position_blended?: number[] | null
          position_musical?: number[] | null
          position_viral?: number[] | null
          position_visual?: number[] | null
          size_score?: number | null
          source_id?: string
          source_table?: string
        }
        Relationships: []
      }
      daily_genre_reports: {
        Row: {
          content_opportunities: Json
          created_at: string | null
          genre_slug: string
          id: string
          key_patterns: Json
          raw_stats: Json | null
          report_date: string
          summary: string
          top_outliers: Json
        }
        Insert: {
          content_opportunities: Json
          created_at?: string | null
          genre_slug: string
          id?: string
          key_patterns: Json
          raw_stats?: Json | null
          report_date?: string
          summary: string
          top_outliers: Json
        }
        Update: {
          content_opportunities?: Json
          created_at?: string | null
          genre_slug?: string
          id?: string
          key_patterns?: Json
          raw_stats?: Json | null
          report_date?: string
          summary?: string
          top_outliers?: Json
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          avg_90d: number | null
          date: string | null
          delta_1d: number | null
          delta_30d: number | null
          delta_7d: number | null
          entity_id: string | null
          latest_value: number | null
          metric: string | null
          pct_change_30d: number | null
          pct_change_7d: number | null
          peak_ratio: number | null
          peak_value: number | null
          platform: string | null
          stddev_90d: number | null
          z_score: number | null
        }
        Insert: {
          avg_90d?: number | null
          date?: string | null
          delta_1d?: number | null
          delta_30d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          latest_value?: number | null
          metric?: string | null
          pct_change_30d?: number | null
          pct_change_7d?: number | null
          peak_ratio?: number | null
          peak_value?: number | null
          platform?: string | null
          stddev_90d?: number | null
          z_score?: number | null
        }
        Update: {
          avg_90d?: number | null
          date?: string | null
          delta_1d?: number | null
          delta_30d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          latest_value?: number | null
          metric?: string | null
          pct_change_30d?: number | null
          pct_change_7d?: number | null
          peak_ratio?: number | null
          peak_value?: number | null
          platform?: string | null
          stddev_90d?: number | null
          z_score?: number | null
        }
        Relationships: []
      }
      daily_summaries_geo: {
        Row: {
          country_code: string | null
          date: string | null
          delta_1d: number | null
          delta_7d: number | null
          entity_id: string | null
          latest_value: number | null
          metric: string | null
          pct_change_7d: number | null
          platform: string | null
        }
        Insert: {
          country_code?: string | null
          date?: string | null
          delta_1d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          latest_value?: number | null
          metric?: string | null
          pct_change_7d?: number | null
          platform?: string | null
        }
        Update: {
          country_code?: string | null
          date?: string | null
          delta_1d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          latest_value?: number | null
          metric?: string | null
          pct_change_7d?: number | null
          platform?: string | null
        }
        Relationships: []
      }
      decision_point_actions: {
        Row: {
          action_type: string
          brief_date: string
          created_at: string
          decision_point_key: string
          decision_point_snapshot: Json
          forward_note: string | null
          forwarded_to_email: string | null
          forwarded_to_slack_channel: string | null
          forwarded_to_user_id: string | null
          id: string
          label_id: string
          snooze_until: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          brief_date: string
          created_at?: string
          decision_point_key: string
          decision_point_snapshot: Json
          forward_note?: string | null
          forwarded_to_email?: string | null
          forwarded_to_slack_channel?: string | null
          forwarded_to_user_id?: string | null
          id?: string
          label_id: string
          snooze_until?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          brief_date?: string
          created_at?: string
          decision_point_key?: string
          decision_point_snapshot?: Json
          forward_note?: string | null
          forwarded_to_email?: string | null
          forwarded_to_slack_channel?: string | null
          forwarded_to_user_id?: string | null
          id?: string
          label_id?: string
          snooze_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_point_actions_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_research_jobs: {
        Row: {
          artist_handle: string
          artist_name: string | null
          brand_document: Json | null
          comment_data: Json | null
          comments_status: string | null
          competitor_data: Json | null
          competitor_status: string | null
          completed_at: string | null
          content_analysis_data: Json | null
          content_analysis_status: string | null
          content_plan: Json | null
          content_plan_editor_log: Json | null
          content_plan_selected_variant: string | null
          content_plan_variants: Json | null
          cost_log: Json | null
          created_at: string
          cross_platform_data: Json | null
          deep_research_data: Json | null
          deep_research_status: string | null
          deliverable_cost_log: Json | null
          deliverable_generated_at: string | null
          deliverable_status: string | null
          error_log: Json | null
          id: string
          instagram_data: Json | null
          instagram_status: string | null
          label_id: string | null
          plan_render_status: string | null
          rag_status: string | null
          report_render_status: string | null
          requested_by: string | null
          spotify_data: Json | null
          spotify_status: string | null
          status: string
          synthesis_status: string | null
          thirty_day_plan: Json | null
          tiktok_data: Json | null
          tiktok_status: string | null
          updated_at: string
        }
        Insert: {
          artist_handle: string
          artist_name?: string | null
          brand_document?: Json | null
          comment_data?: Json | null
          comments_status?: string | null
          competitor_data?: Json | null
          competitor_status?: string | null
          completed_at?: string | null
          content_analysis_data?: Json | null
          content_analysis_status?: string | null
          content_plan?: Json | null
          content_plan_editor_log?: Json | null
          content_plan_selected_variant?: string | null
          content_plan_variants?: Json | null
          cost_log?: Json | null
          created_at?: string
          cross_platform_data?: Json | null
          deep_research_data?: Json | null
          deep_research_status?: string | null
          deliverable_cost_log?: Json | null
          deliverable_generated_at?: string | null
          deliverable_status?: string | null
          error_log?: Json | null
          id?: string
          instagram_data?: Json | null
          instagram_status?: string | null
          label_id?: string | null
          plan_render_status?: string | null
          rag_status?: string | null
          report_render_status?: string | null
          requested_by?: string | null
          spotify_data?: Json | null
          spotify_status?: string | null
          status?: string
          synthesis_status?: string | null
          thirty_day_plan?: Json | null
          tiktok_data?: Json | null
          tiktok_status?: string | null
          updated_at?: string
        }
        Update: {
          artist_handle?: string
          artist_name?: string | null
          brand_document?: Json | null
          comment_data?: Json | null
          comments_status?: string | null
          competitor_data?: Json | null
          competitor_status?: string | null
          completed_at?: string | null
          content_analysis_data?: Json | null
          content_analysis_status?: string | null
          content_plan?: Json | null
          content_plan_editor_log?: Json | null
          content_plan_selected_variant?: string | null
          content_plan_variants?: Json | null
          cost_log?: Json | null
          created_at?: string
          cross_platform_data?: Json | null
          deep_research_data?: Json | null
          deep_research_status?: string | null
          deliverable_cost_log?: Json | null
          deliverable_generated_at?: string | null
          deliverable_status?: string | null
          error_log?: Json | null
          id?: string
          instagram_data?: Json | null
          instagram_status?: string | null
          label_id?: string | null
          plan_render_status?: string | null
          rag_status?: string | null
          report_render_status?: string | null
          requested_by?: string | null
          spotify_data?: Json | null
          spotify_status?: string | null
          status?: string
          synthesis_status?: string | null
          thirty_day_plan?: Json | null
          tiktok_data?: Json | null
          tiktok_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deliverable_versions: {
        Row: {
          artist_handle: string
          content: Json | null
          content_html: string | null
          created_at: string | null
          created_by: string | null
          deliverable_type: string
          id: number
          job_id: string | null
          notes: string | null
          version_number: number
          week_of: string | null
        }
        Insert: {
          artist_handle: string
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_type: string
          id?: never
          job_id?: string | null
          notes?: string | null
          version_number?: number
          week_of?: string | null
        }
        Update: {
          artist_handle?: string
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_type?: string
          id?: never
          job_id?: string | null
          notes?: string | null
          version_number?: number
          week_of?: string | null
        }
        Relationships: []
      }
      device_push_tokens: {
        Row: {
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expo_push_token: string
          id?: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discovery_streaming_divergence: {
        Row: {
          canonical_name: string | null
          country_code: string | null
          date: string | null
          discovery_platform_list: string[] | null
          discovery_platforms: number | null
          discovery_score: number | null
          divergence: number | null
          entity_id: string | null
          signal_type: string | null
          streaming_platform_list: string[] | null
          streaming_platforms: number | null
          streaming_score: number | null
          total_platforms: number | null
        }
        Insert: {
          canonical_name?: string | null
          country_code?: string | null
          date?: string | null
          discovery_platform_list?: string[] | null
          discovery_platforms?: number | null
          discovery_score?: number | null
          divergence?: number | null
          entity_id?: string | null
          signal_type?: string | null
          streaming_platform_list?: string[] | null
          streaming_platforms?: number | null
          streaming_score?: number | null
          total_platforms?: number | null
        }
        Update: {
          canonical_name?: string | null
          country_code?: string | null
          date?: string | null
          discovery_platform_list?: string[] | null
          discovery_platforms?: number | null
          discovery_score?: number | null
          divergence?: number | null
          entity_id?: string | null
          signal_type?: string | null
          streaming_platform_list?: string[] | null
          streaming_platforms?: number | null
          streaming_score?: number | null
          total_platforms?: number | null
        }
        Relationships: []
      }
      entity_health: {
        Row: {
          canonical_name: string | null
          date: string | null
          discovery_momentum: number | null
          entity_id: string | null
          entity_type: string | null
          geographic_reach: number | null
          health_score: number | null
          listeners_peak_ratio: number | null
          social_momentum: number | null
          streaming_momentum: number | null
          touring_activity: number | null
        }
        Insert: {
          canonical_name?: string | null
          date?: string | null
          discovery_momentum?: number | null
          entity_id?: string | null
          entity_type?: string | null
          geographic_reach?: number | null
          health_score?: number | null
          listeners_peak_ratio?: number | null
          social_momentum?: number | null
          streaming_momentum?: number | null
          touring_activity?: number | null
        }
        Update: {
          canonical_name?: string | null
          date?: string | null
          discovery_momentum?: number | null
          entity_id?: string | null
          entity_type?: string | null
          geographic_reach?: number | null
          health_score?: number | null
          listeners_peak_ratio?: number | null
          social_momentum?: number | null
          streaming_momentum?: number | null
          touring_activity?: number | null
        }
        Relationships: []
      }
      fan_briefs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          artist_handle: string
          artist_id: string | null
          caption: string | null
          clip_duration_seconds: number | null
          clip_storage_path: string | null
          clip_storage_url: string | null
          confidence_score: number | null
          created_at: string | null
          format_recommendation: string
          generation_context: Json | null
          hook_text: string
          id: string
          label_id: string | null
          modified_hook: string | null
          platform_recommendation: string[] | null
          posted_url: string | null
          rendered_clip_url: string | null
          segment_id: string | null
          sound_pairing: string | null
          source_title: string | null
          source_url: string | null
          status: string | null
          timestamp_end: number | null
          timestamp_start: number | null
          why_now: string
          youtube_timestamp_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          artist_handle: string
          artist_id?: string | null
          caption?: string | null
          clip_duration_seconds?: number | null
          clip_storage_path?: string | null
          clip_storage_url?: string | null
          confidence_score?: number | null
          created_at?: string | null
          format_recommendation: string
          generation_context?: Json | null
          hook_text: string
          id?: string
          label_id?: string | null
          modified_hook?: string | null
          platform_recommendation?: string[] | null
          posted_url?: string | null
          rendered_clip_url?: string | null
          segment_id?: string | null
          sound_pairing?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string | null
          timestamp_end?: number | null
          timestamp_start?: number | null
          why_now: string
          youtube_timestamp_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          artist_handle?: string
          artist_id?: string | null
          caption?: string | null
          clip_duration_seconds?: number | null
          clip_storage_path?: string | null
          clip_storage_url?: string | null
          confidence_score?: number | null
          created_at?: string | null
          format_recommendation?: string
          generation_context?: Json | null
          hook_text?: string
          id?: string
          label_id?: string | null
          modified_hook?: string | null
          platform_recommendation?: string[] | null
          posted_url?: string | null
          rendered_clip_url?: string | null
          segment_id?: string | null
          sound_pairing?: string | null
          source_title?: string | null
          source_url?: string | null
          status?: string | null
          timestamp_end?: number | null
          timestamp_start?: number | null
          why_now?: string
          youtube_timestamp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fan_briefs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_briefs_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_briefs_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "content_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_suggestions: {
        Row: {
          anonymous_id: string | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_public: boolean
          status: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          status?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feature_votes: {
        Row: {
          anonymous_id: string | null
          created_at: string
          id: string
          suggestion_id: string
          user_id: string | null
          vote_type: number
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          suggestion_id: string
          user_id?: string | null
          vote_type: number
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string | null
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "feature_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_member_signups: {
        Row: {
          b2b_name_company: string | null
          b2b_pilot_interest: string | null
          b2b_team_size: string | null
          biggest_challenges: string[] | null
          created_at: string
          current_solutions: string[] | null
          deposit_credit_used: boolean | null
          deposit_credit_used_at: string | null
          deposit_paid: boolean
          email: string
          email_sent_at: string | null
          id: string
          instagram_handle: string | null
          member_number: number | null
          referral_code: string
          referred_by: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tiktok_handle: string | null
          time_spent_weekly: string | null
          updated_at: string
          usefulness_rating: string | null
          user_id: string | null
          user_type: string | null
          wall_display_name: string | null
          willingness_to_pay: string | null
        }
        Insert: {
          b2b_name_company?: string | null
          b2b_pilot_interest?: string | null
          b2b_team_size?: string | null
          biggest_challenges?: string[] | null
          created_at?: string
          current_solutions?: string[] | null
          deposit_credit_used?: boolean | null
          deposit_credit_used_at?: string | null
          deposit_paid?: boolean
          email: string
          email_sent_at?: string | null
          id?: string
          instagram_handle?: string | null
          member_number?: number | null
          referral_code?: string
          referred_by?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tiktok_handle?: string | null
          time_spent_weekly?: string | null
          updated_at?: string
          usefulness_rating?: string | null
          user_id?: string | null
          user_type?: string | null
          wall_display_name?: string | null
          willingness_to_pay?: string | null
        }
        Update: {
          b2b_name_company?: string | null
          b2b_pilot_interest?: string | null
          b2b_team_size?: string | null
          biggest_challenges?: string[] | null
          created_at?: string
          current_solutions?: string[] | null
          deposit_credit_used?: boolean | null
          deposit_credit_used_at?: string | null
          deposit_paid?: boolean
          email?: string
          email_sent_at?: string | null
          id?: string
          instagram_handle?: string | null
          member_number?: number | null
          referral_code?: string
          referred_by?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tiktok_handle?: string | null
          time_spent_weekly?: string | null
          updated_at?: string
          usefulness_rating?: string | null
          user_id?: string | null
          user_type?: string | null
          wall_display_name?: string | null
          willingness_to_pay?: string | null
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      geographic_footprint: {
        Row: {
          avg_position: number | null
          best_position: number | null
          canonical_name: string | null
          chart_streams: number | null
          country_code: string | null
          country_rank: number | null
          date: string | null
          days_on_chart: number | null
          dominant_markets: number | null
          entity_id: string | null
          entity_type: string | null
          market_strength: string | null
          platforms_charting: number | null
          strong_markets: number | null
          total_chart_streams: number | null
          total_markets: number | null
        }
        Insert: {
          avg_position?: number | null
          best_position?: number | null
          canonical_name?: string | null
          chart_streams?: number | null
          country_code?: string | null
          country_rank?: number | null
          date?: string | null
          days_on_chart?: number | null
          dominant_markets?: number | null
          entity_id?: string | null
          entity_type?: string | null
          market_strength?: string | null
          platforms_charting?: number | null
          strong_markets?: number | null
          total_chart_streams?: number | null
          total_markets?: number | null
        }
        Update: {
          avg_position?: number | null
          best_position?: number | null
          canonical_name?: string | null
          chart_streams?: number | null
          country_code?: string | null
          country_rank?: number | null
          date?: string | null
          days_on_chart?: number | null
          dominant_markets?: number | null
          entity_id?: string | null
          entity_type?: string | null
          market_strength?: string | null
          platforms_charting?: number | null
          strong_markets?: number | null
          total_chart_streams?: number | null
          total_markets?: number | null
        }
        Relationships: []
      }
      health_cache: {
        Row: {
          data: Json
          id: number
          refreshed_at: string | null
        }
        Insert: {
          data?: Json
          id?: number
          refreshed_at?: string | null
        }
        Update: {
          data?: Json
          id?: number
          refreshed_at?: string | null
        }
        Relationships: []
      }
      idea_decisions: {
        Row: {
          content_plan_id: string
          created_at: string | null
          decision: string
          id: string
          idea_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_plan_id: string
          created_at?: string | null
          decision: string
          id?: string
          idea_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_plan_id?: string
          created_at?: string | null
          decision?: string
          id?: string
          idea_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      idea_feedback: {
        Row: {
          artist_handle: string
          content_plan_id: string | null
          created_at: string | null
          feedback_reason: string
          feedback_text: string | null
          id: string
          idea_index: number | null
          idea_title: string
          source: string | null
        }
        Insert: {
          artist_handle: string
          content_plan_id?: string | null
          created_at?: string | null
          feedback_reason: string
          feedback_text?: string | null
          id?: string
          idea_index?: number | null
          idea_title: string
          source?: string | null
        }
        Update: {
          artist_handle?: string
          content_plan_id?: string | null
          created_at?: string | null
          feedback_reason?: string
          feedback_text?: string | null
          id?: string
          idea_index?: number | null
          idea_title?: string
          source?: string | null
        }
        Relationships: []
      }
      instagram_artist_daily: {
        Row: {
          avg_engagement_rate: number | null
          avg_plays: number | null
          canonical_name: string | null
          consistency_score: number | null
          date: string | null
          days_since_last_post: number | null
          engagement_percentile: number | null
          engagement_trend_pct: number | null
          entity_id: string | null
          follow_ratio: number | null
          follower_growth_7d: number | null
          follower_growth_pct_7d: number | null
          follower_percentile: number | null
          follower_tier: string | null
          followers: number | null
          following: number | null
          instagram_health: string | null
          last_observed: string | null
          median_engagement_rate: number | null
          median_plays: number | null
          new_posts_7d: number | null
          original_audio_pct: number | null
          plays_percentile: number | null
          plays_trend_pct: number | null
          posting_cadence: string | null
          posts_30d: number | null
          posts_count: number | null
          reels_30d: number | null
          scraped_posts: number | null
          top_hashtags: string[] | null
          total_reels: number | null
        }
        Insert: {
          avg_engagement_rate?: number | null
          avg_plays?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_percentile?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          follow_ratio?: number | null
          follower_growth_7d?: number | null
          follower_growth_pct_7d?: number | null
          follower_percentile?: number | null
          follower_tier?: string | null
          followers?: number | null
          following?: number | null
          instagram_health?: string | null
          last_observed?: string | null
          median_engagement_rate?: number | null
          median_plays?: number | null
          new_posts_7d?: number | null
          original_audio_pct?: number | null
          plays_percentile?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          posts_30d?: number | null
          posts_count?: number | null
          reels_30d?: number | null
          scraped_posts?: number | null
          top_hashtags?: string[] | null
          total_reels?: number | null
        }
        Update: {
          avg_engagement_rate?: number | null
          avg_plays?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_percentile?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          follow_ratio?: number | null
          follower_growth_7d?: number | null
          follower_growth_pct_7d?: number | null
          follower_percentile?: number | null
          follower_tier?: string | null
          followers?: number | null
          following?: number | null
          instagram_health?: string | null
          last_observed?: string | null
          median_engagement_rate?: number | null
          median_plays?: number | null
          new_posts_7d?: number | null
          original_audio_pct?: number | null
          plays_percentile?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          posts_30d?: number | null
          posts_count?: number | null
          reels_30d?: number | null
          scraped_posts?: number | null
          top_hashtags?: string[] | null
          total_reels?: number | null
        }
        Relationships: []
      }
      instagram_video_summary: {
        Row: {
          avg_comments: number | null
          avg_days_between_posts: number | null
          avg_engagement_30d: number | null
          avg_engagement_rate: number | null
          avg_likes: number | null
          avg_plays: number | null
          avg_plays_30d: number | null
          best_plays: number | null
          canonical_name: string | null
          consistency_score: number | null
          date: string | null
          days_since_last_post: number | null
          engagement_trend_pct: number | null
          entity_id: string | null
          median_comments: number | null
          median_engagement_rate: number | null
          median_likes: number | null
          median_plays: number | null
          median_plays_30d: number | null
          original_audio_pct: number | null
          plays_stddev: number | null
          plays_trend_pct: number | null
          posting_cadence: string | null
          posts_30d: number | null
          posts_7d: number | null
          posts_90d: number | null
          reels_30d: number | null
          top_hashtags: string[] | null
          top_sound_artist: string | null
          top_sound_title: string | null
          top_sound_uses: number | null
          total_plays: number | null
          total_posts: number | null
          total_reels: number | null
          unique_sounds_used: number | null
          video_pct: number | null
          worst_plays: number | null
        }
        Insert: {
          avg_comments?: number | null
          avg_days_between_posts?: number | null
          avg_engagement_30d?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_plays_30d?: number | null
          best_plays?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          median_comments?: number | null
          median_engagement_rate?: number | null
          median_likes?: number | null
          median_plays?: number | null
          median_plays_30d?: number | null
          original_audio_pct?: number | null
          plays_stddev?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          posts_30d?: number | null
          posts_7d?: number | null
          posts_90d?: number | null
          reels_30d?: number | null
          top_hashtags?: string[] | null
          top_sound_artist?: string | null
          top_sound_title?: string | null
          top_sound_uses?: number | null
          total_plays?: number | null
          total_posts?: number | null
          total_reels?: number | null
          unique_sounds_used?: number | null
          video_pct?: number | null
          worst_plays?: number | null
        }
        Update: {
          avg_comments?: number | null
          avg_days_between_posts?: number | null
          avg_engagement_30d?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_plays_30d?: number | null
          best_plays?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          median_comments?: number | null
          median_engagement_rate?: number | null
          median_likes?: number | null
          median_plays?: number | null
          median_plays_30d?: number | null
          original_audio_pct?: number | null
          plays_stddev?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          posts_30d?: number | null
          posts_7d?: number | null
          posts_90d?: number | null
          reels_30d?: number | null
          top_hashtags?: string[] | null
          top_sound_artist?: string | null
          top_sound_title?: string | null
          top_sound_uses?: number | null
          total_plays?: number | null
          total_posts?: number | null
          total_reels?: number | null
          unique_sounds_used?: number | null
          video_pct?: number | null
          worst_plays?: number | null
        }
        Relationships: []
      }
      intelligence_briefs: {
        Row: {
          brief_date: string
          brief_html: string
          brief_json: Json
          brief_type: string
          compressed_input: Json
          entity_id: string
          generated_at: string | null
          id: string
          label_id: string | null
          modules_empty: string[]
          modules_included: string[]
        }
        Insert: {
          brief_date?: string
          brief_html: string
          brief_json: Json
          brief_type?: string
          compressed_input: Json
          entity_id: string
          generated_at?: string | null
          id?: string
          label_id?: string | null
          modules_empty: string[]
          modules_included: string[]
        }
        Update: {
          brief_date?: string
          brief_html?: string
          brief_json?: Json
          brief_type?: string
          compressed_input?: Json
          entity_id?: string
          generated_at?: string | null
          id?: string
          label_id?: string | null
          modules_empty?: string[]
          modules_included?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_briefs_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      label_invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          label_id: string
          label_name: string | null
          max_uses: number | null
          use_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label_id: string
          label_name?: string | null
          max_uses?: number | null
          use_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          label_id?: string
          label_name?: string | null
          max_uses?: number | null
          use_count?: number | null
        }
        Relationships: []
      }
      labels: {
        Row: {
          contact_email: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          id: string
          invite_code: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          onboarding_status: string | null
          slug: string
        }
        Insert: {
          contact_email?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          id?: string
          invite_code: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          onboarding_status?: string | null
          slug: string
        }
        Update: {
          contact_email?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          onboarding_status?: string | null
          slug?: string
        }
        Relationships: []
      }
      language_country_map: {
        Row: {
          country_code: string | null
          language_code: string | null
          weight: number | null
        }
        Insert: {
          country_code?: string | null
          language_code?: string | null
          weight?: number | null
        }
        Update: {
          country_code?: string | null
          language_code?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      lyric_video_projects: {
        Row: {
          audio_url: string | null
          background_video_url: string | null
          created_at: string
          duration_ms: number | null
          genre: string | null
          id: string
          mood: string | null
          name: string
          rendered_url: string | null
          status: string | null
          "sub-genre": string | null
          transcription_data: Json | null
          updated_at: string
          user_id: string
          video_settings: Json | null
        }
        Insert: {
          audio_url?: string | null
          background_video_url?: string | null
          created_at?: string
          duration_ms?: number | null
          genre?: string | null
          id?: string
          mood?: string | null
          name?: string
          rendered_url?: string | null
          status?: string | null
          "sub-genre"?: string | null
          transcription_data?: Json | null
          updated_at?: string
          user_id: string
          video_settings?: Json | null
        }
        Update: {
          audio_url?: string | null
          background_video_url?: string | null
          created_at?: string
          duration_ms?: number | null
          genre?: string | null
          id?: string
          mood?: string | null
          name?: string
          rendered_url?: string | null
          status?: string | null
          "sub-genre"?: string | null
          transcription_data?: Json | null
          updated_at?: string
          user_id?: string
          video_settings?: Json | null
        }
        Relationships: []
      }
      market_adjacency: {
        Row: {
          confidence_pct: number | null
          from_country: string | null
          region_cluster: string | null
          to_country: string | null
          typical_lag_days: number | null
        }
        Insert: {
          confidence_pct?: number | null
          from_country?: string | null
          region_cluster?: string | null
          to_country?: string | null
          typical_lag_days?: number | null
        }
        Update: {
          confidence_pct?: number | null
          from_country?: string | null
          region_cluster?: string | null
          to_country?: string | null
          typical_lag_days?: number | null
        }
        Relationships: []
      }
      market_health: {
        Row: {
          apple_music_artists: number | null
          charting_artists: number | null
          country_code: string | null
          date: string | null
          entity_id: string | null
          entity_type: string | null
          health_score: number | null
          shazam_artists: number | null
          spotify_artists: number | null
          tiktok_artists: number | null
        }
        Insert: {
          apple_music_artists?: number | null
          charting_artists?: number | null
          country_code?: string | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          health_score?: number | null
          shazam_artists?: number | null
          spotify_artists?: number | null
          tiktok_artists?: number | null
        }
        Update: {
          apple_music_artists?: number | null
          charting_artists?: number | null
          country_code?: string | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          health_score?: number | null
          shazam_artists?: number | null
          spotify_artists?: number | null
          tiktok_artists?: number | null
        }
        Relationships: []
      }
      market_intelligence: {
        Row: {
          arbitrage_score: number | null
          avg_cpm_blended: number
          avg_ticket_price_usd: number | null
          country_code: string
          country_name: string
          created_at: string | null
          fan_value_index: number
          id: string
          internet_penetration: number | null
          live_attendance_index: number | null
          merch_enthusiasm_index: number | null
          music_revenue_per_capita: number | null
          population_millions: number | null
          top_platform: string | null
          updated_at: string | null
          yoy_streaming_growth: number | null
        }
        Insert: {
          arbitrage_score?: number | null
          avg_cpm_blended: number
          avg_ticket_price_usd?: number | null
          country_code: string
          country_name: string
          created_at?: string | null
          fan_value_index: number
          id?: string
          internet_penetration?: number | null
          live_attendance_index?: number | null
          merch_enthusiasm_index?: number | null
          music_revenue_per_capita?: number | null
          population_millions?: number | null
          top_platform?: string | null
          updated_at?: string | null
          yoy_streaming_growth?: number | null
        }
        Update: {
          arbitrage_score?: number | null
          avg_cpm_blended?: number
          avg_ticket_price_usd?: number | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          fan_value_index?: number
          id?: string
          internet_penetration?: number | null
          live_attendance_index?: number | null
          merch_enthusiasm_index?: number | null
          music_revenue_per_capita?: number | null
          population_millions?: number | null
          top_platform?: string | null
          updated_at?: string | null
          yoy_streaming_growth?: number | null
        }
        Relationships: []
      }
      market_opportunity: {
        Row: {
          artist_score: number | null
          artist_total_markets: number | null
          best_position: number | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          country_code: string | null
          date: string | null
          entity_id: string | null
          is_present: boolean | null
          market_health_score: number | null
          market_size: number | null
          market_strength: string | null
          momentum_score: number | null
          opportunity_score: number | null
          opportunity_tier: string | null
          platforms_charting: number | null
          recommended_action: string | null
        }
        Insert: {
          artist_score?: number | null
          artist_total_markets?: number | null
          best_position?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          country_code?: string | null
          date?: string | null
          entity_id?: string | null
          is_present?: boolean | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          platforms_charting?: number | null
          recommended_action?: string | null
        }
        Update: {
          artist_score?: number | null
          artist_total_markets?: number | null
          best_position?: number | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          country_code?: string | null
          date?: string | null
          entity_id?: string | null
          is_present?: boolean | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          platforms_charting?: number | null
          recommended_action?: string | null
        }
        Relationships: []
      }
      market_opportunity_v2: {
        Row: {
          artist_score: number | null
          artist_total_markets: number | null
          base_score: number | null
          best_position: number | null
          best_velocity_platform: string | null
          canonical_name: string | null
          catalog_daily_streams: number | null
          country_code: string | null
          date: string | null
          days_trending: number | null
          discovery_bonus: number | null
          discovery_divergence: number | null
          discovery_platform_count: number | null
          discovery_score: number | null
          discovery_signal_type: string | null
          entity_id: string | null
          entry_song_adjacent_markets: number | null
          entry_song_entity_id: string | null
          entry_song_name: string | null
          entry_song_velocity: string | null
          estimated_activation_days: number | null
          estimated_monthly_streams: number | null
          estimated_revenue_monthly: number | null
          estimated_weeks_remaining: number | null
          is_present: boolean | null
          market_health_score: number | null
          market_size: number | null
          market_strength: string | null
          momentum_score: number | null
          opportunity_score: number | null
          opportunity_tier: string | null
          per_stream_rate: number | null
          platform_fit_bonus: number | null
          platform_to_activate_first: string | null
          platforms_charting: number | null
          position_delta_7d: number | null
          recommended_action: string | null
          song_bonus: number | null
          song_entry_score: number | null
          spillover_bonus: number | null
          spillover_probability: number | null
          spillover_sample_size: number | null
          spillover_source_market: string | null
          stream_pct_change_7d: number | null
          streaming_score: number | null
          urgency: string | null
          velocity: string | null
          velocity_bonus: number | null
          window_confidence: string | null
        }
        Insert: {
          artist_score?: number | null
          artist_total_markets?: number | null
          base_score?: number | null
          best_position?: number | null
          best_velocity_platform?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          discovery_bonus?: number | null
          discovery_divergence?: number | null
          discovery_platform_count?: number | null
          discovery_score?: number | null
          discovery_signal_type?: string | null
          entity_id?: string | null
          entry_song_adjacent_markets?: number | null
          entry_song_entity_id?: string | null
          entry_song_name?: string | null
          entry_song_velocity?: string | null
          estimated_activation_days?: number | null
          estimated_monthly_streams?: number | null
          estimated_revenue_monthly?: number | null
          estimated_weeks_remaining?: number | null
          is_present?: boolean | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          per_stream_rate?: number | null
          platform_fit_bonus?: number | null
          platform_to_activate_first?: string | null
          platforms_charting?: number | null
          position_delta_7d?: number | null
          recommended_action?: string | null
          song_bonus?: number | null
          song_entry_score?: number | null
          spillover_bonus?: number | null
          spillover_probability?: number | null
          spillover_sample_size?: number | null
          spillover_source_market?: string | null
          stream_pct_change_7d?: number | null
          streaming_score?: number | null
          urgency?: string | null
          velocity?: string | null
          velocity_bonus?: number | null
          window_confidence?: string | null
        }
        Update: {
          artist_score?: number | null
          artist_total_markets?: number | null
          base_score?: number | null
          best_position?: number | null
          best_velocity_platform?: string | null
          canonical_name?: string | null
          catalog_daily_streams?: number | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          discovery_bonus?: number | null
          discovery_divergence?: number | null
          discovery_platform_count?: number | null
          discovery_score?: number | null
          discovery_signal_type?: string | null
          entity_id?: string | null
          entry_song_adjacent_markets?: number | null
          entry_song_entity_id?: string | null
          entry_song_name?: string | null
          entry_song_velocity?: string | null
          estimated_activation_days?: number | null
          estimated_monthly_streams?: number | null
          estimated_revenue_monthly?: number | null
          estimated_weeks_remaining?: number | null
          is_present?: boolean | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          per_stream_rate?: number | null
          platform_fit_bonus?: number | null
          platform_to_activate_first?: string | null
          platforms_charting?: number | null
          position_delta_7d?: number | null
          recommended_action?: string | null
          song_bonus?: number | null
          song_entry_score?: number | null
          spillover_bonus?: number | null
          spillover_probability?: number | null
          spillover_sample_size?: number | null
          spillover_source_market?: string | null
          stream_pct_change_7d?: number | null
          streaming_score?: number | null
          urgency?: string | null
          velocity?: string | null
          velocity_bonus?: number | null
          window_confidence?: string | null
        }
        Relationships: []
      }
      market_spillover: {
        Row: {
          avg_lag_days: number | null
          confidence_pct: number | null
          date: string | null
          from_country: string | null
          median_lag_days: number | null
          region_cluster: string | null
          sample_size: number | null
          source: string | null
          to_country: string | null
        }
        Insert: {
          avg_lag_days?: number | null
          confidence_pct?: number | null
          date?: string | null
          from_country?: string | null
          median_lag_days?: number | null
          region_cluster?: string | null
          sample_size?: number | null
          source?: string | null
          to_country?: string | null
        }
        Update: {
          avg_lag_days?: number | null
          confidence_pct?: number | null
          date?: string | null
          from_country?: string | null
          median_lag_days?: number | null
          region_cluster?: string | null
          sample_size?: number | null
          source?: string | null
          to_country?: string | null
        }
        Relationships: []
      }
      market_velocity: {
        Row: {
          best_velocity_platform: string | null
          canonical_name: string | null
          country_code: string | null
          date: string | null
          days_trending: number | null
          entity_id: string | null
          position_delta_7d: number | null
          stream_pct_change_7d: number | null
          velocity: string | null
        }
        Insert: {
          best_velocity_platform?: string | null
          canonical_name?: string | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          entity_id?: string | null
          position_delta_7d?: number | null
          stream_pct_change_7d?: number | null
          velocity?: string | null
        }
        Update: {
          best_velocity_platform?: string | null
          canonical_name?: string | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          entity_id?: string | null
          position_delta_7d?: number | null
          stream_pct_change_7d?: number | null
          velocity?: string | null
        }
        Relationships: []
      }
      media_assets_gif_thumbnail: {
        Row: {
          asset_type: string | null
          created_at: string
          id: number
          storage_id: string | null
          storage_path: string | null
          thumbnail_url: string | null
          url: string | null
          video_id: number | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          url?: string | null
          video_id?: number | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          url?: string | null
          video_id?: number | null
        }
        Relationships: []
      }
      media_assets_instagram_reels: {
        Row: {
          asset_type: string | null
          created_at: string
          id: number
          media_duration: number | null
          storage_id: string | null
          storage_path: string | null
          url: string | null
          video_id: number | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          id?: number
          media_duration?: number | null
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          id?: number
          media_duration?: number | null
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      niche_scrape_results: {
        Row: {
          analysis_status: string | null
          analyzed_at: string | null
          artist_handle: string
          author_id: string | null
          author_nickname: string | null
          collect_count: number | null
          created_at: string | null
          follower_count: number | null
          id: number
          is_author_artist: boolean | null
          music_author: string | null
          play_count: number | null
          scrape_category: string | null
          scrape_query: string | null
          video_desc: string | null
          video_url: string
        }
        Insert: {
          analysis_status?: string | null
          analyzed_at?: string | null
          artist_handle: string
          author_id?: string | null
          author_nickname?: string | null
          collect_count?: number | null
          created_at?: string | null
          follower_count?: number | null
          id?: never
          is_author_artist?: boolean | null
          music_author?: string | null
          play_count?: number | null
          scrape_category?: string | null
          scrape_query?: string | null
          video_desc?: string | null
          video_url: string
        }
        Update: {
          analysis_status?: string | null
          analyzed_at?: string | null
          artist_handle?: string
          author_id?: string | null
          author_nickname?: string | null
          collect_count?: number | null
          created_at?: string | null
          follower_count?: number | null
          id?: never
          is_author_artist?: boolean | null
          music_author?: string | null
          play_count?: number | null
          scrape_category?: string | null
          scrape_query?: string | null
          video_desc?: string | null
          video_url?: string
        }
        Relationships: []
      }
      oembed_cache: {
        Row: {
          author_name: string | null
          embed_html: string | null
          thumbnail_url: string | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          author_name?: string | null
          embed_html?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          author_name?: string | null
          embed_html?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      onboarding_snapshots: {
        Row: {
          artist_handle: string
          avg_engagement_rate: number | null
          avg_views: number | null
          created_at: string
          id: string
          instagram_followers: number | null
          median_views: number | null
          monthly_listeners: number | null
          posting_frequency_days: number | null
          snapshot_date: string
          spotify_followers: number | null
          spotify_popularity: number | null
          tiktok_followers: number | null
          total_streams: number | null
          video_count: number | null
        }
        Insert: {
          artist_handle: string
          avg_engagement_rate?: number | null
          avg_views?: number | null
          created_at?: string
          id?: string
          instagram_followers?: number | null
          median_views?: number | null
          monthly_listeners?: number | null
          posting_frequency_days?: number | null
          snapshot_date?: string
          spotify_followers?: number | null
          spotify_popularity?: number | null
          tiktok_followers?: number | null
          total_streams?: number | null
          video_count?: number | null
        }
        Update: {
          artist_handle?: string
          avg_engagement_rate?: number | null
          avg_views?: number | null
          created_at?: string
          id?: string
          instagram_followers?: number | null
          median_views?: number | null
          monthly_listeners?: number | null
          posting_frequency_days?: number | null
          snapshot_date?: string
          spotify_followers?: number | null
          spotify_popularity?: number | null
          tiktok_followers?: number | null
          total_streams?: number | null
          video_count?: number | null
        }
        Relationships: []
      }
      ops_agent_memory: {
        Row: {
          created_at: string | null
          id: number
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: never
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      pipeline_cost_log: {
        Row: {
          apify_calls: number | null
          apify_credits_usd: number | null
          created_at: string | null
          execution_id: string | null
          gemini_calls: number | null
          gemini_model: string | null
          hitl_row_id: number | null
          id: number
          items_discarded: number | null
          items_passed: number | null
          items_scraped: number | null
          notes: string | null
          storage_uploads: number | null
          workflow: string
        }
        Insert: {
          apify_calls?: number | null
          apify_credits_usd?: number | null
          created_at?: string | null
          execution_id?: string | null
          gemini_calls?: number | null
          gemini_model?: string | null
          hitl_row_id?: number | null
          id?: never
          items_discarded?: number | null
          items_passed?: number | null
          items_scraped?: number | null
          notes?: string | null
          storage_uploads?: number | null
          workflow: string
        }
        Update: {
          apify_calls?: number | null
          apify_credits_usd?: number | null
          created_at?: string | null
          execution_id?: string | null
          gemini_calls?: number | null
          gemini_model?: string | null
          hitl_row_id?: number | null
          id?: never
          items_discarded?: number | null
          items_passed?: number | null
          items_scraped?: number | null
          notes?: string | null
          storage_uploads?: number | null
          workflow?: string
        }
        Relationships: []
      }
      plan_reviews: {
        Row: {
          artist_handle: string
          created_at: string | null
          id: string
          label_id: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          week_of: string
        }
        Insert: {
          artist_handle: string
          created_at?: string | null
          id?: string
          label_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          week_of?: string
        }
        Update: {
          artist_handle?: string
          created_at?: string | null
          id?: string
          label_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_reviews_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_coverage: {
        Row: {
          canonical_name: string | null
          coverage_score: number | null
          date: string | null
          entity_id: string | null
          entity_type: string | null
          has_apple_music: boolean | null
          has_deezer: boolean | null
          has_facebook: boolean | null
          has_genius: boolean | null
          has_instagram: boolean | null
          has_isrc: boolean | null
          has_lastfm: boolean | null
          has_musicbrainz: boolean | null
          has_soundcloud: boolean | null
          has_spotify: boolean | null
          has_ticketmaster: boolean | null
          has_tiktok: boolean | null
          has_twitter: boolean | null
          has_youtube: boolean | null
          missing_platforms: string[] | null
          total_platforms: number | null
        }
        Insert: {
          canonical_name?: string | null
          coverage_score?: number | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          has_apple_music?: boolean | null
          has_deezer?: boolean | null
          has_facebook?: boolean | null
          has_genius?: boolean | null
          has_instagram?: boolean | null
          has_isrc?: boolean | null
          has_lastfm?: boolean | null
          has_musicbrainz?: boolean | null
          has_soundcloud?: boolean | null
          has_spotify?: boolean | null
          has_ticketmaster?: boolean | null
          has_tiktok?: boolean | null
          has_twitter?: boolean | null
          has_youtube?: boolean | null
          missing_platforms?: string[] | null
          total_platforms?: number | null
        }
        Update: {
          canonical_name?: string | null
          coverage_score?: number | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          has_apple_music?: boolean | null
          has_deezer?: boolean | null
          has_facebook?: boolean | null
          has_genius?: boolean | null
          has_instagram?: boolean | null
          has_isrc?: boolean | null
          has_lastfm?: boolean | null
          has_musicbrainz?: boolean | null
          has_soundcloud?: boolean | null
          has_spotify?: boolean | null
          has_ticketmaster?: boolean | null
          has_tiktok?: boolean | null
          has_twitter?: boolean | null
          has_youtube?: boolean | null
          missing_platforms?: string[] | null
          total_platforms?: number | null
        }
        Relationships: []
      }
      playlist_momentum: {
        Row: {
          active_playlist_count: number | null
          artist_entity_id: string | null
          artist_name: string | null
          avg_position: number | null
          best_playlist_followers: number | null
          best_playlist_name: string | null
          best_position: number | null
          date: string | null
          entity_id: string | null
          reach_tier: string | null
          song_name: string | null
          total_reach: number | null
        }
        Insert: {
          active_playlist_count?: number | null
          artist_entity_id?: string | null
          artist_name?: string | null
          avg_position?: number | null
          best_playlist_followers?: number | null
          best_playlist_name?: string | null
          best_position?: number | null
          date?: string | null
          entity_id?: string | null
          reach_tier?: string | null
          song_name?: string | null
          total_reach?: number | null
        }
        Update: {
          active_playlist_count?: number | null
          artist_entity_id?: string | null
          artist_name?: string | null
          avg_position?: number | null
          best_playlist_followers?: number | null
          best_playlist_name?: string | null
          best_position?: number | null
          date?: string | null
          entity_id?: string | null
          reach_tier?: string | null
          song_name?: string | null
          total_reach?: number | null
        }
        Relationships: []
      }
      pre_release_subscribers: {
        Row: {
          artist_name: string
          email: string
          id: string
          notified_at: string | null
          processed: boolean
          profile_id: string | null
          song_title: string | null
          subscribed_at: string
        }
        Insert: {
          artist_name: string
          email: string
          id?: string
          notified_at?: string | null
          processed?: boolean
          profile_id?: string | null
          song_title?: string | null
          subscribed_at?: string
        }
        Update: {
          artist_name?: string
          email?: string
          id?: string
          notified_at?: string | null
          processed?: boolean
          profile_id?: string | null
          song_title?: string | null
          subscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_release_subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      president_briefs: {
        Row: {
          brief_date: string
          brief_json: Json | null
          brief_text: string
          generated_at: string | null
          id: string
          input_summary: Json | null
          label_id: string
          role: string
        }
        Insert: {
          brief_date?: string
          brief_json?: Json | null
          brief_text: string
          generated_at?: string | null
          id?: string
          input_summary?: Json | null
          label_id: string
          role?: string
        }
        Update: {
          brief_date?: string
          brief_json?: Json | null
          brief_text?: string
          generated_at?: string | null
          id?: string
          input_summary?: Json | null
          label_id?: string
          role?: string
        }
        Relationships: []
      }
      rag_content: {
        Row: {
          content: string
          date_posted: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json
          performance_multiplier: number | null
          views: number | null
          viral_score: number | null
        }
        Insert: {
          content: string
          date_posted?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata: Json
          performance_multiplier?: number | null
          views?: number | null
          viral_score?: number | null
        }
        Update: {
          content?: string
          date_posted?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata?: Json
          performance_multiplier?: number | null
          views?: number | null
          viral_score?: number | null
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          id: string
          referral_id: string
          referred_user_id: string
          reward_granted: boolean
          reward_granted_at: string | null
          signed_up_at: string
        }
        Insert: {
          id?: string
          referral_id: string
          referred_user_id: string
          reward_granted?: boolean
          reward_granted_at?: string | null
          signed_up_at?: string
        }
        Update: {
          id?: string
          referral_id?: string
          referred_user_id?: string
          reward_granted?: boolean
          reward_granted_at?: string | null
          signed_up_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_signups_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referrer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referrer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referrer_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roster_dashboard_metrics: {
        Row: {
          artist_handle: string
          artist_name: string | null
          avatar_url: string | null
          avg_engagement_30d: number | null
          avg_engagement_7d: number | null
          avg_saves_30d: number | null
          avg_views_30d: number | null
          avg_views_7d: number | null
          computed_at: string
          created_at: string
          days_since_last_post: number | null
          days_since_release: number | null
          delta_avg_views_pct: number | null
          delta_engagement_pct: number | null
          delta_followers_pct: number | null
          delta_posting_freq_pct: number | null
          has_30day_plan: boolean
          has_baseline: boolean
          has_content_plan: boolean
          has_intelligence_report: boolean
          id: string
          instagram_followers: number | null
          label_id: string | null
          label_name: string | null
          last_post_date: string | null
          latest_release_date: string | null
          latest_release_name: string | null
          median_views_baseline: number | null
          momentum_tier: string
          monthly_listeners: number | null
          performance_ratio_30d: number | null
          performance_ratio_7d: number | null
          performance_ratio_current: number | null
          pipeline_status: string | null
          posting_freq_30d: number | null
          posting_freq_7d: number | null
          release_readiness_factors: Json | null
          release_readiness_score: number | null
          risk_flags: Json
          risk_level: string
          spotify_followers: number | null
          tiktok_followers: number | null
          total_videos: number | null
          updated_at: string
          velocity_engagement_pct: number | null
          velocity_posting_freq_pct: number | null
          velocity_views_pct: number | null
        }
        Insert: {
          artist_handle: string
          artist_name?: string | null
          avatar_url?: string | null
          avg_engagement_30d?: number | null
          avg_engagement_7d?: number | null
          avg_saves_30d?: number | null
          avg_views_30d?: number | null
          avg_views_7d?: number | null
          computed_at?: string
          created_at?: string
          days_since_last_post?: number | null
          days_since_release?: number | null
          delta_avg_views_pct?: number | null
          delta_engagement_pct?: number | null
          delta_followers_pct?: number | null
          delta_posting_freq_pct?: number | null
          has_30day_plan?: boolean
          has_baseline?: boolean
          has_content_plan?: boolean
          has_intelligence_report?: boolean
          id?: string
          instagram_followers?: number | null
          label_id?: string | null
          label_name?: string | null
          last_post_date?: string | null
          latest_release_date?: string | null
          latest_release_name?: string | null
          median_views_baseline?: number | null
          momentum_tier?: string
          monthly_listeners?: number | null
          performance_ratio_30d?: number | null
          performance_ratio_7d?: number | null
          performance_ratio_current?: number | null
          pipeline_status?: string | null
          posting_freq_30d?: number | null
          posting_freq_7d?: number | null
          release_readiness_factors?: Json | null
          release_readiness_score?: number | null
          risk_flags?: Json
          risk_level?: string
          spotify_followers?: number | null
          tiktok_followers?: number | null
          total_videos?: number | null
          updated_at?: string
          velocity_engagement_pct?: number | null
          velocity_posting_freq_pct?: number | null
          velocity_views_pct?: number | null
        }
        Update: {
          artist_handle?: string
          artist_name?: string | null
          avatar_url?: string | null
          avg_engagement_30d?: number | null
          avg_engagement_7d?: number | null
          avg_saves_30d?: number | null
          avg_views_30d?: number | null
          avg_views_7d?: number | null
          computed_at?: string
          created_at?: string
          days_since_last_post?: number | null
          days_since_release?: number | null
          delta_avg_views_pct?: number | null
          delta_engagement_pct?: number | null
          delta_followers_pct?: number | null
          delta_posting_freq_pct?: number | null
          has_30day_plan?: boolean
          has_baseline?: boolean
          has_content_plan?: boolean
          has_intelligence_report?: boolean
          id?: string
          instagram_followers?: number | null
          label_id?: string | null
          label_name?: string | null
          last_post_date?: string | null
          latest_release_date?: string | null
          latest_release_name?: string | null
          median_views_baseline?: number | null
          momentum_tier?: string
          monthly_listeners?: number | null
          performance_ratio_30d?: number | null
          performance_ratio_7d?: number | null
          performance_ratio_current?: number | null
          pipeline_status?: string | null
          posting_freq_30d?: number | null
          posting_freq_7d?: number | null
          release_readiness_factors?: Json | null
          release_readiness_score?: number | null
          risk_flags?: Json
          risk_level?: string
          spotify_followers?: number | null
          tiktok_followers?: number | null
          total_videos?: number | null
          updated_at?: string
          velocity_engagement_pct?: number | null
          velocity_posting_freq_pct?: number | null
          velocity_views_pct?: number | null
        }
        Relationships: []
      }
      roster_expansion_intelligence: {
        Row: {
          artist_score: number | null
          audience_signal_score: number | null
          audience_vibe: string | null
          base_score: number | null
          best_position: number | null
          best_velocity_platform: string | null
          canonical_name: string | null
          comment_sentiment_score: number | null
          country_code: string | null
          date: string | null
          days_trending: number | null
          discovery_bonus: number | null
          discovery_divergence: number | null
          discovery_score: number | null
          discovery_signal_type: string | null
          dominant_platform: string | null
          enriched_opportunity_score: number | null
          enriched_tier: string | null
          enriched_urgency: string | null
          entity_id: string | null
          entry_song_adjacent_markets: number | null
          entry_song_entity_id: string | null
          entry_song_name: string | null
          entry_song_velocity: string | null
          estimated_activation_days: number | null
          estimated_monthly_streams: number | null
          estimated_revenue_monthly: number | null
          estimated_weeks_remaining: number | null
          fan_energy: number | null
          fan_intensity_score: number | null
          fastest_growing_platform: string | null
          is_present: boolean | null
          language_country_pct: number | null
          language_signal_score: number | null
          market_health_score: number | null
          market_size: number | null
          market_strength: string | null
          momentum_score: number | null
          opportunity_score: number | null
          opportunity_tier: string | null
          per_stream_rate: number | null
          platform_fit_bonus: number | null
          platform_readiness_score: number | null
          platform_to_activate_first: string | null
          platforms_charting: number | null
          playlist_penetration_score: number | null
          playlist_reach_tier: string | null
          position_delta_7d: number | null
          recommended_action: string | null
          signal_convergence_count: number | null
          song_bonus: number | null
          song_entry_score: number | null
          spillover_bonus: number | null
          spillover_probability: number | null
          spillover_sample_size: number | null
          spillover_source_market: string | null
          stream_pct_change_7d: number | null
          streaming_score: number | null
          tiktok_audience_pct: number | null
          top_languages: string[] | null
          total_upcoming_events: number | null
          touring_alignment_score: number | null
          touring_status: string | null
          urgency: string | null
          velocity: string | null
          velocity_bonus: number | null
          window_confidence: string | null
        }
        Insert: {
          artist_score?: number | null
          audience_signal_score?: number | null
          audience_vibe?: string | null
          base_score?: number | null
          best_position?: number | null
          best_velocity_platform?: string | null
          canonical_name?: string | null
          comment_sentiment_score?: number | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          discovery_bonus?: number | null
          discovery_divergence?: number | null
          discovery_score?: number | null
          discovery_signal_type?: string | null
          dominant_platform?: string | null
          enriched_opportunity_score?: number | null
          enriched_tier?: string | null
          enriched_urgency?: string | null
          entity_id?: string | null
          entry_song_adjacent_markets?: number | null
          entry_song_entity_id?: string | null
          entry_song_name?: string | null
          entry_song_velocity?: string | null
          estimated_activation_days?: number | null
          estimated_monthly_streams?: number | null
          estimated_revenue_monthly?: number | null
          estimated_weeks_remaining?: number | null
          fan_energy?: number | null
          fan_intensity_score?: number | null
          fastest_growing_platform?: string | null
          is_present?: boolean | null
          language_country_pct?: number | null
          language_signal_score?: number | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          per_stream_rate?: number | null
          platform_fit_bonus?: number | null
          platform_readiness_score?: number | null
          platform_to_activate_first?: string | null
          platforms_charting?: number | null
          playlist_penetration_score?: number | null
          playlist_reach_tier?: string | null
          position_delta_7d?: number | null
          recommended_action?: string | null
          signal_convergence_count?: number | null
          song_bonus?: number | null
          song_entry_score?: number | null
          spillover_bonus?: number | null
          spillover_probability?: number | null
          spillover_sample_size?: number | null
          spillover_source_market?: string | null
          stream_pct_change_7d?: number | null
          streaming_score?: number | null
          tiktok_audience_pct?: number | null
          top_languages?: string[] | null
          total_upcoming_events?: number | null
          touring_alignment_score?: number | null
          touring_status?: string | null
          urgency?: string | null
          velocity?: string | null
          velocity_bonus?: number | null
          window_confidence?: string | null
        }
        Update: {
          artist_score?: number | null
          audience_signal_score?: number | null
          audience_vibe?: string | null
          base_score?: number | null
          best_position?: number | null
          best_velocity_platform?: string | null
          canonical_name?: string | null
          comment_sentiment_score?: number | null
          country_code?: string | null
          date?: string | null
          days_trending?: number | null
          discovery_bonus?: number | null
          discovery_divergence?: number | null
          discovery_score?: number | null
          discovery_signal_type?: string | null
          dominant_platform?: string | null
          enriched_opportunity_score?: number | null
          enriched_tier?: string | null
          enriched_urgency?: string | null
          entity_id?: string | null
          entry_song_adjacent_markets?: number | null
          entry_song_entity_id?: string | null
          entry_song_name?: string | null
          entry_song_velocity?: string | null
          estimated_activation_days?: number | null
          estimated_monthly_streams?: number | null
          estimated_revenue_monthly?: number | null
          estimated_weeks_remaining?: number | null
          fan_energy?: number | null
          fan_intensity_score?: number | null
          fastest_growing_platform?: string | null
          is_present?: boolean | null
          language_country_pct?: number | null
          language_signal_score?: number | null
          market_health_score?: number | null
          market_size?: number | null
          market_strength?: string | null
          momentum_score?: number | null
          opportunity_score?: number | null
          opportunity_tier?: string | null
          per_stream_rate?: number | null
          platform_fit_bonus?: number | null
          platform_readiness_score?: number | null
          platform_to_activate_first?: string | null
          platforms_charting?: number | null
          playlist_penetration_score?: number | null
          playlist_reach_tier?: string | null
          position_delta_7d?: number | null
          recommended_action?: string | null
          signal_convergence_count?: number | null
          song_bonus?: number | null
          song_entry_score?: number | null
          spillover_bonus?: number | null
          spillover_probability?: number | null
          spillover_sample_size?: number | null
          spillover_source_market?: string | null
          stream_pct_change_7d?: number | null
          streaming_score?: number | null
          tiktok_audience_pct?: number | null
          top_languages?: string[] | null
          total_upcoming_events?: number | null
          touring_alignment_score?: number | null
          touring_status?: string | null
          urgency?: string | null
          velocity?: string | null
          velocity_bonus?: number | null
          window_confidence?: string | null
        }
        Relationships: []
      }
      roster_overview: {
        Row: {
          artists_breaking_out: number | null
          artists_developing: number | null
          artists_elite: number | null
          artists_emerging: number | null
          artists_falling: number | null
          artists_new: number | null
          artists_rising: number | null
          artists_rising_fast: number | null
          artists_stable: number | null
          artists_strong: number | null
          avg_artist_score: number | null
          avg_coverage_score: number | null
          avg_markets: number | null
          avg_roster_growth_7d: number | null
          best_global_rank: number | null
          best_ranked_artist: string | null
          date: string | null
          fastest_growing_artist: string | null
          fastest_growing_pct: number | null
          label_id: string | null
          label_name: string | null
          median_artist_score: number | null
          sounds_analyzed: number | null
          sounds_monitored: number | null
          top_artist_name: string | null
          top_artist_score: number | null
          total_artists: number | null
          total_hot_songs: number | null
          total_roster_daily_streams: number | null
          total_viral_songs: number | null
          unread_sound_alerts: number | null
          weakest_artist_name: string | null
          weakest_artist_score: number | null
        }
        Insert: {
          artists_breaking_out?: number | null
          artists_developing?: number | null
          artists_elite?: number | null
          artists_emerging?: number | null
          artists_falling?: number | null
          artists_new?: number | null
          artists_rising?: number | null
          artists_rising_fast?: number | null
          artists_stable?: number | null
          artists_strong?: number | null
          avg_artist_score?: number | null
          avg_coverage_score?: number | null
          avg_markets?: number | null
          avg_roster_growth_7d?: number | null
          best_global_rank?: number | null
          best_ranked_artist?: string | null
          date?: string | null
          fastest_growing_artist?: string | null
          fastest_growing_pct?: number | null
          label_id?: string | null
          label_name?: string | null
          median_artist_score?: number | null
          sounds_analyzed?: number | null
          sounds_monitored?: number | null
          top_artist_name?: string | null
          top_artist_score?: number | null
          total_artists?: number | null
          total_hot_songs?: number | null
          total_roster_daily_streams?: number | null
          total_viral_songs?: number | null
          unread_sound_alerts?: number | null
          weakest_artist_name?: string | null
          weakest_artist_score?: number | null
        }
        Update: {
          artists_breaking_out?: number | null
          artists_developing?: number | null
          artists_elite?: number | null
          artists_emerging?: number | null
          artists_falling?: number | null
          artists_new?: number | null
          artists_rising?: number | null
          artists_rising_fast?: number | null
          artists_stable?: number | null
          artists_strong?: number | null
          avg_artist_score?: number | null
          avg_coverage_score?: number | null
          avg_markets?: number | null
          avg_roster_growth_7d?: number | null
          best_global_rank?: number | null
          best_ranked_artist?: string | null
          date?: string | null
          fastest_growing_artist?: string | null
          fastest_growing_pct?: number | null
          label_id?: string | null
          label_name?: string | null
          median_artist_score?: number | null
          sounds_analyzed?: number | null
          sounds_monitored?: number | null
          top_artist_name?: string | null
          top_artist_score?: number | null
          total_artists?: number | null
          total_hot_songs?: number | null
          total_roster_daily_streams?: number | null
          total_viral_songs?: number | null
          unread_sound_alerts?: number | null
          weakest_artist_name?: string | null
          weakest_artist_score?: number | null
        }
        Relationships: []
      }
      saved_profile_analyses: {
        Row: {
          handle: string | null
          id: string
          job_id: number
          saved_at: string | null
          user_id: string
        }
        Insert: {
          handle?: string | null
          id?: string
          job_id: number
          saved_at?: string | null
          user_id: string
        }
        Update: {
          handle?: string | null
          id?: string
          job_id?: number
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "Analysis Profile 2 - analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_cache: {
        Row: {
          created_at: string | null
          data_type: string
          fetched_at: string | null
          handle: string
          id: string
          platform: string
          response_json: Json
        }
        Insert: {
          created_at?: string | null
          data_type: string
          fetched_at?: string | null
          handle: string
          id?: string
          platform: string
          response_json: Json
        }
        Update: {
          created_at?: string | null
          data_type?: string
          fetched_at?: string | null
          handle?: string
          id?: string
          platform?: string
          response_json?: Json
        }
        Relationships: []
      }
      scraped_tiktok_videos: {
        Row: {
          ai_confidence: number | null
          ai_decision: string | null
          ai_reasoning: string | null
          author_avatar_url: string | null
          author_bio: string | null
          author_followers: number | null
          author_id: string | null
          author_nickname: string | null
          author_unique_id: string | null
          author_verified: boolean | null
          caption: string | null
          collect_count: number | null
          comment_count: number | null
          created_at: string
          creator_avg_views: number | null
          creator_median_views: number | null
          date_posted: string | null
          duration_seconds: number | null
          hashtags: string[] | null
          hitl_row_id: number | null
          id: number
          is_ad: boolean | null
          is_author_artist: boolean | null
          is_own_sound: boolean | null
          language: string | null
          like_count: number | null
          location_created: string | null
          music_author: string | null
          music_id: string | null
          music_name: string | null
          performance_multiplier: string | null
          pipeline_status: string
          play_count: number | null
          share_count: number | null
          share_url: string
          tiktok_video_id: string
          updated_at: string
          video_cover_url: string | null
          video_download_url: string | null
          viral_score: number | null
          web_url: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_decision?: string | null
          ai_reasoning?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          created_at?: string
          creator_avg_views?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          hashtags?: string[] | null
          hitl_row_id?: number | null
          id?: never
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          is_own_sound?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          pipeline_status?: string
          play_count?: number | null
          share_count?: number | null
          share_url: string
          tiktok_video_id: string
          updated_at?: string
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          web_url?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_decision?: string | null
          ai_reasoning?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          created_at?: string
          creator_avg_views?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          hashtags?: string[] | null
          hitl_row_id?: number | null
          id?: never
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          is_own_sound?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          pipeline_status?: string
          play_count?: number | null
          share_count?: number | null
          share_url?: string
          tiktok_video_id?: string
          updated_at?: string
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          web_url?: string | null
        }
        Relationships: []
      }
      scraper_runs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          entities_created: number | null
          entities_matched: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          rows_inserted: number | null
          scraper_group: string
          scraper_name: string
          started_at: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          entities_created?: number | null
          entities_matched?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          rows_inserted?: number | null
          scraper_group: string
          scraper_name: string
          started_at?: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          entities_created?: number | null
          entities_matched?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          rows_inserted?: number | null
          scraper_group?: string
          scraper_name?: string
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      session_ideas: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          idea_id: string
          session_id: string
          title: string
          video_data: Json | null
          video_embed_id: string | null
          why_it_works: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          idea_id: string
          session_id: string
          title: string
          video_data?: Json | null
          video_embed_id?: string | null
          why_it_works?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          idea_id?: string
          session_id?: string
          title?: string
          video_data?: Json | null
          video_embed_id?: string | null
          why_it_works?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_ideas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_content_plans: {
        Row: {
          created_at: string
          id: string
          plan_data: Json
          plan_id: string
          plan_name: string
          share_id: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          plan_data: Json
          plan_id: string
          plan_name: string
          share_id: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          plan_data?: Json
          plan_id?: string
          plan_name?: string
          share_id?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workspace_notes: {
        Row: {
          created_at: string
          id: string
          notes_content: string
          share_id: string
          title: string | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes_content: string
          share_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes_content?: string
          share_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      shazam_daily_snapshots: {
        Row: {
          chart_position: number | null
          country_code: string | null
          created_at: string
          id: number
          job_id: string
          raw_response: Json | null
          shazam_count: number | null
          shazam_delta: number | null
          snapshot_date: string
        }
        Insert: {
          chart_position?: number | null
          country_code?: string | null
          created_at?: string
          id?: never
          job_id: string
          raw_response?: Json | null
          shazam_count?: number | null
          shazam_delta?: number | null
          snapshot_date?: string
        }
        Update: {
          chart_position?: number | null
          country_code?: string | null
          created_at?: string
          id?: never
          job_id?: string
          raw_response?: Json | null
          shazam_count?: number | null
          shazam_delta?: number | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "shazam_daily_snapshots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_report_todo_state: {
        Row: {
          brief_date: string
          checked_at: string
          id: string
          label_id: string
          todo_key: string
          todo_snapshot: Json
          user_id: string
        }
        Insert: {
          brief_date: string
          checked_at?: string
          id?: string
          label_id: string
          todo_key: string
          todo_snapshot: Json
          user_id: string
        }
        Update: {
          brief_date?: string
          checked_at?: string
          id?: string
          label_id?: string
          todo_key?: string
          todo_snapshot?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_report_todo_state_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_scenarios: {
        Row: {
          artist_name: string
          created_at: string
          created_by: string | null
          deal_type: string
          id: string
          label_id: string | null
          notes: string | null
          preset_id: string | null
          prospect_id: string | null
          result_summary: Json
          scenario_config: Json
          sensitivity_data: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          artist_name: string
          created_at?: string
          created_by?: string | null
          deal_type: string
          id?: string
          label_id?: string | null
          notes?: string | null
          preset_id?: string | null
          prospect_id?: string | null
          result_summary: Json
          scenario_config: Json
          sensitivity_data?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          artist_name?: string
          created_at?: string
          created_by?: string | null
          deal_type?: string
          id?: string
          label_id?: string | null
          notes?: string | null
          preset_id?: string | null
          prospect_id?: string | null
          result_summary?: Json
          scenario_config?: Json
          sensitivity_data?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_scenarios_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_scenarios_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "ar_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      song_health: {
        Row: {
          apple_best_position: number | null
          apple_chart_points: number | null
          best_chart_position: number | null
          canonical_name: string | null
          countries_charting: number | null
          daily_streams: number | null
          date: string | null
          entity_id: string | null
          entity_type: string | null
          health_score: number | null
          itunes_best_position: number | null
          radio_audience: number | null
          radio_formats: number | null
          radio_position: number | null
          total_streams: number | null
          youtube_daily_views: number | null
          youtube_total_views: number | null
        }
        Insert: {
          apple_best_position?: number | null
          apple_chart_points?: number | null
          best_chart_position?: number | null
          canonical_name?: string | null
          countries_charting?: number | null
          daily_streams?: number | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          health_score?: number | null
          itunes_best_position?: number | null
          radio_audience?: number | null
          radio_formats?: number | null
          radio_position?: number | null
          total_streams?: number | null
          youtube_daily_views?: number | null
          youtube_total_views?: number | null
        }
        Update: {
          apple_best_position?: number | null
          apple_chart_points?: number | null
          best_chart_position?: number | null
          canonical_name?: string | null
          countries_charting?: number | null
          daily_streams?: number | null
          date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          health_score?: number | null
          itunes_best_position?: number | null
          radio_audience?: number | null
          radio_formats?: number | null
          radio_position?: number | null
          total_streams?: number | null
          youtube_daily_views?: number | null
          youtube_total_views?: number | null
        }
        Relationships: []
      }
      song_market_matrix: {
        Row: {
          active_playlist_count: number | null
          adjacent_market_count: number | null
          artist_entity_id: string | null
          artist_name: string | null
          best_position: number | null
          chart_streams: number | null
          country_code: string | null
          date: string | null
          entry_score: number | null
          global_daily_streams: number | null
          global_pct_change_7d: number | null
          platforms: string[] | null
          platforms_charting: number | null
          playlist_reach: number | null
          position_delta_7d: number | null
          rank_for_market: number | null
          reach_tier: string | null
          song_entity_id: string | null
          song_name: string | null
          total_markets: number | null
          velocity_class: string | null
        }
        Insert: {
          active_playlist_count?: number | null
          adjacent_market_count?: number | null
          artist_entity_id?: string | null
          artist_name?: string | null
          best_position?: number | null
          chart_streams?: number | null
          country_code?: string | null
          date?: string | null
          entry_score?: number | null
          global_daily_streams?: number | null
          global_pct_change_7d?: number | null
          platforms?: string[] | null
          platforms_charting?: number | null
          playlist_reach?: number | null
          position_delta_7d?: number | null
          rank_for_market?: number | null
          reach_tier?: string | null
          song_entity_id?: string | null
          song_name?: string | null
          total_markets?: number | null
          velocity_class?: string | null
        }
        Update: {
          active_playlist_count?: number | null
          adjacent_market_count?: number | null
          artist_entity_id?: string | null
          artist_name?: string | null
          best_position?: number | null
          chart_streams?: number | null
          country_code?: string | null
          date?: string | null
          entry_score?: number | null
          global_daily_streams?: number | null
          global_pct_change_7d?: number | null
          platforms?: string[] | null
          platforms_charting?: number | null
          playlist_reach?: number | null
          position_delta_7d?: number | null
          rank_for_market?: number | null
          reach_tier?: string | null
          song_entity_id?: string | null
          song_name?: string | null
          total_markets?: number | null
          velocity_class?: string | null
        }
        Relationships: []
      }
      song_velocity: {
        Row: {
          artist_entity_id: string | null
          artist_name: string | null
          daily_streams: number | null
          date: string | null
          delta_1d: number | null
          delta_7d: number | null
          entity_id: string | null
          pct_change_7d: number | null
          peak_daily_streams: number | null
          peak_ratio: number | null
          rank_by_growth: number | null
          rank_by_streams: number | null
          song_name: string | null
          total_streams: number | null
          velocity_class: string | null
          z_score: number | null
        }
        Insert: {
          artist_entity_id?: string | null
          artist_name?: string | null
          daily_streams?: number | null
          date?: string | null
          delta_1d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          pct_change_7d?: number | null
          peak_daily_streams?: number | null
          peak_ratio?: number | null
          rank_by_growth?: number | null
          rank_by_streams?: number | null
          song_name?: string | null
          total_streams?: number | null
          velocity_class?: string | null
          z_score?: number | null
        }
        Update: {
          artist_entity_id?: string | null
          artist_name?: string | null
          daily_streams?: number | null
          date?: string | null
          delta_1d?: number | null
          delta_7d?: number | null
          entity_id?: string | null
          pct_change_7d?: number | null
          peak_daily_streams?: number | null
          peak_ratio?: number | null
          rank_by_growth?: number | null
          rank_by_streams?: number | null
          song_name?: string | null
          total_streams?: number | null
          velocity_class?: string | null
          z_score?: number | null
        }
        Relationships: []
      }
      sound_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          job_id: string
          label_id: string | null
          message: string | null
          push_sent: boolean | null
          push_sent_at: string | null
          severity: string | null
          sound_id: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          job_id: string
          label_id?: string | null
          message?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          severity?: string | null
          sound_id?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          job_id?: string
          label_id?: string | null
          message?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          severity?: string | null
          sound_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_alerts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_intelligence_jobs: {
        Row: {
          ai_summary: string | null
          ai_summary_updated_at: string | null
          album_name: string | null
          artist_handle: string | null
          artist_name: string | null
          chorus_duration_ms: number | null
          chorus_start_ms: number | null
          completed_at: string | null
          cost_log: Json | null
          cover_url: string | null
          created_at: string
          error_log: Json | null
          id: string
          intensive_since: string | null
          isrc: string | null
          label_id: string | null
          last_monitored_at: string | null
          last_refresh_at: string | null
          monitoring_interval: string | null
          refresh_count: number | null
          requested_by: string | null
          sound_id: string | null
          sound_url: string
          source: string
          spike_decline_count: number | null
          spike_format: string | null
          spotify_id: string | null
          spotify_track_id: string | null
          status: string
          track_name: string | null
          tracking_expires_at: string | null
          updated_at: string
          user_count: number | null
          videos_analyzed: number | null
          videos_scraped: number | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          album_name?: string | null
          artist_handle?: string | null
          artist_name?: string | null
          chorus_duration_ms?: number | null
          chorus_start_ms?: number | null
          completed_at?: string | null
          cost_log?: Json | null
          cover_url?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          intensive_since?: string | null
          isrc?: string | null
          label_id?: string | null
          last_monitored_at?: string | null
          last_refresh_at?: string | null
          monitoring_interval?: string | null
          refresh_count?: number | null
          requested_by?: string | null
          sound_id?: string | null
          sound_url: string
          source?: string
          spike_decline_count?: number | null
          spike_format?: string | null
          spotify_id?: string | null
          spotify_track_id?: string | null
          status?: string
          track_name?: string | null
          tracking_expires_at?: string | null
          updated_at?: string
          user_count?: number | null
          videos_analyzed?: number | null
          videos_scraped?: number | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_updated_at?: string | null
          album_name?: string | null
          artist_handle?: string | null
          artist_name?: string | null
          chorus_duration_ms?: number | null
          chorus_start_ms?: number | null
          completed_at?: string | null
          cost_log?: Json | null
          cover_url?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          intensive_since?: string | null
          isrc?: string | null
          label_id?: string | null
          last_monitored_at?: string | null
          last_refresh_at?: string | null
          monitoring_interval?: string | null
          refresh_count?: number | null
          requested_by?: string | null
          sound_id?: string | null
          sound_url?: string
          source?: string
          spike_decline_count?: number | null
          spike_format?: string | null
          spotify_id?: string | null
          spotify_track_id?: string | null
          status?: string
          track_name?: string | null
          tracking_expires_at?: string | null
          updated_at?: string
          user_count?: number | null
          videos_analyzed?: number | null
          videos_scraped?: number | null
        }
        Relationships: []
      }
      sound_intelligence_results: {
        Row: {
          analysis: Json
          artist_name: string | null
          created_at: string
          id: string
          job_id: string
          label_id: string | null
          sound_id: string | null
          track_name: string | null
          updated_at: string
        }
        Insert: {
          analysis: Json
          artist_name?: string | null
          created_at?: string
          id?: string
          job_id: string
          label_id?: string | null
          sound_id?: string | null
          track_name?: string | null
          updated_at?: string
        }
        Update: {
          analysis?: Json
          artist_name?: string | null
          created_at?: string
          id?: string
          job_id?: string
          label_id?: string | null
          sound_id?: string | null
          track_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_intelligence_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_intelligence_videos: {
        Row: {
          author_followers: number | null
          author_handle: string | null
          author_nickname: string | null
          author_region: string | null
          author_verified: boolean | null
          aweme_type: number | null
          caption: string | null
          comment_count: number | null
          create_time: string | null
          created_at: string
          creator_profile: string | null
          duration: number | null
          energy_level: string | null
          format_caption: string | null
          format_confidence: number | null
          format_final: string | null
          format_flash: string | null
          format_pro: string | null
          format_signals: string | null
          has_text_overlay: boolean | null
          hashtags: string | null
          hook_analysis: Json | null
          id: number
          intent: string | null
          is_singing: boolean | null
          job_id: string
          like_count: number | null
          music_begin_time_ms: number | null
          music_end_time_ms: number | null
          niche: string | null
          play_count: number | null
          region: string | null
          save_count: number | null
          share_count: number | null
          song_role: string | null
          sound_author: string | null
          sound_id: string | null
          sound_title: string | null
          spark_score: number | null
          thumbnail_url: string | null
          vibe: string | null
          video_download_url: string | null
          video_id: string
          video_url: string | null
          visual_style_tags: Json | null
        }
        Insert: {
          author_followers?: number | null
          author_handle?: string | null
          author_nickname?: string | null
          author_region?: string | null
          author_verified?: boolean | null
          aweme_type?: number | null
          caption?: string | null
          comment_count?: number | null
          create_time?: string | null
          created_at?: string
          creator_profile?: string | null
          duration?: number | null
          energy_level?: string | null
          format_caption?: string | null
          format_confidence?: number | null
          format_final?: string | null
          format_flash?: string | null
          format_pro?: string | null
          format_signals?: string | null
          has_text_overlay?: boolean | null
          hashtags?: string | null
          hook_analysis?: Json | null
          id?: number
          intent?: string | null
          is_singing?: boolean | null
          job_id: string
          like_count?: number | null
          music_begin_time_ms?: number | null
          music_end_time_ms?: number | null
          niche?: string | null
          play_count?: number | null
          region?: string | null
          save_count?: number | null
          share_count?: number | null
          song_role?: string | null
          sound_author?: string | null
          sound_id?: string | null
          sound_title?: string | null
          spark_score?: number | null
          thumbnail_url?: string | null
          vibe?: string | null
          video_download_url?: string | null
          video_id: string
          video_url?: string | null
          visual_style_tags?: Json | null
        }
        Update: {
          author_followers?: number | null
          author_handle?: string | null
          author_nickname?: string | null
          author_region?: string | null
          author_verified?: boolean | null
          aweme_type?: number | null
          caption?: string | null
          comment_count?: number | null
          create_time?: string | null
          created_at?: string
          creator_profile?: string | null
          duration?: number | null
          energy_level?: string | null
          format_caption?: string | null
          format_confidence?: number | null
          format_final?: string | null
          format_flash?: string | null
          format_pro?: string | null
          format_signals?: string | null
          has_text_overlay?: boolean | null
          hashtags?: string | null
          hook_analysis?: Json | null
          id?: number
          intent?: string | null
          is_singing?: boolean | null
          job_id?: string
          like_count?: number | null
          music_begin_time_ms?: number | null
          music_end_time_ms?: number | null
          niche?: string | null
          play_count?: number | null
          region?: string | null
          save_count?: number | null
          share_count?: number | null
          song_role?: string | null
          sound_author?: string | null
          sound_id?: string | null
          sound_title?: string | null
          spark_score?: number | null
          thumbnail_url?: string | null
          vibe?: string | null
          video_download_url?: string | null
          video_id?: string
          video_url?: string | null
          visual_style_tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sound_intelligence_videos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_monitoring_snapshots: {
        Row: {
          captured_at: string
          format_stats: Json
          id: number
          intent_stats: Json | null
          job_id: string
          new_videos_count: number | null
          niche_stats: Json | null
          sound_id: string
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          total_videos: number | null
          total_views: number | null
          user_count: number | null
        }
        Insert: {
          captured_at?: string
          format_stats?: Json
          id?: number
          intent_stats?: Json | null
          job_id: string
          new_videos_count?: number | null
          niche_stats?: Json | null
          sound_id: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_videos?: number | null
          total_views?: number | null
          user_count?: number | null
        }
        Update: {
          captured_at?: string
          format_stats?: Json
          id?: number
          intent_stats?: Json | null
          job_id?: string
          new_videos_count?: number | null
          niche_stats?: Json | null
          sound_id?: string
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          total_videos?: number | null
          total_views?: number | null
          user_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sound_monitoring_snapshots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_scan_reels: {
        Row: {
          caption: string | null
          comments: number | null
          created_at: string
          creator_handle: string | null
          id: number
          job_id: string
          likes: number | null
          posted_at: string | null
          reel_id: string
          reel_url: string | null
          spark_score: number | null
          views: number | null
        }
        Insert: {
          caption?: string | null
          comments?: number | null
          created_at?: string
          creator_handle?: string | null
          id?: never
          job_id: string
          likes?: number | null
          posted_at?: string | null
          reel_id: string
          reel_url?: string | null
          spark_score?: number | null
          views?: number | null
        }
        Update: {
          caption?: string | null
          comments?: number | null
          created_at?: string
          creator_handle?: string | null
          id?: never
          job_id?: string
          likes?: number | null
          posted_at?: string | null
          reel_id?: string
          reel_url?: string | null
          spark_score?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sound_scan_reels_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          is_own_sound: boolean | null
          job_id: string
          label_id: string | null
          notes: string | null
          notify_on_spike: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_own_sound?: boolean | null
          job_id: string
          label_id?: string | null
          notes?: string | null
          notify_on_spike?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_own_sound?: boolean | null
          job_id?: string
          label_id?: string | null
          notes?: string | null
          notify_on_spike?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_subscriptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sound_subscriptions_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_catalog_tracks: {
        Row: {
          album_artists: string | null
          album_id: string | null
          album_name: string | null
          album_type: string | null
          copyright_c_text: string | null
          copyright_p_text: string | null
          duration_ms: number | null
          entity_id: string
          id: string
          label: string | null
          observed_at: string
          observed_date: string | null
          release_date: string | null
          stream_count: number
          track_id: string
          track_name: string
        }
        Insert: {
          album_artists?: string | null
          album_id?: string | null
          album_name?: string | null
          album_type?: string | null
          copyright_c_text?: string | null
          copyright_p_text?: string | null
          duration_ms?: number | null
          entity_id: string
          id?: string
          label?: string | null
          observed_at?: string
          observed_date?: string | null
          release_date?: string | null
          stream_count: number
          track_id: string
          track_name: string
        }
        Update: {
          album_artists?: string | null
          album_id?: string | null
          album_name?: string | null
          album_type?: string | null
          copyright_c_text?: string | null
          copyright_p_text?: string | null
          duration_ms?: number | null
          entity_id?: string
          id?: string
          label?: string | null
          observed_at?: string
          observed_date?: string | null
          release_date?: string | null
          stream_count?: number
          track_id?: string
          track_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_catalog_tracks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_daily_snapshots: {
        Row: {
          created_at: string
          followers: number | null
          id: number
          job_id: string
          monthly_listeners: number | null
          popularity: number | null
          raw_response: Json | null
          snapshot_date: string
          spotify_id: string
          top_cities: Json | null
          track_play_count: number | null
          track_popularity: number | null
          world_rank: number | null
        }
        Insert: {
          created_at?: string
          followers?: number | null
          id?: never
          job_id: string
          monthly_listeners?: number | null
          popularity?: number | null
          raw_response?: Json | null
          snapshot_date?: string
          spotify_id: string
          top_cities?: Json | null
          track_play_count?: number | null
          track_popularity?: number | null
          world_rank?: number | null
        }
        Update: {
          created_at?: string
          followers?: number | null
          id?: never
          job_id?: string
          monthly_listeners?: number | null
          popularity?: number | null
          raw_response?: Json | null
          snapshot_date?: string
          spotify_id?: string
          top_cities?: Json | null
          track_play_count?: number | null
          track_popularity?: number | null
          world_rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spotify_daily_snapshots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_editorial_placements: {
        Row: {
          added_at: string | null
          artist_name: string
          entity_id: string
          first_seen: string
          id: string
          is_active: boolean | null
          last_seen: string
          playlist_followers: number | null
          playlist_id: string
          playlist_name: string
          position: number | null
          stream_count: number | null
          track_id: string
          track_name: string
        }
        Insert: {
          added_at?: string | null
          artist_name: string
          entity_id: string
          first_seen?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string
          playlist_followers?: number | null
          playlist_id: string
          playlist_name: string
          position?: number | null
          stream_count?: number | null
          track_id: string
          track_name: string
        }
        Update: {
          added_at?: string | null
          artist_name?: string
          entity_id?: string
          first_seen?: string
          id?: string
          is_active?: boolean | null
          last_seen?: string
          playlist_followers?: number | null
          playlist_id?: string
          playlist_name?: string
          position?: number | null
          stream_count?: number | null
          track_id?: string
          track_name?: string
        }
        Relationships: []
      }
      spotify_playlist_tracking: {
        Row: {
          created_at: string
          first_seen: string
          id: number
          is_editorial: boolean | null
          job_id: string
          last_seen: string
          playlist_followers: number | null
          playlist_id: string
          playlist_name: string | null
          playlist_owner: string | null
          removed_at: string | null
          spotify_track_id: string
        }
        Insert: {
          created_at?: string
          first_seen?: string
          id?: never
          is_editorial?: boolean | null
          job_id: string
          last_seen?: string
          playlist_followers?: number | null
          playlist_id: string
          playlist_name?: string | null
          playlist_owner?: string | null
          removed_at?: string | null
          spotify_track_id: string
        }
        Update: {
          created_at?: string
          first_seen?: string
          id?: never
          is_editorial?: boolean | null
          job_id?: string
          last_seen?: string
          playlist_followers?: number | null
          playlist_id?: string
          playlist_name?: string | null
          playlist_owner?: string | null
          removed_at?: string | null
          spotify_track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotify_playlist_tracking_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sound_intelligence_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_artist_daily: {
        Row: {
          avg_engagement_rate: number | null
          avg_plays: number | null
          avg_virality_ratio: number | null
          canonical_name: string | null
          consistency_score: number | null
          date: string | null
          days_since_last_post: number | null
          engagement_percentile: number | null
          engagement_trend_pct: number | null
          entity_id: string | null
          follow_ratio: number | null
          follower_growth_7d: number | null
          follower_growth_pct_7d: number | null
          follower_percentile: number | null
          follower_tier: string | null
          followers: number | null
          following: number | null
          last_observed: string | null
          likes_growth_7d: number | null
          likes_per_follower: number | null
          median_engagement_rate: number | null
          median_plays: number | null
          new_videos_7d: number | null
          original_sound_pct: number | null
          plays_percentile: number | null
          plays_trend_pct: number | null
          posting_cadence: string | null
          scraped_videos: number | null
          tiktok_health: string | null
          top_hashtags: string[] | null
          total_likes: number | null
          video_count: number | null
          videos_30d: number | null
          virality_percentile: number | null
        }
        Insert: {
          avg_engagement_rate?: number | null
          avg_plays?: number | null
          avg_virality_ratio?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_percentile?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          follow_ratio?: number | null
          follower_growth_7d?: number | null
          follower_growth_pct_7d?: number | null
          follower_percentile?: number | null
          follower_tier?: string | null
          followers?: number | null
          following?: number | null
          last_observed?: string | null
          likes_growth_7d?: number | null
          likes_per_follower?: number | null
          median_engagement_rate?: number | null
          median_plays?: number | null
          new_videos_7d?: number | null
          original_sound_pct?: number | null
          plays_percentile?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          scraped_videos?: number | null
          tiktok_health?: string | null
          top_hashtags?: string[] | null
          total_likes?: number | null
          video_count?: number | null
          videos_30d?: number | null
          virality_percentile?: number | null
        }
        Update: {
          avg_engagement_rate?: number | null
          avg_plays?: number | null
          avg_virality_ratio?: number | null
          canonical_name?: string | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_percentile?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          follow_ratio?: number | null
          follower_growth_7d?: number | null
          follower_growth_pct_7d?: number | null
          follower_percentile?: number | null
          follower_tier?: string | null
          followers?: number | null
          following?: number | null
          last_observed?: string | null
          likes_growth_7d?: number | null
          likes_per_follower?: number | null
          median_engagement_rate?: number | null
          median_plays?: number | null
          new_videos_7d?: number | null
          original_sound_pct?: number | null
          plays_percentile?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          scraped_videos?: number | null
          tiktok_health?: string | null
          top_hashtags?: string[] | null
          total_likes?: number | null
          video_count?: number | null
          videos_30d?: number | null
          virality_percentile?: number | null
        }
        Relationships: []
      }
      tiktok_global_benchmarks: {
        Row: {
          avg_plays_mixed_sound: number | null
          avg_plays_mostly_original: number | null
          avg_plays_mostly_trends: number | null
          cadence_daily: number | null
          cadence_dormant: number | null
          cadence_inactive: number | null
          cadence_regular: number | null
          cadence_sporadic: number | null
          consistency_p25: number | null
          consistency_p50: number | null
          consistency_p75: number | null
          date: string | null
          engagement_p10: number | null
          engagement_p25: number | null
          engagement_p50: number | null
          engagement_p75: number | null
          engagement_p90: number | null
          global_avg_engagement: number | null
          global_avg_median_plays: number | null
          global_avg_original_sound_pct: number | null
          global_avg_posting_interval: number | null
          global_avg_virality: number | null
          plays_p10: number | null
          plays_p25: number | null
          plays_p50: number | null
          plays_p75: number | null
          plays_p90: number | null
          plays_p95: number | null
          plays_p99: number | null
          total_artists: number | null
          virality_p50: number | null
          virality_p75: number | null
          virality_p90: number | null
        }
        Insert: {
          avg_plays_mixed_sound?: number | null
          avg_plays_mostly_original?: number | null
          avg_plays_mostly_trends?: number | null
          cadence_daily?: number | null
          cadence_dormant?: number | null
          cadence_inactive?: number | null
          cadence_regular?: number | null
          cadence_sporadic?: number | null
          consistency_p25?: number | null
          consistency_p50?: number | null
          consistency_p75?: number | null
          date?: string | null
          engagement_p10?: number | null
          engagement_p25?: number | null
          engagement_p50?: number | null
          engagement_p75?: number | null
          engagement_p90?: number | null
          global_avg_engagement?: number | null
          global_avg_median_plays?: number | null
          global_avg_original_sound_pct?: number | null
          global_avg_posting_interval?: number | null
          global_avg_virality?: number | null
          plays_p10?: number | null
          plays_p25?: number | null
          plays_p50?: number | null
          plays_p75?: number | null
          plays_p90?: number | null
          plays_p95?: number | null
          plays_p99?: number | null
          total_artists?: number | null
          virality_p50?: number | null
          virality_p75?: number | null
          virality_p90?: number | null
        }
        Update: {
          avg_plays_mixed_sound?: number | null
          avg_plays_mostly_original?: number | null
          avg_plays_mostly_trends?: number | null
          cadence_daily?: number | null
          cadence_dormant?: number | null
          cadence_inactive?: number | null
          cadence_regular?: number | null
          cadence_sporadic?: number | null
          consistency_p25?: number | null
          consistency_p50?: number | null
          consistency_p75?: number | null
          date?: string | null
          engagement_p10?: number | null
          engagement_p25?: number | null
          engagement_p50?: number | null
          engagement_p75?: number | null
          engagement_p90?: number | null
          global_avg_engagement?: number | null
          global_avg_median_plays?: number | null
          global_avg_original_sound_pct?: number | null
          global_avg_posting_interval?: number | null
          global_avg_virality?: number | null
          plays_p10?: number | null
          plays_p25?: number | null
          plays_p50?: number | null
          plays_p75?: number | null
          plays_p90?: number | null
          plays_p95?: number | null
          plays_p99?: number | null
          total_artists?: number | null
          virality_p50?: number | null
          virality_p75?: number | null
          virality_p90?: number | null
        }
        Relationships: []
      }
      tiktok_video_summary: {
        Row: {
          avg_comments: number | null
          avg_days_between_posts: number | null
          avg_engagement_30d: number | null
          avg_engagement_rate: number | null
          avg_likes: number | null
          avg_plays: number | null
          avg_plays_30d: number | null
          avg_plays_90d: number | null
          avg_saves: number | null
          avg_shares: number | null
          avg_virality_30d: number | null
          avg_virality_ratio: number | null
          best_plays: number | null
          canonical_name: string | null
          commerce_music_pct: number | null
          consistency_score: number | null
          date: string | null
          days_since_last_post: number | null
          engagement_trend_pct: number | null
          entity_id: string | null
          median_comments: number | null
          median_engagement_rate: number | null
          median_likes: number | null
          median_plays: number | null
          median_plays_30d: number | null
          median_saves: number | null
          median_shares: number | null
          original_sound_pct: number | null
          pinned_avg_plays: number | null
          pinned_count: number | null
          pinned_total_plays: number | null
          plays_stddev: number | null
          plays_trend_pct: number | null
          posting_cadence: string | null
          top_hashtags: string[] | null
          top_sound_author: string | null
          top_sound_title: string | null
          top_sound_uses: number | null
          total_plays: number | null
          total_videos: number | null
          unique_external_artists: number | null
          unique_sounds_used: number | null
          videos_30d: number | null
          videos_7d: number | null
          videos_90d: number | null
          worst_plays: number | null
        }
        Insert: {
          avg_comments?: number | null
          avg_days_between_posts?: number | null
          avg_engagement_30d?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_plays_30d?: number | null
          avg_plays_90d?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_virality_30d?: number | null
          avg_virality_ratio?: number | null
          best_plays?: number | null
          canonical_name?: string | null
          commerce_music_pct?: number | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          median_comments?: number | null
          median_engagement_rate?: number | null
          median_likes?: number | null
          median_plays?: number | null
          median_plays_30d?: number | null
          median_saves?: number | null
          median_shares?: number | null
          original_sound_pct?: number | null
          pinned_avg_plays?: number | null
          pinned_count?: number | null
          pinned_total_plays?: number | null
          plays_stddev?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          top_hashtags?: string[] | null
          top_sound_author?: string | null
          top_sound_title?: string | null
          top_sound_uses?: number | null
          total_plays?: number | null
          total_videos?: number | null
          unique_external_artists?: number | null
          unique_sounds_used?: number | null
          videos_30d?: number | null
          videos_7d?: number | null
          videos_90d?: number | null
          worst_plays?: number | null
        }
        Update: {
          avg_comments?: number | null
          avg_days_between_posts?: number | null
          avg_engagement_30d?: number | null
          avg_engagement_rate?: number | null
          avg_likes?: number | null
          avg_plays?: number | null
          avg_plays_30d?: number | null
          avg_plays_90d?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_virality_30d?: number | null
          avg_virality_ratio?: number | null
          best_plays?: number | null
          canonical_name?: string | null
          commerce_music_pct?: number | null
          consistency_score?: number | null
          date?: string | null
          days_since_last_post?: number | null
          engagement_trend_pct?: number | null
          entity_id?: string | null
          median_comments?: number | null
          median_engagement_rate?: number | null
          median_likes?: number | null
          median_plays?: number | null
          median_plays_30d?: number | null
          median_saves?: number | null
          median_shares?: number | null
          original_sound_pct?: number | null
          pinned_avg_plays?: number | null
          pinned_count?: number | null
          pinned_total_plays?: number | null
          plays_stddev?: number | null
          plays_trend_pct?: number | null
          posting_cadence?: string | null
          top_hashtags?: string[] | null
          top_sound_author?: string | null
          top_sound_title?: string | null
          top_sound_uses?: number | null
          total_plays?: number | null
          total_videos?: number | null
          unique_external_artists?: number | null
          unique_sounds_used?: number | null
          videos_30d?: number | null
          videos_7d?: number | null
          videos_90d?: number | null
          worst_plays?: number | null
        }
        Relationships: []
      }
      top_artist_comments: {
        Row: {
          artist_name: string | null
          author_nickname: string | null
          author_unique_id: string | null
          aweme_id: string | null
          comment_id: string | null
          comment_impact_pct: number | null
          comment_language: string | null
          comment_likes: number | null
          comment_rank: number | null
          comment_text: string | null
          comment_time: string | null
          date: string | null
          engagement_score: number | null
          entity_id: string | null
          reply_count: number | null
          video_caption: string | null
          video_plays: number | null
          video_posted: string | null
        }
        Insert: {
          artist_name?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          aweme_id?: string | null
          comment_id?: string | null
          comment_impact_pct?: number | null
          comment_language?: string | null
          comment_likes?: number | null
          comment_rank?: number | null
          comment_text?: string | null
          comment_time?: string | null
          date?: string | null
          engagement_score?: number | null
          entity_id?: string | null
          reply_count?: number | null
          video_caption?: string | null
          video_plays?: number | null
          video_posted?: string | null
        }
        Update: {
          artist_name?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          aweme_id?: string | null
          comment_id?: string | null
          comment_impact_pct?: number | null
          comment_language?: string | null
          comment_likes?: number | null
          comment_rank?: number | null
          comment_text?: string | null
          comment_time?: string | null
          date?: string | null
          engagement_score?: number | null
          entity_id?: string | null
          reply_count?: number | null
          video_caption?: string | null
          video_plays?: number | null
          video_posted?: string | null
        }
        Relationships: []
      }
      top_comments_weekly: {
        Row: {
          artist_name: string | null
          author_nickname: string | null
          aweme_id: string | null
          comment_id: string | null
          comment_impact_pct: number | null
          comment_text: string | null
          comment_time: string | null
          days_in_top: number | null
          entity_id: string | null
          first_surfaced: string | null
          gaining_momentum: boolean | null
          initial_likes: number | null
          is_active_today: boolean | null
          last_seen: string | null
          latest_engagement_score: number | null
          latest_likes: number | null
          latest_reply_count: number | null
          likes_delta: number | null
          momentum_note: string | null
          peak_rank: number | null
          video_caption: string | null
          video_plays: number | null
          week_start: string | null
        }
        Insert: {
          artist_name?: string | null
          author_nickname?: string | null
          aweme_id?: string | null
          comment_id?: string | null
          comment_impact_pct?: number | null
          comment_text?: string | null
          comment_time?: string | null
          days_in_top?: number | null
          entity_id?: string | null
          first_surfaced?: string | null
          gaining_momentum?: boolean | null
          initial_likes?: number | null
          is_active_today?: boolean | null
          last_seen?: string | null
          latest_engagement_score?: number | null
          latest_likes?: number | null
          latest_reply_count?: number | null
          likes_delta?: number | null
          momentum_note?: string | null
          peak_rank?: number | null
          video_caption?: string | null
          video_plays?: number | null
          week_start?: string | null
        }
        Update: {
          artist_name?: string | null
          author_nickname?: string | null
          aweme_id?: string | null
          comment_id?: string | null
          comment_impact_pct?: number | null
          comment_text?: string | null
          comment_time?: string | null
          days_in_top?: number | null
          entity_id?: string | null
          first_surfaced?: string | null
          gaining_momentum?: boolean | null
          initial_likes?: number | null
          is_active_today?: boolean | null
          last_seen?: string | null
          latest_engagement_score?: number | null
          latest_likes?: number | null
          latest_reply_count?: number | null
          likes_delta?: number | null
          momentum_note?: string | null
          peak_rank?: number | null
          video_caption?: string | null
          video_plays?: number | null
          week_start?: string | null
        }
        Relationships: []
      }
      ugc_highlight_videos: {
        Row: {
          analysis_confidence: number | null
          analysis_json: Json | null
          analysis_source: string | null
          artist_handle: string
          artist_name: string | null
          caption: string | null
          comment_count: number | null
          content_description: string | null
          content_format: string | null
          created_at: string | null
          creator_followers: number | null
          creator_handle: string
          creator_nickname: string | null
          creator_profile: string | null
          creator_verified: boolean | null
          id: number
          label_id: string | null
          like_count: number | null
          music_id: string
          niche: string | null
          play_count: number
          replicable: boolean | null
          replication_difficulty: string | null
          replication_elements: string | null
          scan_date: string
          seen: boolean | null
          share_count: number | null
          song_moment: string | null
          song_name: string
          song_usage: string | null
          vibe: string | null
          video_created_at: string | null
          video_id: string
          video_url: string | null
          why_it_works: string | null
        }
        Insert: {
          analysis_confidence?: number | null
          analysis_json?: Json | null
          analysis_source?: string | null
          artist_handle: string
          artist_name?: string | null
          caption?: string | null
          comment_count?: number | null
          content_description?: string | null
          content_format?: string | null
          created_at?: string | null
          creator_followers?: number | null
          creator_handle: string
          creator_nickname?: string | null
          creator_profile?: string | null
          creator_verified?: boolean | null
          id?: never
          label_id?: string | null
          like_count?: number | null
          music_id: string
          niche?: string | null
          play_count: number
          replicable?: boolean | null
          replication_difficulty?: string | null
          replication_elements?: string | null
          scan_date?: string
          seen?: boolean | null
          share_count?: number | null
          song_moment?: string | null
          song_name: string
          song_usage?: string | null
          vibe?: string | null
          video_created_at?: string | null
          video_id: string
          video_url?: string | null
          why_it_works?: string | null
        }
        Update: {
          analysis_confidence?: number | null
          analysis_json?: Json | null
          analysis_source?: string | null
          artist_handle?: string
          artist_name?: string | null
          caption?: string | null
          comment_count?: number | null
          content_description?: string | null
          content_format?: string | null
          created_at?: string | null
          creator_followers?: number | null
          creator_handle?: string
          creator_nickname?: string | null
          creator_profile?: string | null
          creator_verified?: boolean | null
          id?: never
          label_id?: string | null
          like_count?: number | null
          music_id?: string
          niche?: string | null
          play_count?: number
          replicable?: boolean | null
          replication_difficulty?: string | null
          replication_elements?: string | null
          scan_date?: string
          seen?: boolean | null
          share_count?: number | null
          song_moment?: string | null
          song_name?: string
          song_usage?: string | null
          vibe?: string | null
          video_created_at?: string | null
          video_id?: string
          video_url?: string | null
          why_it_works?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ugc_highlight_videos_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_log: {
        Row: {
          created_at: string | null
          id: number
          message: string | null
          model_used: string
          reason: string | null
          route: string
          session_id: string | null
          tier: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          message?: string | null
          model_used: string
          reason?: string | null
          route: string
          session_id?: string | null
          tier?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          message?: string | null
          model_used?: string
          reason?: string | null
          route?: string
          session_id?: string | null
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_analysis_usage: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_artist_links: {
        Row: {
          artist_handle: string
          created_at: string | null
          label_id: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          artist_handle: string
          created_at?: string | null
          label_id?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          artist_handle?: string
          created_at?: string | null
          label_id?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_artist_links_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          sort_order: number | null
          user_id: string
          video_id: number
          video_type: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          sort_order?: number | null
          user_id: string
          video_id: number
          video_type?: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          sort_order?: number | null
          user_id?: string
          video_id?: number
          video_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "favorite_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_type: string | null
          artist_handle: string | null
          created_at: string
          creator_role: string | null
          genres: string[] | null
          id: string
          label_id: string | null
          label_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          artist_handle?: string | null
          created_at?: string
          creator_role?: string | null
          genres?: string[] | null
          id?: string
          label_id?: string | null
          label_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          artist_handle?: string | null
          created_at?: string
          creator_role?: string | null
          genres?: string[] | null
          id?: string
          label_id?: string | null
          label_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_label"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_selected_videos: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          stripe_customer_id: string | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          stripe_customer_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          stripe_customer_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_uploaded_videos: {
        Row: {
          content_category: string
          created_at: string
          duration: number | null
          id: string
          music_genre: string
          notes: string | null
          storage_path: string
          updated_at: string
          user_id: string
          user_query: string | null
          video_url: string
        }
        Insert: {
          content_category: string
          created_at?: string
          duration?: number | null
          id?: string
          music_genre: string
          notes?: string | null
          storage_path: string
          updated_at?: string
          user_id: string
          user_query?: string | null
          video_url: string
        }
        Update: {
          content_category?: string
          created_at?: string
          duration?: number | null
          id?: string
          music_genre?: string
          notes?: string | null
          storage_path?: string
          updated_at?: string
          user_id?: string
          user_query?: string | null
          video_url?: string
        }
        Relationships: []
      }
      video_analysis_results: {
        Row: {
          category_style: string | null
          created_at: string | null
          genre: string | null
          hooks_captions: Json
          id: string
          status: Database["public"]["Enums"]["analysis_status"]
          sub_genre: string | null
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          category_style?: string | null
          created_at?: string | null
          genre?: string | null
          hooks_captions?: Json
          id?: string
          status?: Database["public"]["Enums"]["analysis_status"]
          sub_genre?: string | null
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          category_style?: string | null
          created_at?: string | null
          genre?: string | null
          hooks_captions?: Json
          id?: string
          status?: Database["public"]["Enums"]["analysis_status"]
          sub_genre?: string | null
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_analysis_results_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_uploaded_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_comment_sentiment: {
        Row: {
          analyzed_at: string
          audience_vibe: string | null
          content_ideas: Json | null
          date: string
          entity_id: string
          fan_energy: number
          id: string
          intent_breakdown: Json | null
          language_distribution: Json
          model_used: string
          raw_analysis: Json | null
          sentiment_score: number
          themes: Json
          top_requests: Json | null
          total_comments_analyzed: number
          total_videos_analyzed: number
        }
        Insert: {
          analyzed_at?: string
          audience_vibe?: string | null
          content_ideas?: Json | null
          date?: string
          entity_id: string
          fan_energy: number
          id?: string
          intent_breakdown?: Json | null
          language_distribution?: Json
          model_used?: string
          raw_analysis?: Json | null
          sentiment_score: number
          themes?: Json
          top_requests?: Json | null
          total_comments_analyzed?: number
          total_videos_analyzed?: number
        }
        Update: {
          analyzed_at?: string
          audience_vibe?: string | null
          content_ideas?: Json | null
          date?: string
          entity_id?: string
          fan_energy?: number
          id?: string
          intent_breakdown?: Json | null
          language_distribution?: Json
          model_used?: string
          raw_analysis?: Json | null
          sentiment_score?: number
          themes?: Json
          top_requests?: Json | null
          total_comments_analyzed?: number
          total_videos_analyzed?: number
        }
        Relationships: [
          {
            foreignKeyName: "wb_comment_sentiment_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_entities: {
        Row: {
          canonical_name: string
          created_at: string | null
          entity_type: string
          id: string
          metadata: Json | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_name: string
          created_at?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_name?: string
          created_at?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wb_entity_relationships: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          relationship: string
          source_id: string
          target_id: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relationship: string
          source_id: string
          target_id: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relationship?: string
          source_id?: string
          target_id?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_entity_relationships_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wb_entity_relationships_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_handle_health_log: {
        Row: {
          checked_at: string
          entity_id: string
          id: string
          metadata: Json | null
          new_handle: string | null
          platform: string
          platform_id: string
          result: string
          source: string
        }
        Insert: {
          checked_at?: string
          entity_id: string
          id?: string
          metadata?: Json | null
          new_handle?: string | null
          platform: string
          platform_id: string
          result: string
          source: string
        }
        Update: {
          checked_at?: string
          entity_id?: string
          id?: string
          metadata?: Json | null
          new_handle?: string | null
          platform?: string
          platform_id?: string
          result?: string
          source?: string
        }
        Relationships: []
      }
      wb_instagram_videos: {
        Row: {
          caption: string | null
          comment_count: number | null
          content_type: string | null
          create_time: string | null
          entity_id: string
          first_seen_at: string
          id: number
          is_original_audio: boolean | null
          last_seen_at: string
          like_count: number | null
          media_id: string | null
          music_artist: string | null
          music_audio_id: string | null
          music_song: string | null
          play_count: number | null
          shortcode: string
          thumbnail_url: string | null
        }
        Insert: {
          caption?: string | null
          comment_count?: number | null
          content_type?: string | null
          create_time?: string | null
          entity_id: string
          first_seen_at?: string
          id?: never
          is_original_audio?: boolean | null
          last_seen_at?: string
          like_count?: number | null
          media_id?: string | null
          music_artist?: string | null
          music_audio_id?: string | null
          music_song?: string | null
          play_count?: number | null
          shortcode: string
          thumbnail_url?: string | null
        }
        Update: {
          caption?: string | null
          comment_count?: number | null
          content_type?: string | null
          create_time?: string | null
          entity_id?: string
          first_seen_at?: string
          id?: never
          is_original_audio?: boolean | null
          last_seen_at?: string
          like_count?: number | null
          media_id?: string | null
          music_artist?: string | null
          music_audio_id?: string | null
          music_song?: string | null
          play_count?: number | null
          shortcode?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      wb_observations: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "wb_observations_partitioned_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_observations_2026_04: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_05: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_06: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_07: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_08: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_09: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_10: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_11: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_2026_12: {
        Row: {
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "wb_observations_geo_partitioned_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_observations_geo_2026_04: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_05: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_06: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_07: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_08: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_09: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_10: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_11: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_observations_geo_2026_12: {
        Row: {
          country_code: string
          entity_id: string
          metadata: Json | null
          metric: string
          observed_at: string
          platform: string
          source: string | null
          value: number
        }
        Insert: {
          country_code: string
          entity_id: string
          metadata?: Json | null
          metric: string
          observed_at?: string
          platform: string
          source?: string | null
          value: number
        }
        Update: {
          country_code?: string
          entity_id?: string
          metadata?: Json | null
          metric?: string
          observed_at?: string
          platform?: string
          source?: string | null
          value?: number
        }
        Relationships: []
      }
      wb_platform_ids: {
        Row: {
          confidence: number | null
          consecutive_failures: number | null
          entity_id: string
          health_metadata: Json | null
          health_status: string | null
          id_type: string | null
          last_checked_at: string | null
          last_seen_alive_at: string | null
          linked_at: string | null
          platform: string
          platform_id: string
          platform_url: string | null
          superseded_by: string | null
          verified: boolean | null
        }
        Insert: {
          confidence?: number | null
          consecutive_failures?: number | null
          entity_id: string
          health_metadata?: Json | null
          health_status?: string | null
          id_type?: string | null
          last_checked_at?: string | null
          last_seen_alive_at?: string | null
          linked_at?: string | null
          platform: string
          platform_id: string
          platform_url?: string | null
          superseded_by?: string | null
          verified?: boolean | null
        }
        Update: {
          confidence?: number | null
          consecutive_failures?: number | null
          entity_id?: string
          health_metadata?: Json | null
          health_status?: string | null
          id_type?: string | null
          last_checked_at?: string | null
          last_seen_alive_at?: string | null
          linked_at?: string | null
          platform?: string
          platform_id?: string
          platform_url?: string | null
          superseded_by?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_platform_ids_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_playlist_events: {
        Row: {
          artist_name: string | null
          created_at: string
          event_date: string
          event_type: string
          id: number
          playlist_entity_id: string
          position: number | null
          previous_position: number | null
          song_entity_id: string | null
          spotify_track_id: string
          track_name: string | null
        }
        Insert: {
          artist_name?: string | null
          created_at?: string
          event_date?: string
          event_type: string
          id?: never
          playlist_entity_id: string
          position?: number | null
          previous_position?: number | null
          song_entity_id?: string | null
          spotify_track_id: string
          track_name?: string | null
        }
        Update: {
          artist_name?: string | null
          created_at?: string
          event_date?: string
          event_type?: string
          id?: never
          playlist_entity_id?: string
          position?: number | null
          previous_position?: number | null
          song_entity_id?: string | null
          spotify_track_id?: string
          track_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_playlist_events_playlist_entity_id_fkey"
            columns: ["playlist_entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wb_playlist_events_song_entity_id_fkey"
            columns: ["song_entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_playlist_tracks: {
        Row: {
          added_date: string
          artist_name: string | null
          artist_spotify_id: string | null
          last_seen: string
          playlist_entity_id: string
          position: number
          removed_date: string | null
          song_entity_id: string | null
          spotify_track_id: string
          track_name: string | null
        }
        Insert: {
          added_date?: string
          artist_name?: string | null
          artist_spotify_id?: string | null
          last_seen?: string
          playlist_entity_id: string
          position: number
          removed_date?: string | null
          song_entity_id?: string | null
          spotify_track_id: string
          track_name?: string | null
        }
        Update: {
          added_date?: string
          artist_name?: string | null
          artist_spotify_id?: string | null
          last_seen?: string
          playlist_entity_id?: string
          position?: number
          removed_date?: string | null
          song_entity_id?: string | null
          spotify_track_id?: string
          track_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_playlist_tracks_playlist_entity_id_fkey"
            columns: ["playlist_entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wb_playlist_tracks_song_entity_id_fkey"
            columns: ["song_entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_tiktok_comments: {
        Row: {
          author_nickname: string | null
          author_uid: string | null
          author_unique_id: string | null
          aweme_id: string
          comment_id: string
          comment_language: string | null
          create_time: string
          digg_count: number | null
          entity_id: string
          id: string
          metadata: Json | null
          predicted_age_group: string | null
          reply_count: number | null
          scrape_stage: number
          scraped_at: string
          text: string
        }
        Insert: {
          author_nickname?: string | null
          author_uid?: string | null
          author_unique_id?: string | null
          aweme_id: string
          comment_id: string
          comment_language?: string | null
          create_time: string
          digg_count?: number | null
          entity_id: string
          id?: string
          metadata?: Json | null
          predicted_age_group?: string | null
          reply_count?: number | null
          scrape_stage: number
          scraped_at?: string
          text: string
        }
        Update: {
          author_nickname?: string | null
          author_uid?: string | null
          author_unique_id?: string | null
          aweme_id?: string
          comment_id?: string
          comment_language?: string | null
          create_time?: string
          digg_count?: number | null
          entity_id?: string
          id?: string
          metadata?: Json | null
          predicted_age_group?: string | null
          reply_count?: number | null
          scrape_stage?: number
          scraped_at?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "wb_tiktok_comments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      wb_tiktok_videos: {
        Row: {
          aweme_id: string
          caption: string | null
          collect_count: number | null
          comment_count: number | null
          comments_scraped_stages: number[] | null
          content_type: string | null
          create_time: string
          digg_count: number | null
          entity_id: string
          first_seen_at: string
          id: string
          is_commerce_music: boolean | null
          is_original_sound: boolean | null
          is_pinned: boolean | null
          last_seen_at: string
          metadata: Json | null
          music_author: string | null
          music_id_str: string | null
          music_title: string | null
          play_count: number | null
          share_count: number | null
        }
        Insert: {
          aweme_id: string
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comments_scraped_stages?: number[] | null
          content_type?: string | null
          create_time: string
          digg_count?: number | null
          entity_id: string
          first_seen_at?: string
          id?: string
          is_commerce_music?: boolean | null
          is_original_sound?: boolean | null
          is_pinned?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          music_author?: string | null
          music_id_str?: string | null
          music_title?: string | null
          play_count?: number | null
          share_count?: number | null
        }
        Update: {
          aweme_id?: string
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comments_scraped_stages?: number[] | null
          content_type?: string | null
          create_time?: string
          digg_count?: number | null
          entity_id?: string
          first_seen_at?: string
          id?: string
          is_commerce_music?: boolean | null
          is_original_sound?: boolean | null
          is_pinned?: boolean | null
          last_seen_at?: string
          metadata?: Json | null
          music_author?: string | null
          music_id_str?: string | null
          music_title?: string | null
          play_count?: number | null
          share_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_tiktok_videos_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_notes: {
        Row: {
          created_at: string
          id: string
          notes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_pc_tiktok: {
        Row: {
          created_at: string | null
          effort: string | null
          gender: string | null
          hook: string | null
          hook_confidence: string | null
          hook_text: string | null
          id: number | null
          language: string | null
          photo_c_id: number | null
          transcribed_text: string | null
        }
        Insert: {
          created_at?: string | null
          effort?: string | null
          gender?: string | null
          hook?: string | null
          hook_confidence?: string | null
          hook_text?: string | null
          id?: number | null
          language?: string | null
          photo_c_id?: number | null
          transcribed_text?: string | null
        }
        Update: {
          created_at?: string | null
          effort?: string | null
          gender?: string | null
          hook?: string | null
          hook_confidence?: string | null
          hook_text?: string | null
          id?: number | null
          language?: string | null
          photo_c_id?: number | null
          transcribed_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 10 - Ai Analysis - Reels_duplicate_photo_c_id_fkey"
            columns: ["photo_c_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 10 - Ai Analysis - Reels_duplicate_photo_c_id_fkey"
            columns: ["photo_c_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reels: {
        Row: {
          candidates: string | null
          content_style: string | null
          content_style_confidence: string | null
          context: string | null
          created_at: string | null
          description: string | null
          effort: string | null
          evidence_pointers: string | null
          hook: string | null
          id: number | null
          label_reasons: string | null
          "social_context_&_mood": string | null
          sub_style: string | null
          video_id: number | null
        }
        Insert: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number | null
          label_reasons?: string | null
          "social_context_&_mood"?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Update: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number | null
          label_reasons?: string | null
          "social_context_&_mood"?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 10 - Video - Ai Analysis - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 10 - Video - Ai Analysis - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tiktok: {
        Row: {
          candidates: string | null
          content_style: string | null
          content_style_confidence: string | null
          context: string | null
          created_at: string | null
          description: string | null
          effort: string | null
          evidence_pointers: string | null
          hook: string | null
          id: number | null
          label_reasons: string | null
          sub_style: string | null
          video_id: number | null
        }
        Insert: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number | null
          label_reasons?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Update: {
          candidates?: string | null
          content_style?: string | null
          content_style_confidence?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          effort?: string | null
          evidence_pointers?: string | null
          hook?: string | null
          id?: number | null
          label_reasons?: string | null
          sub_style?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 9 - Video - Ai Analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 9 - Video - Ai Analysis_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_intel_feed: {
        Row: {
          action_suggestion: string | null
          action_type: string | null
          actionable: boolean | null
          artist_name: string | null
          body: string | null
          chunk_type: string | null
          confidence: string | null
          created_at: string | null
          days_since_research: number | null
          days_until_event: number | null
          entity_id: string | null
          event_date: string | null
          event_end_date: string | null
          expires_at: string | null
          facts: Json | null
          freshness_score: number | null
          relevance: string | null
          research_week: string | null
          source_urls: string[] | null
          summary: string | null
          surfaced_count: number | null
          tags: string[] | null
          title: string | null
          urgency: string | null
        }
        Relationships: []
      }
      artist_sound_velocity: {
        Row: {
          artist_handle: string | null
          label_id: string | null
          last_week_total_new_ugc: number | null
          second_sound_new_ugc: number | null
          second_sound_title: string | null
          sounds_tracked: number | null
          third_sound_new_ugc: number | null
          third_sound_title: string | null
          this_week_total_new_ugc: number | null
          top_sound_new_ugc: number | null
          top_sound_title: string | null
          top_sound_total_ugc: number | null
          total_ugc: number | null
          velocity: string | null
          wow_change_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_sounds_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      assets_pc_tiktok: {
        Row: {
          created_at: string | null
          id: number | null
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 8.1 - Assets - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 8.1 - Assets - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      assets_reels: {
        Row: {
          created_at: string | null
          id: number | null
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 8 - Assets - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 8 - Assets - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      assets_tiktok: {
        Row: {
          created_at: string | null
          id: number | null
          thumbnail_url: string | null
          video_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          thumbnail_url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "01. Table 8 - Assets - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "01. Table 8 - Assets - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_action_telemetry: {
        Row: {
          action_date: string | null
          action_type: string | null
          category: string | null
          distinct_decision_points: number | null
          distinct_users: number | null
          event_count: number | null
          label_id: string | null
          urgency: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_point_actions_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      hitl_instagram: {
        Row: {
          author_avatar_url: string | null
          author_bio: string | null
          author_followers: number | null
          author_full_name: string | null
          author_id: string | null
          author_username: string | null
          author_verified: boolean | null
          caption: string | null
          comment_count: number | null
          comment_sentiment: string | null
          comments_raw: Json | null
          Confidence: number | null
          content_type: string | null
          created_at: string | null
          creator_avg_comments: number | null
          creator_avg_engagement: number | null
          creator_avg_likes: number | null
          creator_avg_views: number | null
          creator_median_comments: number | null
          creator_median_engagement: number | null
          creator_median_likes: number | null
          creator_median_views: number | null
          date_posted: string | null
          duration_seconds: number | null
          gemini_analysis: Json | null
          hashtags: string | null
          id: number | null
          instagram_media_id: string | null
          is_paid_partnership: boolean | null
          language: string | null
          like_count: number | null
          location_name: string | null
          music_artist_name: string | null
          music_audio_id: string | null
          music_song_name: string | null
          performance_multiplier: string | null
          play_count: number | null
          post_id: string | null
          Reasoning: string | null
          red_flags: Json | null
          replicable_elements: string | null
          scrape_category: string | null
          scrape_query: string | null
          shortcode: string | null
          Status: string | null
          URL: string | null
          uses_original_audio: boolean | null
          video_cover_url: string | null
          video_download_url: string | null
          view_count: number | null
          viral_score: number | null
          virality_type: string | null
          web_url: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_full_name?: string | null
          author_id?: string | null
          author_username?: string | null
          author_verified?: boolean | null
          caption?: string | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number | null
          instagram_media_id?: string | null
          is_paid_partnership?: boolean | null
          language?: string | null
          like_count?: number | null
          location_name?: string | null
          music_artist_name?: string | null
          music_audio_id?: string | null
          music_song_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          shortcode?: string | null
          Status?: string | null
          URL?: string | null
          uses_original_audio?: boolean | null
          video_cover_url?: string | null
          video_download_url?: string | null
          view_count?: number | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_full_name?: string | null
          author_id?: string | null
          author_username?: string | null
          author_verified?: boolean | null
          caption?: string | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number | null
          instagram_media_id?: string | null
          is_paid_partnership?: boolean | null
          language?: string | null
          like_count?: number | null
          location_name?: string | null
          music_artist_name?: string | null
          music_audio_id?: string | null
          music_song_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          shortcode?: string | null
          Status?: string | null
          URL?: string | null
          uses_original_audio?: boolean | null
          video_cover_url?: string | null
          video_download_url?: string | null
          view_count?: number | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Relationships: []
      }
      hitl_tiktok: {
        Row: {
          artist_handle: string | null
          author_avatar_url: string | null
          author_bio: string | null
          author_followers: number | null
          author_id: string | null
          author_nickname: string | null
          author_unique_id: string | null
          author_verified: boolean | null
          caption: string | null
          collect_count: number | null
          comment_count: number | null
          comment_sentiment: string | null
          comments_raw: Json | null
          Confidence: number | null
          content_type: string | null
          created_at: string | null
          creator_avg_comments: number | null
          creator_avg_engagement: number | null
          creator_avg_likes: number | null
          creator_avg_saves: number | null
          creator_avg_shares: number | null
          creator_avg_views: number | null
          creator_median_comments: number | null
          creator_median_engagement: number | null
          creator_median_likes: number | null
          creator_median_saves: number | null
          creator_median_shares: number | null
          creator_median_views: number | null
          date_posted: string | null
          duration_seconds: number | null
          gemini_analysis: Json | null
          hashtags: string | null
          id: number | null
          image_urls: string | null
          is_ad: boolean | null
          is_author_artist: boolean | null
          language: string | null
          like_count: number | null
          location_created: string | null
          music_author: string | null
          music_id: string | null
          music_name: string | null
          performance_multiplier: string | null
          play_count: number | null
          post_id: string | null
          Reasoning: string | null
          red_flags: Json | null
          replicable_elements: string | null
          scrape_category: string | null
          scrape_query: string | null
          share_count: number | null
          Status: string | null
          tiktok_video_id: string | null
          URL: string | null
          video_cover_url: string | null
          video_download_url: string | null
          viral_score: number | null
          virality_type: string | null
          web_url: string | null
        }
        Insert: {
          artist_handle?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_saves?: number | null
          creator_avg_shares?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_saves?: number | null
          creator_median_shares?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number | null
          image_urls?: string | null
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          share_count?: number | null
          Status?: string | null
          tiktok_video_id?: string | null
          URL?: string | null
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Update: {
          artist_handle?: string | null
          author_avatar_url?: string | null
          author_bio?: string | null
          author_followers?: number | null
          author_id?: string | null
          author_nickname?: string | null
          author_unique_id?: string | null
          author_verified?: boolean | null
          caption?: string | null
          collect_count?: number | null
          comment_count?: number | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          Confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          creator_avg_comments?: number | null
          creator_avg_engagement?: number | null
          creator_avg_likes?: number | null
          creator_avg_saves?: number | null
          creator_avg_shares?: number | null
          creator_avg_views?: number | null
          creator_median_comments?: number | null
          creator_median_engagement?: number | null
          creator_median_likes?: number | null
          creator_median_saves?: number | null
          creator_median_shares?: number | null
          creator_median_views?: number | null
          date_posted?: string | null
          duration_seconds?: number | null
          gemini_analysis?: Json | null
          hashtags?: string | null
          id?: number | null
          image_urls?: string | null
          is_ad?: boolean | null
          is_author_artist?: boolean | null
          language?: string | null
          like_count?: number | null
          location_created?: string | null
          music_author?: string | null
          music_id?: string | null
          music_name?: string | null
          performance_multiplier?: string | null
          play_count?: number | null
          post_id?: string | null
          Reasoning?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          scrape_category?: string | null
          scrape_query?: string | null
          share_count?: number | null
          Status?: string | null
          tiktok_video_id?: string | null
          URL?: string | null
          video_cover_url?: string | null
          video_download_url?: string | null
          viral_score?: number | null
          virality_type?: string | null
          web_url?: string | null
        }
        Relationships: []
      }
      master_content_view: {
        Row: {
          caption: string | null
          content_id: number | null
          content_style: string | null
          content_type: string | null
          context: string | null
          date_posted: string | null
          description: string | null
          duration: number | null
          effort: string | null
          genre: string | null
          hashtags: string | null
          hook: string | null
          hook_text: string | null
          instruments: Json | null
          likes: number | null
          lyric_analysis: Json | null
          mood: Json | null
          performance_multiplier: string | null
          platform: string | null
          sound_identifier: string | null
          sub_genre: string | null
          sub_style: string | null
          transcribed_text: string | null
          video_url: string | null
          views: number | null
          viral_score: number | null
          voices: Json | null
        }
        Relationships: []
      }
      mv_song_artist_genre: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          primary_genre: string | null
          song_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_entity_relationships_source_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wb_entity_relationships_target_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_tiktok: {
        Row: {
          caption: string | null
          created_at: string | null
          date_posted: string | null
          hashtags: string | null
          id: number | null
          language: string | null
          performance_multiplier: string | null
          photo_comments: number | null
          photo_likes: number | null
          photo_saves: number | null
          photo_views: number | null
          post_id: number | null
          post_url: string | null
          viral_score: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          date_posted?: string | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          photo_comments?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_views?: number | null
          post_id?: number | null
          post_url?: string | null
          viral_score?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          date_posted?: string | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          photo_comments?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_views?: number | null
          post_id?: number | null
          post_url?: string | null
          viral_score?: number | null
        }
        Relationships: []
      }
      profile_instagram: {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_views: number | null
          created_at: string | null
          gender: string | null
          handle: string | null
          id: number | null
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_url: string | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string | null
          gender?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string | null
          gender?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 2 - Profile - Instagram_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 2 - Profile - Instagram_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_pc_tiktok: {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_views: number | null
          created_at: string | null
          handle: string | null
          id: number | null
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_url: string | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_views?: number | null
          created_at?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_url?: string | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 1.1 - Profile - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 1.1 - Profile - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_tiktok: {
        Row: {
          avatar_url: string | null
          avg_comments: number | null
          avg_engagement: number | null
          avg_likes: number | null
          avg_saves: number | null
          avg_shares: number | null
          avg_views: number | null
          created_at: string | null
          gender: string | null
          handle: string | null
          id: number | null
          median_comments: number | null
          median_engagement: number | null
          median_likes: number | null
          median_saves: number | null
          median_shares: number | null
          median_views: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: number | null
          total_posts: number | null
          video_id: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          created_at?: string | null
          gender?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: number | null
          total_posts?: number | null
          video_id?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_comments?: number | null
          avg_engagement?: number | null
          avg_likes?: number | null
          avg_saves?: number | null
          avg_shares?: number | null
          avg_views?: number | null
          created_at?: string | null
          gender?: string | null
          handle?: string | null
          id?: number | null
          median_comments?: number | null
          median_engagement?: number | null
          median_likes?: number | null
          median_saves?: number | null
          median_shares?: number | null
          median_views?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: number | null
          total_posts?: number | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 1 - Profile - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 1 - Profile - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_insights: {
        Row: {
          artist_handle: string | null
          artist_rank: number | null
          insight_message: string | null
          insight_type: string | null
          label_id: string | null
          last_week_new_ugc: number | null
          music_id: string | null
          ownership: string | null
          sound_author: string | null
          sound_title: string | null
          this_week_new_ugc: number | null
          total_ugc: number | null
          velocity: string | null
          wow_change_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_sounds_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_pc_tiktok: {
        Row: {
          audio_url_128k: string | null
          created_at: string | null
          emotinal_profile: Json | null
          genre: string | null
          id: number | null
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sound_url: string | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 6.1 - Sound - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.1 - PC - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 6.1 - Sound - PC - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "pc_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_reels: {
        Row: {
          audio_url_128k: string | null
          created_at: string | null
          duration: number | null
          emotinal_profile: Json | null
          genre: string | null
          id: number | null
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sound_url: string | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string | null
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string | null
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 7 - Sound - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2.2 - Video - Reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 7 - Sound - Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_reels"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_tiktok: {
        Row: {
          audio_url_128k: string | null
          created_at: string | null
          duration: number | null
          emotinal_profile: Json | null
          genre: string | null
          id: number | null
          instruments: Json | null
          lyric_analysis: Json | null
          mood: Json | null
          sound_id: number | null
          sub_genre: string | null
          technical_feedback: Json | null
          video_id: number | null
          voices: Json | null
        }
        Insert: {
          audio_url_128k?: string | null
          created_at?: string | null
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Update: {
          audio_url_128k?: string | null
          created_at?: string | null
          duration?: number | null
          emotinal_profile?: Json | null
          genre?: string | null
          id?: number | null
          instruments?: Json | null
          lyric_analysis?: Json | null
          mood?: Json | null
          sound_id?: number | null
          sub_genre?: string | null
          technical_feedback?: Json | null
          video_id?: number | null
          voices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "0.1. Table 6 - Sound - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "0.1. Table 2 - Video - TikTok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "0.1. Table 6 - Sound - TikTok_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_tiktok"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_weekly_velocity: {
        Row: {
          artist_handle: string | null
          label_id: string | null
          last_snapshot: string | null
          last_week_new_ugc: number | null
          music_id: string | null
          ownership: string | null
          sound_author: string | null
          sound_title: string | null
          this_week_new_ugc: number | null
          total_ugc: number | null
          velocity: string | null
          wow_change_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_sounds_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      video_all_urls: {
        Row: {
          id: number | null
          platform: string | null
          red_flags: Json | null
          video_embedded_url: string | null
          virality_type: string | null
        }
        Relationships: []
      }
      video_reels: {
        Row: {
          caption: string | null
          comment_sentiment: string | null
          comments_raw: Json | null
          created_at: string | null
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number | null
          language: string | null
          performance_multiplier: string | null
          post_id: string | null
          red_flags: Json | null
          replay_rate: number | null
          replicable_elements: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
          virality_type: string | null
        }
        Insert: {
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string | null
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replay_rate?: number | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Update: {
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string | null
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replay_rate?: number | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Relationships: []
      }
      video_tiktok: {
        Row: {
          author_id: number | null
          caption: string | null
          comment_sentiment: string | null
          comments_raw: Json | null
          created_at: string | null
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number | null
          language: string | null
          performance_multiplier: string | null
          post_id: string | null
          red_flags: Json | null
          replicable_elements: string | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_saves: number | null
          video_shares: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
          virality_type: string | null
        }
        Insert: {
          author_id?: number | null
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string | null
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Update: {
          author_id?: number | null
          caption?: string | null
          comment_sentiment?: string | null
          comments_raw?: Json | null
          created_at?: string | null
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number | null
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          red_flags?: Json | null
          replicable_elements?: string | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
          virality_type?: string | null
        }
        Relationships: []
      }
      wb_song_playlist_count: {
        Row: {
          playlist_count: number | null
          song_entity_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wb_playlist_tracks_song_entity_id_fkey"
            columns: ["song_entity_id"]
            isOneToOne: false
            referencedRelation: "wb_entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      artist_hybrid_search: {
        Args: {
          full_text_weight?: number
          match_limit?: number
          p_artist_handle: string
          p_category?: string
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          artist_handle: string
          category: string
          content: string
          id: number
          metadata: Json
          score: number
          subcategory: string
        }[]
      }
      assign_all_artists_to_member: {
        Args: { p_label_id: string; p_user_id: string }
        Returns: undefined
      }
      assign_artist_to_member: {
        Args: { p_artist_handle: string; p_label_id: string; p_user_id: string }
        Returns: undefined
      }
      capture_onboarding_snapshot: {
        Args: { p_handle: string }
        Returns: boolean
      }
      cleanup_archived_plans: { Args: never; Returns: undefined }
      cleanup_zombie_scraper_runs: { Args: never; Returns: number }
      filter_explore_content: {
        Args: {
          p_content_styles?: string[]
          p_effort?: string
          p_follower_range?: string
          p_genders?: string[]
          p_genres?: string[]
          p_limit?: number
          p_offset?: number
          p_performance_range?: string
          p_platforms?: string[]
          p_search_query?: string
          p_sort_by?: string
          p_sub_genres?: string[]
        }
        Returns: {
          avatar_url: string
          caption: string
          content_style: string
          date_posted: string
          duration: number
          effort: string
          embedded_url: string
          gender: string
          genre: string
          gif_url: string
          handle: string
          hook: string
          id: number
          platform: string
          profile_followers: number
          sub_genre: string
          thumbnail_url: string
          total_count: number
          video_comments: string
          video_likes: number
          video_shares: number
          video_url: string
          video_views: number
          viral_score: number
        }[]
      }
      get_admin_health_extended: { Args: never; Returns: Json }
      get_artist_assignments: {
        Args: { p_label_id: string }
        Returns: {
          artist_handle: string
          email: string
          label_role: string
          user_id: string
        }[]
      }
      get_artist_sound_velocity: {
        Args: { p_label_id: string }
        Returns: {
          artist_handle: string
          sounds_tracked: number
          this_week_total_new_ugc: number
          top_sound_new_ugc: number
          top_sound_title: string
          top_sound_total_ugc: number
          velocity: string
        }[]
      }
      get_artist_video_timeline: {
        Args: { p_handle: string; p_limit?: number }
        Returns: {
          caption: string
          date_posted: string
          engagement_rate: number
          id: number
          momentum_tier: string
          performance_ratio: number
          video_comments: number
          video_likes: number
          video_saves: number
          video_shares: number
          video_views: number
        }[]
      }
      get_country_detail: {
        Args: { p_country_code: string; p_label_id?: string }
        Returns: Json
      }
      get_distinct_genres: {
        Args: never
        Returns: {
          genre: string
        }[]
      }
      get_distinct_sub_genres: {
        Args: never
        Returns: {
          sub_genre: string
        }[]
      }
      get_format_spark_scores: {
        Args: { p_job_id: string }
        Returns: {
          avg_spark_score: number
          format: string
          video_count: number
        }[]
      }
      get_founding_member_count: { Args: never; Returns: number }
      get_genre_waves: {
        Args: { p_days?: number; p_genre: string }
        Returns: Json
      }
      get_globe_data: {
        Args: { p_date?: string; p_label_id?: string }
        Returns: Json
      }
      get_handle_health_stats: { Args: never; Returns: Json }
      get_health_table_counts: { Args: never; Returns: Json }
      get_hitl_artist_aggregates: {
        Args: {
          p_min_plays?: number
          p_min_videos?: number
          p_platform?: string
        }
        Returns: {
          author_handle: string
          author_nickname: string
          avatar_url: string
          avg_engagement_rate: number
          avg_viral_score: number
          followers: number
          max_plays: number
          total_comments: number
          total_likes: number
          total_plays: number
          total_shares: number
          total_videos: number
        }[]
      }
      get_identity_coverage: { Args: never; Returns: Json }
      get_label_members: {
        Args: { p_label_id: string }
        Returns: {
          account_type: string
          email: string
          joined_at: string
          label_role: string
          user_id: string
        }[]
      }
      get_label_teammates: {
        Args: { p_label_id: string }
        Returns: {
          artist_handle: string
          email: string
          label_role: string
          user_id: string
        }[]
      }
      get_latest_scraper_runs: {
        Args: never
        Returns: {
          completed_at: string | null
          duration_ms: number | null
          entities_created: number | null
          entities_matched: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          rows_inserted: number | null
          scraper_group: string
          scraper_name: string
          started_at: string
          status: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "scraper_runs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_listeners_rank: {
        Args: { target_ids?: string[] }
        Returns: {
          entity_id: string
          listeners_rank: number
          total_artists: number
        }[]
      }
      get_member_number_by_email: {
        Args: { lookup_email: string }
        Returns: number
      }
      get_si_sound_performance: {
        Args: { p_label_id: string }
        Returns: {
          artist_name: string
          completed_at: string
          job_id: string
          si_status: string
          sound_id: string
          total_views: number
          track_name: string
          unique_creators: number
          videos_count: number
          weekly_new_videos: number
        }[]
      }
      get_song_cross_platform: { Args: { p_entity_id: string }; Returns: Json }
      get_sound_analysis_with_text_ids: {
        Args: { p_job_id: number }
        Returns: {
          audio_analysis: string
          id: number
          sound_author: string
          sound_coverimage_url: string
          sound_id: string
          sound_name: string
        }[]
      }
      get_suggestion_vote_count: {
        Args: { p_suggestion_id: string }
        Returns: number
      }
      get_table_counts: { Args: never; Returns: Json }
      get_table_sizes: { Args: never; Returns: Json }
      get_top_artists_by_listeners: {
        Args: { limit_count?: number }
        Returns: {
          entity_id: string
          value: number
        }[]
      }
      get_user_usage: { Args: { _user_id: string }; Returns: Json }
      get_velocity_grid: {
        Args: {
          p_artist_id?: string
          p_label_id: string
          p_min_streams?: number
          p_velocity_class?: string
        }
        Returns: Json
      }
      get_video_analysis_with_text_ids: {
        Args: { p_job_id: number }
        Returns: {
          caption: string
          content_url: string
          id: number
          post_comments: string
          post_likes: number
          post_shares: number
          post_views: number
          sound_id: string
          viral_score: number
          visual_analysis: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hybrid_search: {
        Args: {
          filter_date?: string
          filter_json?: Json
          full_text_weight?: number
          match_count: number
          match_threshold?: number
          min_views?: number
          query_embedding: string
          query_text: string
          semantic_weight?: number
          sort_by?: string
        }
        Returns: {
          content: string
          date_posted: string
          id: number
          metadata: Json
          performance_multiplier: number
          similarity: number
          velocity: number
          views: number
          viral_score: number
        }[]
      }
      increment_link_click: { Args: { link_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      label_hybrid_search: {
        Args: {
          full_text_weight?: number
          match_limit?: number
          p_artist_handle?: string
          p_category?: string
          p_label_id: string
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          artist_handle: string
          artist_name: string
          category: string
          content: string
          id: number
          metadata: Json
          score: number
          subcategory: string
        }[]
      }
      match_0_1__documents_gemini: {
        Args: {
          filter: Json
          match_count: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_gemini: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_rag_content: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      pipeline_health_stats: { Args: never; Returns: Json }
      refresh_globe_materialized_views: { Args: never; Returns: undefined }
      refresh_health_views: { Args: never; Returns: undefined }
      refresh_popular_videos: { Args: never; Returns: undefined }
      refresh_roster_metrics: {
        Args: { target_handle?: string }
        Returns: Json
      }
      remove_artist_assignment: {
        Args: { p_artist_handle: string; p_label_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_label_member: {
        Args: { p_label_id: string; p_target_user_id: string }
        Returns: undefined
      }
      segment_hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count?: number
          p_artist_handle?: string
          p_label_id?: string
          p_moment_type?: string
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          artist_handle: string
          catalog_id: string | null
          clip_extracted_at: string | null
          clip_storage_path: string | null
          clip_storage_url: string | null
          content: string
          created_at: string | null
          duration_seconds: number | null
          embedding: string | null
          end_seconds: number
          fan_potential_score: number | null
          fts: unknown
          id: string
          label_id: string | null
          metadata: Json | null
          moment_summary: string
          moment_type: string | null
          speaker: string | null
          start_seconds: number
          transcript_excerpt: string
          visual_confirmed: boolean | null
          visual_description: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "content_segments"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      swap_content_plan_idea: {
        Args: { p_artist_handle: string; p_day: string; p_new_option: string }
        Returns: Json
      }
      update_label_member_role: {
        Args: {
          p_label_id: string
          p_new_role: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      update_thumbnail_url: {
        Args: { p_thumbnail_url: string; p_video_id: number }
        Returns: boolean
      }
      upsert_founding_member_signup: {
        Args: {
          p_b2b_name_company?: string
          p_b2b_pilot_interest?: string
          p_b2b_team_size?: string
          p_biggest_challenges?: string[]
          p_current_solutions?: string[]
          p_deposit_paid?: boolean
          p_email: string
          p_instagram_handle?: string
          p_referral_code?: string
          p_referred_by?: string
          p_tiktok_handle?: string
          p_time_spent_weekly?: string
          p_usefulness_rating?: string
          p_user_type?: string
          p_wall_display_name?: string
          p_willingness_to_pay?: string
        }
        Returns: number
      }
      view_content_plan_ideas: {
        Args: { p_artist_handle: string }
        Returns: {
          day: string
          effort: string
          is_selected: boolean
          option: string
          slot_id: string
          source_type: string
          title: string
        }[]
      }
      wb_cleanup_old_observations: { Args: never; Returns: undefined }
    }
    Enums: {
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_role: "admin" | "moderator" | "user" | "label"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: ["pending", "processing", "completed", "failed"],
      app_role: ["admin", "moderator", "user", "label"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.90.0 (currently installed v2.84.2)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
