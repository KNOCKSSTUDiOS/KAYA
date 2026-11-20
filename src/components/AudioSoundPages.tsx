import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, Volume2, Waves, Upload, ShieldCheck } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { UNIFIED_WATERMARK_TEXT, getUnifiedWatermarkLabel } from '../lib/watermarkEngine.js';

interface WavCopyrightMeta {
  copyright?: string;
  artist?: string;
  title?: string;
  software?: string;
}

function buildInfoSubchunk(id: string, text: string): Uint8Array {
  const encoded = new TextEncoder().encode(`${text}\0`);
  const paddedLen = encoded.length % 2 === 0 ? encoded.length : encoded.length + 1;
  const out = new Uint8Array(8 + paddedLen);
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  const dv = new DataView(out.buffer);
  dv.setUint32(4, encoded.length, true);
  out.set(encoded, 8);
  return out;
}

function encodeWavBlob(samples: Float32Array, sampleRate: number, meta?: WavCopyrightMeta): Blob {
  const infoChunks: Uint8Array[] = [];
  if (meta?.copyright) infoChunks.push(buildInfoSubchunk('ICOP', meta.copyright));
  if (meta?.artist) infoChunks.push(buildInfoSubchunk('IART', meta.artist));
  if (meta?.title) infoChunks.push(buildInfoSubchunk('INAM', meta.title));
  if (meta?.software) infoChunks.push(buildInfoSubchunk('ISFT', meta.software));

  let listChunkSize = 0;
  if (infoChunks.length > 0) {
    const subSize = infoChunks.reduce((acc, c) => acc + c.length, 0);
    listChunkSize = 12 + subSize; // 'LIST' + size + 'INFO' + subchunks
  }

  const dataByteLen = samples.length * 2;
  const totalLen = 44 + dataByteLen + listChunkSize;
  const buffer = new ArrayBuffer(totalLen);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, totalLen - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataByteLen, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  if (infoChunks.length > 0) {
    writeStr(offset, 'LIST');
    view.setUint32(offset + 4, listChunkSize - 8, true);
    writeStr(offset + 8, 'INFO');
    let p = offset + 12;
    const u8 = new Uint8Array(buffer);
    for (const chunk of infoChunks) {
      u8.set(chunk, p);
      p += chunk.length;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

type SynthPreset = 'cinema_drone' | 'cyber_bass' | 'scifi_pad' | 'noir_pulse';

export function AudioStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const animIdRef = useRef<number>(0);

  const [preset, setPreset] = useState<SynthPreset>('cinema_drone');
  const [baseFreq, setBaseFreq] = useState(110);
  const [cutoff, setCutoff] = useState(1400);
  const [bpm, setBpm] = useState(118);
  const [lowGainDb, setLowGainDb] = useState(2);
  const [highGainDb, setHighGainDb] = useState(1);
  const [beatActive, setBeatActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<boolean[]>([true, false, true, false, true, true, false, true]);
  const [playing, setPlaying] = useState(false);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | null>(null);
  const [loadedName, setLoadedName] = useState<string>('');
  const [copyrightOwner, setCopyrightOwner] = useState('VORTEX · KAYA™');
  const [watermarkStamp, setWatermarkStamp] = useState(true);
  const [acousticBeacon, setAcousticBeacon] = useState(true);
  const [stampCode] = useState(() => `KY-2024-2026-${Math.floor(1000 + Math.random() * 8999)}`);
  const [statusText, setStatusText] = useState(`${UNIFIED_WATERMARK_TEXT} Acoustic Master Ready`);
  const beatTimerRef = useRef<number>(0);

  const stopAudio = () => {
    cancelAnimationFrame(animIdRef.current);
    clearInterval(beatTimerRef.current);
    oscNodesRef.current.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    oscNodesRef.current = [];
    setPlaying(false);
    setBeatActive(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // 8-Step Music & Beat Sequencer loop
  useEffect(() => {
    if (!beatActive) {
      clearInterval(beatTimerRef.current);
      return;
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = audioCtxRef.current && audioCtxRef.current.state !== 'closed' ? audioCtxRef.current : new Ctx();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    let stepIdx = 0;
    const intervalMs = Math.max(110, Math.round((60 / bpm / 2) * 1000));
    beatTimerRef.current = window.setInterval(() => {
      setActiveStep(stepIdx);
      if (steps[stepIdx]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const isDownbeat = stepIdx % 4 === 0;
        osc.type = isDownbeat ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(isDownbeat ? baseFreq * 1.2 : baseFreq * 2.5, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 38 : baseFreq, ctx.currentTime + 0.14);
        g.gain.setValueAtTime(0.28, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.17);
      }
      stepIdx = (stepIdx + 1) % 8;
    }, intervalMs);

    return () => clearInterval(beatTimerRef.current);
  }, [beatActive, bpm, baseFreq, steps]);

  const startLiveSynth = () => {
    stopAudio();
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = audioCtxRef.current && audioCtxRef.current.state !== 'closed' ? audioCtxRef.current : new Ctx();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = preset === 'cyber_bass' ? 6 : 2;

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 180;
    lowShelf.gain.value = lowGainDb;

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = highGainDb;

    const gain = ctx.createGain();
    gain.gain.value = 0.24;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    filter.connect(lowShelf);
    lowShelf.connect(highShelf);
    highShelf.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    const ratios =
      preset === 'cinema_drone'
        ? [0.5, 1, 1.5]
        : preset === 'cyber_bass'
        ? [0.5, 1, 2]
        : preset === 'scifi_pad'
        ? [1, 1.25, 1.5]
        : [1, 1.189, 1.498];
    const wave: OscillatorType =
      preset === 'cyber_bass' ? 'sawtooth' : preset === 'noir_pulse' ? 'triangle' : 'sine';

    const oscs = ratios.map((r, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? wave : 'triangle';
      osc.frequency.value = baseFreq * r;
      osc.connect(filter);
      osc.start();
      return osc;
    });
    oscNodesRef.current = oscs;
    setPlaying(true);
    setStatusText(`Mastering ${preset.replace('_', ' ')} @ ${baseFreq} Hz`);

    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    const drawSpectrum = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const g = canvas.getContext('2d');
      if (!g) return;
      analyser.getByteFrequencyData(dataArr);
      const w = canvas.width;
      const h = canvas.height;
      g.fillStyle = '#040507';
      g.fillRect(0, 0, w, h);

      const barW = w / dataArr.length;
      for (let i = 0; i < dataArr.length; i++) {
        const val = dataArr[i] / 255;
        const bh = val * (h - 24);
        const grad = g.createLinearGradient(0, h - bh, 0, h);
        grad.addColorStop(0, '#F1F5F9');
        grad.addColorStop(0.5, '#FF2E63');
        grad.addColorStop(1, '#FF1E42');
        g.fillStyle = grad;
        g.fillRect(i * barW + 1, h - bh, Math.max(2, barW - 2), bh);
      }
      animIdRef.current = requestAnimationFrame(drawSpectrum);
    };
    drawSpectrum();
  };

  const handleExportWav = async () => {
    const sampleRate = 44100;
    const durationSec = 5;
    const offline = new OfflineAudioContext(1, sampleRate * durationSec, sampleRate);
    const filter = offline.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = offline.createGain();
    gain.gain.setValueAtTime(0.01, 0);
    gain.gain.exponentialRampToValueAtTime(0.32, 0.4);
    gain.gain.setValueAtTime(0.32, durationSec - 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, durationSec);
    filter.connect(gain);
    gain.connect(offline.destination);

    const ratios = preset === 'cyber_bass' ? [0.5, 1, 2] : [0.5, 1, 1.5];
    ratios.forEach((r) => {
      const osc = offline.createOscillator();
      osc.type = preset === 'cyber_bass' ? 'sawtooth' : 'sine';
      osc.frequency.value = baseFreq * r;
      osc.connect(filter);
      osc.start(0);
      osc.stop(durationSec);
    });

    const rendered = await offline.startRendering();
    const raw = new Float32Array(rendered.getChannelData(0));
    if (watermarkStamp && acousticBeacon) {
      // Embed ultra-subtle 19.2 kHz copyright signature carrier pulses every 0.5s
      for (let i = 0; i < raw.length; i++) {
        const t = i / sampleRate;
        const pulseWindow = (t % 0.5) < 0.04 ? 0.0022 : 0;
        raw[i] = raw[i] + pulseWindow * Math.sin(2 * Math.PI * 19200 * t);
      }
    }
    const copyrightLine = `© 2024–2026 ${copyrightOwner.trim() || 'KAYA™ Music'} [${stampCode}] — All Rights Reserved`;
    const wav = encodeWavBlob(
      raw,
      sampleRate,
      watermarkStamp
        ? {
            copyright: copyrightLine,
            artist: copyrightOwner.trim() || 'KAYA™ Studio',
            title: `${preset.toUpperCase()} Master (${stampCode})`,
            software: 'KAYA™ 4K HDR Audio Engine © 2024–2026',
          }
        : undefined
    );
    downloadBlob(wav, `kaya-music-${preset}-${baseFreq}hz-2024-2026.wav`);
    setStatusText(
      watermarkStamp
        ? `Exported Stamped WAV (${copyrightLine})`
        : `Exported 5s 44.1kHz WAV master (${preset})`
    );
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-[#F1F5F9]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Audio Studio · Mastering Sound &amp; Music Editor
          </h2>
        </div>
        <LedStatusIndicator label={statusText} tone={playing || beatActive ? 'red' : 'cyan'} pulse={playing || beatActive} />
      </div>

      {/* Real-time Spectrum Analyzer Canvas + Single Unified Watermark Stamp */}
      <div className="candy-surface rounded-xl p-2 relative">
        <canvas
          ref={canvasRef}
          width={960}
          height={200}
          className="w-full h-[180px] rounded-lg bg-[#050304]"
        />
        {watermarkStamp && (
          <div className="pointer-events-none absolute bottom-4 right-4 px-3 py-1 rounded-full bg-[#050304]/85 font-mono text-[10px] tracking-widest uppercase text-[#FF9BAE] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF3B5C]" />
            <span>{getUnifiedWatermarkLabel(copyrightOwner, stampCode)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60 block">
            Synth &amp; Mastering Voice
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['cinema_drone', 'Cinema Drone'],
                ['cyber_bass', 'Cyber Bass'],
                ['scifi_pad', 'Sci-Fi Pad'],
                ['noir_pulse', 'Noir Pulse'],
              ] as [SynthPreset, string][]
            ).map(([k, lbl]) => (
              <HardwareButton
                key={k}
                size="sm"
                fullWidth
                tone="cyan"
                active={preset === k}
                onClick={() => setPreset(k)}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>
        </div>

        <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
              <span>Root Pitch &amp; Cutoff</span>
              <span className="text-[#F1F5F9] tabular-nums">{baseFreq} Hz · {cutoff} Hz</span>
            </div>
            <input
              type="range"
              min={55}
              max={440}
              value={baseFreq}
              onChange={(e) => setBaseFreq(Number(e.target.value))}
              className="hw-capsule-slider w-full"
            />
            <input
              type="range"
              min={240}
              max={6000}
              step={20}
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="hw-capsule-slider w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between font-mono text-[11px] text-[#E6ECF5]/70">
                <span>Low EQ</span>
                <span className="text-[#FF3B5C] tabular-nums">{lowGainDb > 0 ? `+${lowGainDb}` : lowGainDb} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                value={lowGainDb}
                onChange={(e) => setLowGainDb(Number(e.target.value))}
                className="hw-capsule-slider w-full"
              />
            </div>
            <div>
              <div className="flex justify-between font-mono text-[11px] text-[#E6ECF5]/70">
                <span>High EQ</span>
                <span className="text-[#F1F5F9] tabular-nums">{highGainDb > 0 ? `+${highGainDb}` : highGainDb} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                value={highGainDb}
                onChange={(e) => setHighGainDb(Number(e.target.value))}
                className="hw-capsule-slider w-full"
              />
            </div>
          </div>
        </div>

        <div className="cnc-recess rounded-[8px] p-3.5 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <HardwareButton
              tone={playing ? 'red' : 'cyan'}
              active
              onClick={playing ? stopAudio : startLiveSynth}
            >
              {playing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{playing ? 'Stop Synth' : 'Audition Synth'}</span>
            </HardwareButton>
            <HardwareButton tone="magenta" active={false} onClick={handleExportWav}>
              <Download className="w-3.5 h-3.5 text-[#FF5C8A]" />
              <span>Export WAV (5s)</span>
            </HardwareButton>
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full candy-surface font-mono text-xs text-[#E6ECF5] cursor-pointer hover:bg-[#19060C]/80">
            <Upload className="w-3.5 h-3.5 text-[#F1F5F9]" />
            <span className="truncate">{loadedName ? `Loaded: ${loadedName}` : 'Load Local Audio Track…'}</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (loadedAudioUrl) URL.revokeObjectURL(loadedAudioUrl);
                setLoadedAudioUrl(URL.createObjectURL(file));
                setLoadedName(file.name);
              }}
            />
          </label>
          {loadedAudioUrl && <audio controls src={loadedAudioUrl} className="w-full h-8" />}
        </div>
      </div>

      {/* 8-Step Music Pattern Sequencer */}
      <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70">
            8-Step Music &amp; Rhythm Sequencer ({bpm} BPM)
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="range"
              min={70}
              max={165}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="hw-capsule-slider w-28"
            />
            <HardwareButton
              size="sm"
              tone={beatActive ? 'red' : 'cyan'}
              active={beatActive}
              onClick={() => setBeatActive((b) => !b)}
            >
              {beatActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{beatActive ? 'Stop Beat' : 'Play Music Loop'}</span>
            </HardwareButton>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {steps.map((enabled, idx) => (
            <HardwareButton
              key={idx}
              size="sm"
              fullWidth
              tone={beatActive && activeStep === idx ? 'red' : 'cyan'}
              active={enabled}
              onClick={() =>
                setSteps((prev) => prev.map((v, j) => (j === idx ? !v : v)))
              }
            >
              <span className="tabular-nums">S{idx + 1}</span>
            </HardwareButton>
          ))}
        </div>
      </div>

      {/* MUSIC COPYRIGHT 2024–2026 WATERMARK & RIFF STAMP */}
      <div className="cnc-recess rounded-[8px] p-4 space-y-3 border border-[#FF1E42]/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF3B5C]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Music Copyright © 2024–2026 Watermark &amp; Acoustic Stamp
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#F1F5F9]">Registry ID: {stampCode}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <input
            type="text"
            value={copyrightOwner}
            onChange={(e) => setCopyrightOwner(e.target.value)}
            placeholder="Rights Holder / Label Name…"
            className="w-full bg-[#050304] border border-[#B84323]/30 rounded-full px-3.5 py-2 font-mono text-xs text-white focus:outline-none focus:border-[#FF0A3C]"
          />
          <HardwareButton
            size="sm"
            fullWidth
            tone="red"
            active={watermarkStamp}
            onClick={() => setWatermarkStamp((w) => !w)}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF3B5C]" />
            <span>© 2024–2026 Stamp: {watermarkStamp ? 'ON' : 'OFF'}</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            fullWidth
            tone="cyan"
            active={acousticBeacon}
            onClick={() => setAcousticBeacon((a) => !a)}
          >
            <span>RIFF + Sonic Watermark: {acousticBeacon ? 'ON' : 'OFF'}</span>
          </HardwareButton>
        </div>
        <p className="font-mono text-[11px] text-[#E6ECF5]/60">
          Embeds binary RIFF LIST/INFO copyright metadata (<code className="text-[#F1F5F9]">ICOP / IART / ISFT</code>) and subtle ultrasonic provenance pulse into every exported music track.
        </p>
      </div>
    </PlateBezel>
  );
}

interface SoundPadSpec {
  id: string;
  label: string;
  freqStart: number;
  freqEnd: number;
  dur: number;
  type: OscillatorType;
  tone: 'red' | 'cyan' | 'magenta';
}

const FOLEY_PADS: SoundPadSpec[] = [
  { id: 'sub_boom', label: 'Cinema Sub Boom', freqStart: 120, freqEnd: 32, dur: 0.9, type: 'sine', tone: 'red' },
  { id: 'cyber_braam', label: 'Cyber Braam', freqStart: 95, freqEnd: 68, dur: 1.1, type: 'sawtooth', tone: 'magenta' },
  { id: 'scifi_sweep', label: 'Sci-Fi Riser', freqStart: 180, freqEnd: 1100, dur: 0.8, type: 'triangle', tone: 'cyan' },
  { id: 'cnc_latch', label: 'CNC Mech Latch', freqStart: 900, freqEnd: 190, dur: 0.12, type: 'square', tone: 'cyan' },
  { id: 'laser_pulse', label: 'Laser Pulse', freqStart: 1600, freqEnd: 240, dur: 0.28, type: 'sawtooth', tone: 'red' },
  { id: 'holo_chime', label: 'Holo Glass Chime', freqStart: 880, freqEnd: 1320, dur: 0.55, type: 'sine', tone: 'cyan' },
  { id: 'plasma_hum', label: 'Plasma Arc', freqStart: 220, freqEnd: 145, dur: 0.7, type: 'sawtooth', tone: 'magenta' },
  { id: 'glitch_hit', label: 'Glitch Burst', freqStart: 1400, freqEnd: 90, dur: 0.22, type: 'square', tone: 'red' },
];

export function SoundFoleyPage() {
  const [pitchMult, setPitchMult] = useState(1.0);
  const [lastTriggered, setLastTriggered] = useState<SoundPadSpec>(FOLEY_PADS[0]);

  const triggerPad = (pad: SoundPadSpec) => {
    setLastTriggered(pad);
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freqStart * pitchMult, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, pad.freqEnd * pitchMult),
      ctx.currentTime + pad.dur
    );
    gain.gain.setValueAtTime(0.38, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + pad.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + pad.dur);
    setTimeout(() => ctx.close().catch(() => {}), Math.round(pad.dur * 1000) + 200);
  };

  const exportPadWav = async (pad: SoundPadSpec) => {
    const sampleRate = 44100;
    const offline = new OfflineAudioContext(1, Math.round(sampleRate * pad.dur), sampleRate);
    const osc = offline.createOscillator();
    const gain = offline.createGain();
    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freqStart * pitchMult, 0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, pad.freqEnd * pitchMult), pad.dur);
    gain.gain.setValueAtTime(0.42, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, pad.dur);
    osc.connect(gain);
    gain.connect(offline.destination);
    osc.start(0);
    osc.stop(pad.dur);
    const buf = await offline.startRendering();
    downloadBlob(encodeWavBlob(buf.getChannelData(0), sampleRate), `kaya-sfx-${pad.id}.wav`);
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Waves className="w-4 h-4 text-[#FF5C8A]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            06. Sound Effects &amp; Foley Matrix
          </h2>
        </div>
        <LedStatusIndicator label={`Active SFX: ${lastTriggered.label}`} tone="magenta" />
      </div>

      <div className="cnc-recess rounded-[8px] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FOLEY_PADS.map((pad) => (
          <HardwareButton
            key={pad.id}
            fullWidth
            size="lg"
            tone={pad.tone}
            active={lastTriggered.id === pad.id}
            onClick={() => triggerPad(pad)}
          >
            <span>{pad.label}</span>
          </HardwareButton>
        ))}
      </div>

      <div className="cnc-recess rounded-[8px] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[220px]">
          <span className="font-mono text-xs text-[#E6ECF5]/75 whitespace-nowrap">
            Pitch Multiplier ({pitchMult.toFixed(2)}x)
          </span>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={pitchMult}
            onChange={(e) => setPitchMult(parseFloat(e.target.value))}
            className="hw-capsule-slider flex-1"
          />
        </div>
        <HardwareButton
          tone="cyan"
          active
          onClick={() => exportPadWav(lastTriggered)}
        >
          <Download className="w-3.5 h-3.5 text-[#F1F5F9]" />
          <span>Export "{lastTriggered.label}" (.wav)</span>
        </HardwareButton>
      </div>
    </PlateBezel>
  );
}
