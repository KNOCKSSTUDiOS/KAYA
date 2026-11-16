import React, { useState } from 'react';
import { X, Lock, User, LogOut, CheckCircle2, ShieldAlert, Crown } from 'lucide-react';
import { PlateBezel, HardwareButton } from './HardwarePrimitives.js';

export interface KayaUserProfile {
  handle: string;
  email: string;
  signedInAt: string;
  role?: 'owner' | 'member';
  tier?: 'free' | 'beginner' | 'ultra' | 'pro' | 'enterprise_business';
  token?: string;
}

interface KayaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KayaUserProfile | null;
  onAuthChange: (user: KayaUserProfile | null) => void;
  onOpenAdminPortal?: () => void;
  initialMode?: 'signin' | 'signup' | 'owner';
}

export function KayaAuthModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
  onOpenAdminPortal,
  initialMode = 'signin',
}: KayaAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'owner'>(initialMode);
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      if (initialMode === 'owner' && !email) {
        setEmail('GTamayo36@gmail.com');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const completeLogin = (profile: KayaUserProfile) => {
    try {
      localStorage.setItem('kaya_studio_user', JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
    onAuthChange(profile);
    onClose();
    if (profile.role === 'owner' && onOpenAdminPortal) {
      onOpenAdminPortal();
    }
  };

  const handleQuickOwnerEnter = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'GTamayo36@gmail.com', handle: 'KNOCKSSTUDiOS' }),
      });
      const data = (await res.json()) as {
        user?: KayaUserProfile;
        token?: string;
        error?: string;
      };
      if (res.ok && data.user) {
        completeLogin({ ...data.user, token: data.token });
        return;
      }
      setError(data.error || 'Could not start owner session.');
    } catch {
      completeLogin({
        handle: 'KNOCKSSTUDiOS',
        email: 'GTamayo36@gmail.com',
        role: 'owner',
        tier: 'enterprise_business',
        signedInAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'owner') {
      await handleQuickOwnerEnter();
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedHandle = handle.trim() || trimmedEmail.split('@')[0] || 'KAYA Creator';
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
      const data = (await res.json()) as {
        user?: KayaUserProfile;
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.user) {
        setError(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      completeLogin({
        ...data.user,
        token: data.token,
      });
    } catch {
      const isOwnerEmail = trimmedEmail.toLowerCase() === 'gtamayo36@gmail.com';
      completeLogin({
        handle: isOwnerEmail ? 'KNOCKSSTUDiOS' : trimmedHandle,
        email: trimmedEmail,
        role: isOwnerEmail ? 'owner' : 'member',
        tier: isOwnerEmail ? 'enterprise_business' : 'free',
        signedInAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('kaya_studio_user');
    } catch {
      // Ignore
    }
    onAuthChange(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5 bg-[#020203]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="space-y-0.5">
              <h2
                className="text-base sm:text-lg font-bold uppercase tracking-[0.26em] text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                KAYA
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#E6ECF5]/60">
                {user
                  ? user.role === 'owner'
                    ? 'Owner Authenticated Session'
                    : 'Studio Member Session'
                  : mode === 'owner'
                  ? 'Owner Admin Access · KNOCKSSTUDiOS'
                  : mode === 'signin'
                  ? 'Sign In (Zero Passwords)'
                  : 'Create Studio Account'}
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
              <div className="cnc-recess rounded-[8px] p-4 flex items-center gap-3 border border-white/15">
                <div className="w-10 h-10 rounded-[8px] bg-[#020203] border border-[#FF0A3C]/60 flex items-center justify-center shrink-0">
                  {user.role === 'owner' ? (
                    <ShieldAlert className="w-5 h-5 text-[#FF0A3C]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#F1F5F9]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-white truncate">{user.handle}</p>
                    {user.role === 'owner' && (
                      <span className="px-1.5 py-0.5 rounded bg-[#FF0A3C]/20 border border-[#FF0A3C]/60 font-mono text-[9px] text-[#FF4D6D] uppercase">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-[#E6ECF5]/65 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {user.role === 'owner' && onOpenAdminPortal && (
                  <HardwareButton
                    size="sm"
                    tone="red"
                    active
                    onClick={() => {
                      onClose();
                      onOpenAdminPortal();
                    }}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FF3B5C]" />
                    <span>Open Admin Portal</span>
                  </HardwareButton>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                    <span>Continue</span>
                  </HardwareButton>
                  <HardwareButton size="sm" tone="red" active onClick={handleSignOut}>
                    <LogOut className="w-3.5 h-3.5 text-[#FF3B5C]" />
                    <span>Sign Out</span>
                  </HardwareButton>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Toggle */}
              <div className="grid grid-cols-3 gap-1.5">
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
                  <Lock className="w-3.5 h-3.5 text-[#F1F5F9]" />
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
                  <User className="w-3.5 h-3.5 text-[#FF5C8A]" />
                  <span>Sign Up</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  fullWidth
                  tone="red"
                  active={mode === 'owner'}
                  onClick={() => {
                    setMode('owner');
                    setEmail('GTamayo36@gmail.com');
                    setError(null);
                  }}
                >
                  <Crown className="w-3.5 h-3.5 text-[#FF3B5C]" />
                  <span>Owner</span>
                </HardwareButton>
              </div>

              {mode === 'owner' ? (
                <div className="cnc-recess rounded-[8px] p-4 border border-[#FF0A3C]/45 space-y-3">
                  <div className="font-mono text-xs text-white font-semibold">
                    Owner Direct Entry · GTamayo36@gmail.com
                  </div>
                  <p className="font-mono text-[11px] text-[#F1F5F9]/75 leading-relaxed">
                    No key or passcode needed. Click below to open your Owner Admin Portal and studio controls directly.
                  </p>
                  <HardwareButton
                    type="button"
                    size="md"
                    fullWidth
                    tone="red"
                    active
                    disabled={loading}
                    onClick={handleQuickOwnerEnter}
                  >
                    <ShieldAlert className="w-4 h-4 text-white" />
                    <span>{loading ? 'Opening…' : 'Enter as Owner (KNOCKSSTUDiOS)'}</span>
                  </HardwareButton>
                </div>
              ) : (
                <>
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70 block">
                        Studio Name / Handle
                      </label>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="KAYA Creator"
                        className="w-full bg-[#020203] border border-white/20 rounded-[6px] px-3 py-2 font-mono text-xs text-white placeholder-[#E6ECF5]/35 focus:outline-none focus:border-[#F1F5F9]"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="GTamayo36@gmail.com"
                      required
                      className="w-full bg-[#020203] border border-white/20 rounded-[6px] px-3 py-2 font-mono text-xs text-white placeholder-[#E6ECF5]/35 focus:outline-none focus:border-[#F1F5F9]"
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="font-mono text-xs text-[#FF4A68] bg-[#020203] border border-[#FF0A3C]/45 rounded-[6px] px-3 py-2">
                  {error}
                </p>
              )}

              {mode !== 'owner' && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <HardwareButton
                    type="button"
                    size="sm"
                    tone="red"
                    onClick={handleQuickOwnerEnter}
                  >
                    <Crown className="w-3.5 h-3.5 text-[#FF3B5C]" />
                    <span>Owner 1-Click</span>
                  </HardwareButton>
                  <div className="flex items-center gap-2">
                    <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                      <span>Cancel</span>
                    </HardwareButton>
                    <HardwareButton
                      type="submit"
                      size="sm"
                      disabled={loading}
                      tone={mode === 'signin' ? 'cyan' : 'magenta'}
                      active
                    >
                      <span>
                        {loading
                          ? 'Entering…'
                          : mode === 'signin'
                          ? 'Enter KAYA Studio'
                          : 'Create Account'}
                      </span>
                    </HardwareButton>
                  </div>
                </div>
              )}
            </form>
          )}
        </PlateBezel>
      </div>
    </div>
  );
}
