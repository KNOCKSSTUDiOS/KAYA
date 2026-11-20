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
  Gauge,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { FPSKey } from '../lib/studioRenderer.js';
import {
  UNIFIED_WATERMARK_TEXT,
  getUnifiedWatermarkConfig,
  setUnifiedWatermarkConfig,
} from '../lib/watermarkEngine.js';

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
  { key: 'brand', label: 'Brand™ & Watermark', tone: 'red', icon: <Award className="w-3.5 h-3.5" /> },
  { key: 'security', label: 'Protections', tone: 'cyan', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { key: 'policies', label: 'Policies', tone: 'magenta', icon: <Scale className="w-3.5 h-3.5" /> },
  { key: 'terms', label: 'Terms & Privacy', tone: 'cyan', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'gpu', label: 'Opus 4.7 GPU', tone: 'red', icon: <Gauge className="w-3.5 h-3.5" /> },
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
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(() => getUnifiedWatermarkConfig().enabled);

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || tab !== 'gpu') return;

    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
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
        setMeasuredHz(Math.round((frames * 1000) / elapsed));
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const toggleUnifiedWatermark = () => {
    const next = !watermarkEnabled;
    setWatermarkEnabled(next);
    setUnifiedWatermarkConfig({ enabled: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/92">
      <PlateBezel accent="red" className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FF0A3C]" />
            <div>
              <h2
                className="text-base sm:text-lg font-bold uppercase tracking-wider text-[#F5E9EA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                VORTEX · KAYA™ Governance, Policies &amp; Unified Watermark
              </h2>
              <p className="font-mono text-[11px] text-[#F5E9EA]/60">
                Active Plan: {activeTierLabel} · {activeFps} fps · Firebase Committed Backend
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {acceptedAt && <LedStatusIndicator label={`Verified ${acceptedAt}`} tone="emerald" />}
            <HardwareButton size="sm" tone="red" ledIndicator={false} onClick={onClose} aria-label="Close legal modal">
              <X className="w-4 h-4" />
            </HardwareButton>
          </div>
        </div>

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

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm text-[#F5E9EA]/85">
          {tab === 'brand' && (
            <div className="space-y-4">
              <div className="candy-trace-tile p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FF5E7E]">
                    Unified Studio Watermark Controller
                  </span>
                  <HardwareButton size="sm" tone="red" active={watermarkEnabled} onClick={toggleUnifiedWatermark}>
                    <span>{watermarkEnabled ? 'Unified Watermark: ON' : 'Unified Watermark: OFF'}</span>
                  </HardwareButton>
                </div>
                <p className="leading-relaxed text-xs">
                  Active Mark: <strong>{UNIFIED_WATERMARK_TEXT}</strong>. All video reels, audio stems, storyboards, and cooling scopes pass through one deduplicated watermark layer so marks never stack or overlap.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="candy-trace-tile p-4 space-y-1.5">
                  <h3 className="font-mono text-xs font-bold uppercase text-[#F5E9EA]">Creator Ownership</h3>
                  <p className="text-xs text-[#F5E9EA]/75 leading-relaxed">
                    Every 4K HDR reel, Blender GLB export, Printify mockup, and audio master authored inside VORTEX · KAYA™ belongs cleanly to its creator.
                  </p>
                </div>
                <div className="candy-trace-tile p-4 space-y-1.5">
                  <h3 className="font-mono text-xs font-bold uppercase text-[#E06844]">Protected Marks</h3>
                  <p className="text-xs text-[#F5E9EA]/75 leading-relaxed">
                    VORTEX™, KAYA™, Infinity · Valerius (V) Sentinel of the Ten Galaxies™, and Soul Cooling Forge Opus 4.7™ are protected studio marks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-3">
              <div className="candy-trace-tile p-4 space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#F5E9EA]">
                  <Lock className="w-4 h-4 text-[#FF0A3C]" />
                  <span>Committed Cloud Storage &amp; Zero-Device-Leak Policy</span>
                </div>
                <p className="text-xs leading-relaxed">
                  All user profiles, projects, Printify listings, billing states, and verified database connectors persist strictly to Firebase and committed self-hosted endpoints—zero records are routed to phone storage or SD card space.
                </p>
              </div>
            </div>
          )}

          {tab === 'policies' && (
            <div className="candy-trace-tile p-4 space-y-2 text-xs leading-relaxed">
              <h3 className="font-mono text-xs font-bold uppercase text-[#E06844]">Acceptable Use &amp; Billing Policy</h3>
              <ul className="space-y-1.5 list-disc list-inside text-[#F5E9EA]/80">
                <li>Self-hosted inference, MCP tools, and SQL endpoints operate without exposing third-party keys.</li>
                <li>Printify merch designs must use original or cleared studio artwork.</li>
                <li>Switch Monthly &amp; Yearly tiers across Soul Stripe and Infinity Billing anytime with no lock-in fees.</li>
              </ul>
            </div>
          )}

          {tab === 'terms' && (
            <div className="candy-trace-tile p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-[#F5E9EA] block">Session Compliance Confirmation</span>
                <p className="font-mono text-[11px] text-[#F5E9EA]/60">
                  {acceptedAt ? `Verified on ${acceptedAt}.` : 'Confirm compliance acknowledgment for studio exports.'}
                </p>
              </div>
              <HardwareButton
                size="sm"
                tone="cyan"
                active={!!acceptedAt}
                onClick={() => setAcceptedAt(new Date().toISOString().split('T')[0])}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{acceptedAt ? 'Policies Accepted' : 'Accept & Verify'}</span>
              </HardwareButton>
            </div>
          )}

          {tab === 'gpu' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="candy-trace-tile p-3 space-y-1">
                <span className="text-[10px] uppercase text-[#F5E9EA]/55 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> WebGL2 Adapter
                </span>
                <span className="text-xs text-[#F5E9EA] font-semibold break-words">{gpuRenderer}</span>
              </div>
              <div className="candy-trace-tile p-3 space-y-1">
                <span className="text-[10px] uppercase text-[#F5E9EA]/55 block">Studio Output FPS</span>
                <span className="text-xs text-white font-bold tabular-nums">{activeFps} fps</span>
              </div>
              <div className="candy-trace-tile p-3 space-y-1">
                <span className="text-[10px] uppercase text-[#F5E9EA]/55 block">Display Refresh</span>
                <span className="text-xs text-[#FF5E7E] font-bold tabular-nums">
                  {measuredHz ? `${measuredHz} Hz` : 'Measuring…'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="font-mono text-[11px] text-[#F5E9EA]/50">{UNIFIED_WATERMARK_TEXT}</span>
          <HardwareButton size="sm" tone="neutral" ledIndicator={false} onClick={onClose}>
            Close
          </HardwareButton>
        </div>
      </PlateBezel>
    </div>
  );
}
