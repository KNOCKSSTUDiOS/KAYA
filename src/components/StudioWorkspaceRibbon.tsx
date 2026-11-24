import React from 'react';
import { Film, Sparkles, Volume2, Image as ImageIcon, Scissors, Play, Loader2 } from 'lucide-react';
import { HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { FPS_PRESETS, FPSKey, RESOLUTION_PRESETS, ResolutionKey } from '../lib/studioRenderer.js';
import type { VideoExportFormat } from '../lib/studioPipelineTypes.js';
import type { StudioPageKey } from './RubiksCubeHubPage.js';

interface StudioWorkspaceRibbonProps {
  activeTool: StudioPageKey;
  fps: FPSKey;
  onChangeFps: (fps: FPSKey) => void;
  resolution: ResolutionKey;
  onChangeResolution: (res: ResolutionKey) => void;
  exportFormat?: VideoExportFormat;
  onChangeExportFormat?: (fmt: VideoExportFormat) => void;
  timelineProgress: number;
  onScrubTimeline: (pct: number) => void;
  durationSec: number;
  canRender: boolean;
  isRendering: boolean;
  onRender: () => void;
  onSwitchWorkspace: (tool: StudioPageKey) => void;
  position?: 'top' | 'bottom';
}

export function StudioWorkspaceRibbon({
  activeTool,
  fps,
  onChangeFps,
  resolution,
  onChangeResolution,
  exportFormat = 'webm',
  onChangeExportFormat,
  timelineProgress,
  onScrubTimeline,
  durationSec,
  canRender,
  isRendering,
  onRender,
  onSwitchWorkspace,
  position = 'top',
}: StudioWorkspaceRibbonProps) {
  const resSpec = RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[3];
  const scrubbedSec = ((timelineProgress / 100) * durationSec).toFixed(1);

  if (position === 'bottom') {
    return (
      <div className="candy-surface rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <LedStatusIndicator
            label={`${resSpec.label} (${resSpec.tag}) · ${fps} FPS · ${exportFormat.toUpperCase()}`}
            tone="cyan"
          />
          <span className="font-mono text-[11px] text-[#E0FFFF]/75 tabular-nums">
            Timeline {scrubbedSec}s / {durationSec}s
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['video', 'Video'],
              ['vfx', 'VFX'],
              ['audio', 'Audio'],
              ['picture', 'Picture'],
              ['editor', 'Timeline'],
            ] as [StudioPageKey, string][]
          ).map(([k, label]) => (
            <HardwareButton
              key={k}
              size="sm"
              tone={activeTool === k ? 'red' : 'neutral'}
              active={activeTool === k}
              onClick={() => onSwitchWorkspace(k)}
            >
              <span>{label}</span>
            </HardwareButton>
          ))}
          <HardwareButton
            size="sm"
            tone="red"
            active={canRender || isRendering}
            disabled={!canRender || isRendering}
            onClick={onRender}
          >
            {isRendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRendering ? 'Rendering…' : `Render ${fps} FPS`}</span>
          </HardwareButton>
        </div>
      </div>
    );
  }

  return (
    <div className="candy-surface rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <HardwareButton
            size="sm"
            tone="red"
            active={activeTool === 'video'}
            onClick={() => onSwitchWorkspace('video')}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            tone="magenta"
            active={activeTool === 'vfx'}
            onClick={() => onSwitchWorkspace('vfx')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>VFX Studio</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            tone="cyan"
            active={activeTool === 'audio'}
            onClick={() => onSwitchWorkspace('audio')}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            tone="cyan"
            active={activeTool === 'picture'}
            onClick={() => onSwitchWorkspace('picture')}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Picture</span>
          </HardwareButton>
          <HardwareButton
            size="sm"
            tone="neutral"
            active={activeTool === 'editor'}
            onClick={() => onSwitchWorkspace('editor')}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Timeline NLE</span>
          </HardwareButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onChangeExportFormat && (
            <div className="flex items-center gap-1">
              {(
                [
                  ['webm', 'WebM'],
                  ['mp4', 'MP4'],
                  ['png_seq', 'PNG Seq'],
                ] as [VideoExportFormat, string][]
              ).map(([fmt, lbl]) => (
                <HardwareButton
                  key={fmt}
                  size="sm"
                  tone="magenta"
                  ledIndicator={false}
                  active={exportFormat === fmt}
                  onClick={() => onChangeExportFormat(fmt)}
                >
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
            </div>
          )}
          <LedStatusIndicator
            label={`${resSpec.tag} · ${fps} FPS`}
            tone="cyan"
          />
          <HardwareButton
            size="sm"
            tone="red"
            active={canRender || isRendering}
            disabled={!canRender || isRendering}
            onClick={onRender}
          >
            {isRendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRendering ? 'Rendering…' : 'Render Master'}</span>
          </HardwareButton>
        </div>
      </div>

      {/* Unified Timeline Scrubber + Synchronized Resolution & FPS Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center cnc-recess rounded-xl px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#00D9C0] whitespace-nowrap shrink-0">
            Timeline Scrub
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(timelineProgress)}
            onChange={(e) => onScrubTimeline(Number(e.target.value))}
            aria-label="Unified workspace timeline scrubber"
            className="hw-capsule-slider flex-1 min-w-0"
          />
          <span className="font-mono text-xs text-[#F5FFFA] tabular-nums whitespace-nowrap shrink-0">
            {scrubbedSec}s / {durationSec}s
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {RESOLUTION_PRESETS.map((r) => (
            <HardwareButton
              key={r.key}
              size="sm"
              tone="cyan"
              active={resolution === r.key}
              onClick={() => onChangeResolution(r.key)}
            >
              <span>{r.label}</span>
            </HardwareButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FPS_PRESETS.map((f) => (
            <HardwareButton
              key={f.key}
              size="sm"
              tone={f.key >= 90 ? 'red' : 'magenta'}
              active={fps === f.key}
              onClick={() => onChangeFps(f.key)}
            >
              <span className="tabular-nums">{f.label}</span>
            </HardwareButton>
          ))}
        </div>
      </div>
    </div>
  );
}
