import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Layers,
  Play,
  Pause,
  Upload,
  Volume2,
  Palette,
  Type,
  Zap,
  Check,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import {
  RENDER_STYLE_PRESETS,
  RenderStyleKey,
  RESOLUTION_PRESETS,
  ResolutionKey,
  exportCompositionStillFrame,
} from '../lib/studioRenderer.js';
import {
  GeneratorPresetKey,
  ShaderPresetKey,
  STUDIO_GENERATOR_PRESETS,
  STUDIO_SHADER_PRESETS,
  TitleOverlayConfig,
} from '../lib/studioPipelineTypes.js';
import { createZipBlob, ZipEntryInput } from '../lib/zipBuilder.js';
import { fileToDownscaledDataUrl } from '../images.js';

interface PictureStudioPageProps {
  productUrl: string;
  transparentProductUrl?: string;
  atmosphereUrl: string;
  activeShader?: ShaderPresetKey;
  onUploadPic?: (dataUrl: string, name: string) => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function PictureStudioPage({
  productUrl,
  transparentProductUrl,
  atmosphereUrl,
  activeShader,
  onUploadPic,
}: PictureStudioPageProps) {
  const [style, setStyle] = useState<RenderStyleKey>('3d_cyberpunk');
  const [resolution, setResolution] = useState<ResolutionKey>('cinemax_4k');
  const [transparentCutout, setTransparentCutout] = useState(false);
  const [exposure, setExposure] = useState(1.0);
  const [contrast, setContrast] = useState(1.05);
  const [saturation, setSaturation] = useState(1.05);
  const [customPicUrl, setCustomPicUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const picInputRef = useRef<HTMLInputElement | null>(null);

  const effectivePicUrl = customPicUrl || productUrl;
  const activeRes = RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[3];
  const activeStyleObj = RENDER_STYLE_PRESETS.find((s) => s.key === style) ?? RENDER_STYLE_PRESETS[0];

  const renderPreview = async () => {
    setRendering(true);
    try {
      const res = await exportCompositionStillFrame(
        {
          productUrl: effectivePicUrl,
          transparentProductUrl: customPicUrl ? undefined : transparentProductUrl,
          atmosphereUrl,
          durationSec: 10,
          resolution,
          hdrGrade: 'ultra_cinemax',
          renderStyle: style,
          shaderPreset: activeShader,
          exposure,
          contrast,
          saturation,
        },
        {
          progress: 0.35,
          transparentBackground: transparentCutout,
          includeShadow: true,
          format: 'png',
          maxWidth: 1600,
        }
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(res.blob));
    } finally {
      setRendering(false);
    }
  };

  useEffect(() => {
    renderPreview();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [
    effectivePicUrl,
    atmosphereUrl,
    style,
    resolution,
    transparentCutout,
    exposure,
    contrast,
    saturation,
    activeShader,
  ]);

  const handleSavePicture = async (format: 'png' | 'jpeg') => {
    setRendering(true);
    try {
      const res = await exportCompositionStillFrame(
        {
          productUrl: effectivePicUrl,
          transparentProductUrl: customPicUrl ? undefined : transparentProductUrl,
          atmosphereUrl,
          durationSec: 10,
          resolution,
          hdrGrade: 'ultra_cinemax',
          renderStyle: style,
          shaderPreset: activeShader,
          exposure,
          contrast,
          saturation,
        },
        {
          progress: 0.35,
          transparentBackground: transparentCutout,
          includeShadow: true,
          format,
        }
      );
      const ext = transparentCutout || format === 'png' ? 'png' : 'jpg';
      downloadBlob(res.blob, `knocksstudios-picture-${style}-${res.width}x${res.height}.${ext}`);
    } finally {
      setRendering(false);
    }
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ImageIcon className="w-4 h-4 text-[#00D9C0]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5FFFA]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Picture Tools · 4K Multi-Style Renderer
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={picInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await fileToDownscaledDataUrl(file);
                setCustomPicUrl(url);
                onUploadPic?.(url, file.name);
              } finally {
                if (picInputRef.current) picInputRef.current.value = '';
              }
            }}
          />
          <HardwareButton size="sm" tone="red" active onClick={() => picInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 text-[#FF007F]" />
            <span>Upload Pic</span>
          </HardwareButton>
          <span className="px-2.5 py-1 rounded-full bg-[#0A0A0A] font-mono text-[10px] text-[#E0FFFF]/85 tabular-nums">
            {activeRes.tag} · {activeRes.aspectDesc} · {transparentCutout ? 'RGBA Alpha' : '24-Bit RGB'}
          </span>
          <LedStatusIndicator label={activeStyleObj.label} tone="cyan" />
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="candy-surface rounded-xl p-2">
        <div className="relative w-full aspect-video max-h-[420px] rounded-lg overflow-hidden optical-glass flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Styled 4K Picture Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="font-mono text-xs text-[#E0FFFF]/65">Rendering preview…</span>
          )}
        </div>
      </div>

      {/* Style Matrix */}
      <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/65 block">
          Picture Render Style (19 Modes)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {RENDER_STYLE_PRESETS.slice(0, 15).map((s) => (
            <HardwareButton
              key={s.key}
              size="sm"
              fullWidth
              tone={s.key.includes('cyberpunk') || s.key === 'animorph' ? 'magenta' : 'cyan'}
              active={style === s.key}
              onClick={() => setStyle(s.key)}
            >
              <span className="truncate">{s.label}</span>
            </HardwareButton>
          ))}
        </div>
      </div>

      {/* Optical Picture Grading Tools */}
      <div className="cnc-recess rounded-[8px] p-3.5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/85">
            <span>Exposure</span>
            <span className="text-[#F5FFFA] tabular-nums">{exposure.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.65}
            max={1.45}
            step={0.05}
            value={exposure}
            onChange={(e) => setExposure(parseFloat(e.target.value))}
            className="hw-capsule-slider w-full"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/85">
            <span>Contrast</span>
            <span className="text-[#FF007F] tabular-nums">{contrast.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.75}
            max={1.65}
            step={0.05}
            value={contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            className="hw-capsule-slider w-full"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/85">
            <span>Saturation</span>
            <span className="text-[#FC8EAC] tabular-nums">{saturation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1.75}
            step={0.05}
            value={saturation}
            onChange={(e) => setSaturation(parseFloat(e.target.value))}
            className="hw-capsule-slider w-full"
          />
        </div>
      </div>

      {/* Export Controls */}
      <div className="cnc-recess rounded-[8px] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {RESOLUTION_PRESETS.map((r) => (
            <HardwareButton
              key={r.key}
              size="sm"
              tone="neutral"
              active={resolution === r.key}
              onClick={() => setResolution(r.key)}
            >
              <span>{r.label}</span>
            </HardwareButton>
          ))}
          <HardwareButton
            size="sm"
            tone="magenta"
            active={transparentCutout}
            onClick={() => setTransparentCutout((t) => !t)}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Transparent PNG: {transparentCutout ? 'ON' : 'OFF'}</span>
          </HardwareButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HardwareButton tone="cyan" active disabled={rendering} onClick={() => handleSavePicture('png')}>
            <Download className="w-3.5 h-3.5 text-[#00D9C0]" />
            <span>Save 4K PNG</span>
          </HardwareButton>
          {!transparentCutout && (
            <HardwareButton tone="neutral" disabled={rendering} onClick={() => handleSavePicture('jpeg')}>
              <Download className="w-3.5 h-3.5" />
              <span>Save JPG</span>
            </HardwareButton>
          )}
        </div>
      </div>
    </PlateBezel>
  );
}

export type VfxSubView = 'vfx_picture' | 'vfx_sound' | 'shaders' | 'titles' | 'generators';

type VfxLayerKey =
  | 'motion_trails'
  | 'cyber_rain'
  | 'anamorphic_flare'
  | 'glitch_slice'
  | 'scifi_hud'
  | 'animorph_wave'
  | '2d_halftone'
  | '2d_kaleidoscope';

type BfxBroadcastKey = 'chroma_split' | 'dts_scope' | 'broadcast_slate' | 'lens_halation';

interface VfxStingerSpec {
  id: string;
  label: string;
  freqStart: number;
  freqEnd: number;
  dur: number;
  wave: OscillatorType;
  tone: 'red' | 'cyan' | 'magenta';
}

const VFX_SOUND_STINGERS: VfxStingerSpec[] = [
  { id: 'laser_sweep', label: 'Laser Sweep', freqStart: 1850, freqEnd: 220, dur: 0.38, wave: 'sawtooth', tone: 'red' },
  { id: 'sub_drop', label: 'Bioluminescent Sub Drop', freqStart: 135, freqEnd: 28, dur: 0.9, wave: 'sine', tone: 'magenta' },
  { id: 'plasma_arc', label: 'Plasma Arc Discharge', freqStart: 320, freqEnd: 1180, dur: 0.45, wave: 'sawtooth', tone: 'cyan' },
  { id: 'glitch_burst', label: 'Glitch Frame Burst', freqStart: 1400, freqEnd: 85, dur: 0.24, wave: 'square', tone: 'red' },
  { id: 'anamorphic_swell', label: 'Anamorphic Lens Swell', freqStart: 160, freqEnd: 740, dur: 0.78, wave: 'triangle', tone: 'magenta' },
  { id: 'quantum_ping', label: 'Quantum Core Ping', freqStart: 1240, freqEnd: 980, dur: 0.55, wave: 'sine', tone: 'cyan' },
];

function encodeSimpleWav(samples: Float32Array, sampleRate: number): Blob {
  const len = 44 + samples.length * 2;
  const buf = new ArrayBuffer(len);
  const view = new DataView(buf);
  const wStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  wStr(0, 'RIFF');
  view.setUint32(4, len - 8, true);
  wStr(8, 'WAVE');
  wStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  wStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let p = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}

interface VfxStudioPageProps {
  productUrl?: string;
  atmosphereUrl: string;
  activeSubView?: VfxSubView;
  onChangeSubView?: (sub: VfxSubView) => void;
  activeShader?: ShaderPresetKey;
  onChangeShader?: (shader: ShaderPresetKey) => void;
  activeGenerator?: GeneratorPresetKey;
  onChangeGenerator?: (gen: GeneratorPresetKey) => void;
  titleOverlay?: TitleOverlayConfig;
  onChangeTitleOverlay?: (patch: Partial<TitleOverlayConfig>) => void;
  onApplyToVideo?: (summary: string) => void;
}

export function VfxStudioPage({
  productUrl,
  atmosphereUrl,
  activeSubView,
  onChangeSubView,
  activeShader,
  onChangeShader,
  activeGenerator,
  onChangeGenerator,
  titleOverlay,
  onChangeTitleOverlay,
  onApplyToVideo,
}: VfxStudioPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [localSubView, setLocalSubView] = useState<VfxSubView>('vfx_picture');
  const [localShader, setLocalShader] = useState<ShaderPresetKey>('bioluminescent_magenta');
  const [localGenerator, setLocalGenerator] = useState<GeneratorPresetKey>('bio_aurora');
  const [localTitle, setLocalTitle] = useState<TitleOverlayConfig>({
    enabled: true,
    headline: 'KNOCKSSTUDiOS',
    subline: 'Hollywood MOTiON Pictures · KAYA',
    typography: 'chakra_etch',
    accentHex: '#FF007F',
    placement: 'bottom',
  });

  const subView = activeSubView ?? localSubView;
  const setSubView = onChangeSubView ?? setLocalSubView;
  const shader = activeShader ?? localShader;
  const setShader = onChangeShader ?? setLocalShader;
  const generator = activeGenerator ?? localGenerator;
  const setGenerator = onChangeGenerator ?? setLocalGenerator;
  const currentTitle = titleOverlay ?? localTitle;
  const updateTitle = (patch: Partial<TitleOverlayConfig>) => {
    if (onChangeTitleOverlay) onChangeTitleOverlay(patch);
    else setLocalTitle((prev) => ({ ...prev, ...patch }));
  };

  const [effect, setEffect] = useState<VfxLayerKey>('motion_trails');
  const [bfxLayers, setBfxLayers] = useState<Record<BfxBroadcastKey, boolean>>({
    chroma_split: true,
    dts_scope: true,
    broadcast_slate: false,
    lens_halation: true,
  });
  const [motionTrailsOn, setMotionTrailsOn] = useState<boolean>(true);
  const [intensity, setIntensity] = useState(0.75);
  const [playing, setPlaying] = useState(true);
  const [exportingSeq, setExportingSeq] = useState(false);
  const [lastStinger, setLastStinger] = useState<VfxStingerSpec>(VFX_SOUND_STINGERS[0]);
  const soundPulseRef = useRef<number>(0);

  const toggleBfx = (k: BfxBroadcastKey) => {
    setBfxLayers((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const triggerStinger = (spec: VfxStingerSpec) => {
    setLastStinger(spec);
    soundPulseRef.current = performance.now();
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.wave;
    osc.frequency.setValueAtTime(spec.freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.freqEnd), ctx.currentTime + spec.dur);
    gain.gain.setValueAtTime(0.36, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + spec.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + spec.dur);
    setTimeout(() => ctx.close().catch(() => {}), Math.round(spec.dur * 1000) + 200);
  };

  const downloadStingerWav = async (spec: VfxStingerSpec) => {
    const sr = 44100;
    const offline = new OfflineAudioContext(1, Math.round(sr * spec.dur), sr);
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = spec.wave;
    osc.frequency.setValueAtTime(spec.freqStart, 0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, spec.freqEnd), spec.dur);
    gain.gain.setValueAtTime(0.4, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, spec.dur);
    osc.connect(gain);
    gain.connect(offline.destination);
    osc.start(0);
    osc.stop(spec.dur);
    const buf = await offline.startRendering();
    downloadBlob(encodeSimpleWav(buf.getChannelData(0), sr), `knocksstudios-vfx-${spec.id}.wav`);
  };

  useEffect(() => {
    let frameId = 0;
    let alive = true;
    const prod = productUrl ? new Image() : null;
    const atmo = new Image();
    if (prod && productUrl) {
      if (productUrl.startsWith('http') && !productUrl.startsWith(window.location.origin)) {
        prod.crossOrigin = 'anonymous';
      }
      prod.src = productUrl;
    }
    if (atmosphereUrl.startsWith('http') && !atmosphereUrl.startsWith(window.location.origin)) {
      atmo.crossOrigin = 'anonymous';
    }
    atmo.src = atmosphereUrl;

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.4 + Math.random() * 1.1,
      len: 16 + Math.random() * 34,
    }));

    const trailHistory: { x: number; y: number; scale: number; rot: number }[] = [];
    const start = performance.now();

    const draw = (now: number) => {
      if (!alive) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const t = (now - start) / 1000;
          const flashAge = (now - soundPulseRef.current) / 1000;
          const soundFlash = flashAge >= 0 && flashAge < 0.7 ? 1 - flashAge / 0.7 : 0;

          if (motionTrailsOn && subView === 'vfx_picture') {
            ctx.fillStyle = `rgba(10, 10, 10, ${0.32 - intensity * 0.16})`;
            ctx.fillRect(0, 0, w, h);
          } else {
            ctx.fillStyle = '#0A0A0A';
            ctx.fillRect(0, 0, w, h);
          }

          if (atmo.complete && atmo.naturalWidth > 0 && (subView !== 'generators' || generator === 'none')) {
            ctx.save();
            ctx.globalAlpha = motionTrailsOn ? 0.42 : 0.76;
            ctx.drawImage(atmo, 0, 0, w, h);
            ctx.restore();
          }

          // Active procedural Generator preview (full frame in generators sub-view or when active)
          const activeGen = subView === 'generators' && generator === 'none' ? 'bio_aurora' : generator;
          if (activeGen !== 'none') {
            ctx.save();
            if (activeGen === 'bio_aurora') {
              for (let band = 0; band < 4; band++) {
                ctx.beginPath();
                ctx.moveTo(0, h);
                for (let x = 0; x <= w; x += 24) {
                  const y = h * (0.3 + band * 0.14) + Math.sin(x * 0.008 + t * 2.2 + band) * 38 * intensity;
                  ctx.lineTo(x, y);
                }
                ctx.lineTo(w, h);
                ctx.closePath();
                ctx.fillStyle = band % 2 === 0 ? 'rgba(255, 0, 127, 0.22)' : 'rgba(0, 217, 192, 0.20)';
                ctx.fill();
              }
            } else if (activeGen === 'quantum_matrix') {
              ctx.strokeStyle = 'rgba(0, 217, 192, 0.26)';
              ctx.lineWidth = 1;
              for (let x = 0; x < w; x += 48) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
              }
              particles.forEach((p, idx) => {
                const px = p.x * w;
                const py = ((p.y + t * p.speed * 0.35) % 1) * h;
                ctx.fillStyle = idx % 2 === 0 ? '#FF007F' : '#00D9C0';
                ctx.beginPath();
                ctx.arc(px, py, 2.4, 0, Math.PI * 2);
                ctx.fill();
              });
            } else if (activeGen === 'candy_plasma') {
              const g = ctx.createRadialGradient(
                w * (0.5 + Math.cos(t * 1.4) * 0.2),
                h * (0.5 + Math.sin(t * 1.1) * 0.16),
                12,
                w / 2,
                h / 2,
                w * 0.65
              );
              g.addColorStop(0, 'rgba(255, 0, 127, 0.42)');
              g.addColorStop(0.5, 'rgba(252, 142, 172, 0.24)');
              g.addColorStop(1, 'rgba(255, 218, 185, 0.08)');
              ctx.fillStyle = g;
              ctx.fillRect(0, 0, w, h);
            } else if (activeGen === 'optical_grid') {
              const horizon = h * 0.54;
              ctx.strokeStyle = 'rgba(224, 255, 255, 0.25)';
              ctx.lineWidth = 1.2;
              for (let i = -9; i <= 9; i++) {
                ctx.beginPath();
                ctx.moveTo(w / 2 + i * 24, horizon);
                ctx.lineTo(w / 2 + i * 165, h);
                ctx.stroke();
              }
              for (let r = 0; r < 6; r++) {
                const pr = (r / 6 + t * 0.55) % 1;
                const y = horizon + pr * pr * (h - horizon);
                ctx.strokeStyle = `rgba(255, 0, 127, ${0.2 + pr * 0.45})`;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
              }
            }
            ctx.restore();
          }

          // Shader tint overlay
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          if (shader === 'bioluminescent_magenta') {
            const sg = ctx.createLinearGradient(0, 0, w, h);
            sg.addColorStop(0, `rgba(255, 0, 127, ${0.24 * intensity})`);
            sg.addColorStop(1, `rgba(0, 217, 192, ${0.18 * intensity})`);
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, w, h);
          } else if (shader === 'candy_pearlescent') {
            const sg = ctx.createLinearGradient(0, 0, w, h);
            sg.addColorStop(0, `rgba(252, 142, 172, ${0.26 * intensity})`);
            sg.addColorStop(0.5, `rgba(224, 255, 255, ${0.16 * intensity})`);
            sg.addColorStop(1, `rgba(255, 218, 185, ${0.22 * intensity})`);
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, w, h);
          } else if (shader === 'quantum_teal_holo') {
            ctx.fillStyle = `rgba(0, 217, 192, ${0.18 * intensity})`;
            ctx.fillRect(0, 0, w, h);
          } else if (shader === 'fresnel_peach_rim') {
            ctx.fillStyle = `rgba(255, 218, 185, ${0.18 * intensity})`;
            ctx.fillRect(0, 0, w, h);
          }
          ctx.restore();

          const orbitX = Math.sin(t * 2.1) * w * 0.12 * intensity;
          const orbitY = Math.cos(t * 1.6) * h * 0.07 * intensity;
          const curScale = 1 + Math.sin(t * 2.8) * 0.05 + soundFlash * 0.14;
          const curRot = Math.sin(t * 1.4) * 0.06 * intensity;

          if (playing) {
            trailHistory.push({ x: orbitX, y: orbitY, scale: curScale, rot: curRot });
            if (trailHistory.length > 10) trailHistory.shift();
          }

          if (prod && prod.complete && prod.naturalWidth > 0 && subView !== 'generators') {
            const aspect = prod.naturalWidth / prod.naturalHeight;
            const ph = h * 0.52;
            const pw = ph * aspect;

            if (motionTrailsOn && trailHistory.length > 1 && subView === 'vfx_picture') {
              for (let i = 0; i < trailHistory.length - 1; i++) {
                const tr = trailHistory[i];
                const ratio = (i + 1) / trailHistory.length;
                ctx.save();
                ctx.globalAlpha = ratio * 0.28 * intensity;
                ctx.translate(w / 2 + tr.x, h / 2 + tr.y);
                ctx.rotate(tr.rot);
                ctx.scale(tr.scale, tr.scale);
                ctx.drawImage(prod, -pw / 2, -ph / 2, pw, ph);
                ctx.restore();
              }
            }

            const waveX = effect === 'animorph_wave' ? Math.sin(t * 4) * 24 * intensity : 0;
            ctx.save();
            ctx.translate(w / 2 + orbitX + waveX, h / 2 + orbitY);
            ctx.rotate(curRot);
            ctx.scale(curScale, curScale);
            ctx.drawImage(prod, -pw / 2, -ph / 2, pw, ph);
            ctx.restore();
          }

          // Active VFX Passes
          if (subView === 'vfx_picture') {
            if (effect === 'motion_trails') {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              for (let s = 0; s < 14; s++) {
                const ang = (s / 14) * Math.PI * 2 + t * 1.4;
                const r1 = 80 + ((t * 180 + s * 35) % 240);
                const r2 = r1 + 65 * intensity;
                ctx.strokeStyle = s % 2 === 0 ? 'rgba(255, 0, 127, 0.72)' : 'rgba(0, 217, 192, 0.68)';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(w / 2 + orbitX + Math.cos(ang) * r1, h / 2 + orbitY + Math.sin(ang) * r1);
                ctx.lineTo(w / 2 + orbitX + Math.cos(ang) * r2, h / 2 + orbitY + Math.sin(ang) * r2);
                ctx.stroke();
              }
              ctx.restore();
            } else if (effect === 'cyber_rain') {
              ctx.save();
              ctx.strokeStyle = `rgba(0, 217, 192, ${0.38 + 0.45 * intensity})`;
              ctx.lineWidth = 2;
              particles.forEach((p) => {
                const py = ((p.y + (playing ? t * p.speed * 0.45 : 0)) % 1) * h;
                const px = p.x * w;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + p.len * intensity);
                ctx.stroke();
              });
              ctx.restore();
            } else if (effect === 'anamorphic_flare') {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              const fx = w * (0.5 + Math.sin(t * 1.3) * 0.3);
              const g = ctx.createLinearGradient(0, h * 0.45, w, h * 0.45);
              g.addColorStop(0, 'rgba(0,0,0,0)');
              g.addColorStop(0.5, `rgba(255, 0, 127, ${0.68 * intensity})`);
              g.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = g;
              ctx.fillRect(0, h * 0.43, w, h * 0.05);
              const r = ctx.createRadialGradient(fx, h * 0.45, 4, fx, h * 0.45, 220 * intensity);
              r.addColorStop(0, 'rgba(245, 255, 250, 0.85)');
              r.addColorStop(0.4, 'rgba(252, 142, 172, 0.45)');
              r.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = r;
              ctx.fillRect(0, 0, w, h);
              ctx.restore();
            } else if (effect === 'glitch_slice') {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              for (let s = 0; s < 6; s++) {
                const sy = ((Math.sin(t * 8 + s * 3.1) + 1) * 0.5) * h;
                const sh = 6 + (s % 3) * 8;
                ctx.fillStyle =
                  s % 2 === 0
                    ? `rgba(0, 217, 192, ${0.34 * intensity})`
                    : `rgba(255, 0, 127, ${0.34 * intensity})`;
                ctx.fillRect(0, sy, w, sh);
              }
              ctx.restore();
            } else if (effect === 'scifi_hud') {
              ctx.save();
              ctx.strokeStyle = `rgba(0, 217, 192, ${0.65 * intensity})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(w / 2, h / 2, 160, t, t + Math.PI * 1.4);
              ctx.stroke();
              ctx.strokeStyle = `rgba(255, 0, 127, ${0.55 * intensity})`;
              ctx.beginPath();
              ctx.arc(w / 2, h / 2, 190, -t * 1.3, -t * 1.3 + Math.PI);
              ctx.stroke();
              ctx.restore();
            } else if (effect === '2d_halftone') {
              ctx.save();
              ctx.fillStyle = `rgba(255, 0, 127, ${0.28 * intensity})`;
              const step = 20;
              for (let gx = 10; gx < w; gx += step) {
                for (let gy = 10; gy < h; gy += step) {
                  const rad = 1.6 + Math.abs(Math.sin(t * 2 + gx * 0.015 + gy * 0.015)) * 3.2 * intensity;
                  ctx.beginPath();
                  ctx.arc(gx, gy, rad, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              ctx.restore();
            } else if (effect === '2d_kaleidoscope') {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              ctx.translate(w / 2, h / 2);
              for (let k = 0; k < 8; k++) {
                ctx.save();
                ctx.rotate((k * Math.PI) / 4 + t * 0.45);
                ctx.strokeStyle =
                  k % 2 === 0
                    ? `rgba(255, 0, 127, ${0.55 * intensity})`
                    : `rgba(0, 217, 192, ${0.55 * intensity})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(40, -18, 220 * intensity, 36);
                ctx.restore();
              }
              ctx.restore();
            }
          }

          // Sound pulse ripple when VFX sound pad fires
          if (soundFlash > 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(0, 217, 192, ${soundFlash * 0.85})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 60 + (1 - soundFlash) * 240, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Active BFX Broadcast FX Layers
          if (bfxLayers.lens_halation) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const halo = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, w * 0.55);
            halo.addColorStop(0, `rgba(255, 0, 127, ${0.14 * intensity})`);
            halo.addColorStop(0.55, `rgba(252, 142, 172, ${0.1 * intensity})`);
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
          }

          if (bfxLayers.chroma_split) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = `rgba(255, 0, 127, ${0.42 * intensity})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, w - 20, h - 20);
            ctx.strokeStyle = `rgba(0, 217, 192, ${0.38 * intensity})`;
            ctx.strokeRect(14, 12, w - 28, h - 24);
            ctx.restore();
          }

          if (bfxLayers.dts_scope) {
            ctx.save();
            const bars = 28;
            const bw = 6;
            const startX = w - bars * (bw + 3) - 22;
            for (let b = 0; b < bars; b++) {
              const mag =
                8 +
                (Math.abs(Math.sin(t * 7.5 + b * 0.48)) * 38 + soundFlash * 28) * intensity;
              ctx.fillStyle = b > 20 ? '#FF007F' : '#00D9C0';
              ctx.fillRect(startX + b * (bw + 3), h - 20 - mag, bw, mag);
            }
            ctx.fillStyle = 'rgba(224, 255, 255, 0.78)';
            ctx.font = '600 10px monospace';
            ctx.fillText('BFX · DTS:X / SONY SDDS SCOPE', startX, h - 72);
            ctx.restore();
          }

          if (bfxLayers.broadcast_slate || subView === 'titles' || currentTitle.enabled) {
            const yBase =
              currentTitle.placement === 'top'
                ? 58
                : currentTitle.placement === 'center'
                ? h / 2
                : h - 46;
            const boxX = currentTitle.placement === 'center' ? w / 2 - 210 : 22;
            const boxY = yBase - 28;
            ctx.save();
            ctx.fillStyle = 'rgba(10, 10, 10, 0.84)';
            ctx.fillRect(boxX, boxY, 420, 50);
            ctx.fillStyle = currentTitle.accentHex || '#FF007F';
            ctx.fillRect(boxX, boxY, 4, 50);
            ctx.fillStyle = '#F5FFFA';
            ctx.font =
              currentTitle.typography === 'hollywood_serif'
                ? '700 15px Georgia, serif'
                : currentTitle.typography === 'mono_broadcast'
                ? '700 14px monospace'
                : '800 15px sans-serif';
            ctx.fillText(currentTitle.headline || 'KNOCKSSTUDiOS', boxX + 16, boxY + 21);
            ctx.fillStyle = currentTitle.accentHex || '#00D9C0';
            ctx.font = '600 11px monospace';
            ctx.fillText(currentTitle.subline || 'Hollywood MOTiON Pictures · KAYA', boxX + 16, boxY + 39);
            ctx.restore();
          }
        }
      }
      if (playing) frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
    };
  }, [
    productUrl,
    atmosphereUrl,
    effect,
    bfxLayers,
    motionTrailsOn,
    intensity,
    playing,
    subView,
    shader,
    generator,
    currentTitle,
  ]);

  const handleSaveVfxZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExportingSeq(true);
    try {
      const entries: ZipEntryInput[] = [];
      for (let i = 0; i < 12; i++) {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );
        entries.push({
          name: `knocksstudios-vfx-${effect}-${String(i + 1).padStart(3, '0')}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        await new Promise((r) => setTimeout(r, 45));
      }
      downloadBlob(createZipBlob(entries), `knocksstudios-vfx-${effect}.zip`);
    } finally {
      setExportingSeq(false);
    }
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF007F]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5FFFA]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VFX Picture · VFX Sound · Shaders · Titles · Generators
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LedStatusIndicator label={`Shader: ${shader.replace('_', ' ')}`} tone="cyan" />
          <LedStatusIndicator label={subView.replace('_', ' ')} tone="magenta" />
        </div>
      </div>

      {/* Dedicated 5 Sub-View Navigation */}
      <div className="cnc-recess rounded-[10px] p-2.5 flex flex-wrap items-center gap-2">
        {(
          [
            ['vfx_picture', 'VFX Picture', <Sparkles className="w-3.5 h-3.5" />, 'red'],
            ['vfx_sound', 'VFX Sound', <Volume2 className="w-3.5 h-3.5" />, 'cyan'],
            ['shaders', 'Shaders', <Palette className="w-3.5 h-3.5" />, 'magenta'],
            ['titles', 'Titles / Typography', <Type className="w-3.5 h-3.5" />, 'cyan'],
            ['generators', 'Generators', <Zap className="w-3.5 h-3.5" />, 'red'],
          ] as [VfxSubView, string, React.ReactNode, 'red' | 'cyan' | 'magenta'][]
        ).map(([k, lbl, icon, tone]) => (
          <HardwareButton
            key={k}
            size="sm"
            tone={tone}
            active={subView === k}
            onClick={() => setSubView(k)}
          >
            {icon}
            <span>{lbl}</span>
          </HardwareButton>
        ))}
      </div>

      {/* Shared Live VFX Canvas Viewport */}
      <div className="candy-surface rounded-xl p-2">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full aspect-video max-h-[420px] rounded-lg bg-[#0A0A0A]"
        />
      </div>

      {/* SUB-VIEW 1: VFX PICTURE */}
      {subView === 'vfx_picture' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="cnc-recess rounded-[8px] p-4 space-y-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FC8EAC] block">
              VFX Picture Visual Passes
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['motion_trails', 'Motion Trails'],
                  ['cyber_rain', 'Cyber Rain'],
                  ['anamorphic_flare', 'Anamorphic Flare'],
                  ['glitch_slice', 'Glitch Slice'],
                  ['scifi_hud', 'Sci-Fi HUD'],
                  ['animorph_wave', 'Animorph Wave'],
                  ['2d_halftone', '2D Halftone'],
                  ['2d_kaleidoscope', '2D Kaleidoscope'],
                ] as [VfxLayerKey, string][]
              ).map(([k, lbl]) => (
                <HardwareButton key={k} size="sm" fullWidth tone="magenta" active={effect === k} onClick={() => setEffect(k)}>
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
            </div>
          </div>

          <div className="cnc-recess rounded-[8px] p-4 space-y-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FFDAB9] block">
              BFX Broadcast FX &amp; Optical Layers
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['chroma_split', 'Chromatic Frame'],
                  ['dts_scope', 'DTS / Sony Waveform'],
                  ['broadcast_slate', 'Broadcast Slate'],
                  ['lens_halation', 'Lens Halation'],
                ] as [BfxBroadcastKey, string][]
              ).map(([k, lbl]) => (
                <HardwareButton
                  key={k}
                  size="sm"
                  fullWidth
                  tone="red"
                  active={bfxLayers[k]}
                  onClick={() => toggleBfx(k)}
                >
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: VFX SOUND */}
      {subView === 'vfx_sound' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D9C0]">
              VFX Visual-Synced Sound Stingers (Click Pad to Trigger Pulse + Audio)
            </span>
            <HardwareButton size="sm" tone="cyan" active onClick={() => downloadStingerWav(lastStinger)}>
              <Download className="w-3.5 h-3.5" />
              <span>Export "{lastStinger.label}" (.wav)</span>
            </HardwareButton>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {VFX_SOUND_STINGERS.map((st) => (
              <HardwareButton
                key={st.id}
                size="lg"
                fullWidth
                tone={st.tone}
                active={lastStinger.id === st.id}
                onClick={() => triggerStinger(st)}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="truncate">{st.label}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SHADERS */}
      {subView === 'shaders' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]">
              KNOCKSSTUDiOS Pearlescent &amp; Bioluminescent Shader Library
            </span>
            {onApplyToVideo && (
              <HardwareButton
                size="sm"
                tone="red"
                active
                onClick={() => onApplyToVideo(`Bound shader "${shader}" to Video Pipeline`)}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bind Shader to Video Pipeline</span>
              </HardwareButton>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {STUDIO_SHADER_PRESETS.map((sh) => (
              <HardwareButton
                key={sh.key}
                size="md"
                fullWidth
                tone="cyan"
                active={shader === sh.key}
                onClick={() => setShader(sh.key)}
              >
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: sh.swatch }}
                />
                <span className="truncate">{sh.label}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: TITLES / TYPOGRAPHY */}
      {subView === 'titles' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FC8EAC]">
              Titles &amp; Typography Slate Composer (KNOCKSSTUDiOS · Hollywood MOTiON Pictures)
            </span>
            <HardwareButton
              size="sm"
              tone={currentTitle.enabled ? 'red' : 'neutral'}
              active={currentTitle.enabled}
              onClick={() => updateTitle({ enabled: !currentTitle.enabled })}
            >
              <span>Overlay: {currentTitle.enabled ? 'ON' : 'OFF'}</span>
            </HardwareButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={currentTitle.headline}
              onChange={(e) => updateTitle({ headline: e.target.value })}
              placeholder="KNOCKSSTUDiOS"
              className="w-full rounded-full bg-[#0A0A0A] border border-[#FF007F]/35 px-4 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none focus:border-[#00D9C0]"
            />
            <input
              type="text"
              value={currentTitle.subline}
              onChange={(e) => updateTitle({ subline: e.target.value })}
              placeholder="Hollywood MOTiON Pictures"
              className="w-full rounded-full bg-[#0A0A0A] border border-[#00D9C0]/35 px-4 py-2 font-mono text-xs text-[#E0FFFF] focus:outline-none focus:border-[#FF007F]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['chakra_etch', 'Chakra Etch'],
                  ['hollywood_serif', 'Hollywood Serif'],
                  ['mono_broadcast', 'Mono Broadcast'],
                ] as const
              ).map(([k, lbl]) => (
                <HardwareButton
                  key={k}
                  size="sm"
                  tone="cyan"
                  active={currentTitle.typography === k}
                  onClick={() => updateTitle({ typography: k })}
                >
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['top', 'center', 'bottom'] as const).map((pos) => (
                <HardwareButton
                  key={pos}
                  size="sm"
                  tone="magenta"
                  active={currentTitle.placement === pos}
                  onClick={() => updateTitle({ placement: pos })}
                >
                  <span className="capitalize">{pos}</span>
                </HardwareButton>
              ))}
              {(['#FF007F', '#00D9C0', '#FC8EAC', '#FFDAB9', '#F5FFFA'] as const).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => updateTitle({ accentHex: hex })}
                  aria-label={`Set title accent ${hex}`}
                  className={`w-6 h-6 rounded-full cursor-pointer border-2 ${
                    currentTitle.accentHex === hex ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: GENERATORS */}
      {subView === 'generators' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D9C0]">
              Procedural Motion Generators (Full Frame Backdrop Engine)
            </span>
            {onApplyToVideo && (
              <HardwareButton
                size="sm"
                tone="red"
                active
                onClick={() => onApplyToVideo(`Bound generator "${generator}" to Video Pipeline`)}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Bind Generator to Video</span>
              </HardwareButton>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {STUDIO_GENERATOR_PRESETS.map((g) => (
              <HardwareButton
                key={g.key}
                size="md"
                fullWidth
                tone="red"
                active={generator === g.key}
                onClick={() => setGenerator(g.key)}
              >
                <span>{g.label}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* Shared Footer Controls */}
      <div className="cnc-recess rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <HardwareButton
            size="sm"
            tone="cyan"
            active={motionTrailsOn}
            onClick={() => setMotionTrailsOn((m) => !m)}
          >
            <span>Trails Buffer: {motionTrailsOn ? 'ON' : 'OFF'}</span>
          </HardwareButton>
          <span className="font-mono text-[11px] text-[#E0FFFF]/75">
            FX Intensity ({Math.round(intensity * 100)}%)
          </span>
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="hw-capsule-slider w-28"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HardwareButton size="sm" tone="cyan" active={playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </HardwareButton>
          <HardwareButton size="sm" tone="cyan" active disabled={exportingSeq} onClick={handleSaveVfxZip}>
            <Download className="w-3.5 h-3.5 text-[#00D9C0]" />
            <span>{exportingSeq ? 'Packing…' : 'Export VFX + BFX (.zip)'}</span>
          </HardwareButton>
        </div>
      </div>
    </PlateBezel>
  );
}
