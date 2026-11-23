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
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { LogEntry } from './VideoOutput.js';

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
  onOpenFullTimeline?: () => void;
}

type TrackId = 'v1' | 'v2' | 'fx' | 'a1' | 'a2';

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
  activeStyleLabel = 'Pro & Candy HDR',
  activeFps = 60,
  onOpenFullTimeline,
}: MasterControlDeckProps) {
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [mutedTracks, setMutedTracks] = useState<Record<TrackId, boolean>>({
    v1: false,
    v2: false,
    fx: false,
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
    soloTrack ? soloTrack === id : !mutedTracks[id];

  const toggleMute = (id: TrackId) => {
    setMutedTracks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSolo = (id: TrackId) => {
    setSoloTrack((prev) => (prev === id ? null : id));
  };

  const stepFrame = (deltaFrames: number) => {
    if (!hasReadyVideo) return;
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
        ? `Master Sequence (${targetSeconds}s @ ${activeFps}fps)`
        : `Timeline Armed (${targetSeconds}s @ ${activeFps}fps)`,
      barClass: 'bg-[#14070B]',
      textClass: 'text-[#F5E9EA]',
    },
    {
      id: 'v2',
      badge: 'V2',
      label: 'VFX / BFX',
      clipLabel: 'VFX Shader Layer · BFX Broadcast Scope & Chroma Bus',
      barClass: 'bg-[#1A080E]',
      textClass: 'text-[#FF5C8A]',
    },
    {
      id: 'fx',
      badge: 'FX',
      label: 'GRADE',
      clipLabel: `Color Pipeline · ${activeStyleLabel}`,
      barClass: 'bg-[#1D090F]',
      textClass: 'text-[#E06844]',
    },
    {
      id: 'a1',
      badge: 'A1',
      label: 'MUSIC',
      clipLabel: '44.1 kHz Stereo Music Bus · Copyright Stamped',
      barClass: 'bg-[#0D0507]',
      textClass: 'text-[#E6ECF5]/80',
    },
    {
      id: 'a2',
      badge: 'A2',
      label: 'DTS / SFX',
      clipLabel: 'DTS:X Cinema & Sony SDDS 7.1 Sample Foley Bus',
      barClass: 'bg-[#0B0406]',
      textClass: 'text-[#F1F5F9]/75',
    },
  ];

  return (
    <div id="studio-timeline" className="scroll-mt-20">
      <PlateBezel accent={isGenerating ? 'red' : 'neutral'} className="p-5 sm:p-6 space-y-4">
        {/* Header + SMPTE Frame Timecode */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-4 h-4 text-[#FF0A3C]" />
            <span
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#F5E9EA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              DaVinci Cut Timeline &amp; Master Control
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#050304] border border-[#B84323]/40 font-mono text-xs font-bold tracking-widest text-[#FF5C8A] tabular-nums">
              {formatSmpte(hasReadyVideo ? currentTime : 0, activeFps)} · {activeFps} FPS
            </span>
            {onOpenFullTimeline && (
              <HardwareButton size="sm" tone="magenta" active={false} onClick={onOpenFullTimeline}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E06844]" />
                <span>Full NLE Station</span>
              </HardwareButton>
            )}
            <LedStatusIndicator label={statusLabel} tone={statusTone} pulse={isGenerating} />
            <LedStatusIndicator
              label={isLooping ? 'Loop On' : 'Single'}
              tone={isLooping ? 'magenta' : 'neutral'}
            />
          </div>
        </div>

        {/* Multi-Track NLE Visual Timeline (V1, V2, FX, A1, A2 with Mute/Solo) */}
        <div className="cnc-recess rounded-[10px] p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[#E6ECF5]/65">
            <span>5-Track Broadcast NLE ({effectiveDuration.toFixed(1)}s · Click ruler to scrub)</span>
            <div className="flex items-center gap-1.5">
              <HardwareButton
                size="sm"
                tone="neutral"
                ledIndicator={false}
                disabled={!hasReadyVideo}
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
                disabled={!hasReadyVideo}
                onClick={() => stepFrame(1)}
                title="Next Frame (+1f)"
              >
                <span>+1f</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </HardwareButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[150px_minmax(0,1fr)] gap-2 rounded-xl bg-[#050304] p-2.5">
            {/* Left Track Header Strip */}
            <div className="hidden md:flex flex-col justify-between gap-1.5 pt-4">
              {tracks.map((tr) => {
                const active = isTrackActive(tr.id);
                const isMuted = mutedTracks[tr.id];
                const isSolo = soloTrack === tr.id;
                return (
                  <div
                    key={tr.id}
                    className={`h-6 rounded-lg px-2 flex items-center justify-between gap-1 font-mono text-[10px] bg-[#0B0407] transition-opacity ${
                      active ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <span className="font-bold text-[#F5E9EA] truncate">
                      {tr.badge} {tr.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleMute(tr.id)}
                        title={`Mute ${tr.badge}`}
                        className={`w-4 h-4 rounded text-[9px] font-bold cursor-pointer ${
                          isMuted
                            ? 'bg-[#FF0A3C] text-white'
                            : 'bg-[#1D090F] text-[#E6ECF5]/60 hover:text-white'
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
                            ? 'bg-[#B84323] text-white'
                            : 'bg-[#1D090F] text-[#E6ECF5]/60 hover:text-white'
                        }`}
                      >
                        S
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Interactive Scrubbed Tracks */}
            <div
              onClick={(e) => {
                if (!hasReadyVideo) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                onSeek(ratio * effectiveDuration);
              }}
              className={`relative space-y-1.5 overflow-hidden select-none rounded-lg ${
                hasReadyVideo ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* SMPTE Ruler Ticks */}
              <div className="flex justify-between font-mono text-[9px] text-[#E6ECF5]/45 pb-0.5 tabular-nums">
                <span>00:00:00:00</span>
                <span>{formatSmpte(effectiveDuration * 0.25, activeFps)}</span>
                <span>{formatSmpte(effectiveDuration * 0.5, activeFps)}</span>
                <span>{formatSmpte(effectiveDuration * 0.75, activeFps)}</span>
                <span>{formatSmpte(effectiveDuration, activeFps)}</span>
              </div>

              {/* Live Candy-Gloss Playhead Needle */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-[#FF0A3C] z-20 shadow-[0_0_10px_#FF0A3C]"
                style={{ left: `${playheadPct}%` }}
              />

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
                    <span className="text-[9px] text-[#E6ECF5]/40 uppercase shrink-0 ml-2">
                      {active ? 'ON' : 'MUTED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expandable Activity Monitor Log Drawer */}
        {monitorOpen && (
          <div className="cnc-recess rounded-[8px] p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="text-[#E6ECF5]/45">
                No activity recorded yet. Enter scene direction or pick frame plates and press Render Reel.
              </div>
            ) : (
              logs.slice(-12).map((entry) => (
                <div
                  key={entry.id}
                  className={
                    entry.type === 'error'
                      ? 'text-[#FF7088]'
                      : entry.type === 'warn'
                      ? 'text-amber-300'
                      : entry.type === 'success'
                      ? 'text-[#F1F5F9]'
                      : 'text-[#E6ECF5]/75'
                  }
                >
                  <span className="text-[#E6ECF5]/35 mr-2">›</span>
                  <span>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Capsule Groove Timeline Slider & Progress Control */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-3 items-center">
          <div className="capsule-track-housing rounded-full px-4 py-2.5 flex items-center gap-3 min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E6ECF5]/60 whitespace-nowrap shrink-0">
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
            <span className="font-mono text-xs font-semibold text-[#F1F5F9] tabular-nums whitespace-nowrap shrink-0">
              {hasReadyVideo
                ? `${formatSmpte(currentTime, activeFps)}`
                : `${String(targetSeconds).padStart(2, '0')}s`}
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full capsule-track-housing">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#E6ECF5]/60 shrink-0">
              Render
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-[#050304] overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#FF0A3C] via-[#E06844] to-[#F5E9EA] transition-all duration-200"
                style={{
                  width: `${isGenerating ? Math.max(5, renderProgress) : hasReadyVideo ? 100 : 0}%`,
                }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#E6ECF5] tabular-nums w-9 text-right shrink-0">
              {isGenerating ? `${renderProgress}%` : hasReadyVideo ? '100%' : '0%'}
            </span>
          </div>
        </div>

        {/* Activity Monitor Bar + Launch Control Switches */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setMonitorOpen((o) => !o)}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[8px] cnc-recess hover:border-[#F1F5F9]/40 text-left transition-colors cursor-pointer flex-1 min-w-0"
          >
            <span className="flex items-center gap-2 min-w-0 font-mono text-xs text-[#E6ECF5]/75">
              <Activity className="w-3.5 h-3.5 text-[#F1F5F9] shrink-0" />
              <span className="truncate">
                {latestLog ? latestLog.message : 'Activity Monitor: Ready to render sequence'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#E6ECF5]/50 whitespace-nowrap shrink-0">
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
              {isLooping ? <Repeat className="w-3.5 h-3.5 text-[#FF5C8A]" /> : <Repeat1 className="w-3.5 h-3.5" />}
              <span>Loop: {isLooping ? 'ON' : 'OFF'}</span>
            </HardwareButton>

            {hasReadyVideo && (
              <HardwareButton
                tone="cyan"
                active={false}
                disabled={downloading}
                onClick={onSaveVideo}
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#F1F5F9]" />}
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
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF3B5C]" />
                  <span>Rendering…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-[#FF3B5C]" />
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
