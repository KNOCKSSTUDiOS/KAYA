import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Download,
  Volume2,
  Waves,
  Upload,
  ShieldCheck,
  Music,
  Disc3,
  Guitar,
  Mic,
  Sliders,
  Grid,
} from 'lucide-react';
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
    listChunkSize = 12 + subSize;
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
export type SpatialCodecKey = 'dts_x' | 'sony_sdds' | 'dry_stereo';
export type AudioSubViewKey = 'full_song' | 'sfx' | 'acoustic' | 'vocals_score' | 'sequencer' | 'buses';

interface MusicStemPreset {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  baseFreq: number;
  cutoff: number;
  synth: SynthPreset;
  steps: boolean[];
}

const MUSIC_STEM_PRESETS: MusicStemPreset[] = [
  {
    id: 'harbor_drive',
    title: 'Midnight Harbor Drive',
    genre: 'Outrun Synth · 118 BPM',
    bpm: 118,
    baseFreq: 98,
    cutoff: 1650,
    synth: 'cyber_bass',
    steps: [true, false, true, true, false, true, false, true],
  },
  {
    id: 'bioluminescent_forge',
    title: 'Candy Bioluminescence 128',
    genre: 'Cinema Pulse · 128 BPM',
    bpm: 128,
    baseFreq: 82,
    cutoff: 2200,
    synth: 'noir_pulse',
    steps: [true, true, false, true, true, false, true, false],
  },
  {
    id: 'valerius_cosmic',
    title: 'Valerius Celestial Pad',
    genre: 'Hollywood MOTiON Score · 92 BPM',
    bpm: 92,
    baseFreq: 110,
    cutoff: 1200,
    synth: 'scifi_pad',
    steps: [true, false, false, true, false, false, true, false],
  },
  {
    id: 'candy_neon',
    title: 'Pearlescent Club Loop',
    genre: 'Chrome Electro · 124 BPM',
    bpm: 124,
    baseFreq: 130,
    cutoff: 2600,
    synth: 'cinema_drone',
    steps: [true, false, true, false, true, true, false, true],
  },
];

type SampleCategory = 'all' | 'sub_impact' | 'scifi_holo' | 'mech_foley' | 'risers';

interface SoundPadSpec {
  id: string;
  label: string;
  category: Exclude<SampleCategory, 'all'>;
  freqStart: number;
  freqEnd: number;
  dur: number;
  type: OscillatorType;
  tone: 'red' | 'cyan' | 'magenta';
}

const FOLEY_PADS: SoundPadSpec[] = [
  { id: 'sub_boom', label: 'Cinema Sub Boom', category: 'sub_impact', freqStart: 120, freqEnd: 30, dur: 0.95, type: 'sine', tone: 'red' },
  { id: 'cyber_braam', label: 'Trailer Braam', category: 'sub_impact', freqStart: 95, freqEnd: 58, dur: 1.15, type: 'sawtooth', tone: 'magenta' },
  { id: 'vault_slam', label: 'Iron Vault Slam', category: 'sub_impact', freqStart: 220, freqEnd: 36, dur: 0.52, type: 'triangle', tone: 'red' },
  { id: 'thunder_drop', label: '808 Deep Drop', category: 'sub_impact', freqStart: 145, freqEnd: 28, dur: 0.85, type: 'sine', tone: 'red' },
  { id: 'laser_pulse', label: 'Laser Pulse', category: 'scifi_holo', freqStart: 1600, freqEnd: 240, dur: 0.28, type: 'sawtooth', tone: 'red' },
  { id: 'holo_chime', label: 'Holo Glass Chime', category: 'scifi_holo', freqStart: 880, freqEnd: 1320, dur: 0.55, type: 'sine', tone: 'cyan' },
  { id: 'plasma_arc', label: 'Plasma Arc', category: 'scifi_holo', freqStart: 240, freqEnd: 145, dur: 0.7, type: 'sawtooth', tone: 'magenta' },
  { id: 'orbit_ping', label: 'Orbital Sonar Ping', category: 'scifi_holo', freqStart: 1080, freqEnd: 1020, dur: 0.65, type: 'sine', tone: 'cyan' },
  { id: 'cnc_latch', label: 'CNC Mech Latch', category: 'mech_foley', freqStart: 900, freqEnd: 190, dur: 0.14, type: 'square', tone: 'cyan' },
  { id: 'glitch_hit', label: 'Digital Glitch Burst', category: 'mech_foley', freqStart: 1400, freqEnd: 90, dur: 0.22, type: 'square', tone: 'red' },
  { id: 'shutter_snap', label: '35mm Shutter Snap', category: 'mech_foley', freqStart: 1200, freqEnd: 280, dur: 0.09, type: 'triangle', tone: 'cyan' },
  { id: 'chain_clank', label: 'Steel Chain Clank', category: 'mech_foley', freqStart: 760, freqEnd: 310, dur: 0.34, type: 'square', tone: 'magenta' },
  { id: 'scifi_sweep', label: 'Sci-Fi Riser', category: 'risers', freqStart: 180, freqEnd: 1180, dur: 0.85, type: 'triangle', tone: 'cyan' },
  { id: 'turbine_spool', label: 'Cooling Turbine Spool', category: 'risers', freqStart: 140, freqEnd: 920, dur: 1.0, type: 'sawtooth', tone: 'magenta' },
  { id: 'broadcast_stinger', label: 'SDDS Stinger Sweep', category: 'risers', freqStart: 320, freqEnd: 1640, dur: 0.48, type: 'sine', tone: 'red' },
  { id: 'reverse_whoosh', label: 'Reverse Whoosh Cue', category: 'risers', freqStart: 95, freqEnd: 880, dur: 0.72, type: 'triangle', tone: 'cyan' },
];

type AcousticVoiceKey = 'harp_pluck' | 'grand_keys' | 'nylon_string' | 'timber_perc';
type VocalScoreVoiceKey = 'choir_aah' | 'celestial_pad' | 'brass_score' | 'heroic_strings';

export function AudioStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const animIdRef = useRef<number>(0);

  const [subView, setSubView] = useState<AudioSubViewKey>('full_song');
  const [selectedStemId, setSelectedStemId] = useState<string>(MUSIC_STEM_PRESETS[0].id);
  const [preset, setPreset] = useState<SynthPreset>('cyber_bass');
  const [spatialBus, setSpatialBus] = useState<SpatialCodecKey>('dts_x');
  const [baseFreq, setBaseFreq] = useState(98);
  const [cutoff, setCutoff] = useState(1650);
  const [bpm, setBpm] = useState(118);
  const [lowGainDb, setLowGainDb] = useState(3);
  const [highGainDb, setHighGainDb] = useState(2);
  const [beatActive, setBeatActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<boolean[]>([true, false, true, true, false, true, false, true]);
  const [playing, setPlaying] = useState(false);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | null>(null);
  const [loadedName, setLoadedName] = useState<string>('');
  const [copyrightOwner, setCopyrightOwner] = useState('KNOCKSSTUDiOS · Hollywood MOTiON Pictures™');
  const [watermarkStamp, setWatermarkStamp] = useState(true);
  const [acousticBeacon, setAcousticBeacon] = useState(true);
  const [stampCode] = useState(() => `KNX-2024-2026-${Math.floor(1000 + Math.random() * 8999)}`);
  const [statusText, setStatusText] = useState(`${UNIFIED_WATERMARK_TEXT} Audio Bus Ready`);

  // Acoustic & Vocals/Score local controls
  const [acousticVoice, setAcousticVoice] = useState<AcousticVoiceKey>('harp_pluck');
  const [acousticOctave, setAcousticOctave] = useState<number>(0);
  const [acousticDecay, setAcousticDecay] = useState<number>(1.2);
  const [vocalVoice, setVocalVoice] = useState<VocalScoreVoiceKey>('choir_aah');
  const [lastPad, setLastPad] = useState<SoundPadSpec>(FOLEY_PADS[0]);

  const beatTimerRef = useRef<number>(0);

  const getAudioCtx = () => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx =
      audioCtxRef.current && audioCtxRef.current.state !== 'closed'
        ? audioCtxRef.current
        : new Ctx();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

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

  const loadStemPreset = (stem: MusicStemPreset) => {
    setSelectedStemId(stem.id);
    setPreset(stem.synth);
    setBpm(stem.bpm);
    setBaseFreq(stem.baseFreq);
    setCutoff(stem.cutoff);
    setSteps(stem.steps);
    setStatusText(`Loaded Music Stem: ${stem.title} (${stem.bpm} BPM)`);
  };

  useEffect(() => {
    if (!beatActive) {
      clearInterval(beatTimerRef.current);
      return;
    }
    const ctx = getAudioCtx();
    let stepIdx = 0;
    const intervalMs = Math.max(105, Math.round((60 / bpm / 2) * 1000));
    beatTimerRef.current = window.setInterval(() => {
      setActiveStep(stepIdx);
      if (steps[stepIdx]) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        const isDownbeat = stepIdx % 4 === 0;
        osc.type = isDownbeat ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(isDownbeat ? baseFreq * 1.25 : baseFreq * 2.5, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isDownbeat ? 38 : baseFreq, ctx.currentTime + 0.14);
        filter.type = 'lowshelf';
        filter.frequency.value = 140;
        filter.gain.value = spatialBus === 'dts_x' ? 4 : spatialBus === 'sony_sdds' ? 2.5 : 0;
        g.gain.setValueAtTime(0.28, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.17);
      }
      stepIdx = (stepIdx + 1) % 8;
    }, intervalMs);

    return () => clearInterval(beatTimerRef.current);
  }, [beatActive, bpm, baseFreq, steps, spatialBus]);

  const startLiveSynth = () => {
    stopAudio();
    const ctx = getAudioCtx();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = preset === 'cyber_bass' ? 6 : 2;

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 180;
    lowShelf.gain.value = lowGainDb + (spatialBus === 'dts_x' ? 3 : 0);

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = highGainDb + (spatialBus === 'sony_sdds' ? 2.5 : 0);

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
    setStatusText(`Mastering ${preset.replace('_', ' ')} via ${spatialBus.toUpperCase()} @ ${baseFreq} Hz`);

    const dataArr = new Uint8Array(analyser.frequencyBinCount);
    const drawSpectrum = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const g = canvas.getContext('2d');
      if (!g) return;
      analyser.getByteFrequencyData(dataArr);
      const w = canvas.width;
      const h = canvas.height;
      g.fillStyle = '#0A0A0A';
      g.fillRect(0, 0, w, h);

      const barW = w / dataArr.length;
      for (let i = 0; i < dataArr.length; i++) {
        const val = dataArr[i] / 255;
        const bh = val * (h - 24);
        const grad = g.createLinearGradient(0, h - bh, 0, h);
        grad.addColorStop(0, '#F5FFFA');
        grad.addColorStop(0.5, '#00D9C0');
        grad.addColorStop(1, '#FF007F');
        g.fillStyle = grad;
        g.fillRect(i * barW + 1, h - bh, Math.max(2, barW - 2), bh);
      }
      animIdRef.current = requestAnimationFrame(drawSpectrum);
    };
    drawSpectrum();
  };

  const triggerAcousticPluck = (noteFreq: number) => {
    const ctx = getAudioCtx();
    const mult = Math.pow(2, acousticOctave);
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lpf = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = acousticVoice === 'grand_keys' ? 'triangle' : acousticVoice === 'timber_perc' ? 'sine' : 'sawtooth';
    osc2.type = 'sine';
    osc.frequency.value = noteFreq * mult;
    osc2.frequency.value = noteFreq * mult * (acousticVoice === 'harp_pluck' ? 2 : 1.004);

    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(3400, ctx.currentTime);
    lpf.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + acousticDecay);

    g.gain.setValueAtTime(0.32, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + acousticDecay);

    osc.connect(lpf);
    osc2.connect(lpf);
    lpf.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + acousticDecay + 0.05);
    osc2.stop(ctx.currentTime + acousticDecay + 0.05);
    setStatusText(`Triggered ${acousticVoice.replace('_', ' ')} (${Math.round(noteFreq * mult)} Hz)`);
  };

  const triggerVocalChord = (rootHz: number) => {
    const ctx = getAudioCtx();
    const intervals = vocalVoice === 'brass_score' ? [1, 1.5, 2] : [1, 1.25, 1.5, 1.875];
    intervals.forEach((ratio) => {
      const osc = ctx.createOscillator();
      const formant = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = vocalVoice === 'brass_score' || vocalVoice === 'heroic_strings' ? 'sawtooth' : 'triangle';
      osc.frequency.value = rootHz * ratio;
      formant.type = 'bandpass';
      formant.frequency.value = vocalVoice === 'choir_aah' ? 920 : 1420;
      formant.Q.value = vocalVoice === 'choir_aah' ? 3.5 : 1.6;
      g.gain.setValueAtTime(0.01, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.85);
      osc.connect(formant);
      formant.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.9);
    });
    setStatusText(`Triggered ${vocalVoice.replace('_', ' ')} Score Chord (${rootHz} Hz)`);
  };

  const triggerSfxPad = (pad: SoundPadSpec) => {
    setLastPad(pad);
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, pad.freqEnd), ctx.currentTime + pad.dur);
    gain.gain.setValueAtTime(0.36, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + pad.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + pad.dur);
    setStatusText(`SFX Cue: ${pad.label}`);
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
      for (let i = 0; i < raw.length; i++) {
        const t = i / sampleRate;
        const pulseWindow = t % 0.5 < 0.04 ? 0.0022 : 0;
        raw[i] = raw[i] + pulseWindow * Math.sin(2 * Math.PI * 19200 * t);
      }
    }
    const copyrightLine = `© 2024–2026 ${copyrightOwner.trim() || 'KNOCKSSTUDiOS · KAYA™'} [${stampCode}] — All Rights Reserved`;
    const wav = encodeWavBlob(
      raw,
      sampleRate,
      watermarkStamp
        ? {
            copyright: copyrightLine,
            artist: copyrightOwner.trim() || 'KNOCKSSTUDiOS',
            title: `${preset.toUpperCase()} (${spatialBus.toUpperCase()}) Master (${stampCode})`,
            software: 'INFINITY CORE ENGINE -- KNOCKSSTUDiOS Audio © 2024–2026',
          }
        : undefined
    );
    downloadBlob(wav, `knocksstudios-audio-${selectedStemId}-${spatialBus}-${baseFreq}hz.wav`);
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
          <Music className="w-4 h-4 text-[#FF007F]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5FFFA]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Audio &amp; Music Suite · SFX · Full Song · Acoustic · Score · Buses
          </h2>
        </div>
        <LedStatusIndicator label={statusText} tone={playing || beatActive ? 'red' : 'cyan'} />
      </div>

      {/* 6 Dedicated Segmented Sub-Views */}
      <div className="cnc-recess rounded-[10px] p-2.5 flex flex-wrap items-center gap-2">
        {(
          [
            ['full_song', 'Full Song', <Music className="w-3.5 h-3.5" />, 'red'],
            ['sfx', 'SFX Pads', <Waves className="w-3.5 h-3.5" />, 'cyan'],
            ['acoustic', 'Acoustic', <Guitar className="w-3.5 h-3.5" />, 'magenta'],
            ['vocals_score', 'Vocals / Score', <Mic className="w-3.5 h-3.5" />, 'cyan'],
            ['sequencer', 'Sequencer', <Grid className="w-3.5 h-3.5" />, 'red'],
            ['buses', 'Buses (DTS / SDDS)', <Sliders className="w-3.5 h-3.5" />, 'magenta'],
          ] as [AudioSubViewKey, string, React.ReactNode, 'red' | 'cyan' | 'magenta'][]
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

      {/* Shared Live Spectrum Analyzer Canvas */}
      <div className="candy-surface rounded-xl p-2 relative">
        <canvas
          ref={canvasRef}
          width={960}
          height={180}
          className="w-full h-[160px] rounded-lg bg-[#0A0A0A]"
        />
        {watermarkStamp && (
          <div className="pointer-events-none absolute bottom-4 right-4 px-3 py-1 rounded-full bg-[#0A0A0A]/85 font-mono text-[10px] tracking-widest uppercase text-[#FC8EAC] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF007F]" />
            <span>{getUnifiedWatermarkLabel(copyrightOwner, stampCode)}</span>
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: FULL SONG */}
      {subView === 'full_song' && (
        <>
          <div className="cnc-recess rounded-[10px] p-3.5 space-y-2.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 block">
              Full Song Stems &amp; Backing Library
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {MUSIC_STEM_PRESETS.map((stem) => (
                <button
                  key={stem.id}
                  type="button"
                  data-active={selectedStemId === stem.id}
                  onClick={() => loadStemPreset(stem)}
                  className="candy-trace-tile rounded-xl p-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#F5FFFA] truncate">{stem.title}</span>
                    <Disc3
                      className={`w-3.5 h-3.5 shrink-0 ${
                        selectedStemId === stem.id ? 'text-[#FF007F]' : 'text-[#E0FFFF]/45'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#00D9C0] block mt-1">{stem.genre}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/65 block">
                Synth &amp; Score Voice
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

            <div className="cnc-recess rounded-[8px] p-3.5 space-y-2">
              <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/80">
                <span>Root Pitch &amp; Filter</span>
                <span className="text-[#F5FFFA] tabular-nums">
                  {baseFreq} Hz · {cutoff} Hz
                </span>
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

            <div className="cnc-recess rounded-[8px] p-3.5 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <HardwareButton
                  tone={playing ? 'red' : 'cyan'}
                  active
                  onClick={playing ? stopAudio : startLiveSynth}
                >
                  {playing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{playing ? 'Stop Song Synth' : 'Play Song Stem'}</span>
                </HardwareButton>
                <HardwareButton tone="magenta" active={false} onClick={handleExportWav}>
                  <Download className="w-3.5 h-3.5 text-[#FC8EAC]" />
                  <span>Export WAV (5s)</span>
                </HardwareButton>
              </div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full candy-surface font-mono text-xs text-[#E0FFFF] cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#00D9C0]" />
                <span className="truncate">
                  {loadedName ? `Loaded: ${loadedName}` : 'Import Custom Music Track…'}
                </span>
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
        </>
      )}

      {/* SUB-VIEW 2: SFX PADS */}
      {subView === 'sfx' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D9C0]">
              16 Cinema SFX &amp; Foley Pads (Selected: {lastPad.label})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FOLEY_PADS.map((pad) => (
              <HardwareButton
                key={pad.id}
                fullWidth
                size="lg"
                tone={pad.tone}
                active={lastPad.id === pad.id}
                onClick={() => triggerSfxPad(pad)}
              >
                <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate">{pad.label}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: ACOUSTIC */}
      {subView === 'acoustic' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FC8EAC]">
              Acoustic Instruments Synthesizer (Plucked Harp · Grand Keys · Nylon · Timber Perc)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#E0FFFF]/70">
                Octave: {acousticOctave >= 0 ? `+${acousticOctave}` : acousticOctave} · Decay: {acousticDecay.toFixed(1)}s
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ['harp_pluck', 'Acoustic Harp'],
                ['grand_keys', 'Warm Grand Keys'],
                ['nylon_string', 'Nylon Guitar'],
                ['timber_perc', 'Timber Percussion'],
              ] as [AcousticVoiceKey, string][]
            ).map(([k, lbl]) => (
              <HardwareButton
                key={k}
                size="sm"
                fullWidth
                tone="magenta"
                active={acousticVoice === k}
                onClick={() => setAcousticVoice(k)}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#E0FFFF]/70">Octave Shift</span>
              <input
                type="range"
                min={-1}
                max={2}
                step={1}
                value={acousticOctave}
                onChange={(e) => setAcousticOctave(Number(e.target.value))}
                className="hw-capsule-slider w-full"
              />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#E0FFFF]/70">Acoustic Decay Resonance</span>
              <input
                type="range"
                min={0.3}
                max={2.4}
                step={0.1}
                value={acousticDecay}
                onChange={(e) => setAcousticDecay(parseFloat(e.target.value))}
                className="hw-capsule-slider w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[
              ['C4', 261.63],
              ['D4', 293.66],
              ['E4', 329.63],
              ['F4', 349.23],
              ['G4', 392.0],
              ['A4', 440.0],
              ['B4', 493.88],
              ['C5', 523.25],
            ].map(([note, hz]) => (
              <HardwareButton
                key={String(note)}
                size="md"
                fullWidth
                tone="cyan"
                active={false}
                onClick={() => triggerAcousticPluck(Number(hz))}
              >
                <span>{note}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: VOCALS / SCORE */}
      {subView === 'vocals_score' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D9C0]">
              Formant Choir Vocals &amp; Hollywood MOTiON Pictures Orchestral Score Chords
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ['choir_aah', 'Choir Aah Formant'],
                ['celestial_pad', 'Celestial Vocal Pad'],
                ['brass_score', 'Hollywood Brass Score'],
                ['heroic_strings', 'Heroic Strings Ens'],
              ] as [VocalScoreVoiceKey, string][]
            ).map(([k, lbl]) => (
              <HardwareButton
                key={k}
                size="sm"
                fullWidth
                tone="cyan"
                active={vocalVoice === k}
                onClick={() => setVocalVoice(k)}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              ['I · Heroic Tonic (130 Hz)', 130.81],
              ['IV · Lift Chord (174 Hz)', 174.61],
              ['V · Cinema Swell (196 Hz)', 196.0],
              ['vi · Dark Minor (110 Hz)', 110.0],
            ].map(([lbl, hz]) => (
              <HardwareButton
                key={String(lbl)}
                size="lg"
                fullWidth
                tone="red"
                active={false}
                onClick={() => triggerVocalChord(Number(hz))}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>

          {/* Copyright 2024-2026 Watermark Registry */}
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5FFFA] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF007F]" />
                <span>Music Copyright © 2024–2026 Watermark &amp; RIFF Registry</span>
              </span>
              <span className="font-mono text-[11px] text-[#00D9C0]">{stampCode}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={copyrightOwner}
                onChange={(e) => setCopyrightOwner(e.target.value)}
                placeholder="Rights Holder..."
                className="w-full bg-[#0A0A0A] border border-[#FF007F]/35 rounded-full px-3.5 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none focus:border-[#00D9C0]"
              />
              <HardwareButton
                size="sm"
                fullWidth
                tone="red"
                active={watermarkStamp}
                onClick={() => setWatermarkStamp((w) => !w)}
              >
                <span>© 2024–2026 Stamp: {watermarkStamp ? 'ON' : 'OFF'}</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                fullWidth
                tone="cyan"
                active={acousticBeacon}
                onClick={() => setAcousticBeacon((a) => !a)}
              >
                <span>RIFF Sonic Beacon: {acousticBeacon ? 'ON' : 'OFF'}</span>
              </HardwareButton>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: SEQUENCER */}
      {subView === 'sequencer' && (
        <div className="cnc-recess rounded-[8px] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/75">
              8-Step Music Rhythm Sequencer ({bpm} BPM)
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
                <span>{beatActive ? 'Stop Beat' : 'Play Rhythm Loop'}</span>
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
                onClick={() => setSteps((prev) => prev.map((v, j) => (j === idx ? !v : v)))}
              >
                <span className="tabular-nums">S{idx + 1}</span>
              </HardwareButton>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: BUSES (DTS:X / SONY SDDS / STEREO) */}
      {subView === 'buses' && (
        <div className="cnc-recess rounded-[10px] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FC8EAC]">
              Theater Spatial Codec Routing &amp; Master EQ Bus
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['dts_x', 'DTS:X Cinema Bus'],
                  ['sony_sdds', 'Sony SDDS 7.1 Bus'],
                  ['dry_stereo', 'Quantum Stereo Bus'],
                ] as [SpatialCodecKey, string][]
              ).map(([k, lbl]) => (
                <HardwareButton
                  key={k}
                  size="sm"
                  tone={k === 'dts_x' ? 'red' : k === 'sony_sdds' ? 'magenta' : 'cyan'}
                  active={spatialBus === k}
                  onClick={() => setSpatialBus(k)}
                >
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/80">
                <span>Low LFE Shelf</span>
                <span className="text-[#FF007F] tabular-nums">{lowGainDb > 0 ? `+${lowGainDb}` : lowGainDb} dB</span>
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
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/80">
                <span>High Air Shelf</span>
                <span className="text-[#00D9C0] tabular-nums">{highGainDb > 0 ? `+${highGainDb}` : highGainDb} dB</span>
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
      )}
    </PlateBezel>
  );
}

export function SoundFoleyPage() {
  const [category, setCategory] = useState<SampleCategory>('all');
  const [spatialCodec, setSpatialCodec] = useState<SpatialCodecKey>('dts_x');
  const [pitchMult, setPitchMult] = useState(1.0);
  const [subPunchDb, setSubPunchDb] = useState(4);
  const [stereoPanSpread, setStereoPanSpread] = useState(0.5);
  const [lastTriggered, setLastTriggered] = useState<SoundPadSpec>(FOLEY_PADS[0]);

  const visiblePads =
    category === 'all' ? FOLEY_PADS : FOLEY_PADS.filter((p) => p.category === category);

  const triggerPad = (pad: SoundPadSpec) => {
    setLastTriggered(pad);
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const eqSub = ctx.createBiquadFilter();
    const eqAir = ctx.createBiquadFilter();
    const panner = ctx.createStereoPanner();
    const gain = ctx.createGain();

    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freqStart * pitchMult, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, pad.freqEnd * pitchMult),
      ctx.currentTime + pad.dur
    );

    eqSub.type = 'lowshelf';
    eqSub.frequency.value = 110;
    eqSub.gain.value = spatialCodec === 'dts_x' ? subPunchDb + 3 : spatialCodec === 'sony_sdds' ? subPunchDb + 1.5 : 0;

    eqAir.type = 'highshelf';
    eqAir.frequency.value = 4200;
    eqAir.gain.value = spatialCodec === 'sony_sdds' ? 4 : spatialCodec === 'dts_x' ? 2 : 0;

    const idx = FOLEY_PADS.findIndex((p) => p.id === pad.id);
    panner.pan.value =
      spatialCodec === 'dry_stereo' ? 0 : (idx % 2 === 0 ? -1 : 1) * stereoPanSpread * 0.65;

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + pad.dur);

    osc.connect(eqSub);
    eqSub.connect(eqAir);
    eqAir.connect(panner);
    panner.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + pad.dur);
    setTimeout(() => ctx.close().catch(() => {}), Math.round(pad.dur * 1000) + 250);
  };

  const exportPadWav = async (pad: SoundPadSpec) => {
    const sampleRate = 44100;
    const offline = new OfflineAudioContext(1, Math.round(sampleRate * pad.dur), sampleRate);
    const osc = offline.createOscillator();
    const eqSub = offline.createBiquadFilter();
    const gain = offline.createGain();

    osc.type = pad.type;
    osc.frequency.setValueAtTime(pad.freqStart * pitchMult, 0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, pad.freqEnd * pitchMult), pad.dur);

    eqSub.type = 'lowshelf';
    eqSub.frequency.value = 110;
    eqSub.gain.value = spatialCodec === 'dts_x' ? subPunchDb + 3 : spatialCodec === 'sony_sdds' ? subPunchDb : 0;

    gain.gain.setValueAtTime(0.42, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, pad.dur);

    osc.connect(eqSub);
    eqSub.connect(gain);
    gain.connect(offline.destination);
    osc.start(0);
    osc.stop(pad.dur);
    const buf = await offline.startRendering();
    downloadBlob(
      encodeWavBlob(buf.getChannelData(0), sampleRate, {
        title: `${pad.label} (${spatialCodec.toUpperCase()})`,
        software: 'INFINITY CORE ENGINE -- KNOCKSSTUDiOS DTS / Sony SDDS Sound',
      }),
      `knocksstudios-sample-${pad.id}-${spatialCodec}.wav`
    );
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Waves className="w-4 h-4 text-[#FF007F]" />
          <h2
            className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5FFFA]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sample Sounds Matrix · DTS:X &amp; Sony SDDS Digital Sound
          </h2>
        </div>
        <LedStatusIndicator
          label={`${spatialCodec.toUpperCase()} · ${lastTriggered.label}`}
          tone="magenta"
        />
      </div>

      <div className="cnc-recess rounded-[10px] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', 'All Samples (16)'],
              ['sub_impact', 'Sub & Impact'],
              ['scifi_holo', 'Sci-Fi & Holo'],
              ['mech_foley', 'Mech & Foley'],
              ['risers', 'Risers & Stingers'],
            ] as [SampleCategory, string][]
          ).map(([k, lbl]) => (
            <HardwareButton
              key={k}
              size="sm"
              tone="cyan"
              active={category === k}
              onClick={() => setCategory(k)}
            >
              <span>{lbl}</span>
            </HardwareButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['dts_x', 'DTS:X Cinema'],
              ['sony_sdds', 'Sony SDDS 7.1'],
              ['dry_stereo', 'Dry Reference'],
            ] as [SpatialCodecKey, string][]
          ).map(([k, lbl]) => (
            <HardwareButton
              key={k}
              size="sm"
              tone={k === 'dts_x' ? 'red' : k === 'sony_sdds' ? 'magenta' : 'neutral'}
              active={spatialCodec === k}
              onClick={() => setSpatialCodec(k)}
            >
              <span>{lbl}</span>
            </HardwareButton>
          ))}
        </div>
      </div>

      <div className="cnc-recess rounded-[10px] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {visiblePads.map((pad) => (
          <HardwareButton
            key={pad.id}
            fullWidth
            size="lg"
            tone={pad.tone}
            active={lastTriggered.id === pad.id}
            onClick={() => triggerPad(pad)}
          >
            <Volume2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
            <span className="truncate">{pad.label}</span>
          </HardwareButton>
        ))}
      </div>

      <div className="cnc-recess rounded-[10px] p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-center">
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs text-[#E0FFFF]/80">
            <span>Pitch Multiplier</span>
            <span className="text-[#F5FFFA] tabular-nums">{pitchMult.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={pitchMult}
            onChange={(e) => setPitchMult(parseFloat(e.target.value))}
            className="hw-capsule-slider w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-[#E0FFFF]/80">
              <span>Sub LFE Punch</span>
              <span className="text-[#FF007F] tabular-nums">+{subPunchDb} dB</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={subPunchDb}
              onChange={(e) => setSubPunchDb(Number(e.target.value))}
              className="hw-capsule-slider w-full"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-[#E0FFFF]/80">
              <span>Surround Spread</span>
              <span className="text-[#00D9C0] tabular-nums">{Math.round(stereoPanSpread * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={stereoPanSpread}
              onChange={(e) => setStereoPanSpread(parseFloat(e.target.value))}
              className="hw-capsule-slider w-full"
            />
          </div>
        </div>

        <HardwareButton tone="cyan" active onClick={() => exportPadWav(lastTriggered)}>
          <Download className="w-3.5 h-3.5 text-[#00D9C0]" />
          <span>Export "{lastTriggered.label}" (.wav)</span>
        </HardwareButton>
      </div>
    </PlateBezel>
  );
}
