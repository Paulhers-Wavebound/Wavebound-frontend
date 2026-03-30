import { useState, useEffect, ReactNode } from 'react';
import waveboundLogo from '@/assets/wavebound-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';

const ACCESS_KEY = 'site_access_granted';

const GATE_CREDENTIALS = [
  { username: 'YC2026', password: 'YC2026PW' },
  { username: 'beta2026', password: 'beta2026PW' },
  { username: 'BETA2026', password: 'BETA2026PW' },
];

export const AccessGate = ({ children }: { children: ReactNode }) => {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const check = async () => {
      // Check sessionStorage first
      if (sessionStorage.getItem(ACCESS_KEY) === 'true') {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      // Check if logged-in Supabase user is admin
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin',
          });
          if (data === true) {
            sessionStorage.setItem(ACCESS_KEY, 'true');
            setAuthorized(true);
          }
        }
      } catch (e) {
        // Not admin, continue to gate
      }
      setChecking(false);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (GATE_CREDENTIALS.some(cred => username === cred.username && password === cred.password)) {
      sessionStorage.setItem(ACCESS_KEY, 'true');
      setAuthorized(true);
    } else {
      setError('Invalid credentials');
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
      <div className="relative">
        <img src={waveboundLogo} alt="Wavebound" className="h-16 object-contain" />
        <span className="absolute -top-1 -right-10 text-xs font-medium text-primary">(beta)</span>
      </div>
      <div className="w-full max-w-sm text-center space-y-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Launching very soon. Founding members will get access first — so keep an eye out for that e-mail. Follow us on{' '}
          <a
            href="https://instagram.com/wavebound.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            @wavebound.ai
          </a>{' '}
          for updates.
        </p>
      </div>
      <Card className="w-full max-w-sm border-2 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Access Required</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-username">Username</Label>
              <Input
                id="gate-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate-password">Password</Label>
              <Input
                id="gate-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground/60">Founding members: 500 / 500 — Thank you ❤️</p>
    </div>
  );
};
