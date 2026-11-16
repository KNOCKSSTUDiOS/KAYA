import React, { useState } from 'react';
import { X, Lock, User, LogOut, CheckCircle2 } from 'lucide-react';
import { PlateBezel, HardwareButton } from './HardwarePrimitives.js';

export interface KayaUserProfile {
  handle: string;
  email: string;
  signedInAt: string;
}

interface KayaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KayaUserProfile | null;
  onAuthChange: (user: KayaUserProfile | null) => void;
}

export function KayaAuthModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
}: KayaAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedHandle = handle.trim() || trimmedEmail.split('@')[0] || 'KAYA Creator';
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Enter a valid studio email address.');
      return;
    }
    if (passcode.trim().length < 4) {
      setError('Passcode must be at least 4 characters.');
      return;
    }

    const profile: KayaUserProfile = {
      handle: trimmedHandle,
      email: trimmedEmail,
      signedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('kaya_studio_user', JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
    onAuthChange(profile);
    setPasscode('');
    onClose();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
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
                {user ? 'Studio Member Session' : mode === 'signin' ? 'Member Sign In' : 'Create Studio Account'}
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
                <div className="w-10 h-10 rounded-[8px] bg-[#020203] border border-[#00E5FF]/60 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-[#00E5FF]" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-white truncate">{user.handle}</p>
                  <p className="font-mono text-xs text-[#E6ECF5]/65 truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                  <span>Continue Studio</span>
                </HardwareButton>
                <HardwareButton size="sm" tone="red" active onClick={handleSignOut}>
                  <LogOut className="w-3.5 h-3.5 text-[#FF3B5C]" />
                  <span>Sign Out</span>
                </HardwareButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Toggle */}
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
                  <Lock className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Sign In</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  fullWidth
                  tone="red"
                  active={mode === 'signup'}
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                >
                  <User className="w-3.5 h-3.5 text-[#FF3B5C]" />
                  <span>Sign Up</span>
                </HardwareButton>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70 block">
                    Studio Name / Handle
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="KAYA Director"
                    className="w-full bg-[#020203] border border-white/20 rounded-[6px] px-3 py-2 font-mono text-xs text-white placeholder-[#E6ECF5]/35 focus:outline-none focus:border-[#00E5FF]"
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
                  placeholder="director@kaya.studio"
                  required
                  className="w-full bg-[#020203] border border-white/20 rounded-[6px] px-3 py-2 font-mono text-xs text-white placeholder-[#E6ECF5]/35 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70 block">
                  Access Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#020203] border border-white/20 rounded-[6px] px-3 py-2 font-mono text-xs text-white placeholder-[#E6ECF5]/35 focus:outline-none focus:border-[#FF1E42]"
                />
              </div>

              {error && (
                <p className="font-mono text-xs text-[#FF4A68] bg-[#020203] border border-[#FF1E42]/45 rounded-[6px] px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
                  <span>Cancel</span>
                </HardwareButton>
                <HardwareButton
                  type="submit"
                  size="sm"
                  tone={mode === 'signin' ? 'cyan' : 'red'}
                  active
                >
                  <span>{mode === 'signin' ? 'Enter KAYA Studio' : 'Create KAYA Account'}</span>
                </HardwareButton>
              </div>
            </form>
          )}
        </PlateBezel>
      </div>
    </div>
  );
}
