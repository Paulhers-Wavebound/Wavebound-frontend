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
        ]
      }
      "0.1. Table 2 - Video - TikTok": {
        Row: {
          author_id: number | null
          caption: string | null
          created_at: string
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number
          language: string | null
          performance_multiplier: string | null
          post_id: number | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_saves: number | null
          video_shares: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
        }
        Insert: {
          author_id?: number | null
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: number | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
        }
        Update: {
          author_id?: number | null
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: number | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_saves?: number | null
          video_shares?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
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
          created_at: string
          date_posted: string | null
          duration: number | null
          hashtags: string | null
          id: number
          language: string | null
          performance_multiplier: string | null
          post_id: string | null
          replay_rate: number | null
          video_comments: number | null
          video_embedded_url: string | null
          video_likes: number | null
          video_url: string | null
          video_views: number | null
          viral_score: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          replay_rate?: number | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          date_posted?: string | null
          duration?: number | null
          hashtags?: string | null
          id?: number
          language?: string | null
          performance_multiplier?: string | null
          post_id?: string | null
          replay_rate?: number | null
          video_comments?: number | null
          video_embedded_url?: string | null
          video_likes?: number | null
          video_url?: string | null
          video_views?: number | null
          viral_score?: number | null
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
      "Audio_analysis_PC_Bridge.Audio": {
        Row: {
          bpm: number | null
          created_at: string
          genre: string | null
          id: number
          instruments: string | null
          key: string | null
          mood: string | null
          movement: string | null
          PC_ID: number | null
          vocal: string | null
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          genre?: string | null
          id?: number
          instruments?: string | null
          key?: string | null
          mood?: string | null
          movement?: string | null
          PC_ID?: number | null
          vocal?: string | null
        }
        Update: {
          bpm?: number | null
          created_at?: string
          genre?: string | null
          id?: number
          instruments?: string | null
          key?: string | null
          mood?: string | null
          movement?: string | null
          PC_ID?: number | null
          vocal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Audio_analysis_PC_PC_ID_fkey"
            columns: ["PC_ID"]
            isOneToOne: false
            referencedRelation: "tiktok_photo_carousel"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_links: {
        Row: {
          click_count: number
          created_at: string
          id: string
          is_active: boolean
          is_presave: boolean
          platform_type: string | null
          profile_id: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_presave?: boolean
          platform_type?: string | null
          profile_id: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_presave?: boolean
          platform_type?: string | null
          profile_id?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "bio_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      documents_gemini: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
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
      Gif_thumbnails_backup: {
        Row: {
          asset_type: string | null
          created_at: string
          id: number
          storage_id: string | null
          storage_path: string | null
          url: string | null
          video_id: number | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Gif_thumbnails_backup_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tiktok_videos_all"
            referencedColumns: ["id"]
          },
        ]
      }
      "Hook Analysis": {
        Row: {
          created_at: string
          "Full Dump Cover": string | null
          "Full Dump Hook Statement": string | null
          "Full Dump Live Performance": string | null
          "Full Dump Lyric Video": string | null
          "Full Dump Meme": string | null
          "Full Dump Pro Camera Lipsync": string | null
          "Full Dump Selfie Lipsync": string | null
          "Full Dump Selfie Performance": string | null
          id: number
          "Tiktok link": string | null
        }
        Insert: {
          created_at?: string
          "Full Dump Cover"?: string | null
          "Full Dump Hook Statement"?: string | null
          "Full Dump Live Performance"?: string | null
          "Full Dump Lyric Video"?: string | null
          "Full Dump Meme"?: string | null
          "Full Dump Pro Camera Lipsync"?: string | null
          "Full Dump Selfie Lipsync"?: string | null
          "Full Dump Selfie Performance"?: string | null
          id?: number
          "Tiktok link"?: string | null
        }
        Update: {
          created_at?: string
          "Full Dump Cover"?: string | null
          "Full Dump Hook Statement"?: string | null
          "Full Dump Live Performance"?: string | null
          "Full Dump Lyric Video"?: string | null
          "Full Dump Meme"?: string | null
          "Full Dump Pro Camera Lipsync"?: string | null
          "Full Dump Selfie Lipsync"?: string | null
          "Full Dump Selfie Performance"?: string | null
          id?: number
          "Tiktok link"?: string | null
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
        Relationships: [
          {
            foreignKeyName: "media_assets_gif_thumbnail_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tiktok_videos_all"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets_gif_thumbnail_Reels: {
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
        Relationships: [
          {
            foreignKeyName: "media_assets_gif_thumbnail_Reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "reels_all"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "media_assets_instagram_reels_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "reels_all"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets_tiktok_videos: {
        Row: {
          asset_type: string | null
          created_at: string
          id: number
          storage_id: string | null
          storage_path: string | null
          url: string | null
          video_id: number | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          id?: number
          storage_id?: string | null
          storage_path?: string | null
          url?: string | null
          video_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_tiktok_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "tiktok_videos_all"
            referencedColumns: ["id"]
          },
        ]
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
      presave_queue: {
        Row: {
          created_at: string
          id: string
          processed: boolean
          processed_at: string | null
          profile_id: string
          release_date: string
          song_isrc: string
          user_email: string | null
          user_refresh_token: string | null
          user_spotify_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          profile_id: string
          release_date: string
          song_isrc: string
          user_email?: string | null
          user_refresh_token?: string | null
          user_spotify_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          profile_id?: string
          release_date?: string
          song_isrc?: string
          user_email?: string | null
          user_refresh_token?: string | null
          user_spotify_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presave_queue_profile_id_fkey"
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
      rag_videos: {
        Row: {
          content: string
          embedding: string | null
          id: number
          metadata: Json
          video_id: number
        }
        Insert: {
          content: string
          embedding?: string | null
          id?: number
          metadata: Json
          video_id: number
        }
        Update: {
          content?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          video_id?: number
        }
        Relationships: []
      }
      reels_all: {
        Row: {
          Artist: string | null
          audience: string | null
          audio_url_320k: string | null
          audio_url_96k: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          duration: number | null
          embedded_url: string
          emotional_profile: string | null
          gender: string | null
          genre: string | null
          genre_2: string | null
          handle: string | null
          hashtags: string | null
          hook: string | null
          id: number
          instruments: string | null
          Location: string | null
          lyric_analysis: string | null
          median_views: number | null
          mood: string | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          technical_feedback: string | null
          video_file_url: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_url: string | null
          video_views: number | null
          viral_views: number | null
          voices: string | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_url: string
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          handle?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          instruments?: string | null
          Location?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          technical_feedback?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          voices?: string | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_url?: string
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          handle?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          instruments?: string | null
          Location?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          technical_feedback?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          voices?: string | null
          "who?"?: string | null
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
      "semi-viral_videos_90days": {
        Row: {
          Artist: string | null
          audience: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          embedded_ulr: string
          gender: string | null
          genre: string | null
          hashtags: string | null
          hook: string | null
          id: number
          median_views: number | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          thumbnail: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_url: string | null
          video_views: number | null
          viral_views: number | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr: string
          gender?: string | null
          genre?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          median_views?: number | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          thumbnail?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr?: string
          gender?: string | null
          genre?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          median_views?: number | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          thumbnail?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
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
      test_video: {
        Row: {
          created_at: string
          id: number
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          video_url?: string | null
        }
        Relationships: []
      }
      testing: {
        Row: {
          created_at: string
          embedded_url: string | null
          id: number
        }
        Insert: {
          created_at?: string
          embedded_url?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          embedded_url?: string | null
          id?: number
        }
        Relationships: []
      }
      tiktok_photo_carousel: {
        Row: {
          artist: string | null
          Audience: string | null
          audio_url_320k: string | null
          audio_url_96k: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          content_sub_style: string | null
          created_at: string
          date_posted: string | null
          embedded_url: string | null
          emotional_profile: string | null
          gender: string | null
          genre: string | null
          genre_status: string | null
          Hook: string | null
          hook_confidence: number | null
          id: number
          instruments: string | null
          lyric_analysis: string | null
          median_views: number | null
          mood: string | null
          outliar_score: number | null
          photo_likes: number | null
          photo_saves: number | null
          photo_shares: number | null
          photo_text_1: string | null
          photo_text_2: string | null
          photo_text_3: string | null
          photo_text_4: string | null
          photo_text_5: string | null
          photo_url_1: string | null
          photo_url_10: string | null
          photo_url_2: string | null
          photo_url_3: string | null
          photo_url_4: string | null
          photo_url_5: string | null
          photo_url_6: string | null
          photo_url_7: string | null
          photo_url_8: string | null
          photo_url_9: string | null
          photo_views: number | null
          posts: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          reasoning: string | null
          sound_id: number | null
          sound_url: string | null
          sub_genre: string | null
          technical_feedback: string | null
          voices: string | null
          "who?": string | null
        }
        Insert: {
          artist?: string | null
          Audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          content_sub_style?: string | null
          created_at?: string
          date_posted?: string | null
          embedded_url?: string | null
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_status?: string | null
          Hook?: string | null
          hook_confidence?: number | null
          id?: number
          instruments?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          outliar_score?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_shares?: number | null
          photo_text_1?: string | null
          photo_text_2?: string | null
          photo_text_3?: string | null
          photo_text_4?: string | null
          photo_text_5?: string | null
          photo_url_1?: string | null
          photo_url_10?: string | null
          photo_url_2?: string | null
          photo_url_3?: string | null
          photo_url_4?: string | null
          photo_url_5?: string | null
          photo_url_6?: string | null
          photo_url_7?: string | null
          photo_url_8?: string | null
          photo_url_9?: string | null
          photo_views?: number | null
          posts?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          reasoning?: string | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: string | null
          voices?: string | null
          "who?"?: string | null
        }
        Update: {
          artist?: string | null
          Audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          content_sub_style?: string | null
          created_at?: string
          date_posted?: string | null
          embedded_url?: string | null
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_status?: string | null
          Hook?: string | null
          hook_confidence?: number | null
          id?: number
          instruments?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          outliar_score?: number | null
          photo_likes?: number | null
          photo_saves?: number | null
          photo_shares?: number | null
          photo_text_1?: string | null
          photo_text_2?: string | null
          photo_text_3?: string | null
          photo_text_4?: string | null
          photo_text_5?: string | null
          photo_url_1?: string | null
          photo_url_10?: string | null
          photo_url_2?: string | null
          photo_url_3?: string | null
          photo_url_4?: string | null
          photo_url_5?: string | null
          photo_url_6?: string | null
          photo_url_7?: string | null
          photo_url_8?: string | null
          photo_url_9?: string | null
          photo_views?: number | null
          posts?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          reasoning?: string | null
          sound_id?: number | null
          sound_url?: string | null
          sub_genre?: string | null
          technical_feedback?: string | null
          voices?: string | null
          "who?"?: string | null
        }
        Relationships: []
      }
      tiktok_videos_all: {
        Row: {
          Artist: string | null
          audience: string | null
          audio_url_320k: string | null
          audio_url_96k: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          duration: number | null
          embedded_ulr: string
          emotional_profile: string | null
          gender: string | null
          genre: string | null
          genre_2: string | null
          hashtags: string | null
          hook: string | null
          id: number
          instruments: string | null
          Location: string | null
          lyric_analysis: string | null
          median_views: number | null
          mood: string | null
          "not working": string | null
          "not working ignore": string | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          technical_feedback: string | null
          video_file_url: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_url: string | null
          video_views: number | null
          viral_views: number | null
          voices: string | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_ulr: string
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          instruments?: string | null
          Location?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          "not working"?: string | null
          "not working ignore"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          technical_feedback?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          voices?: string | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_ulr?: string
          emotional_profile?: string | null
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          instruments?: string | null
          Location?: string | null
          lyric_analysis?: string | null
          median_views?: number | null
          mood?: string | null
          "not working"?: string | null
          "not working ignore"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          technical_feedback?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          voices?: string | null
          "who?"?: string | null
        }
        Relationships: []
      }
      tiktok_videos_all__backup: {
        Row: {
          Artist: string | null
          audience: string | null
          audio_url_320k: string | null
          audio_url_96k: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          duration: number | null
          embedded_ulr: string
          gender: string | null
          genre: string | null
          genre_2: string | null
          hashtags: string | null
          hook: string | null
          id: number
          Location: string | null
          median_views: number | null
          "not working": string | null
          "not working ignore": string | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          video_file_url: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_url: string | null
          video_views: number | null
          viral_views: number | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_ulr: string
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          Location?: string | null
          median_views?: number | null
          "not working"?: string | null
          "not working ignore"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          audio_url_320k?: string | null
          audio_url_96k?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          duration?: number | null
          embedded_ulr?: string
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          Location?: string | null
          median_views?: number | null
          "not working"?: string | null
          "not working ignore"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Relationships: []
      }
      tiktok_videos_all_duplicate_backup: {
        Row: {
          Artist: string | null
          audience: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          embedded_ulr: string
          gender: string | null
          genre: string | null
          genre_2: string | null
          hashtags: string | null
          hook: string | null
          id: number
          Location: string | null
          median_views: number | null
          "not working": string | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          video_file_url: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_url: string | null
          video_views: number | null
          viral_views: number | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr: string
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          Location?: string | null
          median_views?: number | null
          "not working"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr?: string
          gender?: string | null
          genre?: string | null
          genre_2?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          Location?: string | null
          median_views?: number | null
          "not working"?: string | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_url?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
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
      viral_videos: {
        Row: {
          created_at: string
          embed_url: string
          genre: string | null
          id: string
          title: string
          vibe: string | null
          views: number | null
        }
        Insert: {
          created_at?: string
          embed_url: string
          genre?: string | null
          id: string
          title: string
          vibe?: string | null
          views?: number | null
        }
        Update: {
          created_at?: string
          embed_url?: string
          genre?: string | null
          id?: string
          title?: string
          vibe?: string | null
          views?: number | null
        }
        Relationships: []
      }
      "viral_videos_90-180days": {
        Row: {
          Artist: string | null
          audience: string | null
          avatar_url: string | null
          caption: string | null
          comments: string | null
          content_style: string | null
          date_posted: string | null
          embedded_ulr: string
          gender: string | null
          genre: string | null
          hashtags: string | null
          hook: string | null
          id: number
          median_views: number | null
          outliar_score: number | null
          profile_bio: string | null
          profile_followers: number | null
          profile_likes: number | null
          profile_url: string | null
          profile_videos: string | null
          shot_on: string | null
          sound: string | null
          sound_id: number | null
          sub_genre: string | null
          "sub-style": string | null
          thumbnail: string | null
          video_file_url: string | null
          video_likes: number | null
          video_saves: string | null
          video_shares: number | null
          video_text: string | null
          video_views: number | null
          viral_views: number | null
          "who?": string | null
        }
        Insert: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr: string
          gender?: string | null
          genre?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          median_views?: number | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          thumbnail?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Update: {
          Artist?: string | null
          audience?: string | null
          avatar_url?: string | null
          caption?: string | null
          comments?: string | null
          content_style?: string | null
          date_posted?: string | null
          embedded_ulr?: string
          gender?: string | null
          genre?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: number
          median_views?: number | null
          outliar_score?: number | null
          profile_bio?: string | null
          profile_followers?: number | null
          profile_likes?: number | null
          profile_url?: string | null
          profile_videos?: string | null
          shot_on?: string | null
          sound?: string | null
          sound_id?: number | null
          sub_genre?: string | null
          "sub-style"?: string | null
          thumbnail?: string | null
          video_file_url?: string | null
          video_likes?: number | null
          video_saves?: string | null
          video_shares?: number | null
          video_text?: string | null
          video_views?: number | null
          viral_views?: number | null
          "who?"?: string | null
        }
        Relationships: []
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
      popular_videos: {
        Row: {
          Artist: string | null
          caption: string | null
          date_posted: string | null
          embedded_ulr: string | null
          genre: string | null
          id: number | null
          profile_followers: number | null
          source_table: string | null
          sub_genre: string | null
          thumbnail: string | null
          video_file_url: string | null
          video_likes: number | null
          video_shares: number | null
          video_views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
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
      update_thumbnail_url: {
        Args: { p_thumbnail_url: string; p_video_id: number }
        Returns: boolean
      }
    }
    Enums: {
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
