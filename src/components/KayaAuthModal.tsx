import React, { useEffect, useState } from 'react';
import { X, LogOut, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { PlateBezel, HardwareButton } from './HardwarePrimitives.js';
import {
  BillingCycle,
  StaffRole,
  TierKey,
  auth,
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

export function KayaAuthModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
  initialMode = 'signin',
}: KayaAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [challengeQuestion, setChallengeQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = async () => {
    try {
      const res = await fetch('/api/verify/challenge');
      if (res.ok) {
        const data = await res.json();
        setChallengeId(data.challengeId);
        setChallengeQuestion(data.question);
        setCaptchaAnswer('');
      }
    } catch {
      // ignore offline
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      loadChallenge();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const verifyCaptcha = async (): Promise<boolean> => {
    const res = await fetch('/api/verify/captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, answer: captchaAnswer }),
    });
    const data = await res.json();
    if (!res.ok || !data.verified) {
      await loadChallenge();
      setError(data.error || 'Complete the verification check before continuing.');
      return false;
    }
    return true;
  };

  const handleChromeGoogleSignIn = async () => {
    setError(null);
    if (!(await verifyCaptcha())) return;

    setLoading(true);
    try {
      const fbUser = await signInWithChromeGoogle();
      const cloudDoc = await syncUserProfile(fbUser);
      const staff = await verifyStaffAccess(fbUser).catch(() => null);

      onAuthChange({
        uid: fbUser.uid,
        handle: cloudDoc.displayName || fbUser.displayName || 'Vortex Creator',
        email: fbUser.email || '',
        role: staff?.role || 'member',
        tier: cloudDoc.tier || 'free',
        billingCycle: cloudDoc.billingCycle || 'monthly',
        signedInAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Chrome sign-in cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!(await verifyCaptcha())) return;

    const trimmedEmail = email.trim();
    const trimmedHandle = handle.trim() || trimmedEmail.split('@')[0] || 'Vortex Creator';
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, handle: trimmedHandle, mode }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      onAuthChange({
        uid: auth.currentUser?.uid,
        handle: data.user.handle,
        email: data.user.email,
        role: 'member',
        tier: data.user.tier || 'free',
        signedInAt: new Date().toISOString(),
        token: data.token,
      });
      onClose();
    } catch {
      setError('Unable to reach Vortex session server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    onAuthChange(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2
                className="text-base sm:text-lg font-bold uppercase tracking-[0.22em] text-[#F5E9EA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                VORTEX · KAYA
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#F5E9EA]/60">
                {user
                  ? 'Verified Studio Session'
                  : mode === 'signin'
                  ? 'Chrome & Firebase Sign In'
                  : 'Create Verified Studio Profile'}
              </p>
            </div>
            <HardwareButton
              size="sm"
              tone="red"
              ledIndicator={false}
              onClick={onClose}
              aria-label="Close authentication modal"
            >
              <X className="w-4 h-4" />
            </HardwareButton>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="candy-trace-tile p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-[#F5E9EA] truncate">{user.handle}</p>
                  <p className="font-mono text-xs text-[#F5E9EA]/65 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                  <span>Continue</span>
                </HardwareButton>
                <HardwareButton size="sm" tone="red" active onClick={handleSignOut}>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </HardwareButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <HardwareButton
                  size="sm"
                  fullWidth
                  tone="cyan"
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
                  tone="magenta"
                  active={mode === 'signup'}
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                >
                  <span>Create Profile</span>
                </HardwareButton>
              </div>

              {/* Captcha Verification */}
              <div className="candy-trace-tile p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#FF8C66]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {challengeQuestion || 'Loading security verification…'}
                  </span>
                  <button
                    type="button"
                    onClick={loadChallenge}
                    className="text-[#F5E9EA]/60 hover:text-white cursor-pointer"
                    aria-label="Refresh verification challenge"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Enter verification answer"
                  className="w-full rounded-full bg-[#070304] px-4 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                />
              </div>

              <HardwareButton
                type="button"
                size="md"
                fullWidth
                tone="red"
                active
                disabled={loading}
                onClick={handleChromeGoogleSignIn}
              >
                <span>{loading ? 'Connecting Chrome Account…' : 'Continue with Google Chrome / Firebase'}</span>
              </HardwareButton>

              {mode === 'signup' && (
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Studio Display Name"
                  className="w-full rounded-full bg-[#070304] px-4 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                />
              )}

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Member email address"
                className="w-full rounded-full bg-[#070304] px-4 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
              />

              {error && <p className="font-mono text-xs text-[#FF4D6D]">{error}</p>}

              <div className="flex items-center justify-end gap-2">
                <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                  <span>Cancel</span>
                </HardwareButton>
                <HardwareButton type="submit" size="sm" tone="magenta" active disabled={loading}>
                  <span>{loading ? 'Verifying…' : 'Continue with Email'}</span>
                </HardwareButton>
              </div>
            </form>
          )}
        </PlateBezel>
      </div>
    </div>
  );
}
