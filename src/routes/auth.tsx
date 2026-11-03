import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/components/auth-context';
import { isValidEmail, passwordStrength, type Strength } from '@/lib/auth-gate';
import { pageMeta } from '@/components/studio-layout';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import logo from '@/assets/logo.png.asset.json';

export const Route = createFileRoute('/auth')({
  head: () => pageMeta('Enter the Portal', 'Sign in to Beyond A-Z, where 26 letters ignite infinite multiverses.'),
  component: Gateway,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.6c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.6-5.1 3.6-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1l-3.8 2.9C3.2 21.2 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.1 0 12s.4 3.6 1.2 5.2l3.9-2.9z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.8 1.2 6.8l3.9 2.9C6 6.8 8.8 4.7 12 4.7z" />
    </svg>
  );
}

const friendlyAuthError = (message: string) => {
  if (/invalid login credentials/i.test(message)) return 'That spell does not match our records.';
  if (/already registered/i.test(message)) return 'This email already walks our halls — try signing in.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email first — the raven is waiting in your inbox.';
  if (/rate limit/i.test(message)) return 'Too many attempts — the portal needs a breath. Try again shortly.';
  return message;
};

function Gateway() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [penName, setPenName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState<null | 'password' | 'google' | 'lovable'>(null);

  useEffect(() => {
    if (hydrated && user) void navigate({ to: '/', replace: true });
  }, [hydrated, user, navigate]);

  const socialSignIn = async (provider: 'google' | 'lovable') => {
    setBusy(provider === 'google' ? 'google' : 'lovable');
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
        extraParams: provider === 'google' ? { prompt: 'select_account' } : {},
      });
      if (result.error) {
        toast.error(friendlyAuthError(result.error.message || 'The portal did not open. Try again.'));
        setBusy(null);
        return;
      }
      if (!result.redirected) {
        setBusy(null);
        void navigate({ to: '/', replace: true });
      }
    } catch {
      toast.error('The portal did not open. Try again.');
      setBusy(null);
    }
  };

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(email)) { toast.error('That email does not look quite magical yet.'); return; }
    if (!password) { toast.error('Your secret spell (password) is missing.'); return; }
    setBusy('password');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { toast.error(friendlyAuthError(error.message)); setBusy(null); return; }
    void navigate({ to: '/', replace: true });
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!penName.trim()) { toast.error('Every creator needs a pen name.'); return; }
    if (!isValidEmail(email)) { toast.error('That email does not look quite magical yet.'); return; }
    if (passwordStrength(password) === 'weak') { toast.error('Choose at least 8 characters so your spell holds.'); return; }
    if (password !== confirm) { toast.error('The two passwords do not match.'); return; }
    if (!agreed) { toast.error('Please agree to the Terms of the Multiverse first.'); return; }
    setBusy('password');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: penName.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) { toast.error(friendlyAuthError(error.message)); setBusy(null); return; }
    if (data.session) { void navigate({ to: '/', replace: true }); return; }
    toast.info('A confirmation raven is flying to your inbox — click the link to ignite your account.');
    setBusy(null);
  };

  const sendReset = () => {
    if (!isValidEmail(email)) { toast.error('Type your email above first, then the raven can find you.'); return; }
    void supabase.auth
      .resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
      .then(({ error }) => toast.info(error ? friendlyAuthError(error.message) : 'A recovery raven is on its way — check your inbox for the reset scroll.'));
  };

  const strength: Strength | null = password ? passwordStrength(password) : null;
  const strengthLabel = strength === 'weak' ? 'Weak' : strength === 'good' ? 'Good' : strength === 'magical' ? 'Magical' : '';
  const locked = busy !== null;

  return (
    <section className="auth-screen">
      <div className="auth-stars" aria-hidden="true" />
      <div className="auth-stars auth-stars-slow" aria-hidden="true" />
      <div className="auth-card">
        <img src={logo.url} alt="Beyond A-Z open book and imagination portal logo" className="auth-logo" width={88} height={88} />
        <strong className="auth-brand">Beyond A-Z<span className="brand-star">✧</span></strong>
        <p className="auth-tagline">Where 26 letters ignite infinite multiverses.</p>

        {mode === 'signin' ? (
          <form className="auth-form" onSubmit={event => void signIn(event)}>
            <h1>Welcome Back, Creator</h1>
            <p className="auth-sub">Step back into the realm of infinite stories.</p>
            <label className="auth-field">
              <Mail size={15} />
              <input type="email" placeholder="you@beyondaz.app" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required disabled={locked} />
            </label>
            <label className="auth-field">
              <Lock size={15} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Your secret spell" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required disabled={locked} />
              <button type="button" className="pw-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </label>
            <div className="auth-row">
              <button type="button" className="auth-link" onClick={sendReset}>Forgot Password?</button>
            </div>
            <Button variant="enchanted" size="lg" className="auth-cta" disabled={locked}><Sparkles /> Enter the Portal</Button>
            <div className="auth-divider"><span>or continue with</span></div>
            <Button type="button" variant="glass" className="auth-google" onClick={() => void socialSignIn('google')} disabled={locked}><GoogleIcon /> Sign in with Google</Button>
            <Button type="button" variant="ghost" className="auth-lovable" onClick={() => void socialSignIn('lovable')} disabled={locked}><Sparkles size={15} /> Continue with Lovable</Button>
            <p className="auth-switch">New to Beyond A-Z?<button type="button" onClick={() => setMode('signup')}>Create an Account</button></p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={event => void signUp(event)}>
            <h1>Begin Your Creative Journey</h1>
            <p className="auth-sub">Transcend the limits of ordinary thought.</p>
            <label className="auth-field">
              <UserRound size={15} />
              <input type="text" placeholder="Full name or pen name" value={penName} onChange={e => setPenName(e.target.value)} maxLength={40} required disabled={locked} />
            </label>
            <label className="auth-field">
              <Mail size={15} />
              <input type="email" placeholder="you@beyondaz.app" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required disabled={locked} />
            </label>
            <label className="auth-field">
              <Lock size={15} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Choose a secret spell" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required disabled={locked} />
              <button type="button" className="pw-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </label>
            <div className={`strength${strength ? ` strength-${strength}` : ''}`}>
              <div className="strength-track"><div className="strength-fill" /></div>
              <span className="strength-label">{strengthLabel}</span>
            </div>
            <label className="auth-field">
              <Lock size={15} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Confirm your secret spell" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required disabled={locked} />
            </label>
            <label className="auth-terms">
              <Checkbox checked={agreed} onCheckedChange={checked => setAgreed(checked === true)} disabled={locked} aria-label="Agree to the terms" />
              <span>I agree to the <button type="button" className="auth-link" onClick={() => toast.info('The Terms of the Multiverse: be kind, keep creating, believe in impossible things.')}>Terms of the Multiverse</button> and <button type="button" className="auth-link" onClick={() => toast.info('Privacy Lore: your creations are saved to your own Beyond A-Z account and stay yours.')}>Privacy Lore</button>.</span>
            </label>
            <Button variant="enchanted" size="lg" className="auth-cta" disabled={locked}><Sparkles /> Ignite Your Account</Button>
            <div className="auth-divider"><span>or continue with</span></div>
            <Button type="button" variant="glass" className="auth-google" onClick={() => void socialSignIn('google')} disabled={locked}><GoogleIcon /> Sign up with Google</Button>
            <Button type="button" variant="ghost" className="auth-lovable" onClick={() => void socialSignIn('lovable')} disabled={locked}><Sparkles size={15} /> Continue with Lovable</Button>
            <p className="auth-switch">Already have an account?<button type="button" onClick={() => setMode('signin')}>Sign In</button></p>
          </form>
        )}
      </div>

      {busy && (
        <div className="auth-veil" role="status">
          <img src={logo.url} alt="" className="auth-veil-logo" width={74} height={74} />
          <div className="auth-swirl" />
          <p>Opening the portal…</p>
        </div>
      )}
    </section>
  );
}
