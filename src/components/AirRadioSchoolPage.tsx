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
  Send,
  MessageSquare,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { stampUnifiedCanvasWatermark } from '../lib/watermarkEngine.js';

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
  { id: 'candy', freq: 98.4, name: '98.4 Candy Synth FM', genre: 'Synthwave Broadcast', bpm: 118, rootHz: 110, wave: 'sawtooth', cutoffHz: 1650 },
  { id: 'rust', freq: 101.2, name: '101.2 Burnished Sub', genre: 'Deep Bass', bpm: 128, rootHz: 65.4, wave: 'triangle', cutoffHz: 950 },
  { id: 'valerius', freq: 104.8, name: '104.8 Valerius Pulse', genre: 'Ten Galaxies Arp', bpm: 136, rootHz: 146.8, wave: 'square', cutoffHz: 2100 },
  { id: 'soul', freq: 88.9, name: '88.9 Soul Cryo Ambient', genre: 'Opus 4.7 Ambient', bpm: 78, rootHz: 98.0, wave: 'sine', cutoffHz: 1100 },
  { id: 'street', freq: 94.6, name: '94.6 Beat Forge', genre: 'Rhythm Lab', bpm: 96, rootHz: 82.4, wave: 'sawtooth', cutoffHz: 1350 },
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
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setMicLive(false);
    setOnAir(false);
    setBroadcastStatus('AirRadio Standby');
  };

  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      ctxAudioRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  const startChannel = (idx: number) => {
    setChannelIdx(idx);
    const ch = AIRRADIO_CHANNELS[idx];
    setTunerFreq(ch.freq);

    window.clearInterval(timerRef.current);
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxAudioRef.current) ctxAudioRef.current = new AC();
    const actx = ctxAudioRef.current;
    if (actx.state === 'suspended') actx.resume().catch(() => {});

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
    setBroadcastStatus(`ON AIR · ${ch.name}`);
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
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctxAudioRef.current) ctxAudioRef.current = new AC();
      const actx = ctxAudioRef.current;
      if (actx.state === 'suspended') await actx.resume();
      if (!analyserRef.current) {
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
      }
      actx.createMediaStreamSource(stream).connect(analyserRef.current);
      setMicLive(true);
      setBroadcastStatus('LIVE HOST MIC ACTIVE');
    } catch {
      setBroadcastStatus('Microphone permission needed for live host feed.');
    }
  };

  useEffect(() => {
    let raf = 0;
    let pass = 0;
    const renderScope = () => {
      pass += 1;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#060304';
          ctx.fillRect(0, 0, w, h);

          if (analyserRef.current && (onAir || micLive)) {
            const bins = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(bins);
            const barW = w / 48;
            for (let i = 0; i < 48; i++) {
              const mag = bins[i] / 255;
              const bh = Math.max(4, mag * (h * 0.82));
              ctx.fillStyle = i % 3 === 0 ? '#FF0A3C' : i % 2 === 0 ? '#F5E9EA' : '#B84323';
              ctx.fillRect(i * barW + 2, h - bh, Math.max(2, barW - 4), bh);
            }
          } else {
            ctx.strokeStyle = 'rgba(255, 10, 60, 0.42)';
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
          }
          stampUnifiedCanvasWatermark(ctx, w, h, { passToken: pass, opacity: 0.45 });
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
          <Radio className="w-4 h-4 text-[#FF0A3C]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5E9EA]" style={{ fontFamily: 'var(--font-display)' }}>
            AirRadio FM · Broadcast &amp; Live Synth Deck
          </h2>
        </div>
        <LedStatusIndicator label={broadcastStatus} tone={onAir || micLive ? 'red' : 'cyan'} pulse={onAir || micLive} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <span className="text-[#F5E9EA] font-bold text-lg tabular-nums">{tunerFreq.toFixed(1)} MHz</span>
          <span className="text-[#F5E9EA]/75">{activeChannel.name} · {activeChannel.genre}</span>
          <span className="text-[#FF5E7E] tabular-nums">{activeChannel.bpm} BPM</span>
        </div>
        <canvas ref={canvasRef} width={880} height={140} className="w-full h-[140px] rounded-[12px]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-[#F5E9EA]/70">FM Band</span>
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
            <span className="font-mono text-xs text-[#F5E9EA]/70">Gain</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {AIRRADIO_CHANNELS.map((ch, idx) => (
          <HardwareButton
            key={ch.id}
            size="sm"
            fullWidth
            tone={idx % 2 === 0 ? 'red' : 'magenta'}
            active={channelIdx === idx && onAir}
            onClick={() => startChannel(idx)}
          >
            <span className="tabular-nums font-bold">{ch.freq}</span>
            <span className="truncate">{ch.name.replace(/^[\d.]+ /, '')}</span>
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
          <Mic className="w-4 h-4" />
          <span>{micLive ? 'Mic Live (ON)' : 'Patch Live Host Mic'}</span>
        </HardwareButton>
      </div>
    </PlateBezel>
  );
}

// ============================================================================
// INFINITY SCHOOL: DEDICATED CODING SCHOOL + REGULAR RENDERING SCHOOL + AI TUTOR
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
    title: '01 · Rust Systems & Pixel Pipeline',
    level: 'Coding School · Systems',
    summary: 'Zero-allocation RGBA framebuffer loops compiled from Rust into browser canvases for crisp 144fps pacing.',
    code: `pub fn shade_frame(buf: &mut [u8], w: u32, h: u32, t: f32) {\n  for y in 0..h {\n    for x in 0..w {\n      let glow = ((x as f32 * 0.04 + t).sin() * 127.0 + 128.0) as u8;\n      // Emit Candy-Gloss crimson specular channel\n    }\n  }\n}`,
    demoMode: 'rust',
  },
  {
    id: 'rubik-uv-crop',
    track: 'coding',
    title: '02 · 3×3 Rubik Mosaic UV Cropping',
    level: 'Coding School · WebGL Math',
    summary: 'Splitting a live video feed cleanly across 9 front-face cubie quadrants without re-uploading framebuffers.',
    code: `function mapCubieSector(col: number, row: number) {\n  const uMin = col / 3, uMax = (col + 1) / 3;\n  const vMin = row / 3, vMax = (row + 1) / 3;\n  return [uMin, uMax, vMin, vMax];\n}`,
    demoMode: 'shader',
  },
  {
    id: 'mesh-wireframe-render',
    track: 'rendering',
    title: '03 · Clearcoat & Burnished Rust PBR',
    level: 'Regular Rendering School',
    summary: 'Sculpting glossy Candy Red lacquer over dark brushed obsidian metal using clearcoat & roughness ratios.',
    code: `// PBR Shader Core Pass\nvec3 rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * vec3(1.0, 0.04, 0.24);\nvec3 finalColor = albedo * NdotL + specular + rim;`,
    demoMode: 'mesh',
  },
  {
    id: 'telemetry-hud-render',
    track: 'rendering',
    title: '04 · Cinema Scope & Opus Frame Lock',
    level: 'Regular Rendering School',
    summary: 'Combining anamorphic framing, optical rim lights, and Soul Opus 4.7 balanced motion shutters.',
    code: `// Optical Shutter & Horizon Pass\nctx.strokeStyle = 'rgba(255, 10, 60, 0.85)';\ndrawReticle(centerX, centerY, radius, sweepAngle);`,
    demoMode: 'telemetry',
  },
];

export function CodingRenderingSchoolPage() {
  const [schoolSpace, setSchoolSpace] = useState<'coding' | 'rendering'>('coding');
  const [selectedId, setSelectedId] = useState(ACADEMY_LESSONS[0].id);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [editableCode, setEditableCode] = useState(ACADEMY_LESSONS[0].code);
  const [runningTick, setRunningTick] = useState(1);
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorReply, setTutorReply] = useState('Ask the Infinity School AI Tutor about shaders, Rust buffers, lighting, or 144fps rendering.');
  const [tutorBusy, setTutorBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleLessons = ACADEMY_LESSONS.filter((l) => l.track === schoolSpace);
  const activeLesson = ACADEMY_LESSONS.find((l) => l.id === selectedId) ?? visibleLessons[0];

  useEffect(() => {
    const first = ACADEMY_LESSONS.find((l) => l.track === schoolSpace);
    if (first && activeLesson.track !== schoolSpace) {
      setSelectedId(first.id);
    }
  }, [schoolSpace, activeLesson.track]);

  useEffect(() => {
    setEditableCode(activeLesson.code);
  }, [activeLesson.id, activeLesson.code]);

  useEffect(() => {
    let raf = 0;
    let pass = 0;
    const start = performance.now();
    const renderDemo = (now: number) => {
      pass += 1;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const t = ((now - start) / 1000) * (1 + (runningTick % 2) * 0.25);
          ctx.fillStyle = '#060304';
          ctx.fillRect(0, 0, w, h);

          if (activeLesson.demoMode === 'rust') {
            for (let y = 0; y < h; y += 14) {
              for (let x = 0; x < w; x += 22) {
                const wave = Math.sin(x * 0.02 + y * 0.015 + t * 2.4);
                ctx.fillStyle = wave > 0.2 ? 'rgba(184, 67, 35, 0.78)' : wave < -0.2 ? 'rgba(255, 10, 60, 0.58)' : 'rgba(158, 6, 34, 0.25)';
                ctx.fillRect(x, y, 16, 8);
              }
            }
          } else if (activeLesson.demoMode === 'mesh') {
            ctx.strokeStyle = '#E06844';
            ctx.lineWidth = 1.5;
            const cx = w / 2;
            const cy = h / 2;
            for (let i = 0; i < 12; i++) {
              const ang = (i / 12) * Math.PI * 2 + t * 0.8;
              ctx.beginPath();
              ctx.moveTo(cx, cy - 85);
              ctx.lineTo(cx + Math.cos(ang) * 110, cy + Math.sin(ang) * 55);
              ctx.lineTo(cx, cy + 85);
              ctx.stroke();
            }
          } else if (activeLesson.demoMode === 'telemetry') {
            ctx.strokeStyle = '#F5E9EA';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 74, t * 2, t * 2 + Math.PI * 1.3);
            ctx.stroke();
            ctx.strokeStyle = '#FF0A3C';
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
                ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255, 10, 60, 0.6)' : 'rgba(184, 67, 35, 0.55)';
                ctx.fillRect(c * (tileW + 8) + 4, r * (tileH + 8) + 4, tileW, tileH);
              }
            }
          }
          stampUnifiedCanvasWatermark(ctx, w, h, { passToken: pass, opacity: 0.45 });
        }
      }
      raf = requestAnimationFrame(renderDemo);
    };
    raf = requestAnimationFrame(renderDemo);
    return () => cancelAnimationFrame(raf);
  }, [activeLesson.demoMode, runningTick]);

  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuestion.trim() || tutorBusy) return;
    setTutorBusy(true);
    try {
      const res = await fetch('/api/vortex/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: schoolSpace,
          question: tutorQuestion,
          codeContext: editableCode,
        }),
      });
      const json = await res.json();
      setTutorReply(json.reply || 'Tutor ready.');
    } catch {
      setTutorReply('Self-hosted tutor ready on studio host.');
    } finally {
      setTutorBusy(false);
    }
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-[#E06844]" />
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5E9EA]" style={{ fontFamily: 'var(--font-display)' }}>
              Infinity School · Coding &amp; Regular Rendering Spaces
            </h2>
            <p className="font-mono text-[11px] text-[#F5E9EA]/60">
              Dedicated Coding School + Rendering School + Self-Hosted AI Teaching Assistant
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HardwareButton
            size="sm"
            tone="red"
            active={schoolSpace === 'coding'}
            onClick={() => setSchoolSpace('coding')}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Coding School</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            tone="magenta"
            active={schoolSpace === 'rendering'}
            onClick={() => setSchoolSpace('rendering')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Regular Rendering School</span>
          </HardwareButton>
          <LedStatusIndicator
            label={`${completedIds.length}/${ACADEMY_LESSONS.length} Mastered`}
            tone={completedIds.length === ACADEMY_LESSONS.length ? 'emerald' : 'cyan'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {visibleLessons.map((lesson) => {
          const done = completedIds.includes(lesson.id);
          return (
            <HardwareButton
              key={lesson.id}
              size="sm"
              fullWidth
              tone={lesson.track === 'coding' ? 'red' : 'magenta'}
              active={selectedId === lesson.id}
              onClick={() => setSelectedId(lesson.id)}
            >
              <span className="truncate">{lesson.title}</span>
              {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </HardwareButton>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 font-mono text-xs text-[#F5E9EA]">
            <span className="flex items-center gap-1.5 font-bold">
              <Terminal className="w-3.5 h-3.5 text-[#FF0A3C]" />
              <span>{activeLesson.level}</span>
            </span>
          </div>
          <p className="text-xs text-[#F5E9EA]/75">{activeLesson.summary}</p>
          <textarea
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            rows={7}
            spellCheck={false}
            className="w-full rounded-[12px] bg-[#070304] p-3 font-mono text-xs text-[#F5E9EA] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <HardwareButton size="sm" tone="cyan" active onClick={() => setRunningTick((t) => t + 1)}>
              <Cpu className="w-3.5 h-3.5" />
              <span>Execute Lab</span>
            </HardwareButton>
            <HardwareButton
              size="sm"
              tone="magenta"
              active={completedIds.includes(activeLesson.id)}
              onClick={() =>
                setCompletedIds((prev) =>
                  prev.includes(activeLesson.id)
                    ? prev.filter((x) => x !== activeLesson.id)
                    : [...prev, activeLesson.id]
                )
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{completedIds.includes(activeLesson.id) ? 'Completed' : 'Mark Lesson Done'}</span>
            </HardwareButton>
          </div>
        </div>

        <div className="space-y-3">
          <canvas ref={canvasRef} width={560} height={260} className="w-full h-[210px] rounded-[12px]" />

          {/* Interactive AI Tutor / Teaching Assistant */}
          <form onSubmit={handleAskTutor} className="candy-trace-tile p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#FF8C66]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Infinity School AI Tutor ({schoolSpace === 'coding' ? 'Coding' : 'Rendering'})</span>
            </div>
            <p className="font-mono text-xs text-[#F5E9EA]/85 leading-relaxed">{tutorReply}</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tutorQuestion}
                onChange={(e) => setTutorQuestion(e.target.value)}
                placeholder={`Ask ${schoolSpace} tutor a question…`}
                className="flex-1 rounded-full bg-[#070304] px-3.5 py-1.5 font-mono text-xs text-[#F5E9EA] focus:outline-none"
              />
              <HardwareButton type="submit" size="sm" tone="red" active disabled={tutorBusy}>
                <Send className="w-3 h-3" />
                <span>{tutorBusy ? 'Thinking…' : 'Ask Tutor'}</span>
              </HardwareButton>
            </div>
          </form>
        </div>
      </div>
    </PlateBezel>
  );
}
