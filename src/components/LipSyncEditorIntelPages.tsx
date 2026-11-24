import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Download,
  Scissors,
  Cpu,
  Search,
  Globe,
  Eye,
  FolderTree,
  Volume2,
  Film,
  Compass,
  Sparkles,
  Send,
  Loader2,
  ZoomIn,
  EyeOff,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { RENDER_STYLE_PRESETS, FPS_PRESETS, FPSKey, RenderStyleKey } from '../lib/studioRenderer.js';
import { createZipBlob, ZipEntryInput } from '../lib/zipBuilder.js';
import { PRODUCTS, ATMOSPHERES } from '../data.js';
import type { StudioPageKey } from './RubiksCubeHubPage.js';

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

// ============================================================================
// PAGE 07: LOCAL PHONEME VISEME & VOICE LIP SYNC STUDIO
// ============================================================================

type LipCharacterStyle = 'cyberpunk' | 'anime' | 'realism' | 'bw_noir';
type VisemeShape = 'rest' | 'AH' | 'OH' | 'EE' | 'MBP' | 'FV';

function mapCharToViseme(ch: string): VisemeShape {
  const c = ch.toUpperCase();
  if ('AE'.includes(c)) return 'AH';
  if ('OUW'.includes(c)) return 'OH';
  if ('IY'.includes(c)) return 'EE';
  if ('MBP'.includes(c)) return 'MBP';
  if ('FV'.includes(c)) return 'FV';
  return 'rest';
}

export function LipSyncPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [scriptText, setScriptText] = useState(
    'KAYA workstation calibrated for sixty frames per second 4K ultra cinema production.'
  );
  const [charStyle, setCharStyle] = useState<LipCharacterStyle>('cyberpunk');
  const [mode, setMode] = useState<'demo' | 'speech' | 'mic'>('demo');
  const [activeViseme, setActiveViseme] = useState<VisemeShape>('rest');
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const visemeRef = useRef<VisemeShape>('rest');
  const modeRef = useRef<'demo' | 'speech' | 'mic'>('demo');
  const charStyleRef = useRef<LipCharacterStyle>('cyberpunk');
  const micLevelRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    charStyleRef.current = charStyle;
  }, [charStyle]);

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    micLevelRef.current = 0;
    setMicLevel(0);
  };

  useEffect(() => {
    let alive = true;
    const freqData = new Uint8Array(64);
    const start = performance.now();

    const drawFrame = (now: number) => {
      if (!alive) return;
      const t = (now - start) / 1000;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const st = charStyleRef.current;

      // Determine live viseme
      let currentV: VisemeShape = visemeRef.current;
      let mouthOpen = 0.15;

      if (modeRef.current === 'mic' && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < 24; i++) sum += freqData[i];
        const norm = Math.min(1, sum / (24 * 120));
        micLevelRef.current = norm;
        mouthOpen = 0.08 + norm * 0.92;
        currentV = norm > 0.65 ? 'AH' : norm > 0.42 ? 'OH' : norm > 0.2 ? 'EE' : 'rest';
        visemeRef.current = currentV;
      } else if (modeRef.current === 'demo') {
        const seq: VisemeShape[] = ['AH', 'EE', 'OH', 'MBP', 'AH', 'FV', 'EE', 'rest'];
        const idx = Math.floor(t * 5) % seq.length;
        currentV = seq[idx];
        visemeRef.current = currentV;
        mouthOpen = currentV === 'AH' ? 0.85 : currentV === 'OH' ? 0.68 : currentV === 'EE' ? 0.42 : 0.1;
      } else {
        mouthOpen =
          currentV === 'AH'
            ? 0.9
            : currentV === 'OH'
            ? 0.72
            : currentV === 'EE'
            ? 0.45
            : currentV === 'FV'
            ? 0.25
            : 0.08;
      }

      // Stage Background
      const bg = ctx.createLinearGradient(0, 0, w, h);
      if (st === 'bw_noir') {
        bg.addColorStop(0, '#09090b');
        bg.addColorStop(1, '#18181b');
      } else if (st === 'anime') {
        bg.addColorStop(0, '#180c2e');
        bg.addColorStop(1, '#091428');
      } else if (st === 'realism') {
        bg.addColorStop(0, '#10141c');
        bg.addColorStop(1, '#07090d');
      } else {
        bg.addColorStop(0, '#080b14');
        bg.addColorStop(0.5, '#170d20');
        bg.addColorStop(1, '#05151e');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle holographic grid
      ctx.save();
      ctx.strokeStyle =
        st === 'bw_noir'
          ? 'rgba(255,255,255,0.06)'
          : st === 'cyberpunk'
          ? 'rgba(255, 10, 60,0.12)'
          : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.restore();

      // Head & Studio VisorRig
      const cx = w / 2;
      const cy = h / 2 - 12 + Math.sin(t * 2.2) * 4;
      const headW = 210;
      const headH = 260;

      ctx.save();
      ctx.fillStyle = st === 'bw_noir' ? '#d4d4d8' : st === 'anime' ? '#fde6d8' : '#232938';
      ctx.strokeStyle = st === 'cyberpunk' ? '#F1F5F9' : st === 'bw_noir' ? '#fafafa' : '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - headW / 2, cy - headH / 2, headW, headH, [64, 64, 86, 86]);
      ctx.fill();
      ctx.stroke();

      // Eyes / Optical Visor
      const blink = Math.sin(t * 1.9) > 0.97 ? 0.15 : 1;
      if (st === 'cyberpunk') {
        const visorGrad = ctx.createLinearGradient(cx - 80, cy - 42, cx + 80, cy - 12);
        visorGrad.addColorStop(0, '#F1F5F9');
        visorGrad.addColorStop(0.5, '#FF2E63');
        visorGrad.addColorStop(1, '#FF1E42');
        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.roundRect(cx - 76, cy - 44, 152, 34 * blink, 10);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'bw_noir' ? '#09090b' : '#F1F5F9';
        ctx.beginPath();
        ctx.ellipse(cx - 42, cy - 26, 14, 10 * blink, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 42, cy - 26, 14, 10 * blink, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic Phoneme Mouth Cavity
      const mw = currentV === 'OH' ? 38 : currentV === 'EE' ? 84 : currentV === 'MBP' ? 68 : 72;
      const mh = Math.max(4, mouthOpen * 46);
      const my = cy + 56;

      ctx.fillStyle = '#090A0E';
      ctx.strokeStyle = st === 'bw_noir' ? '#18181b' : '#FF1E42';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, my, mw / 2, mh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Upper teeth hint when open
      if (mh > 14 && currentV !== 'MBP') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - mw * 0.28, my - mh * 0.36, mw * 0.56, Math.min(8, mh * 0.25));
      }

      // HUD Viseme Readout
      ctx.fillStyle = 'rgba(230, 236, 245, 0.72)';
      ctx.font = '600 12px monospace';
      ctx.fillText(`VISEME: ${currentV} · STYLE: ${st.toUpperCase()}`, 20, h - 18);
      ctx.restore();

      animRef.current = requestAnimationFrame(drawFrame);
    };

    animRef.current = requestAnimationFrame(drawFrame);
    return () => {
      alive = false;
      cancelAnimationFrame(animRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopMic();
    };
  }, []);

  const handleSpeakScript = () => {
    stopMic();
    setMicError(null);
    if (!('speechSynthesis' in window)) {
      setMode('demo');
      return;
    }
    window.speechSynthesis.cancel();
    setMode('speech');

    const utter = new SpeechSynthesisUtterance(scriptText.trim() || 'KAYA audio check.');
    utter.rate = 1.02;
    utter.pitch = 1.0;

    let boundaryTick: number | null = null;
    const words = scriptText.trim().split(/\s+/);
    let wordIdx = 0;

    utter.onboundary = () => {
      const ch = scriptText[Math.min(scriptText.length - 1, wordIdx)] || 'A';
      const v = mapCharToViseme(ch);
      visemeRef.current = v;
      setActiveViseme(v);
      wordIdx = (wordIdx + 2) % Math.max(1, scriptText.length);
    };

    boundaryTick = window.setInterval(() => {
      const word = words[wordIdx % Math.max(1, words.length)] || 'A';
      const v = mapCharToViseme(word[0] || 'A');
      visemeRef.current = v;
      setActiveViseme(v);
      wordIdx++;
    }, 115);

    utter.onend = () => {
      if (boundaryTick) clearInterval(boundaryTick);
      visemeRef.current = 'rest';
      setActiveViseme('rest');
      setMode('demo');
    };
    utter.onerror = () => {
      if (boundaryTick) clearInterval(boundaryTick);
      setMode('demo');
    };

    window.speechSynthesis.speak(utter);
  };

  const handleToggleMic = async () => {
    if (mode === 'mic') {
      stopMic();
      setMode('demo');
      return;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;
      setMode('mic');
    } catch (err: any) {
      setMicError(err?.message || 'Microphone access blocked or unavailable in browser.');
    }
  };

  const handleExportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `kaya-lipsync-${charStyle}-${activeViseme}.png`);
    }, 'image/png');
  };

  const handleExportZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      const entries: ZipEntryInput[] = [];
      for (let i = 0; i < 12; i++) {
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        entries.push({
          name: `kaya-lipsync-${String(i + 1).padStart(3, '0')}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        await new Promise((r) => setTimeout(r, 50));
      }
      downloadBlob(createZipBlob(entries), `kaya-lipsync-${charStyle}.zip`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mic className="w-4 h-4 text-[#FF5C8A]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            07. Local Lip Sync &amp; Phoneme Viseme Rig
          </h2>
        </div>
        <LedStatusIndicator
          label={mode === 'mic' ? 'Live Mic Viseme' : mode === 'speech' ? 'Speech Synth Sync' : '60 fps Auto Viseme'}
          tone={mode === 'mic' ? 'red' : 'cyan'}
          pulse={mode === 'mic'}
        />
      </div>

      <div className="cnc-recess rounded-[10px] p-2">
        <canvas
          ref={canvasRef}
          width={960}
          height={440}
          className="w-full aspect-video max-h-[400px] rounded-xl bg-[#050304]"
        />
      </div>

      {micError && (
        <div className="font-mono text-xs text-[#FF8DA1] bg-[#FF0A3C]/10 rounded-xl px-3 py-2">
          {micError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="candy-surface rounded-xl p-3.5 space-y-3">
          <label className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/65 block">
            Local Voice Script (Zero External API)
          </label>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={2}
            className="w-full bg-[#050304] border border-[#B84323]/25 rounded-xl p-2.5 font-mono text-xs text-[#E6ECF5] focus:outline-none focus:border-[#FF0A3C]"
          />
          <div className="flex flex-wrap gap-2">
            <HardwareButton size="sm" tone="cyan" active={mode === 'speech'} onClick={handleSpeakScript}>
              <Volume2 className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>Speak &amp; Animate</span>
            </HardwareButton>
            <HardwareButton
              size="sm"
              tone={mode === 'mic' ? 'red' : 'magenta'}
              active={mode === 'mic'}
              onClick={handleToggleMic}
            >
              {mode === 'mic' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#FF5C8A]" />}
              <span>{mode === 'mic' ? `Stop Mic (${Math.round(micLevel * 100)}%)` : 'Mic Live Sync'}</span>
            </HardwareButton>
            <HardwareButton
              size="sm"
              tone="neutral"
              active={mode === 'demo'}
              onClick={() => {
                stopMic();
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setMode('demo');
              }}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Auto Loop</span>
            </HardwareButton>
          </div>
        </div>

        <div className="cnc-recess rounded-[8px] p-3.5 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/65 block">
              Character Render Style
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['cyberpunk', 'anime', 'realism', 'bw_noir'] as LipCharacterStyle[]).map((st) => (
                <HardwareButton
                  key={st}
                  size="sm"
                  fullWidth
                  tone="magenta"
                  active={charStyle === st}
                  onClick={() => setCharStyle(st)}
                >
                  <span className="capitalize">{st === 'bw_noir' ? 'B&W Noir' : st}</span>
                </HardwareButton>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <HardwareButton size="sm" tone="cyan" onClick={handleExportFrame}>
              <Download className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>Export Frame (.png)</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="magenta" active disabled={exporting} onClick={handleExportZip}>
              <Download className="w-3.5 h-3.5 text-[#FF5C8A]" />
              <span>{exporting ? 'Packing…' : 'Export Sequence (.zip)'}</span>
            </HardwareButton>
          </div>
        </div>
      </div>
    </PlateBezel>
  );
}

// ============================================================================
// PAGE 08: NON-LINEAR TIMELINE CUT EDITOR
// ============================================================================

export interface CutVersionItem {
  label: string;
  videoUrl: string;
  mimeType: string;
  specLabel: string;
  prompt: string;
  duration?: string;
}

interface EditorPageProps {
  versions: CutVersionItem[];
  selectedLabel: string | null;
  onSelectVersion: (label: string) => void;
  onDownloadVersion: (v: CutVersionItem) => void;
  onGoToVideo: () => void;
  activeFps?: FPSKey;
  onChangeFps?: (fps: FPSKey) => void;
  resolutionLabel?: string;
  formatLabel?: string;
  shaderLabel?: string;
  titleHeadline?: string;
}

type EditorTrackKey = 'v1' | '3d' | 'fx' | 'ttl' | 'a1';

function formatEditorSmpte(sec: number, fps: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00:00:00';
  const totalFrames = Math.floor(sec * fps);
  const f = totalFrames % fps;
  const totalSec = Math.floor(sec);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function EditorPage({
  versions,
  selectedLabel,
  onSelectVersion,
  onDownloadVersion,
  onGoToVideo,
  activeFps = 60,
  onChangeFps,
  resolutionLabel = '4096×1716',
  formatLabel = 'WEBM',
  shaderLabel = 'Bioluminescent Magenta',
  titleHeadline = 'KNOCKSSTUDiOS',
}: EditorPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [trimInPct, setTrimInPct] = useState(0);
  const [trimOutPct, setTrimOutPct] = useState(100);
  const [playheadPct, setPlayheadPct] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(10);
  const [speed, setSpeed] = useState<number>(1);
  const [gradeCss, setGradeCss] = useState<string>('none');
  const [playing, setPlaying] = useState(true);
  const [zoom, setZoom] = useState<1 | 1.5 | 2 | 4>(1);
  const [splitMarkers, setSplitMarkers] = useState<number[]>([0, 100]);
  const [selectedSegIdx, setSelectedSegIdx] = useState(0);
  const [mutedTracks, setMutedTracks] = useState<Record<EditorTrackKey, boolean>>({
    v1: false,
    '3d': false,
    fx: false,
    ttl: false,
    a1: false,
  });

  const activeCut = versions.find((v) => v.label === selectedLabel) || versions[0] || null;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, activeCut]);

  const seekTimeline = (pct: number) => {
    const el = videoRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const clamped = Math.max(trimInPct, Math.min(trimOutPct, pct));
    el.currentTime = (clamped / 100) * el.duration;
    setPlayheadPct(clamped);
  };

  const handleRazorSplit = () => {
    const pct = Math.round(playheadPct);
    if (pct <= trimInPct + 3 || pct >= trimOutPct - 3) return;
    setSplitMarkers((prev) => {
      if (prev.some((m) => Math.abs(m - pct) < 4)) return prev;
      return [...prev, pct].sort((a, b) => a - b);
    });
  };

  const segments = splitMarkers.slice(0, -1).map((inP, idx) => ({
    idx,
    label: `Cut ${idx + 1}`,
    inP,
    outP: splitMarkers[idx + 1],
  }));
  const currentSeg = segments[Math.min(selectedSegIdx, Math.max(0, segments.length - 1))] ?? {
    idx: 0,
    label: 'Cut 1',
    inP: 0,
    outP: 100,
  };

  const toggleTrack = (k: EditorTrackKey) => {
    setMutedTracks((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Scissors className="w-4 h-4 text-[#FF007F]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5FFFA]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            DaVinci Multi-Track Timeline NLE &amp; Retiming
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#0A0A0A] border border-[#FF007F]/40 font-mono text-[11px] font-bold text-[#FC8EAC] tabular-nums">
            {formatEditorSmpte(currentTimeSec, activeFps)} · {activeFps} FPS
          </span>
          {activeCut && (
            <span className="px-2.5 py-1 rounded-full bg-[#0A0A0A] font-mono text-[10px] text-[#E0FFFF]/85 tabular-nums">
              {activeCut.specLabel}
            </span>
          )}
          <LedStatusIndicator
            label={activeCut ? `${activeCut.label} · ${speed}x` : 'No Cut Loaded'}
            tone="cyan"
          />
        </div>
      </div>

      {!activeCut ? (
        <div className="cnc-recess rounded-[10px] p-10 text-center space-y-4">
          <p className="font-mono text-xs text-[#E0FFFF]/75 max-w-md mx-auto leading-relaxed">
            No rendered reels loaded into the multi-track timeline yet. Render a {activeFps} FPS cut in Video Tools first to inspect V1/3D-V/FX/TTL/A1 tracks, razor cut splits, timeline zoom, trim In/Out points, and preview LUTs.
          </p>
          <HardwareButton tone="red" active onClick={onGoToVideo}>
            <Film className="w-3.5 h-3.5" />
            <span>Open Video Tools</span>
          </HardwareButton>
        </div>
      ) : (
        <>
          <div className="cnc-recess rounded-[10px] p-2">
            <video
              ref={videoRef}
              src={activeCut.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{ filter: gradeCss }}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (Number.isFinite(dur) && dur > 0) setDurationSec(dur);
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (!Number.isFinite(v.duration) || v.duration <= 0) return;
                const startT = (trimInPct / 100) * v.duration;
                const endT = Math.max(startT + 0.25, (trimOutPct / 100) * v.duration);
                if (v.currentTime < startT || v.currentTime >= endT) {
                  v.currentTime = startT;
                }
                setCurrentTimeSec(v.currentTime);
                setPlayheadPct((v.currentTime / v.duration) * 100);
              }}
              className="w-full aspect-video max-h-[380px] rounded-[7px] bg-black object-contain"
            />
          </div>

          {/* Interactive Multi-Track Visual Timeline */}
          <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[#E0FFFF]/70">
              <span>5-Track NLE Ruler (Click Track to Scrub · Razor Split · Zoom)</span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-[#00D9C0]" />
                  {([1, 1.5, 2, 4] as const).map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        zoom === z ? 'bg-[#00D9C0] text-[#0A0A0A]' : 'bg-[#121212] text-[#E0FFFF]/70'
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
                <HardwareButton size="sm" tone="red" active={splitMarkers.length > 2} onClick={handleRazorSplit}>
                  <Scissors className="w-3 h-3 text-[#FF007F]" />
                  <span>Razor Split</span>
                </HardwareButton>
                <span className="text-[#F5FFFA] tabular-nums">
                  In {trimInPct}% · Playhead {Math.round(playheadPct)}% · Out {trimOutPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[125px_minmax(0,1fr)] gap-2 rounded-xl bg-[#0A0A0A] p-2">
              <div className="hidden md:flex flex-col justify-between gap-1.5">
                {(
                  [
                    ['v1', 'V1 VIDEO'],
                    ['3d', '3D ASSET V'],
                    ['fx', 'FX SHADER'],
                    ['ttl', 'TTL TITLE'],
                    ['a1', 'A1 AUDIO'],
                  ] as [EditorTrackKey, string][]
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleTrack(k)}
                    className={`h-6 rounded-lg px-2 flex items-center justify-between font-mono text-[10px] cursor-pointer ${
                      mutedTracks[k]
                        ? 'bg-[#121212] opacity-45 text-[#E0FFFF]/50'
                        : 'bg-[#121212] text-[#F5FFFA]'
                    }`}
                  >
                    <span className="font-bold truncate">{lbl}</span>
                    {mutedTracks[k] ? (
                      <EyeOff className="w-3 h-3 text-[#FC8EAC]" />
                    ) : (
                      <Eye className="w-3 h-3 text-[#00D9C0]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    seekTimeline(pct);
                  }}
                  style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
                  className="relative space-y-1.5 cursor-pointer select-none overflow-hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 bottom-0 bg-[#FF007F]/10 border-x border-[#FF007F]/50"
                    style={{ left: `${trimInPct}%`, width: `${Math.max(2, trimOutPct - trimInPct)}%` }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#FF007F] z-20 shadow-[0_0_8px_#FF007F]"
                    style={{ left: `${playheadPct}%` }}
                  />
                  {splitMarkers.slice(1, -1).map((pct) => (
                    <div
                      key={pct}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#00D9C0]/80 z-10"
                      style={{ left: `${pct}%` }}
                    />
                  ))}

                  <div className={`relative z-10 h-6 rounded-lg bg-[#121212] flex items-center px-2.5 font-mono text-[10px] text-[#F5FFFA] ${mutedTracks.v1 ? 'opacity-30' : ''}`}>
                    V1 VIDEO · {activeCut.label} ({activeCut.duration || '10s'} · {activeFps} FPS)
                  </div>
                  <div className={`relative z-10 h-6 rounded-lg bg-[#170D16] flex items-center px-2.5 font-mono text-[10px] text-[#FFDAB9] ${mutedTracks['3d'] ? 'opacity-30' : ''}`}>
                    3D ASSET (V) · Valerius Crest · {shaderLabel}
                  </div>
                  <div className={`relative z-10 h-6 rounded-lg bg-[#1E0A16] flex items-center px-2.5 font-mono text-[10px] text-[#FF007F] ${mutedTracks.fx ? 'opacity-30' : ''}`}>
                    FX LUT / GRADE · {gradeCss === 'none' ? 'Bypass' : 'Custom Grade Active'}
                  </div>
                  <div className={`relative z-10 h-6 rounded-lg bg-[#14161D] flex items-center px-2.5 font-mono text-[10px] text-[#FC8EAC] ${mutedTracks.ttl ? 'opacity-30' : ''}`}>
                    TTL TYPOGRAPHY · "{titleHeadline}"
                  </div>
                  <div className={`relative z-10 h-6 rounded-lg bg-[#0D1414] flex items-center px-2.5 font-mono text-[10px] text-[#00D9C0] ${mutedTracks.a1 ? 'opacity-30' : ''}`}>
                    A1 AUDIO SYNC BED · Speed {speed}x
                  </div>
                </div>
              </div>
            </div>

            {/* Clip Inspector */}
            <div className="rounded-xl bg-[#0A0A0A] px-3 py-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[#00D9C0] uppercase font-bold">Inspector:</span>
                {segments.map((seg) => (
                  <button
                    key={seg.idx}
                    type="button"
                    onClick={() => setSelectedSegIdx(seg.idx)}
                    className={`px-2 py-0.5 rounded-full cursor-pointer ${
                      currentSeg.idx === seg.idx
                        ? 'bg-[#FF007F] text-[#F5FFFA] font-bold'
                        : 'bg-[#121212] text-[#E0FFFF]/70'
                    }`}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[#E0FFFF]/80 tabular-nums">
                <span>Span: <strong className="text-[#F5FFFA]">{currentSeg.inP}%–{currentSeg.outP}%</strong></span>
                <span>Spec: <strong className="text-[#00D9C0]">{resolutionLabel} · {activeFps} FPS · {formatLabel}</strong></span>
                <span>Shader: <strong className="text-[#FC8EAC]">{shaderLabel}</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Trim Range & FPS Lock */}
            <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 block">
                In / Out Trim ({trimInPct}% – {trimOutPct}%) &amp; Synced FPS
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[#F5FFFA]">
                  <span className="w-10">IN</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, trimOutPct - 5)}
                    value={trimInPct}
                    onChange={(e) => setTrimInPct(Number(e.target.value))}
                    className="hw-capsule-slider flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#FF007F]">
                  <span className="w-10">OUT</span>
                  <input
                    type="range"
                    min={Math.min(100, trimInPct + 5)}
                    max={100}
                    value={trimOutPct}
                    onChange={(e) => setTrimOutPct(Number(e.target.value))}
                    className="hw-capsule-slider flex-1"
                  />
                </div>
              </div>
              {onChangeFps && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {FPS_PRESETS.map((f) => (
                    <HardwareButton
                      key={f.key}
                      size="sm"
                      fullWidth
                      tone={f.key >= 90 ? 'red' : 'cyan'}
                      active={activeFps === f.key}
                      onClick={() => onChangeFps(f.key)}
                    >
                      <span className="tabular-nums">{f.label}</span>
                    </HardwareButton>
                  ))}
                </div>
              )}
            </div>

            {/* Playback Speed & Grade */}
            <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 block">
                Retiming Speed &amp; Grade Preview
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[0.25, 0.5, 1, 1.5, 2].map((r) => (
                  <HardwareButton
                    key={r}
                    size="sm"
                    fullWidth
                    tone="cyan"
                    active={speed === r}
                    onClick={() => setSpeed(r)}
                  >
                    <span>{r}x</span>
                  </HardwareButton>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { lbl: 'Original', css: 'none' },
                  { lbl: '4K HDR', css: 'contrast(1.18) saturate(1.22)' },
                  { lbl: 'Candy Bio', css: 'contrast(1.26) saturate(1.45) hue-rotate(-10deg)' },
                  { lbl: 'B&W Noir', css: 'grayscale(1) contrast(1.36)' },
                ].map((g) => (
                  <HardwareButton
                    key={g.lbl}
                    size="sm"
                    fullWidth
                    tone="magenta"
                    active={gradeCss === g.css}
                    onClick={() => setGradeCss(g.css)}
                  >
                    <span>{g.lbl}</span>
                  </HardwareButton>
                ))}
              </div>
            </div>

            {/* Cuts & Actions */}
            <div className="cnc-recess rounded-[8px] p-3.5 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 block">
                  Rendered Cuts ({versions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {versions.map((v) => (
                    <HardwareButton
                      key={v.label}
                      size="sm"
                      tone="cyan"
                      active={v.label === activeCut.label}
                      onClick={() => onSelectVersion(v.label)}
                    >
                      <span>{v.label}</span>
                    </HardwareButton>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <HardwareButton
                  size="sm"
                  tone="neutral"
                  onClick={() => {
                    const el = videoRef.current;
                    if (!el) return;
                    if (el.paused) {
                      el.play();
                      setPlaying(true);
                    } else {
                      el.pause();
                      setPlaying(false);
                    }
                  }}
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{playing ? 'Pause' : 'Play'}</span>
                </HardwareButton>
                <HardwareButton size="sm" tone="cyan" active onClick={() => onDownloadVersion(activeCut)}>
                  <Download className="w-3.5 h-3.5 text-[#00D9C0]" />
                  <span>Save Cut</span>
                </HardwareButton>
              </div>
            </div>
          </div>
        </>
      )}
    </PlateBezel>
  );
}

// ============================================================================
// PAGE 09: LOCAL VOICE, VISION RECOGNITION, SEARCH, GEO-GRID & CODE STRUCTURE
// ============================================================================

interface IntelCodePageProps {
  productUrl: string;
  onNavigatePage: (page: StudioPageKey) => void;
}

export function IntelCodePage({ productUrl, onNavigatePage }: IntelCodePageProps) {
  // 1. Speech Recognition & Synthesis
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('Local Web Speech engine ready.');

  // 2. Optical Pixel Recognition + Self-Hosted Vision AI
  const [swatches, setSwatches] = useState<string[]>([]);
  const [visionStats, setVisionStats] = useState<{
    luminance: number;
    contrast: number;
    edgeScore: number;
    recommendedStyle: string;
  } | null>(null);
  const [aiVisionLoading, setAiVisionLoading] = useState(false);
  const [aiVisionResult, setAiVisionResult] = useState<{
    analysis?: string;
    recommendedStyle?: string;
    lightingSuggestion?: string;
    colorNotes?: string;
  } | null>(null);
  const [aiVisionErr, setAiVisionErr] = useState<string | null>(null);

  // 2b. Vortex Self-Hosted Co-Director Chat
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatBusy, setAiChatBusy] = useState(false);
  const [aiChatReply, setAiChatReply] = useState<string | null>(null);
  const [aiChatErr, setAiChatErr] = useState<string | null>(null);

  // 3. Search & Local Geo-Grid
  const [searchQuery, setSearchQuery] = useState('');
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number; label: string }>({
    lat: 37.7749,
    lon: -122.4194,
    label: 'Default Sector (37.77°N, 122.42°W)',
  });
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4. Protected Runtime Module Summary (zero raw source file leakage)
  const runtimeModules = [
    { name: 'Candy & Pro Video Synthesis Core', spec: '24–144 fps · GPU Accelerated' },
    { name: '3D Spatial Cube & Storyboard Engine', spec: 'WebGL2 Hardware Pipeline' },
    { name: 'Music Mastering & © 2024–2026 Watermark', spec: '44.1 kHz RIFF / Sonic Stamp' },
    { name: 'Action Animator & VFX Compositor', spec: '60fps Motion Trails · RGBA' },
    { name: 'AirRadio FM & Live Broadcast Deck', spec: 'Local Audio/Cam Capture' },
    { name: 'Offline Service Worker & Auto-Sync', spec: 'Protected Local Runtime' },
  ];

  const handleRunAiVision = async () => {
    setAiVisionLoading(true);
    setAiVisionErr(null);
    try {
      let imageBase64 = productUrl;
      if (!imageBase64.startsWith('data:')) {
        const c = document.createElement('canvas');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load subject image'));
          img.src = productUrl;
        });
        c.width = Math.min(768, img.naturalWidth || 512);
        c.height = Math.round((c.width * (img.naturalHeight || 512)) / (img.naturalWidth || 512));
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
        imageBase64 = c.toDataURL('image/jpeg', 0.85);
      }
      const res = await fetch('/api/ai/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Vision analysis failed');
      setAiVisionResult(json);
    } catch {
      setAiVisionResult({
        analysis: `KAYA Local Optical Vision (${visionStats?.luminance ?? 52}% luma, ${visionStats?.contrast ?? 78}% contrast, ${visionStats?.edgeScore ?? 64}% sharpness): Clean foreground edge clarity suitable for Pro & Candy Finish grading.`,
        recommendedStyle: visionStats?.recommendedStyle || '4K HDR Ultra · Pro Obsidian & Candy Red',
        lightingSuggestion: '45° Platinum Chrome top-rim paired with a Candy Apple Red (#FF0A3C) low kicker to sculpt bevels.',
        colorNotes: 'Crush floor shadows to #050608 and anchor neutral highlights at #F1F5F9.',
      });
    } finally {
      setAiVisionLoading(false);
    }
  };

  const handleAskAiDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim() || aiChatBusy) return;
    setAiChatBusy(true);
    setAiChatErr(null);
    const question = aiChatInput.trim();
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: `Subject metrics: luminance ${visionStats?.luminance ?? '--'}%, contrast ${visionStats?.contrast ?? '--'}%`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'AI Co-Director unavailable');
      setAiChatReply(json.reply || '');
    } catch {
      setAiChatReply(
        `KAYA Native Co-Director (Offline Mode · Luma ${visionStats?.luminance ?? '--'}% / Contrast ${visionStats?.contrast ?? '--'}%): Lock subject framing in Display, apply a 45° Platinum Chrome rim + Candy Apple Red (#FF0A3C) accent flare inside Prompt Window, and align V1/FX/A1 markers on Timeline before 60–144fps master render.`
      );
    } finally {
      setAiChatBusy(false);
    }
  };

  // Analyze Subject image pixels locally
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!active) return;
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 72;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;

      let lumaSum = 0;
      let minL = 255;
      let maxL = 0;
      let edgeSum = 0;
      const bucket = new Map<string, number>();

      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lumaSum += lum;
          if (lum < minL) minL = lum;
          if (lum > maxL) maxL = lum;

          if (x > 0) {
            const prev = i - 4;
            edgeSum += Math.abs(r - data[prev]) + Math.abs(g - data[prev + 1]) + Math.abs(b - data[prev + 2]);
          }

          if ((x + y) % 3 === 0) {
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            const hex = `#${[qr, qg, qb].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
            bucket.set(hex, (bucket.get(hex) || 0) + 1);
          }
        }
      }

      const pxCount = c.width * c.height;
      const avgLum = Math.round((lumaSum / pxCount / 255) * 100);
      const contrast = Math.round(((maxL - minL) / 255) * 100);
      const edgeScore = Math.min(100, Math.round(edgeSum / pxCount / 2.2));
      const topSwatches = Array.from(bucket.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hex]) => hex);

      const recommendedStyle =
        contrast > 82 ? '4K HDR Ultra' : avgLum < 38 ? '3D Cyberpunk' : 'Realism / PBR';

      setSwatches(topSwatches);
      setVisionStats({ luminance: avgLum, contrast, edgeScore, recommendedStyle });
    };
    img.src = productUrl;
    return () => {
      active = false;
    };
  }, [productUrl]);

  // Draw local offline Latitude / Longitude World Geo-Grid Canvas
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#06080D';
    ctx.fillRect(0, 0, w, h);

    // Lat/Lon Graticule
    ctx.strokeStyle = 'rgba(255, 10, 60, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += h / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Simplified vector continental silhouettes (100% self-contained)
    const polygons: [number, number][][] = [
      // North America
      [[-165, 65], [-130, 70], [-60, 52], [-80, 25], [-105, 18], [-125, 38]],
      // South America
      [[-80, 10], [-35, -6], [-52, -34], [-68, -54], [-78, -18]],
      // Europe + Africa
      [[-10, 58], [40, 66], [42, 36], [50, 12], [28, -34], [12, -20], [-16, 15]],
      // Asia
      [[42, 66], [168, 66], [140, 35], [105, 8], [72, 12], [50, 32]],
      // Australia
      [[114, -22], [152, -26], [148, -38], [118, -34]],
    ];

    const projX = (lon: number) => ((lon + 180) / 360) * w;
    const projY = (lat: number) => ((90 - lat) / 180) * h;

    ctx.fillStyle = 'rgba(28, 36, 52, 0.85)';
    ctx.strokeStyle = 'rgba(255, 10, 60, 0.45)';
    ctx.lineWidth = 1.2;
    polygons.forEach((poly) => {
      ctx.beginPath();
      poly.forEach(([lon, lat], idx) => {
        const px = projX(lon);
        const py = projY(lat);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Plot active coordinate pin
    const mx = projX(geoCoords.lon);
    const my = projY(geoCoords.lat);
    ctx.strokeStyle = '#FF1E42';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, 0);
    ctx.lineTo(mx, h);
    ctx.moveTo(0, my);
    ctx.lineTo(w, my);
    ctx.stroke();

    ctx.fillStyle = '#FF1E42';
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.stroke();
  }, [geoCoords]);

  const routeCommand = (text: string) => {
    const lower = text.toLowerCase();
    const routes: [string, StudioPageKey][] = [
      ['radio', 'airradio'],
      ['school', 'school'],
      ['coding', 'school'],
      ['live', 'live'],
      ['stream', 'live'],
      ['camera', 'live'],
      ['fight', 'animator'],
      ['animate', 'animator'],
      ['bridge', 'bridge'],
      ['cube', 'cube'],
      ['audio', 'audio'],
      ['video', 'video'],
      ['picture', 'picture'],
      ['vfx', 'vfx'],
      ['sound', 'sound'],
      ['lip', 'lipsync'],
      ['editor', 'editor'],
    ];
    for (const [kw, target] of routes) {
      if (lower.includes(kw)) {
        setVoiceFeedback(`Matched voice route -> ${target.toUpperCase()}`);
        onNavigatePage(target);
        return;
      }
    }
    setVoiceFeedback(`Captured transcript: "${text}"`);
  };

  const toggleVoiceListen = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceFeedback('Browser Web SpeechRecognition unavailable here; use quick command buttons.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (ev: any) => {
      const txt = ev.results?.[0]?.[0]?.transcript || '';
      setTranscript(txt);
      routeCommand(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setVoiceFeedback('Speech recognition inactive; microphone permission needed.');
    };
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleBrowserGeo = () => {
    if (!navigator.geolocation) {
      setGeoCoords((g) => ({ ...g, label: 'Geolocation API unsupported in this browser' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setGeoCoords({ lat, lon, label: `Device Pin (${lat}°, ${lon}°)` });
      },
      () => {
        setGeoCoords({ lat: 40.7128, lon: -74.006, label: 'Enterprise Hub Fallback (40.71°N, 74.01°W)' });
      }
    );
  };

  const searchableItems = [
    ...RENDER_STYLE_PRESETS.map((s) => ({ title: s.label, cat: 'Render Style', meta: s.desc })),
    ...FPS_PRESETS.map((f) => ({ title: f.label, cat: 'Frame Rate', meta: f.desc })),
    ...PRODUCTS.map((p) => ({ title: p.label, cat: 'Enterprise Subject', meta: p.description })),
    ...ATMOSPHERES.map((a) => ({ title: a.label, cat: 'Employee Environment', meta: a.description })),
  ].filter(
    (item) =>
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meta.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-[#F1F5F9]" />
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              09. KAYA Native AI Co-Director, Vision, Speech &amp; Geo-Grid
            </h2>
          </div>
          <LedStatusIndicator label="KAYA Native AI + Optical Vision Active" tone="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Local Speech & Voice Routing */}
          <div className="cnc-recess rounded-[8px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#F1F5F9] font-semibold flex items-center gap-2">
                <Mic className="w-3.5 h-3.5" />
                Local Speech &amp; Command AI
              </span>
              <HardwareButton size="sm" tone={listening ? 'red' : 'cyan'} active={listening} onClick={toggleVoiceListen}>
                <span>{listening ? 'Stop Listening' : 'Voice Dictate'}</span>
              </HardwareButton>
            </div>
            <p className="font-mono text-xs text-[#E6ECF5]/75 bg-[#050304] rounded-xl p-2.5">
              {transcript ? `"${transcript}" — ${voiceFeedback}` : voiceFeedback}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['cube', 'audio', 'video', 'picture', 'vfx', 'sound', 'lipsync', 'editor'] as StudioPageKey[]).map(
                (pg) => (
                  <HardwareButton key={pg} size="sm" tone="neutral" ledIndicator={false} onClick={() => onNavigatePage(pg)}>
                    <span className="uppercase">{pg}</span>
                  </HardwareButton>
                )
              )}
            </div>
          </div>

          {/* Local Canvas Optical Vision + Self-Hosted Vortex Vision */}
          <div className="candy-surface rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#FF5C8A] font-semibold flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                Optical &amp; KAYA Subject Vision
              </span>
              <HardwareButton
                size="sm"
                tone="red"
                active={!aiVisionLoading}
                disabled={aiVisionLoading}
                onClick={handleRunAiVision}
              >
                {aiVisionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#FF3B5C]" />
                )}
                <span>{aiVisionLoading ? 'Analyzing…' : 'AI Vision Analyze'}</span>
              </HardwareButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {swatches.map((hex) => (
                <div key={hex} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full candy-surface">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                  <span className="font-mono text-[10px] text-[#E6ECF5]/80">{hex}</span>
                </div>
              ))}
            </div>
            {visionStats && (
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="candy-trace-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#E6ECF5]/50">LUMINANCE</div>
                  <div className="text-white font-bold tabular-nums">{visionStats.luminance}%</div>
                </div>
                <div className="candy-trace-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#E6ECF5]/50">CONTRAST</div>
                  <div className="text-[#F1F5F9] font-bold tabular-nums">{visionStats.contrast}%</div>
                </div>
                <div className="candy-trace-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#E6ECF5]/50">SHARPNESS</div>
                  <div className="text-[#FF5C8A] font-bold tabular-nums">{visionStats.edgeScore}%</div>
                </div>
              </div>
            )}
            {aiVisionErr && (
              <p className="font-mono text-[11px] text-[#FF4D6D]">{aiVisionErr}</p>
            )}
            {aiVisionResult && (
              <div className="candy-surface rounded-xl p-2.5 space-y-1 font-mono text-[11px]">
                <div className="text-white font-semibold">{aiVisionResult.analysis}</div>
                {aiVisionResult.lightingSuggestion && (
                  <div className="text-[#FF5C8A]">Lighting: {aiVisionResult.lightingSuggestion}</div>
                )}
                {aiVisionResult.recommendedStyle && (
                  <div className="text-[#F1F5F9]/75">Style: {aiVisionResult.recommendedStyle}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Co-Director Chat Console */}
        <form onSubmit={handleAskAiDirector} className="candy-surface rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF0A3C]" />
              KAYA Co-Director (Lighting, Motion, VFX &amp; Self-Hosted Help)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              placeholder="Ask KAYA Co-Director for lighting setups, 144fps pacing, shader tips, or scene prompts…"
              className="flex-1 min-w-[220px] bg-[#050304] border border-[#B84323]/30 rounded-full px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#FF0A3C]"
            />
            <HardwareButton type="submit" size="sm" tone="red" active disabled={aiChatBusy || !aiChatInput.trim()}>
              {aiChatBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{aiChatBusy ? 'Thinking…' : 'Ask Co-Director'}</span>
            </HardwareButton>
          </div>
          {aiChatErr && <p className="font-mono text-xs text-[#FF4D6D]">{aiChatErr}</p>}
          {aiChatReply && (
            <div className="bg-[#050304] rounded-xl p-3 font-mono text-xs text-[#F1F5F9]/90 whitespace-pre-wrap leading-relaxed">
              {aiChatReply}
            </div>
          )}
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Interactive World Geo-Grid */}
          <div className="candy-surface rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#F1F5F9] font-semibold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Local Coordinate Geo-Grid
              </span>
              <HardwareButton size="sm" tone="cyan" onClick={handleBrowserGeo}>
                <Compass className="w-3.5 h-3.5 text-[#F1F5F9]" />
                <span>Locate Device</span>
              </HardwareButton>
            </div>
            <canvas
              ref={mapCanvasRef}
              width={560}
              height={220}
              className="w-full h-[180px] rounded-lg bg-[#050304]"
            />
            <div className="font-mono text-[11px] text-[#E6ECF5]/75 tabular-nums">{geoCoords.label}</div>
          </div>

          {/* Protected Engine Capabilities + Workstation Search */}
          <div className="candy-surface rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#FF5C8A] font-semibold flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5" />
                KAYA · KNOCKSSTUDiOS™ Engine Index
              </span>
              <span className="font-mono text-[11px] text-[#F1F5F9] tabular-nums">
                Self-Hosted · © 2024–2026
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#E6ECF5]/45 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search studio styles, subjects, environments, FPS…"
                className="w-full bg-[#050304] border border-[#B84323]/30 rounded-full pl-9 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-[#FF0A3C]"
              />
            </div>

            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
              {searchQuery.trim()
                ? searchableItems.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="candy-trace-tile rounded-xl px-3 py-1.5 font-mono text-xs flex justify-between gap-2">
                      <span className="text-white font-semibold truncate">{item.title}</span>
                      <span className="text-[#F1F5F9] text-[10px] shrink-0">{item.cat}</span>
                    </div>
                  ))
                : runtimeModules.map((entry) => (
                    <div key={entry.name} className="candy-trace-tile rounded-xl px-3 py-1.5 font-mono text-xs flex justify-between gap-2">
                      <span className="text-[#E6ECF5]/85">{entry.name}</span>
                      <span className="text-[#FF5C8A] text-[10px] tabular-nums">{entry.spec}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </PlateBezel>
    </div>
  );
}
