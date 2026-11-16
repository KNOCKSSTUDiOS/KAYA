import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Users,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Crown,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { KayaUserProfile } from './KayaAuthModal.js';

interface AdminOverviewResponse {
  owner: { handle: string; email: string };
  runtime: {
    port: number;
    buildId: string;
    aiReady: boolean;
    aiModel: string;
    swCache: string;
    lockedEndpoints: string[];
  };
  config: {
    allowPublicSignup: boolean;
    enforceWatermark: boolean;
    overdrive144fps: boolean;
    maintenanceMode: boolean;
  };
  members: {
    id: string;
    handle: string;
    email: string;
    role: 'owner' | 'member';
    tier: 'free' | 'beginner' | 'ultra' | 'pro' | 'enterprise_business';
    status: 'active' | 'revoked';
    lastSeen: string;
  }[];
}

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KayaUserProfile | null;
  onAuthChange?: (user: KayaUserProfile) => void;
  onRequestOwnerLogin: () => void;
  onConfigUpdated?: (cfg: AdminOverviewResponse['config']) => void;
}

export function AdminPortalModal({
  isOpen,
  onClose,
  user,
  onAuthChange,
  onRequestOwnerLogin,
  onConfigUpdated,
}: AdminPortalModalProps) {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isOwnerSession = user?.role === 'owner' && !!user.token;

  const loadOverview = useCallback(async () => {
    if (!user?.token || user.role !== 'owner') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error || 'Owner session expired. Re-enter below.');
        setData(null);
        return;
      }
      const json = (await res.json()) as AdminOverviewResponse;
      setData(json);
    } catch {
      setError('Failed to reach KAYA Admin Server.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && isOwnerSession) {
      loadOverview();
    }
  }, [isOpen, isOwnerSession, loadOverview]);

  const handleInstantOwnerUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'GTamayo36@gmail.com', handle: 'KNOCKSSTUDiOS' }),
      });
      const json = (await res.json()) as { user?: KayaUserProfile; token?: string; error?: string };
      if (res.ok && json.user) {
        const profile: KayaUserProfile = { ...json.user, token: json.token };
        try {
          localStorage.setItem('kaya_studio_user', JSON.stringify(profile));
        } catch {
          // ignore
        }
        onAuthChange?.(profile);
        return;
      }
      setError(json.error || 'Could not open owner portal.');
    } catch {
      setError('Unable to contact local studio server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleConfig = async (key: keyof AdminOverviewResponse['config']) => {
    if (!data || !user?.token) return;
    const nextVal = !data.config[key];
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ [key]: nextVal }),
      });
      const json = (await res.json()) as { config?: AdminOverviewResponse['config']; error?: string };
      if (!res.ok || !json.config) {
        setStatusMsg(json.error || 'Failed to update config.');
        return;
      }
      setData((prev) => (prev ? { ...prev, config: json.config! } : prev));
      onConfigUpdated?.(json.config);
      setStatusMsg(`Updated ${key} -> ${nextVal ? 'ENABLED' : 'DISABLED'}`);
    } catch {
      setStatusMsg('Network error updating studio control.');
    }
  };

  const updateMember = async (
    email: string,
    updates: {
      tier?: AdminOverviewResponse['members'][number]['tier'];
      status?: AdminOverviewResponse['members'][number]['status'];
    }
  ) => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/admin/member-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email, ...updates }),
      });
      if (res.ok) {
        await loadOverview();
        setStatusMsg(`Updated access for ${email}.`);
      }
    } catch {
      setStatusMsg('Failed to update member.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5 bg-[#030406]">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#07080C] border border-[#FF0A3C]/65 flex items-center justify-center shadow-[0_0_16px_rgba(255,10,60,0.35)]">
                <ShieldAlert className="w-4 h-4 text-[#FF0A3C]" />
              </div>
              <div>
                <h2
                  className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  KAYA™ Owner &amp; Admin Portal
                </h2>
                <p className="font-mono text-[11px] text-[#F1F5F9]/60">
                  KNOCKSSTUDiOS · Private Command, Native AI &amp; Member Governance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwnerSession && (
                <HardwareButton size="sm" tone="cyan" onClick={loadOverview}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </HardwareButton>
              )}
              <HardwareButton size="sm" tone="red" ledIndicator={false} onClick={onClose}>
                <X className="w-4 h-4" />
              </HardwareButton>
            </div>
          </div>

          {!isOwnerSession ? (
            <div className="cnc-recess rounded-[10px] p-6 text-center space-y-4 border border-[#FF0A3C]/40">
              <Crown className="w-8 h-8 text-[#FF0A3C] mx-auto" />
              <div className="space-y-1.5 max-w-md mx-auto">
                <p className="font-mono text-sm font-bold text-white uppercase">
                  Owner Portal · GTamayo36@gmail.com
                </p>
                <p className="font-mono text-xs text-[#F1F5F9]/70 leading-relaxed">
                  No key or passcode required. Enter directly as Owner (<span className="text-white">KNOCKSSTUDiOS</span>) to control runtime switches, AI telemetry, and member access.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <HardwareButton
                  size="md"
                  tone="red"
                  active
                  disabled={loading}
                  onClick={handleInstantOwnerUnlock}
                >
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span>{loading ? 'Unlocking…' : 'Open Owner Portal Now'}</span>
                </HardwareButton>
                <HardwareButton
                  size="md"
                  tone="neutral"
                  ledIndicator={false}
                  onClick={() => {
                    onClose();
                    onRequestOwnerLogin();
                  }}
                >
                  <span>Account Options</span>
                </HardwareButton>
              </div>
            </div>
          ) : error ? (
            <div className="cnc-recess rounded-[10px] p-5 space-y-3 border border-[#FF0A3C]/45">
              <p className="font-mono text-xs text-[#FF4D6D]">{error}</p>
              <HardwareButton
                size="sm"
                tone="red"
                active
                onClick={handleInstantOwnerUnlock}
              >
                <span>Reconnect Owner Session</span>
              </HardwareButton>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {statusMsg && (
                <div className="px-3.5 py-2 rounded-[7px] bg-[#08090D] border border-[#FF2E63]/50 font-mono text-xs text-[#F1F5F9] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF2E63] shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Runtime & Anti-Theft Lock Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="cnc-recess rounded-[8px] p-4 space-y-2.5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#FF0A3C]" />
                      KAYA Server &amp; Native AI Engine
                    </span>
                    <LedStatusIndicator label="AI Ready" tone="red" />
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-[#F1F5F9]/75">
                    <div className="flex justify-between">
                      <span>Owner Identity:</span>
                      <span className="text-white">{data.owner.handle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Engine:</span>
                      <span className="text-[#FF2E63]">{data.runtime.aiModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Live Port / SW Cache:</span>
                      <span className="text-white">:{data.runtime.port} · {data.runtime.swCache}</span>
                    </div>
                  </div>
                </div>

                <div className="cnc-recess rounded-[8px] p-4 space-y-2.5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#F1F5F9]" />
                      Source Code Lockdown (HTTP 403)
                    </span>
                    <LedStatusIndicator label="Protected" tone="cyan" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.runtime.lockedEndpoints.map((ep) => (
                      <span
                        key={ep}
                        className="px-2 py-0.5 rounded bg-[#050608] border border-[#FF0A3C]/40 font-mono text-[10px] text-[#FF4D6D]"
                      >
                        403 · {ep}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Studio Global Controls */}
              <div className="cnc-recess rounded-[8px] p-4 space-y-3 border border-white/10">
                <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FF2E63]" />
                  Global Studio Switches
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="cyan"
                    active={data.config.allowPublicSignup}
                    onClick={() => toggleConfig('allowPublicSignup')}
                  >
                    <span>Sign-Up: {data.config.allowPublicSignup ? 'OPEN' : 'INVITE'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="red"
                    active={data.config.enforceWatermark}
                    onClick={() => toggleConfig('enforceWatermark')}
                  >
                    <span>© Stamp: {data.config.enforceWatermark ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="magenta"
                    active={data.config.overdrive144fps}
                    onClick={() => toggleConfig('overdrive144fps')}
                  >
                    <span>144fps GPU: {data.config.overdrive144fps ? 'ON' : '60fps'}</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone="red"
                    active={data.config.maintenanceMode}
                    onClick={() => toggleConfig('maintenanceMode')}
                  >
                    <span>Lockdown: {data.config.maintenanceMode ? 'ON' : 'OFF'}</span>
                  </HardwareButton>
                </div>
              </div>

              {/* Member Directory */}
              <div className="cnc-recess rounded-[8px] p-4 space-y-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#F1F5F9]" />
                    Active Member &amp; Session Registry ({data.members.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {data.members.map((m) => (
                    <div
                      key={m.email}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[6px] bg-[#050608] border border-white/10 font-mono text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-white font-semibold">{m.handle}</span>{' '}
                        <span className="text-[#F1F5F9]/55">({m.email})</span>
                      </div>
                      {m.role === 'owner' ? (
                        <span className="px-2 py-0.5 rounded bg-[#FF0A3C]/20 border border-[#FF0A3C]/60 text-[10px] text-[#FF4D6D] uppercase">
                          Owner · Enterprise
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            value={m.tier}
                            onChange={(e) =>
                              updateMember(m.email, {
                                tier: e.target.value as AdminOverviewResponse['members'][number]['tier'],
                              })
                            }
                            className="bg-[#0B0D12] border border-white/20 rounded px-2 py-1 text-[11px] text-white"
                          >
                            <option value="free">Free</option>
                            <option value="beginner">Beginner</option>
                            <option value="ultra">Ultra</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise_business">Enterprise</option>
                          </select>
                          <HardwareButton
                            size="sm"
                            tone={m.status === 'active' ? 'cyan' : 'red'}
                            onClick={() =>
                              updateMember(m.email, {
                                status: m.status === 'active' ? 'revoked' : 'active',
                              })
                            }
                          >
                            <span>{m.status === 'active' ? 'Active' : 'Revoked'}</span>
                          </HardwareButton>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </PlateBezel>
      </div>
    </div>
  );
}
