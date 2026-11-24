import React, { useEffect, useState } from 'react';
import { X, LogOut, CheckCircle2, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { HardwareButton } from './HardwarePrimitives.js';
import {
  BillingCycle,
  StaffRole,
  TierKey,
  signInWithChromeGoogle,
  signOutUser,
  syncUserProfile,
  verifyStaffAccess,
} from '../lib/firebase.js';

export interface KayaUserProfile {
  uid?: string;
  handle: string;
  email: string;
  signedInAt: string;
  role?: 'member' | StaffRole;
  tier?: TierKey;
  billingCycle?: BillingCycle;
  token?: string;
}

interface KayaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KayaUserProfile | null;
  onAuthChange: (user: KayaUserProfile | null) => void;
  initialMode?: 'signin' | 'signup';
}

function GoogleMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.5 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12Z"
      />
      <path
        fill="#34A853"
        d="M3.7 7.6 6.9 10c.9-2.5 3.2-4.1 5.1-4.1 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.5 2.5 12 2.5 8.3 2.5 5.1 4.6 3.7 7.6Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.5-1.8.9-3.1.9-2.4 0-4.5-1.6-5.2-3.8l-3.2 2.5c1.5 2.9 4.7 4.9 8.4 4.9Z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.2-1 2.2-2.3 2.9l2.9 2.3c1.7-1.6 3.1-4.1 3.1-7.5Z"
      />
    </svg>
  );
}

export function KayaAuthModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
  initialMode = 'signin',
}: KayaAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const fbUser = await signInWithChromeGoogle();
      const cloudDoc = await syncUserProfile(fbUser).catch(() => null);
      const staff = await verifyStaffAccess(fbUser).catch(() => null);

      onAuthChange({
        uid: fbUser.uid,
        handle: cloudDoc?.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Studio Member',
        email: fbUser.email || '',
        role: staff?.role || 'member',
        tier: cloudDoc?.tier || 'free',
        billingCycle: cloudDoc?.billingCycle || 'monthly',
        signedInAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in could not complete. Sign in with Username & Password below.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUser) {
      setError(mode === 'signin' ? 'Enter your username or email.' : 'Choose a username.');
      return;
    }
    if (!password || (mode === 'signup' && password.length < 6)) {
      setError(
        mode === 'signup'
          ? 'Choose a password with at least 6 characters.'
          : 'Enter your password.'
      );
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'signup'
          ? { username: trimmedUser, email: trimmedEmail, password }
          : { identifier: trimmedUser, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      onAuthChange({
        uid: data.user.uid,
        handle: data.user.handle,
        email: data.user.email,
        role: data.user.role || 'member',
        tier: data.user.tier || 'free',
        signedInAt: data.user.signedInAt || new Date().toISOString(),
        token: data.token,
      });
      onClose();
    } catch {
      setError('Unable to reach KAYA account server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore if session was username/password only
    }
    onAuthChange(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030102]/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[24px] bg-gradient-to-b from-[#17090D] to-[#080305] p-6 sm:p-7 space-y-5 shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,10,60,0.12)] border border-[#FF0A3C]/25"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Brand Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-bold uppercase tracking-[0.28em] see-thru-font"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              KAYA
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#E06844] mt-0.5">
              KNOCKSSTUDiOS · {user ? 'Active Account' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </p>
          </div>
          <HardwareButton
            size="sm"
            tone="red"
            ledIndicator={false}
            onClick={onClose}
            aria-label="Close sign in dialog"
          >
            <X className="w-4 h-4" />
          </HardwareButton>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="candy-trace-tile rounded-2xl p-4 flex items-center gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-white truncate">{user.handle}</p>
                <p className="font-mono text-xs text-[#F5E9EA]/65 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                <span>Done</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="red" active onClick={handleSignOut}>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </HardwareButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Switch */}
            <div className="grid grid-cols-2 gap-2">
              <HardwareButton
                size="sm"
                fullWidth
                tone="red"
                active={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
              >
                <span>Sign In</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                fullWidth
                tone="cyan"
                active={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
              >
                <span>Create Account</span>
              </HardwareButton>
            </div>

            {/* Primary Google Sign-In Button */}
            <HardwareButton
              type="button"
              size="md"
              fullWidth
              tone="cyan"
              active={false}
              disabled={googleLoading || loading}
              onClick={handleGoogleSignIn}
            >
              <GoogleMarkIcon />
              <span>{googleLoading ? 'Connecting Google…' : 'Continue with Google'}</span>
            </HardwareButton>

            {/* Clean Divider */}
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#F5E9EA]/45">
                or username &amp; password
              </span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Username / Email + Password Form */}
            <form onSubmit={handleCredentialSubmit} className="space-y-3">
              <div className="relative">
                <User className="w-4 h-4 text-[#E06844]/80 absolute left-4 top-3" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'signin' ? 'Username or Email' : 'Choose Username'}
                  className="w-full rounded-full bg-[#050203] border border-white/15 pl-11 pr-4 py-2.5 font-mono text-xs text-white placeholder:text-[#F5E9EA]/40 focus:outline-none focus:border-[#FF0A3C]"
                />
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#E06844]/80 absolute left-4 top-3" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address (optional)"
                    className="w-full rounded-full bg-[#050203] border border-white/15 pl-11 pr-4 py-2.5 font-mono text-xs text-white placeholder:text-[#F5E9EA]/40 focus:outline-none focus:border-[#FF0A3C]"
                  />
                </div>
              )}

              <div className="relative">
                <Lock className="w-4 h-4 text-[#E06844]/80 absolute left-4 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signin' ? 'Password' : 'Password (min 6 characters)'}
                  className="w-full rounded-full bg-[#050203] border border-white/15 pl-11 pr-11 py-2.5 font-mono text-xs text-white placeholder:text-[#F5E9EA]/40 focus:outline-none focus:border-[#FF0A3C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-2.5 text-[#F5E9EA]/50 hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="font-mono text-xs text-[#FF4D6D] px-1 leading-relaxed">{error}</p>
              )}

              <div className="pt-1 flex items-center justify-end gap-2.5">
                <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                  <span>Cancel</span>
                </HardwareButton>
                <HardwareButton
                  type="submit"
                  size="md"
                  tone="red"
                  active
                  disabled={loading || googleLoading}
                >
                  <span>
                    {loading
                      ? mode === 'signup'
                        ? 'Creating…'
                        : 'Signing In…'
                      : mode === 'signup'
                      ? 'Create Account'
                      : 'Sign In'}
                  </span>
                </HardwareButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
