-- Create referrals table for tracking referral codes and rewards
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create referral signups table to track who signed up via referral
CREATE TABLE public.referral_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE,
  signed_up_at timestamp with time zone NOT NULL DEFAULT now(),
  reward_granted boolean NOT NULL DEFAULT false,
  reward_granted_at timestamp with time zone
);

-- Create user achievements table for badges
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achievement_data jsonb DEFAULT '{}',
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referral codes" 
ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can create their own referral codes" 
ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

-- RLS Policies for referral_signups (referrers can see their signups)
CREATE POLICY "Referrers can view signups from their codes" 
ON public.referral_signups FOR SELECT 
USING (referral_id IN (SELECT id FROM public.referrals WHERE referrer_user_id = auth.uid()));

-- Allow anyone to insert a signup (needed when new user signs up with referral code)
CREATE POLICY "Allow signup insertion" 
ON public.referral_signups FOR INSERT WITH CHECK (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" 
ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referral_signups_referral_id ON public.referral_signups(referral_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);