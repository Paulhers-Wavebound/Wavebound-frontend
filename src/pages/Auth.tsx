import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import SEOHead from '@/components/SEOHead';
import LabelOnboardingModal from '@/components/LabelOnboardingModal';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [labelCode, setLabelCode] = useState('');
  const [labelCodeError, setLabelCodeError] = useState('');
  const [showLabelOnboarding, setShowLabelOnboarding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const from = (location.state as { from?: string })?.from || '/content-plan';

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false);
    }
  }, [searchParams]);

  const processReferralSignup = async (userId: string) => {
    if (!referralCode) return;
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_user_id')
        .eq('referral_code', referralCode)
        .single();
      if (referral) {
        await supabase.from('referral_signups').insert({
          referral_id: referral.id,
          referred_user_id: userId,
        });
        const { data: existingAchievement } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', referral.referrer_user_id)
          .eq('achievement_type', 'first_referral')
          .single();
        if (!existingAchievement) {
          await supabase.from('user_achievements').insert({
            user_id: referral.referrer_user_id,
            achievement_type: 'first_referral',
          });
        }
      }
    } catch (error) {
      console.error('Error processing referral:', error);
    }
  };

  const validateLabelCode = async (code: string): Promise<{ valid: boolean; error?: string; labelName?: string; labelId?: string }> => {
    const cleaned = code.trim();
    if (!cleaned) return { valid: false, error: 'Label code is required' };

    const { data, error } = await (supabase.from as any)('labels')
      .select('id, name, slug')
      .eq('invite_code', cleaned)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return { valid: false, error: 'Invalid invite code.' };

    return { valid: true, labelName: data.name, labelId: data.id };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLabelCodeError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });

        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        if (signedInUser) {
          const { data: hasLabel } = await supabase.rpc('has_role', {
            _user_id: signedInUser.id,
            _role: 'label' as any,
          });
          if (hasLabel) {
            navigate('/label', { replace: true });
            return;
          }
        }
        navigate(from);
      } else {
        // --- Validate label code BEFORE creating account ---
        const validation = await validateLabelCode(labelCode);
        if (!validation.valid) {
          setLabelCodeError(validation.error || 'Invalid code');
          setLoading(false);
          return;
        }

        // --- Create account ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;

        // Link founding member record
        if (data.user) {
          await supabase
            .from('founding_member_signups' as any)
            .update({ user_id: data.user.id })
            .eq('email', email.toLowerCase());
        }

        // Process referral
        if (data.user && referralCode) {
          await processReferralSignup(data.user.id);
        }

        // Insert user_profiles with label_id
        if (data.user && validation.labelId) {
          try {
            await (supabase.from as any)('user_profiles').insert({
              user_id: data.user.id,
              label_id: validation.labelId,
            });
            toast({ title: `Welcome to ${validation.labelName}!` });
            setShowLabelOnboarding(true);
          } catch (lcErr: any) {
            console.error('Profile creation error:', lcErr);
            toast({ title: 'Code issue', description: 'Account created but label linking failed.', variant: 'destructive' });
          }
        }

        if (data.session) {
          toast({ title: 'Account created!' });
          navigate(from, { replace: true });
        } else {
          toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
          setShowConfirmation(true);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout withHeaderPadding>
      <SEOHead 
        title="Sign In - Wavebound"
        description="Sign in or create an account to access your content plans, favorites, and AI-powered content strategy tools."
      />
      <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-8rem)]">
      {showConfirmation ? (
        <Card className="w-full max-w-md border-2 shadow-xl text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Thank you for signing up!</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to <strong>{email}</strong>. Please check your inbox (and spam folder) to confirm your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full mt-2"
              onClick={() => { setShowConfirmation(false); setIsLogin(true); }}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card className="w-full max-w-md border-2 shadow-xl">
        {referralCode && !isLogin && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center gap-2 text-sm text-primary">
            <Gift className="h-4 w-4" />
            <span>You were invited by a friend!</span>
          </div>
        )}
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? 'Sign in to access your content plans'
              : referralCode 
                ? 'Join your friend on Wavebound'
                : 'Enter your label code to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="labelCode">Label Invite Code</Label>
                <Input
                  id="labelCode"
                  type="text"
                  placeholder="Enter your label code"
                  value={labelCode}
                  onChange={(e) => { setLabelCode(e.target.value); setLabelCodeError(''); }}
                  disabled={loading}
                  required
                  className={labelCodeError ? 'border-destructive' : ''}
                />
                {labelCodeError && (
                  <p className="text-sm text-destructive">{labelCodeError}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm space-y-2">
            {isLogin && (
              <Link
                to="/forgot-password"
                className="text-primary hover:underline block"
              >
                Forgot password?
              </Link>
            )}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setLabelCodeError(''); }}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
      )}
      </div>
      <LabelOnboardingModal 
        open={showLabelOnboarding} 
        onClose={() => { setShowLabelOnboarding(false); navigate('/content-plan'); }} 
      />
    </AppLayout>
  );
};

export default Auth;
