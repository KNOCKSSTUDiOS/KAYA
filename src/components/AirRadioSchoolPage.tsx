import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Mic,
  GraduationCap,
  Code2,
  Sparkles,
  CheckCircle2,
  Terminal,
  Cpu,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';

// ============================================================================
// KAYA AIRRADIO BROADCAST STATION
// ============================================================================

interface RadioChannel {
  id: string;
  freq: number;
  name: string;
  genre: string;
  bpm: number;
  rootHz: number;
  wave: OscillatorType;
  cutoffHz: number;
}

const AIRRADIO_CHANNELS: RadioChannel[] = [
  { id: 'neon', freq: 98.4, name: 'KAYA 98.4 Neon Synth', genre: 'Synthwave FM', bpm: 118, rootHz: 110, wave: 'sawtooth', cutoffHz: 1650 },
  { id: 'titanium', freq: 101.2, name: 'KAYA 101.2 Titanium Sub', genre: 'Deep Bass Broadcast', bpm: 128, rootHz: 65.4, wave: 'triangle', cutoffHz: 950 },
  { id: 'cyber', freq: 104.8, name: 'KAYA 104.8 Cyber Pulse', genre: 'Electro Arpeggio', bpm: 136, rootHz: 146.8, wave: 'square', cutoffHz: 2100 },
  { id: 'ambient', freq: 88.9, name: 'KAYA 88.9 Orbital Glow', genre: 'Ambient Cinema', bpm: 78, rootHz: 98.0, wave: 'sine', cutoffHz: 1100 },
  { id: 'street', freq: 94.6, name: 'KAYA 94.6 Beat Loop', genre: 'Rhythm Workshop', bpm: 96, rootHz: 82.4, wave: 'sawtooth', cutoffHz: 1350 },
];

export function AirRadioPage() {
  const [channelIdx, setChannelIdx] = useState(0);
  const [tunerFreq, setTunerFreq] = useState(98.4);
  const [onAir, setOnAir] = useState(false);
  const [micLive, setMicLive] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [broadcastStatus, setBroadcastStatus] = useState('AirRadio Deck Ready');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxAudioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);

  const activeChannel = AIRRADIO_CHANNELS[channelIdx];

  const stopAudio = () => {
    window.clearInterval(timerRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setMicLive(false);
    setOnAir(false);
    setBroadcastStatus('AirRadio Standby');
  };

  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      ctxAudioRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  const startChannel = (idx: number) => {
    setChannelIdx(idx);
    const ch = AIRRADIO_CHANNELS[idx];
    setTunerFreq(ch.freq);

    window.clearInterval(timerRef.current);
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!ctxAudioRef.current) {
      ctxAudioRef.current = new AC();
    }
    const actx = ctxAudioRef.current;
    if (actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }

    if (!gainRef.current || !analyserRef.current) {
      const gain = actx.createGain();
      gain.gain.value = volume;
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      gain.connect(analyser);
      analyser.connect(actx.destination);
      gainRef.current = gain;
      analyserRef.current = analyser;
    }

    const scale = [1, 1.25, 1.5, 1.875, 2, 1.5, 1.25, 1.125];
    let step = 0;
    const msPerBeat = Math.max(120, Math.round((60_000 / ch.bpm) / 2));

    const triggerNote = () => {
      if (!ctxAudioRef.current || !gainRef.current) return;
      const now = ctxAudioRef.current.currentTime;
      const osc = ctxAudioRef.current.createOscillator();
      const filter = ctxAudioRef.current.createBiquadFilter();
      const env = ctxAudioRef.current.createGain();

      osc.type = ch.wave;
      osc.frequency.setValueAtTime(ch.rootHz * scale[step % scale.length], now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(ch.cutoffHz, now);

      env.gain.setValueAtTime(0.001, now);
      env.gain.exponentialRampToValueAtTime(0.32, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + msPerBeat / 1000);

      osc.connect(filter);
      filter.connect(env);
      env.connect(gainRef.current);
      osc.start(now);
      osc.stop(now + msPerBeat / 1000 + 0.02);
      step++;
    };

    triggerNote();
    timerRef.current = window.setInterval(triggerNote, msPerBeat);
    setOnAir(true);
    setBroadcastStatus(`ON AIR · ${ch.name} (${ch.freq} MHz)`);
  };

  const toggleLiveMic = async () => {
    if (micLive) {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      setMicLive(false);
      setBroadcastStatus(onAir ? `ON AIR · ${activeChannel.name}` : 'AirRadio Standby');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!ctxAudioRef.current) ctxAudioRef.current = new AC();
      const actx = ctxAudioRef.current;
      if (actx.state === 'suspended') await actx.resume();
      if (!analyserRef.current) {
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
      }
      const src = actx.createMediaStreamSource(stream);
      src.connect(analyserRef.current);
      setMicLive(true);
      setBroadcastStatus('LIVE MIC ON AIR · Voice Feed Active');
    } catch {
      setBroadcastStatus('Mic permission required to route live voice onto AirRadio.');
    }
  };

  // Realtime AirRadio FM Spectrum Visualizer
  useEffect(() => {
    let raf = 0;
    const renderScope = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#030407';
          ctx.fillRect(0, 0, w, h);

          // Subtle FM frequency ruler lines
          ctx.strokeStyle = 'rgba(255, 10, 60, 0.14)';
          ctx.lineWidth = 1;
          for (let x = 20; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }

          if (analyserRef.current && (onAir || micLive)) {
            const bins = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(bins);
            const barW = w / 48;
            for (let i = 0; i < 48; i++) {
              const mag = bins[i] / 255;
              const bh = Math.max(4, mag * (h * 0.82));
              ctx.fillStyle = i % 3 === 0 ? '#FF1E42' : i % 2 === 0 ? '#F1F5F9' : '#FF2E63';
              ctx.fillRect(i * barW + 2, h - bh, Math.max(2, barW - 4), bh);
            }
          } else {
            ctx.strokeStyle = 'rgba(255, 30, 66, 0.45)';
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(renderScope);
    };
    raf = requestAnimationFrame(renderScope);
    return () => cancelAnimationFrame(raf);
  }, [onAir, micLive]);

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-[#F1F5F9]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            KAYA AirRadio · Broadcast &amp; Live FM Synth Console
          </h2>
        </div>
        <LedStatusIndicator label={broadcastStatus} tone={onAir || micLive ? 'red' : 'cyan'} pulse={onAir || micLive} />
      </div>

      {/* Live FM Spectrum & Carrier Readout */}
      <div className="cnc-recess rounded-[10px] p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <span className="text-[#F1F5F9] font-bold text-lg tabular-nums">{tunerFreq.toFixed(1)} MHz</span>
          <span className="text-[#E6ECF5]/75">{activeChannel.name} · {activeChannel.genre}</span>
          <span className="text-[#FF3B5C] tabular-nums">{activeChannel.bpm} BPM</span>
        </div>
        <canvas ref={canvasRef} width={880} height={150} className="w-full h-[140px] rounded-[7px] bg-black border border-white/10" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-[#E6ECF5]/70">FM Band</span>
            <input
              type="range"
              min={88.0}
              max={108.0}
              step={0.1}
              value={tunerFreq}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTunerFreq(val);
                let bestIdx = 0;
                let bestDiff = 999;
                AIRRADIO_CHANNELS.forEach((c, idx) => {
                  const d = Math.abs(c.freq - val);
                  if (d < bestDiff) {
                    bestDiff = d;
                    bestIdx = idx;
                  }
                });
                if (bestIdx !== channelIdx && onAir) startChannel(bestIdx);
                else setChannelIdx(bestIdx);
              }}
              className="hw-capsule-slider w-44 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-[#E6ECF5]/70">Gain</span>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="hw-capsule-slider w-24"
            />
          </div>
        </div>
      </div>

      {/* Channel Matrix + Broadcast Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {AIRRADIO_CHANNELS.map((ch, idx) => (
          <HardwareButton
            key={ch.id}
            size="sm"
            fullWidth
            tone={idx % 2 === 0 ? 'cyan' : 'magenta'}
            active={channelIdx === idx && onAir}
            onClick={() => startChannel(idx)}
          >
            <span className="tabular-nums font-bold">{ch.freq}</span>
            <span className="truncate">{ch.name.replace(/^KAYA [\d.]+ /, '')}</span>
          </HardwareButton>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <HardwareButton
          size="md"
          tone={onAir ? 'red' : 'cyan'}
          active
          onClick={() => (onAir ? stopAudio() : startChannel(channelIdx))}
        >
          {onAir ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{onAir ? 'Mute Broadcast' : 'Go On Air'}</span>
        </HardwareButton>

        <HardwareButton size="md" tone="red" active={micLive} onClick={toggleLiveMic}>
          <Mic className="w-4 h-4 text-[#FF3B5C]" />
          <span>{micLive ? 'Mic Live (ON)' : 'Patch Live Host Mic'}</span>
        </HardwareButton>
      </div>
    </PlateBezel>
  );
}

// ============================================================================
// KAYA CODING & RENDERING ACADEMY
// ============================================================================

interface AcademyLesson {
  id: string;
  track: 'coding' | 'rendering';
  title: string;
  level: string;
  summary: string;
  code: string;
  demoMode: 'mesh' | 'rust' | 'telemetry' | 'shader';
}

const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'rust-wasm-buffer',
    track: 'coding',
    title: '01 · Rust Systems & WASM Pixel Pipeline',
    level: 'Systems & Telemetry',
    summary: 'Zero-allocation RGBA framebuffer loops compiled from Rust into browser canvases for crisp 60fps performance.',
    code: `pub fn shade_frame(buf: &mut [u8], w: u32, h: u32, t: f32) {\n  for y in 0..h {\n    for x in 0..w {\n      let edge = ((x as f32 * 0.04 + t).sin() * 127.0 + 128.0) as u8;\n      // Emit oxidized bronze-cyan specular telemetry\n    }\n  }\n}`,
    demoMode: 'rust',
  },
  {
    id: 'rubik-uv-crop',
    track: 'coding',
    title: '02 · Three.js 3×3 Rubik Mosaic UV Cropping',
    level: '3D WebGL Geometry',
    summary: 'Splitting a live playing video stream into 9 front-face cubie sectors with matrix-aligned UV quadrants.',
    code: `function mapCubieSector(col: number, row: number) {\n  const uMin = col / 3, uMax = (col + 1) / 3;\n  const vMin = row / 3, vMax = (row + 1) / 3;\n  return [uMin, uMax, vMin, vMax];\n}`,
    demoMode: 'shader',
  },
  {
    id: 'mesh-wireframe-render',
    track: 'rendering',
    title: '03 · Mesh 3D Lattice & Regular vs Real 3D',
    level: 'Rendering School',
    summary: 'Understanding polygon tessellation, Phong rim highlights, and PBR metallic roughness contrast ratios.',
    code: `// PBR Shader Core Pass\nvec3 rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * vec3(0.0, 0.9, 1.0);\nvec3 finalColor = albedo * NdotL + specular + rim;`,
    demoMode: 'mesh',
  },
  {
    id: 'telemetry-hud-render',
    track: 'rendering',
    title: '04 · Telemetry HUD & Cinema Compositing',
    level: 'Rendering School',
    summary: 'Combining rangefinder overlays, horizon reticles, and 2.39:1 scope color grading inside 60fps streams.',
    code: `// Horizon Lock & Optical HUD Pass\nctx.strokeStyle = 'rgba(255, 10, 60, 0.8)';\ndrawReticle(centerX, centerY, radius, sweepAngle);`,
    demoMode: 'telemetry',
  },
];

export function CodingRenderingSchoolPage() {
  const [selectedId, setSelectedId] = useState(ACADEMY_LESSONS[0].id);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kaya_school_completed');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [editableCode, setEditableCode] = useState(ACADEMY_LESSONS[0].code);
  const [runningTick, setRunningTick] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeLesson = ACADEMY_LESSONS.find((l) => l.id === selectedId) ?? ACADEMY_LESSONS[0];

  useEffect(() => {
    setEditableCode(activeLesson.code);
  }, [activeLesson.id, activeLesson.code]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const renderDemo = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const t = ((now - start) / 1000) * (1 + (runningTick % 2) * 0.25);

          ctx.fillStyle = '#030407';
          ctx.fillRect(0, 0, w, h);

          if (activeLesson.demoMode === 'rust') {
            for (let y = 0; y < h; y += 14) {
              for (let x = 0; x < w; x += 22) {
                const wave = Math.sin(x * 0.02 + y * 0.015 + t * 2.4);
                ctx.fillStyle = wave > 0.2 ? 'rgba(255, 118, 42, 0.75)' : wave < -0.2 ? 'rgba(255, 10, 60, 0.55)' : 'rgba(255, 30, 66, 0.25)';
                ctx.fillRect(x, y, 16, 8);
              }
            }
          } else if (activeLesson.demoMode === 'mesh') {
            ctx.strokeStyle = '#F1F5F9';
            ctx.lineWidth = 1.4;
            const cx = w / 2;
            const cy = h / 2;
            for (let i = 0; i < 12; i++) {
              const ang = (i / 12) * Math.PI * 2 + t * 0.8;
              const rx = Math.cos(ang) * 110;
              const ry = Math.sin(ang) * 55;
              ctx.beginPath();
              ctx.moveTo(cx, cy - 85);
              ctx.lineTo(cx + rx, cy + ry);
              ctx.lineTo(cx, cy + 85);
              ctx.stroke();
            }
          } else if (activeLesson.demoMode === 'telemetry') {
            ctx.strokeStyle = '#F1F5F9';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 74, t * 2, t * 2 + Math.PI * 1.3);
            ctx.stroke();
            ctx.strokeStyle = '#FF1E42';
            ctx.beginPath();
            ctx.moveTo(w / 2 - 120, h / 2);
            ctx.lineTo(w / 2 + 120, h / 2);
            ctx.moveTo(w / 2, h / 2 - 80);
            ctx.lineTo(w / 2, h / 2 + 80);
            ctx.stroke();
          } else {
            const tileW = w / 3 - 8;
            const tileH = h / 3 - 8;
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const hue = ((r * 3 + c) * 40 + t * 60) % 360;
                ctx.fillStyle = `hsla(${hue}, 82%, 52%, 0.72)`;
                ctx.fillRect(c * (tileW + 8) + 4, r * (tileH + 8) + 4, tileW, tileH);
              }
            }
          }
        }
      }
      raf = requestAnimationFrame(renderDemo);
    };
    raf = requestAnimationFrame(renderDemo);
    return () => cancelAnimationFrame(raf);
  }, [activeLesson.demoMode, runningTick]);

  const markComplete = (id: string) => {
    const next = completedIds.includes(id)
      ? completedIds.filter((x) => x !== id)
      : [...completedIds, id];
    setCompletedIds(next);
    try {
      localStorage.setItem('kaya_school_completed', JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-4 h-4 text-[#FF5C8A]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            KAYA Coding &amp; Rendering Academy (Rust · Three.js · Shaders)
          </h2>
        </div>
        <LedStatusIndicator
          label={`${completedIds.length} / ${ACADEMY_LESSONS.length} Modules Mastered`}
          tone={completedIds.length === ACADEMY_LESSONS.length ? 'emerald' : 'cyan'}
        />
      </div>

      {/* Lesson Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ACADEMY_LESSONS.map((lesson) => {
          const done = completedIds.includes(lesson.id);
          return (
            <HardwareButton
              key={lesson.id}
              size="sm"
              fullWidth
              tone={lesson.track === 'coding' ? 'cyan' : 'magenta'}
              active={selectedId === lesson.id}
              onClick={() => setSelectedId(lesson.id)}
            >
              {lesson.track === 'coding' ? (
                <Code2 className="w-3.5 h-3.5 text-[#F1F5F9] shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-[#FF5C8A] shrink-0" />
              )}
              <span className="truncate">{lesson.title}</span>
              {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </HardwareButton>
          );
        })}
      </div>

      {/* Interactive Code + Live Canvas Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="cnc-recess rounded-[10px] p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 font-mono text-xs text-[#F1F5F9]">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>{activeLesson.level}</span>
              </span>
              <span className="text-[#E6ECF5]/60 uppercase">{activeLesson.track}</span>
            </div>
            <p className="text-xs text-[#E6ECF5]/80">{activeLesson.summary}</p>
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              rows={7}
              spellCheck={false}
              className="w-full rounded-[6px] bg-[#020203] border border-white/15 p-3 font-mono text-xs text-[#F1F5F9] focus:outline-none focus:border-[#F1F5F9]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <HardwareButton size="sm" tone="cyan" active onClick={() => setRunningTick((t) => t + 1)}>
              <Cpu className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>Execute Shader Lab</span>
            </HardwareButton>
            <HardwareButton
              size="sm"
              tone="magenta"
              active={completedIds.includes(activeLesson.id)}
              onClick={() => markComplete(activeLesson.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedIds.includes(activeLesson.id) ? 'Completed' : 'Mark Lesson Done'}</span>
            </HardwareButton>
          </div>
        </div>

        <div className="cnc-recess rounded-[10px] p-3 flex flex-col justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
            Live Shader &amp; Geometry Sandbox Output (60 fps)
          </span>
          <canvas
            ref={canvasRef}
            width={560}
            height={300}
            className="w-full h-[240px] rounded-[7px] bg-black border border-white/10"
          />
        </div>
      </div>
    </PlateBezel>
  );
}
