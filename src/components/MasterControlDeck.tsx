import React, { useState } from 'react';
import {
  Play,
  Download,
  Repeat,
  Repeat1,
  Loader2,
  Activity,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Scissors,
  SlidersHorizontal,
  ZoomIn,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { LogEntry } from './VideoOutput.js';
import type { ShaderPresetKey, VideoExportFormat } from '../lib/studioPipelineTypes.js';

interface MasterControlDeckProps {
  appState: 'IDLE' | 'GENERATING_VIDEO' | 'VIDEO_READY';
  renderProgress: number;
  currentTime: number;
  videoDuration: number;
  targetDuration: string;
  onSelectDuration: (val: string) => void;
  onSeek: (time: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  canSubmit: boolean;
  onLaunchRender: () => void;
  onSaveVideo: () => void;
  hasReadyVideo: boolean;
  downloading: boolean;
  logs: LogEntry[];
  activeStyleLabel?: string;
  activeFps?: number;
  activeResolutionTag?: string;
  activeFormat?: VideoExportFormat;
  activeShader?: ShaderPresetKey;
  asset3DName?: string;
  titleHeadline?: string;
  onOpenFullTimeline?: () => void;
}

type TrackId = 'v1' | '3d' | 'v2' | 'ttl' | 'a1' | 'a2';

function formatSmpte(sec: number, fps: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00:00:00';
  const totalFrames = Math.floor(sec * fps);
  const f = totalFrames % fps;
  const totalSec = Math.floor(sec);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function MasterControlDeck({
  appState,
  renderProgress,
  currentTime,
  videoDuration,
  targetDuration,
  onSelectDuration,
  onSeek,
  isLooping,
  onToggleLoop,
  canSubmit,
  onLaunchRender,
  onSaveVideo,
  hasReadyVideo,
  downloading,
  logs,
  activeStyleLabel = '4K HDR Ultra',
  activeFps = 60,
  activeResolutionTag = '4096×1716',
  activeFormat = 'webm',
  activeShader = 'bioluminescent_magenta',
  asset3DName = 'Valerius V Crest',
  titleHeadline = 'KNOCKSSTUDiOS',
  onOpenFullTimeline,
}: MasterControlDeckProps) {
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [zoom, setZoom] = useState<1 | 1.5 | 2 | 4>(1);
  const [cutSplitsPct, setCutSplitsPct] = useState<number[]>([0, 100]);
  const [selectedSegIdx, setSelectedSegIdx] = useState<number>(0);

  const [mutedTracks, setMutedTracks] = useState<Record<TrackId, boolean>>({
    v1: false,
    '3d': false,
    v2: false,
    ttl: false,
    a1: false,
    a2: false,
  });
  const [hiddenTracks, setHiddenTracks] = useState<Record<TrackId, boolean>>({
    v1: false,
    '3d': false,
    v2: false,
    ttl: false,
    a1: false,
    a2: false,
  });
  const [soloTrack, setSoloTrack] = useState<TrackId | null>(null);

  const isGenerating = appState === 'GENERATING_VIDEO';
  const targetSeconds = parseInt(targetDuration, 10) || 10;
  const effectiveDuration = hasReadyVideo && videoDuration > 0 ? videoDuration : targetSeconds;
  const playheadPct =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const latestLog = logs[logs.length - 1];

  const statusTone = isGenerating ? 'red' : hasReadyVideo ? 'cyan' : 'emerald';
  const statusLabel = isGenerating ? 'Rendering' : hasReadyVideo ? 'Cut Ready' : 'Armed';

  const isTrackActive = (id: TrackId) =>
    !hiddenTracks[id] && (soloTrack ? soloTrack === id : !mutedTracks[id]);

  const toggleMute = (id: TrackId) => {
    setMutedTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHide = (id: TrackId) => {
    setHiddenTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolo = (id: TrackId) => {
    setSoloTrack((prev) => (prev === id ? null : id));
  };

  const handleRazorSplitAtPlayhead = () => {
    const splitPct = Math.round(playheadPct);
    if (splitPct <= 3 || splitPct >= 97) return;
    setCutSplitsPct((prev) => {
      if (prev.some((p) => Math.abs(p - splitPct) < 4)) return prev;
      return [...prev, splitPct].sort((a, b) => a - b);
    });
  };

  const segments = cutSplitsPct.slice(0, -1).map((inPct, idx) => ({
    idx,
    label: `Cut ${idx + 1}`,
    inPct,
    outPct: cutSplitsPct[idx + 1],
  }));

  const inspectedSeg = segments[Math.min(selectedSegIdx, Math.max(0, segments.length - 1))] ?? {
    idx: 0,
    label: 'Cut 1',
    inPct: 0,
    outPct: 100,
  };

  const stepFrame = (deltaFrames: number) => {
    const stepSec = deltaFrames / Math.max(24, activeFps);
    const next = Math.min(effectiveDuration, Math.max(0, currentTime + stepSec));
    onSeek(next);
  };

  const tracks: {
    id: TrackId;
    badge: string;
    label: string;
    clipLabel: string;
    barClass: string;
    textClass: string;
  }[] = [
    {
      id: 'v1',
      badge: 'V1',
      label: 'VIDEO',
      clipLabel: hasReadyVideo
        ? `Master Cut (${targetSeconds}s @ ${activeFps}fps · ${activeResolutionTag})`
        : `Video Track Armed (${targetSeconds}s @ ${activeFps}fps)`,
      barClass: 'bg-[#121212]',
      textClass: 'text-[#F5FFFA]',
    },
    {
      id: '3d',
      badge: '3D-V',
      label: 'ASSET (V)',
      clipLabel: `${asset3DName} · Shader: ${activeShader.replace('_', ' ')}`,
      barClass: 'bg-[#170D16]',
      textClass: 'text-[#FFDAB9]',
    },
    {
      id: 'v2',
      badge: 'V2/FX',
      label: 'VFX/GEN',
      clipLabel: `VFX Shaders · ${activeStyleLabel}`,
      barClass: 'bg-[#1E0A16]',
      textClass: 'text-[#FF007F]',
    },
    {
      id: 'ttl',
      badge: 'TTL',
      label: 'TITLES',
      clipLabel: `Typography Overlay · "${titleHeadline}"`,
      barClass: 'bg-[#14161D]',
      textClass: 'text-[#FC8EAC]',
    },
    {
      id: 'a1',
      badge: 'A1',
      label: 'MUSIC',
      clipLabel: '44.1 kHz Stereo Music Bus · © 2024–2026 Stamped',
      barClass: 'bg-[#0D1414]',
      textClass: 'text-[#E0FFFF]',
    },
    {
      id: 'a2',
      badge: 'A2',
      label: 'DTS / SFX',
      clipLabel: 'DTS:X Cinema & Sony SDDS 7.1 Sound Bus',
      barClass: 'bg-[#0C1216]',
      textClass: 'text-[#00D9C0]',
    },
  ];

  return (
    <div id="studio-timeline" className="scroll-mt-20">
      <PlateBezel accent={isGenerating ? 'red' : 'neutral'} className="p-5 sm:p-6 space-y-4">
        {/* Header + SMPTE Frame Timecode */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-4 h-4 text-[#FF007F]" />
            <span
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#F5FFFA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              DaVinci · Blackmagic 6-Track Cut Timeline
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#0A0A0A] border border-[#FF007F]/40 font-mono text-xs font-bold tracking-widest text-[#FC8EAC] tabular-nums">
              {formatSmpte(hasReadyVideo ? currentTime : 0, activeFps)} · {activeFps} FPS
            </span>
            {onOpenFullTimeline && (
              <HardwareButton size="sm" tone="magenta" active={false} onClick={onOpenFullTimeline}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00D9C0]" />
                <span>Full NLE Station</span>
              </HardwareButton>
            )}
            <LedStatusIndicator label={statusLabel} tone={statusTone} />
            <LedStatusIndicator
              label={isLooping ? 'Loop On' : 'Single'}
              tone={isLooping ? 'magenta' : 'neutral'}
            />
          </div>
        </div>

        {/* Multi-Track NLE Visual Timeline (V1, 3D-V, V2/FX, TTL, A1, A2) */}
        <div className="cnc-recess rounded-[10px] p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[#E0FFFF]/75">
            <span>6-Track DaVinci Cut Timeline ({effectiveDuration.toFixed(1)}s · Scrub / Split / Inspect)</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Zoom Selector */}
              <div className="flex items-center gap-1 mr-1">
                <ZoomIn className="w-3.5 h-3.5 text-[#00D9C0]" />
                {([1, 1.5, 2, 4] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      zoom === z
                        ? 'bg-[#00D9C0] text-[#0A0A0A]'
                        : 'bg-[#121212] text-[#E0FFFF]/70 hover:text-white'
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
              <HardwareButton
                size="sm"
                tone="red"
                active={cutSplitsPct.length > 2}
                ledIndicator={false}
                onClick={handleRazorSplitAtPlayhead}
                title="Razor Cut Split at Playhead"
              >
                <Scissors className="w-3 h-3 text-[#FF007F]" />
                <span>Razor Split</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                tone="neutral"
                ledIndicator={false}
                onClick={() => stepFrame(-1)}
                title="Previous Frame (-1f)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>-1f</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                tone="neutral"
                ledIndicator={false}
                onClick={() => stepFrame(1)}
                title="Next Frame (+1f)"
              >
                <span>+1f</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </HardwareButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[175px_minmax(0,1fr)] gap-2 rounded-xl bg-[#0A0A0A] p-2.5">
            {/* Left Track Header Strip */}
            <div className="hidden md:flex flex-col justify-between gap-1.5 pt-4">
              {tracks.map((tr) => {
                const active = isTrackActive(tr.id);
                const isMuted = mutedTracks[tr.id];
                const isSolo = soloTrack === tr.id;
                const isHidden = hiddenTracks[tr.id];
                return (
                  <div
                    key={tr.id}
                    className={`h-6 rounded-lg px-2 flex items-center justify-between gap-1 font-mono text-[10px] bg-[#121212] transition-opacity ${
                      active ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <span className="font-bold text-[#F5FFFA] truncate">
                      {tr.badge} {tr.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleHide(tr.id)}
                        title={`Toggle Visibility ${tr.badge}`}
                        className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer ${
                          isHidden ? 'bg-[#0A0A0A] text-[#FC8EAC]/40' : 'bg-[#1D1D24] text-[#E0FFFF]'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMute(tr.id)}
                        title={`Mute ${tr.badge}`}
                        className={`w-4 h-4 rounded text-[9px] font-bold cursor-pointer ${
                          isMuted
                            ? 'bg-[#FF007F] text-[#F5FFFA]'
                            : 'bg-[#1D1D24] text-[#E0FFFF]/65 hover:text-white'
                        }`}
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSolo(tr.id)}
                        title={`Solo ${tr.badge}`}
                        className={`w-4 h-4 rounded text-[9px] font-bold cursor-pointer ${
                          isSolo
                            ? 'bg-[#00D9C0] text-[#0A0A0A]'
                            : 'bg-[#1D1D24] text-[#E0FFFF]/65 hover:text-white'
                        }`}
                      >
                        S
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Interactive Scrubbed & Zoomable Tracks */}
            <div className="overflow-x-auto">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                  onSeek(ratio * effectiveDuration);
                }}
                style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
                className="relative space-y-1.5 select-none rounded-lg cursor-pointer"
              >
                {/* SMPTE Ruler Ticks */}
                <div className="flex justify-between font-mono text-[9px] text-[#E0FFFF]/55 pb-0.5 tabular-nums">
                  <span>00:00:00:00</span>
                  <span>{formatSmpte(effectiveDuration * 0.25, activeFps)}</span>
                  <span>{formatSmpte(effectiveDuration * 0.5, activeFps)}</span>
                  <span>{formatSmpte(effectiveDuration * 0.75, activeFps)}</span>
                  <span>{formatSmpte(effectiveDuration, activeFps)}</span>
                </div>

                {/* Live Bioluminescent Playhead Needle */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#FF007F] z-20 shadow-[0_0_10px_#FF007F]"
                  style={{ left: `${playheadPct}%` }}
                />

                {/* Razor Split Markers */}
                {cutSplitsPct.slice(1, -1).map((pct) => (
                  <div
                    key={pct}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-4 bottom-0 w-px bg-[#00D9C0]/80 z-10"
                    style={{ left: `${pct}%` }}
                  />
                ))}

                {tracks.map((tr) => {
                  const active = isTrackActive(tr.id);
                  return (
                    <div
                      key={tr.id}
                      className={`h-6 rounded-lg ${tr.barClass} flex items-center justify-between px-2.5 font-mono text-[10px] transition-opacity ${
                        active ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <span className={`${tr.textClass} truncate`}>
                        <span className="md:hidden font-bold mr-1.5">{tr.badge}</span>
                        {tr.clipLabel}
                      </span>
                      <span className="text-[9px] text-[#E0FFFF]/45 uppercase shrink-0 ml-2">
                        {active ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clip Inspector Strip */}
          <div className="rounded-xl bg-[#0A0A0A] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#00D9C0] uppercase font-bold">Clip Inspector:</span>
              {segments.map((seg) => (
                <button
                  key={seg.idx}
                  type="button"
                  onClick={() => setSelectedSegIdx(seg.idx)}
                  className={`px-2 py-0.5 rounded-full cursor-pointer ${
                    inspectedSeg.idx === seg.idx
                      ? 'bg-[#FF007F] text-[#F5FFFA] font-bold'
                      : 'bg-[#121212] text-[#E0FFFF]/70'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[#E0FFFF]/80 tabular-nums">
              <span>
                In–Out: <strong className="text-[#F5FFFA]">{inspectedSeg.inPct}%–{inspectedSeg.outPct}%</strong>
              </span>
              <span>
                Rate: <strong className="text-[#00D9C0]">{activeFps} FPS</strong>
              </span>
              <span>
                Out: <strong className="text-[#FC8EAC]">{activeResolutionTag} · {activeFormat.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Activity Monitor Log Drawer */}
        {monitorOpen && (
          <div className="cnc-recess rounded-[8px] p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="text-[#E0FFFF]/50">
                No activity recorded yet. Configure scene options and press Render Cut.
              </div>
            ) : (
              logs.slice(-12).map((entry) => (
                <div
                  key={entry.id}
                  className={
                    entry.type === 'error'
                      ? 'text-[#FF007F]'
                      : entry.type === 'warn'
                      ? 'text-[#FFDAB9]'
                      : entry.type === 'success'
                      ? 'text-[#00D9C0]'
                      : 'text-[#E0FFFF]/80'
                  }
                >
                  <span className="text-[#E0FFFF]/35 mr-2">›</span>
                  <span>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Capsule Groove Timeline Slider & Progress Control */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-3 items-center">
          <div className="capsule-track-housing rounded-full px-4 py-2.5 flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E0FFFF]/65 whitespace-nowrap shrink-0">
              {hasReadyVideo ? 'Playhead' : 'Duration'}
            </span>
            {hasReadyVideo ? (
              <input
                type="range"
                min={0}
                max={effectiveDuration}
                step={0.05}
                value={Math.min(currentTime, effectiveDuration)}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                aria-label="Video playback timeline"
                className="hw-capsule-slider flex-1 min-w-0"
              />
            ) : (
              <input
                type="range"
                min={5}
                max={15}
                step={5}
                disabled={isGenerating}
                value={targetSeconds}
                onChange={(e) => onSelectDuration(`${e.target.value}s`)}
                aria-label="Target reel duration"
                className="hw-capsule-slider flex-1 min-w-0"
              />
            )}
            <span className="font-mono text-xs font-semibold text-[#F5FFFA] tabular-nums whitespace-nowrap shrink-0">
              {hasReadyVideo
                ? `${formatSmpte(currentTime, activeFps)}`
                : `${String(targetSeconds).padStart(2, '0')}s`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full capsule-track-housing">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E0FFFF]/65 shrink-0">
              Render
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-[#0A0A0A] overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#FF007F] via-[#FC8EAC] to-[#00D9C0] transition-all duration-200"
                style={{
                  width: `${isGenerating ? Math.max(5, renderProgress) : hasReadyVideo ? 100 : 0}%`,
                }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#F5FFFA] tabular-nums w-9 text-right shrink-0">
              {isGenerating ? `${renderProgress}%` : hasReadyVideo ? '100%' : '0%'}
            </span>
          </div>
        </div>

        {/* Activity Monitor Bar + Launch Control Switches */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setMonitorOpen((o) => !o)}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[8px] cnc-recess hover:border-[#00D9C0]/40 text-left transition-colors cursor-pointer flex-1 min-w-0"
          >
            <span className="flex items-center gap-2 min-w-0 font-mono text-xs text-[#E0FFFF]/80">
              <Activity className="w-3.5 h-3.5 text-[#00D9C0] shrink-0" />
              <span className="truncate">
                {latestLog ? latestLog.message : 'Activity Monitor: Ready to render sequence'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#E0FFFF]/55 whitespace-nowrap shrink-0">
              <span>{logs.length} logs</span>
              {monitorOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            <HardwareButton
              tone="magenta"
              active={isLooping}
              onClick={onToggleLoop}
              aria-label={isLooping ? 'Disable infinite loop' : 'Enable infinite loop'}
            >
              {isLooping ? <Repeat className="w-3.5 h-3.5 text-[#FC8EAC]" /> : <Repeat1 className="w-3.5 h-3.5" />}
              <span>Loop: {isLooping ? 'ON' : 'OFF'}</span>
            </HardwareButton>

            {hasReadyVideo && (
              <HardwareButton
                tone="cyan"
                active={false}
                disabled={downloading}
                onClick={onSaveVideo}
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#00D9C0]" />}
                <span>Save Cut</span>
              </HardwareButton>
            )}

            <HardwareButton
              tone="red"
              size="lg"
              active={isGenerating || canSubmit}
              disabled={!canSubmit}
              onClick={onLaunchRender}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF007F]" />
                  <span>Rendering…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-[#FF007F]" />
                  <span>Render Cut</span>
                </>
              )}
            </HardwareButton>
          </div>
        </div>
      </PlateBezel>
    </div>
  );
}
