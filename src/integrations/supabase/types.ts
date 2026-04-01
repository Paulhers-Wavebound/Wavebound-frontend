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
      artist_alerts: {
        Row: {
          alert_type: string
          artist_handle: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          label_id: string | null
          message: string | null
          push_sent: boolean | null
          push_sent_at: string | null
          severity: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          alert_type: string
          artist_handle: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          label_id?: string | null
          message?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          severity?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          alert_type?: string
          artist_handle?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          label_id?: string | null
          message?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          severity?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_alerts_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_artist_intelligence_label"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
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
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
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
          created_at: string
          id: string
          is_favorite: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      sound_intelligence_jobs: {
        Row: {
          album_name: string | null
          artist_name: string | null
          chorus_duration_ms: number | null
          chorus_start_ms: number | null
          completed_at: string | null
          cost_log: Json | null
          cover_url: string | null
          created_at: string
          error_log: Json | null
          id: string
          label_id: string | null
          last_refresh_at: string | null
          refresh_count: number | null
          requested_by: string | null
          sound_id: string | null
          sound_url: string
          status: string
          track_name: string | null
          updated_at: string
          user_count: number | null
          videos_analyzed: number | null
          videos_scraped: number | null
        }
        Insert: {
          album_name?: string | null
          artist_name?: string | null
          chorus_duration_ms?: number | null
          chorus_start_ms?: number | null
          completed_at?: string | null
          cost_log?: Json | null
          cover_url?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          label_id?: string | null
          last_refresh_at?: string | null
          refresh_count?: number | null
          requested_by?: string | null
          sound_id?: string | null
          sound_url: string
          status?: string
          track_name?: string | null
          updated_at?: string
          user_count?: number | null
          videos_analyzed?: number | null
          videos_scraped?: number | null
        }
        Update: {
          album_name?: string | null
          artist_name?: string | null
          chorus_duration_ms?: number | null
          chorus_start_ms?: number | null
          completed_at?: string | null
          cost_log?: Json | null
          cover_url?: string | null
          created_at?: string
          error_log?: Json | null
          id?: string
          label_id?: string | null
          last_refresh_at?: string | null
          refresh_count?: number | null
          requested_by?: string | null
          sound_id?: string | null
          sound_url?: string
          status?: string
          track_name?: string | null
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
          duration: number | null
          energy_level: string | null
          format_caption: string | null
          format_confidence: number | null
          format_final: string | null
          format_flash: string | null
          format_pro: string | null
          has_text_overlay: boolean | null
          hashtags: string | null
          hook_analysis: Json | null
          id: number
          is_singing: boolean | null
          job_id: string
          like_count: number | null
          music_begin_time_ms: number | null
          music_end_time_ms: number | null
          play_count: number | null
          region: string | null
          save_count: number | null
          share_count: number | null
          sound_author: string | null
          sound_id: string | null
          sound_title: string | null
          thumbnail_url: string | null
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
          duration?: number | null
          energy_level?: string | null
          format_caption?: string | null
          format_confidence?: number | null
          format_final?: string | null
          format_flash?: string | null
          format_pro?: string | null
          has_text_overlay?: boolean | null
          hashtags?: string | null
          hook_analysis?: Json | null
          id?: number
          is_singing?: boolean | null
          job_id: string
          like_count?: number | null
          music_begin_time_ms?: number | null
          music_end_time_ms?: number | null
          play_count?: number | null
          region?: string | null
          save_count?: number | null
          share_count?: number | null
          sound_author?: string | null
          sound_id?: string | null
          sound_title?: string | null
          thumbnail_url?: string | null
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
          duration?: number | null
          energy_level?: string | null
          format_caption?: string | null
          format_confidence?: number | null
          format_final?: string | null
          format_flash?: string | null
          format_pro?: string | null
          has_text_overlay?: boolean | null
          hashtags?: string | null
          hook_analysis?: Json | null
          id?: number
          is_singing?: boolean | null
          job_id?: string
          like_count?: number | null
          music_begin_time_ms?: number | null
          music_end_time_ms?: number | null
          play_count?: number | null
          region?: string | null
          save_count?: number | null
          share_count?: number | null
          sound_author?: string | null
          sound_id?: string | null
          sound_title?: string | null
          thumbnail_url?: string | null
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
      get_artist_assignments: {
        Args: { p_label_id: string }
        Returns: {
          artist_handle: string
          email: string
          label_role: string
          user_id: string
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
      get_founding_member_count: { Args: never; Returns: number }
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
      get_member_number_by_email: {
        Args: { lookup_email: string }
        Returns: number
      }
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
      get_user_usage: { Args: { _user_id: string }; Returns: Json }
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
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
