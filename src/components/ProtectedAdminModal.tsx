import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Users,
  RefreshCw,
  Sliders,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { KayaUserProfile } from './KayaAuthModal.js';
import {
  StaffMemberDoc,
  StaffRole,
  auth,
  fetchStaffRoster,
  revokeStaffMember,
  signInWithChromeGoogle,
  upsertStaffMember,
  verifyStaffAccess,
} from '../lib/firebase.js';

interface ProtectedAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KayaUserProfile | null;
  onAuthChange?: (user: KayaUserProfile) => void;
}

export function ProtectedAdminModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
}: ProtectedAdminModalProps) {
  const [challengeId, setChallengeId] = useState('');
  const [challengeQuestion, setChallengeQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [staffMember, setStaffMember] = useState<StaffMemberDoc | null>(null);
  const [roster, setRoster] = useState<StaffMemberDoc[]>([]);
  const [staffJwt, setStaffJwt] = useState<string | null>(null);
  const [config, setConfig] = useState({
    allowPublicSignup: true,
    enforceWatermark: true,
    overdrive144fps: true,
    maintenanceMode: false,
    selfHostedEndpoint: '',
  });

  // Add/update employee form
  const [newUid, setNewUid] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('engineer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    try {
      const res = await fetch('/api/verify/challenge');
      if (res.ok) {
        const data = await res.json();
        setChallengeId(data.challengeId);
        setChallengeQuestion(data.question);
        setCaptchaAnswer('');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setStatusMsg(null);
      loadChallenge();
    }
  }, [isOpen, loadChallenge]);

  const loadOverviewAndRoster = useCallback(async (jwt: string) => {
    try {
      const [overviewRes, staffRows] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${jwt}` } }),
        fetchStaffRoster().catch(() => []),
      ]);
      if (overviewRes.ok) {
        const json = await overviewRes.json();
        if (json.config) setConfig(json.config);
      }
      setRoster(staffRows);
    } catch {
      // ignore
    }
  }, []);

  const handleAuthenticateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let currentFb = auth.currentUser;
      if (!currentFb) {
        currentFb = await signInWithChromeGoogle();
      }
      if (!currentFb.emailVerified) {
        throw new Error('Verified Google account email is required.');
      }

      // 1. Verify captcha server-side
      let vToken = verifiedToken;
      if (!vToken) {
        const capRes = await fetch('/api/verify/captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeId, answer: captchaAnswer }),
        });
        const capJson = await capRes.json();
        if (!capRes.ok || !capJson.verified) {
          await loadChallenge();
          throw new Error(capJson.error || 'Captcha verification failed.');
        }
        vToken = capJson.verificationToken;
        setVerifiedToken(vToken);
      }

      // 2. Verify staff role in Firestore /admins/{uid}
      const member = await verifyStaffAccess(currentFb);
      if (!member) {
        throw new Error('This Google account is not registered under Studio Staff Access.');
      }

      // 3. Exchange for signed server staff session
      const staffRes = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentFb.email,
          role: member.role,
          verificationToken: vToken,
        }),
      });
      const staffJson = await staffRes.json();
      if (!staffRes.ok || !staffJson.token) {
        throw new Error(staffJson.error || 'Staff authorization denied.');
      }

      setStaffMember(member);
      setStaffJwt(staffJson.token);
      onAuthChange?.({
        uid: currentFb.uid,
        handle: currentFb.displayName || member.email.split('@')[0],
        email: member.email,
        role: member.role,
        tier: 'enterprise',
        signedInAt: new Date().toISOString(),
        token: staffJson.token,
      });
      await loadOverviewAndRoster(staffJson.token);
      setStatusMsg(`Authenticated as ${member.role.toUpperCase()} · ${member.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staff verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConfig = async (key: 'allowPublicSignup' | 'enforceWatermark' | 'overdrive144fps' | 'maintenanceMode') => {
    if (!staffJwt) return;
    const nextVal = !config[key];
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffJwt}`,
        },
        body: JSON.stringify({ [key]: nextVal }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.config) setConfig(json.config);
        setStatusMsg(`Updated ${key}`);
      }
    } catch {
      setError('Failed to update studio configuration.');
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim() || !newEmail.trim()) return;
    try {
      await upsertStaffMember({
        userId: newUid.trim(),
        email: newEmail.trim(),
        role: newRole,
        active: true,
        grantedBy: staffMember?.userId || user?.uid || 'admin',
      });
      setNewUid('');
      setNewEmail('');
      const updated = await fetchStaffRoster();
      setRoster(updated);
      setStatusMsg(`Granted ${newRole} access to ${newEmail.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save staff record.');
    }
  };

  const handleRevokeEmployee = async (uid: string) => {
    try {
      await revokeStaffMember(uid);
      const updated = await fetchStaffRoster();
      setRoster(updated);
      setStatusMsg('Removed staff role entry.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/92 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl my-auto" onClick={(e) => e.stopPropagation()}>
        <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-[#FF0A3C]" />
              <div>
                <h2
                  className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] text-[#F5E9EA]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Protected Administrator &amp; Employee Portal
                </h2>
                <p className="font-mono text-[11px] text-[#F5E9EA]/60">
                  Real Google Auth + Captcha + Role-Based Firestore Registry
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {staffMember && <LedStatusIndicator label={`${staffMember.role} Active`} tone="emerald" />}
              <HardwareButton size="sm" tone="red" ledIndicator={false} onClick={onClose} aria-label="Close staff portal">
                <X className="w-4 h-4" />
              </HardwareButton>
            </div>
          </div>

          {!staffMember || !staffJwt ? (
            <form onSubmit={handleAuthenticateStaff} className="candy-trace-tile p-5 space-y-4">
              <p className="text-xs text-[#F5E9EA]/80 leading-relaxed">
                This protected portal is restricted to verified studio administrators and authorized staff roles.
                Complete verification below and authenticate with your verified Google account.
              </p>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-[#FF8C66] block">
                  Verification Challenge: {challengeQuestion || 'Loading challenge…'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Enter verification answer"
                    className="flex-1 rounded-full bg-[#070304] px-4 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                  />
                  <HardwareButton type="button" size="sm" tone="neutral" ledIndicator={false} onClick={loadChallenge}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </HardwareButton>
                </div>
              </div>

              {error && <p className="font-mono text-xs text-[#FF4D6D]">{error}</p>}

              <HardwareButton type="submit" size="md" tone="red" active disabled={loading}>
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying Staff Credentials…' : 'Sign In & Verify Staff Access'}</span>
              </HardwareButton>
            </form>
          ) : (
            <div className="space-y-5">
              {statusMsg && <p className="font-mono text-xs text-emerald-400">{statusMsg}</p>}
              {error && <p className="font-mono text-xs text-[#FF4D6D]">{error}</p>}

              {/* Runtime Controls */}
              <div className="space-y-2.5">
                <span className="font-mono text-xs uppercase tracking-wider text-[#F5E9EA]/70 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#FF0A3C]" /> Runtime Policy Controls
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="cyan"
                    active={config.allowPublicSignup}
                    onClick={() => handleToggleConfig('allowPublicSignup')}
                  >
                    <span>Public Signups: {config.allowPublicSignup ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="red"
                    active={config.enforceWatermark}
                    onClick={() => handleToggleConfig('enforceWatermark')}
                  >
                    <span>Unified Watermark: {config.enforceWatermark ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="magenta"
                    active={config.overdrive144fps}
                    onClick={() => handleToggleConfig('overdrive144fps')}
                  >
                    <span>Opus 144fps Lock: {config.overdrive144fps ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="neutral"
                    active={config.maintenanceMode}
                    onClick={() => handleToggleConfig('maintenanceMode')}
                  >
                    <span>Maintenance: {config.maintenanceMode ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                </div>
              </div>

              {/* Employee & Role Access Management */}
              <div className="candy-surface rounded-[14px] p-4 space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-[#F5E9EA]/75 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#E06844]" /> Employee &amp; Role Access Registry
                </span>

                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newUid}
                    onChange={(e) => setNewUid(e.target.value)}
                    placeholder="Employee Firebase UID"
                    className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="employee@domain.com"
                    className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StaffRole)}
                    className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                  >
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="instructor">Instructor</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                  <HardwareButton type="submit" size="sm" fullWidth tone="red" active>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Grant Role</span>
                  </HardwareButton>
                </form>

                <div className="space-y-2">
                  {roster.length === 0 ? (
                    <p className="font-mono text-[11px] text-[#F5E9EA]/55">
                      Root Administrator active. Use the form above to grant future employee access by Firebase UID.
                    </p>
                  ) : (
                    roster.map((m) => (
                      <div key={m.userId} className="candy-trace-tile p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0 font-mono text-xs">
                          <span className="text-[#F5E9EA] font-bold">{m.email}</span>
                          <span className="text-[#FF8C66] ml-2 uppercase">{m.role}</span>
                        </div>
                        <HardwareButton
                          size="sm"
                          tone="red"
                          ledIndicator={false}
                          onClick={() => handleRevokeEmployee(m.userId)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </HardwareButton>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </PlateBezel>
      </div>
    </div>
  );
}
