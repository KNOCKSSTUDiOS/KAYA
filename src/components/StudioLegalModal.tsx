import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Award,
  Scale,
  Lock,
  Cpu,
  X,
  CheckCircle2,
  FileText,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { FPSKey } from '../lib/studioRenderer.js';

export type LegalTabKey = 'brand' | 'security' | 'policies' | 'terms' | 'gpu';

interface StudioLegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTabKey;
  onClose: () => void;
  activeFps: FPSKey;
  activeTierLabel: string;
}

const TABS: {
  key: LegalTabKey;
  label: string;
  tone: 'red' | 'cyan' | 'magenta';
  icon: React.ReactNode;
}[] = [
  { key: 'brand', label: 'Brand™ & IP', tone: 'red', icon: <Award className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
  { key: 'security', label: 'Protections', tone: 'cyan', icon: <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" /> },
  { key: 'policies', label: 'Studio Policies', tone: 'magenta', icon: <Scale className="w-3.5 h-3.5 text-[#FF64B8]" /> },
  { key: 'terms', label: 'Terms & Privacy', tone: 'cyan', icon: <FileText className="w-3.5 h-3.5 text-[#00E5FF]" /> },
  { key: 'gpu', label: 'GPU & 120fps+', tone: 'red', icon: <Gauge className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
];

export function StudioLegalModal({
  isOpen,
  initialTab = 'brand',
  onClose,
  activeFps,
  activeTierLabel,
}: StudioLegalModalProps) {
  const [tab, setTab] = useState<LegalTabKey>(initialTab);
  const [gpuRenderer, setGpuRenderer] = useState<string>('Detecting GPU Pipeline…');
  const [measuredHz, setMeasuredHz] = useState<number | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('kaya_policies_accepted');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || tab !== 'gpu') return;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
        canvas.getContext('webgl', { powerPreference: 'high-performance' });
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = ext
          ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
          : gl.getParameter(gl.RENDERER);
        setGpuRenderer(String(renderer || 'Hardware WebGL2 Pipeline Active'));
      } else {
        setGpuRenderer('2D Hardware Canvas Pipeline');
      }
    } catch {
      setGpuRenderer('Hardware Canvas Pipeline');
    }

    let rafId = 0;
    let frames = 0;
    const start = performance.now();
    const tick = (now: number) => {
      frames += 1;
      const elapsed = now - start;
      if (elapsed >= 750) {
        const hz = Math.round((frames * 1000) / elapsed);
        setMeasuredHz(hz);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleAcknowledge = () => {
    const stamp = new Date().toISOString().split('T')[0];
    setAcceptedAt(stamp);
    try {
      localStorage.setItem('kaya_policies_accepted', stamp);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <PlateBezel accent="red" className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6 gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] cnc-module border border-[#FF1E42]/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#FF3B5C]" />
            </div>
            <div>
              <h2
                className="text-base sm:text-lg font-bold uppercase tracking-wider text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                KAYA™ Studio Governance, Brand™ &amp; Protections
              </h2>
              <p className="font-mono text-[11px] text-[#E6ECF5]/60">
                Active Plan: {activeTierLabel} · Render Target: {activeFps} fps · Zero-Telemetry Local Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {acceptedAt && <LedStatusIndicator label={`Verified ${acceptedAt}`} tone="cyan" />}
            <HardwareButton
              size="sm"
              tone="red"
              ledIndicator={false}
              onClick={onClose}
              aria-label="Close legal and protections menu"
            >
              <X className="w-4 h-4" />
            </HardwareButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {TABS.map((item) => (
            <HardwareButton
              key={item.key}
              size="sm"
              tone={item.tone}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </HardwareButton>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm text-[#E6ECF5]/85">
          {tab === 'brand' && (
            <div className="space-y-4">
              <div className="cnc-recess rounded-[10px] p-4 space-y-2 border border-[#FF1E42]/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF3B5C]">
                    Registered Marks &amp; Proprietary Identity
                  </span>
                  <span className="font-mono text-[10px] text-[#E6ECF5]/60 uppercase">All Rights Reserved</span>
                </div>
                <p className="leading-relaxed">
                  <strong>KAYA™</strong>, <strong>KAYA Studio™</strong>, <strong>KAYA Infinity™</strong>,{' '}
                  <strong>KAYA AirRadio™</strong>, and the Obsidian Titanium 3D Cube emblem are proprietary trademarks
                  and service marks. Unauthorized redistribution, cloning, or misrepresentation of official KAYA™ marks
                  or studio hardware branding is strictly prohibited.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="cnc-module rounded-[8px] p-4 space-y-2">
                  <h3 className="font-mono text-xs font-bold uppercase text-[#00E5FF]">
                    100% Creator Export &amp; © 2024–2026 Music Stamp
                  </h3>
                  <p className="text-xs text-[#E6ECF5]/75 leading-relaxed">
                    Every 4K HDR master video, PNG alpha cutout, © 2024–2026 watermarked WAV audio stem, 3D storyboard,
                    and custom print design compiled inside KAYA™ belongs strictly to the creator who authored it.
                  </p>
                </div>
                <div className="cnc-module rounded-[8px] p-4 space-y-2">
                  <h3 className="font-mono text-xs font-bold uppercase text-[#FF64B8]">
                    Commercial Broadcast Licensing
                  </h3>
                  <p className="text-xs text-[#E6ECF5]/75 leading-relaxed">
                    Free Tier covers personal evaluation &amp; demos. Beginner, Ultra, Pro, and Enterprise Business tiers
                    include full worldwide royalty-free commercial cinema, merch store, and live stream rights.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <div className="cnc-recess rounded-[10px] p-4 space-y-2 border border-[#00E5FF]/30">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#00E5FF]">
                  <Lock className="w-4 h-4" />
                  <span>Zero-Telemetry Local Processing Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  All canvas composition, 3D WebGL shaders, audio synthesis, lip-sync keyframes, and transparent PNG
                  archive builds execute directly inside your local workstation hardware. KAYA™ never transmits raw
                  camera feeds, personal portraits, or unreleased project files to external third-party AI servers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="cnc-module rounded-[8px] p-3.5 space-y-1.5">
                  <span className="font-mono text-[11px] font-bold uppercase text-white block">
                    Likeness &amp; Face Safety
                  </span>
                  <p className="text-xs text-[#E6ECF5]/70">
                    Creators must hold consent for any human likeness loaded into Action Animator or Lip-Sync Rig.
                  </p>
                </div>
                <div className="cnc-module rounded-[8px] p-3.5 space-y-1.5">
                  <span className="font-mono text-[11px] font-bold uppercase text-white block">
                    DRM &amp; Asset Hashing
                  </span>
                  <p className="text-xs text-[#E6ECF5]/70">
                    Every exported master cut includes local manifest metadata to protect original studio provenance.
                  </p>
                </div>
                <div className="cnc-module rounded-[8px] p-3.5 space-y-1.5">
                  <span className="font-mono text-[11px] font-bold uppercase text-white block">
                    DMCA &amp; IP Takedown
                  </span>
                  <p className="text-xs text-[#E6ECF5]/70">
                    Verified rights holders may submit proof-of-ownership notices for immediate store catalog review.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'policies' && (
            <div className="space-y-3">
              <div className="cnc-recess rounded-[10px] p-4 space-y-2">
                <h3 className="font-mono text-xs font-bold uppercase text-[#FF64B8]">
                  Acceptable Use &amp; Broadcast Policy
                </h3>
                <ul className="space-y-1.5 text-xs text-[#E6ECF5]/80 list-disc list-inside leading-relaxed">
                  <li>No deceptive impersonation, illegal content, or unconsented biometric cloning.</li>
                  <li>Merch &amp; Print Store listings require original artwork or licensed graphics cleared for print.</li>
                  <li>AirRadio FM streams &amp; Live Cam broadcasts must respect copyright &amp; regional safety standards.</li>
                  <li>Coding &amp; Rendering School certificates verify completion of KAYA™ real-time render labs.</li>
                </ul>
              </div>

              <div className="cnc-recess rounded-[10px] p-4 space-y-2">
                <h3 className="font-mono text-xs font-bold uppercase text-[#00E5FF]">
                  Membership Billing &amp; Cancellation Protection
                </h3>
                <p className="text-xs text-[#E6ECF5]/80 leading-relaxed">
                  Switch seamlessly between Monthly &amp; Annual billing (20% yearly savings), upgrade or cancel anytime
                  with zero lock-in penalty fees, and retain permanent local access to previously exported media files.
                </p>
              </div>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-3">
              <div className="cnc-recess rounded-[10px] p-4 space-y-2">
                <h3 className="font-mono text-xs font-bold uppercase text-white">
                  Terms of Service &amp; Privacy Standard
                </h3>
                <p className="text-xs text-[#E6ECF5]/80 leading-relaxed">
                  By operating KAYA Studio™, you confirm legal authorization over uploaded subjects, music stems, and
                  environments. Local storage caches membership settings, workstation member handles, and offline PWA
                  assets strictly on your device for instant 60–144fps startup and silent background auto-updates.
                </p>
              </div>

              <div className="cnc-module rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                    Compliance Stamp
                  </span>
                  <p className="font-mono text-[11px] text-[#E6ECF5]/60">
                    {acceptedAt
                      ? `Accepted & stored locally on ${acceptedAt}.`
                      : 'Record local compliance acknowledgment for commercial team exports.'}
                  </p>
                </div>
                <HardwareButton
                  size="sm"
                  tone="cyan"
                  active={!!acceptedAt}
                  onClick={handleAcknowledge}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>{acceptedAt ? 'Policies Accepted' : 'Accept & Verify'}</span>
                </HardwareButton>
              </div>
            </div>
          )}

          {tab === 'gpu' && (
            <div className="space-y-3">
              <div className="cnc-recess rounded-[10px] p-4 space-y-2 border border-[#FF1E42]/30">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#FF3B5C]">
                  <Cpu className="w-4 h-4" />
                  <span>Active Hardware Graphics Adapter &amp; Frame Pacing</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono">
                  <div className="cnc-module rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase text-[#E6ECF5]/55 block">WebGL2 Adapter</span>
                    <span className="text-xs text-[#00E5FF] font-semibold break-words">{gpuRenderer}</span>
                  </div>
                  <div className="cnc-module rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase text-[#E6ECF5]/55 block">Studio Output FPS</span>
                    <span className="text-xs text-white font-bold tabular-nums">{activeFps} fps</span>
                  </div>
                  <div className="cnc-module rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase text-[#E6ECF5]/55 block">Detected Display Hz</span>
                    <span className="text-xs text-[#FF64B8] font-bold tabular-nums">
                      {measuredHz ? `${measuredHz} Hz` : 'Measuring…'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cnc-module rounded-[8px] p-4 space-y-1.5 text-xs text-[#E6ECF5]/80">
                <span className="font-mono text-[11px] font-bold uppercase text-[#00E5FF] block">
                  Customer Frame Rate Support (24 / 30 / 60 / 90 / 120 / 144 fps)
                </span>
                <p className="leading-relaxed">
                  KAYA™ automatically requests high-performance discrete GPU scheduling for 3D Cube and Canvas renders.
                  Ensure Windows Graphics Preference is set to High Performance for maximum 120fps / 144fps playback.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="font-mono text-[11px] text-[#E6ECF5]/50">
            © 2024–2026 KAYA™ Music &amp; Studio. All Trademarks, Watermark Stamps &amp; Engines Self-Contained.
          </span>
          <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
            Close Menu
          </HardwareButton>
        </div>
      </PlateBezel>
    </div>
  );
}
