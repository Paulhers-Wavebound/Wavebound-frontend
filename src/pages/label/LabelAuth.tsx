import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import waveboundLogo from '@/assets/wavebound-logo.png';

const getSafeRedirect = (params: URLSearchParams): string => {
  const r = params.get('redirect');
  if (r && r.startsWith('/') && !r.startsWith('//')) return r;
  return '/label';
};

export default function LabelAuth() {
  const { inviteCode: urlInviteCode } = useParams<{ inviteCode?: string }>();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams);
  const [mode, setMode] = useState<'login' | 'signup'>(urlInviteCode ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(urlInviteCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirectTo, { replace: true });
    });
  }, [navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        toast({ title: 'Welcome back!' });
        navigate(redirectTo, { replace: true });
      } else {
        // Signup via edge function only — no fallback
        const cleaned = inviteCode.trim();
        if (!cleaned) {
          setError('Invite code is required');
          setLoading(false);
          return;
        }

        const { data, error: fnError } = await supabase.functions.invoke('label-signup', {
          body: { email, password, invite_code: cleaned },
        });

        if (fnError || data?.error) {
          // If the SDK swallowed the body (non-2xx), show a helpful fallback
          if (fnError && !data?.error) {
            setError('Signup failed — please check your details and try again, or contact support.');
            setLoading(false);
            return;
          }
          if (data?.code === 'DUPLICATE_EMAIL') {
            setError('An account with this email already exists. Please sign in instead.');
            setMode('login');
          } else {
            setError(data?.error || 'Signup failed. Please try again.');
          }
          setLoading(false);
          return;
        }

        // Edge function succeeded — sign in
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) { throw signInErr; }

        toast({ title: data?.label_name ? `Welcome to ${data.label_name}!` : 'Account created!' });
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors focus:border-[#5E5CE6]";
  const inputStyle = { background: '#1C1C1E', color: '#fff', borderColor: '#3A3A3C' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0A0A0A' }}>
      <SEOHead title="Label Portal — Sign In" description="Sign in to your label dashboard" />

      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={waveboundLogo} alt="Wavebound" className="w-10 h-10" />
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#8E8E93' }}>
            Label Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl" style={{ background: '#1C1C1E', border: '1px solid #3A3A3C' }}>
            <h1 className="text-xl font-bold text-center" style={{ color: '#fff' }}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#8E8E93' }}>Invite Code *</label>
                <input
                  type="text"
                  placeholder="Enter your label invite code"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#8E8E93' }}>Email</label>
              <input
                type="email"
                placeholder="you@label.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: '#8E8E93' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                style={inputStyle}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-xs font-medium" style={{ color: '#FF453A' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#5E5CE6', color: '#fff' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Please wait
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="text-center space-y-2">
              {mode === 'login' && (
                <Link to="/forgot-password" className="text-xs hover:underline block" style={{ color: '#5E5CE6' }}>
                  Forgot password?
                </Link>
              )}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                className="text-xs hover:underline"
                style={{ color: '#8E8E93' }}
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
