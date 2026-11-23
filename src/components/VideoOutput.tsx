import React, { useRef, useEffect, useState } from 'react';
import {
  Loader2,
  AlertTriangle,
  Repeat,
  Repeat1,
  Download,
  Sliders,
  Camera,
  Image as ImageIcon,
  Layers,
  Film,
  X,
  Info,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import {
  CompositionConfig,
  RESOLUTION_PRESETS,
  RENDER_STYLE_PRESETS,
  HDR_GRADE_PRESETS,
  CAMERA_MOTION_PRESETS,
  captureVideoElementFrame,
  exportCompositionStillFrame,
  exportCompositionSequenceArchive,
  extractVideoSequenceArchive,
} from '../lib/studioRenderer.js';

type AppState = 'IDLE' | 'GENERATING_ATMOSPHERE' | 'GENERATING_PROMPT' | 'GENERATING_VIDEO' | 'VIDEO_READY';
type LogType = 'info' | 'success' | 'warn' | 'error';
export interface LogEntry { id: string; message: string; type: LogType; image?: string }

interface VideoOutputProps {
  appState: AppState;
  videoUrl: string | null;
  logs: LogEntry[];
  isLooping?: boolean;
  onToggleLoop?: () => void;
  onDownload?: () => void;
  onToggleEdit?: () => void;
  editOpen?: boolean;
  downloading?: boolean;
  versionLabel?: string;
  targetDuration?: string;
  formatSpecLabel?: string;
  renderProgress?: number;
  onVideoTimeUpdate?: (current: number, total: number) => void;
  seekToTime?: number | null;
  emptyHint?: string;
  composition?: CompositionConfig;
  onLog?: (message: string, type?: LogType) => void;
}

const logColor = (type: LogType) =>
  type === 'error' ? 'text-[#FF7088]' :
  type === 'warn' ? 'text-amber-300' :
  type === 'success' ? 'text-[#F1F5F9]' :
  'text-[#E6ECF5]/75';

const readableError = (raw: string): string => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      const message = parsed?.error?.message ?? parsed?.message;
      if (typeof message === 'string' && message.trim()) return message;
    } catch {
      // fall through
    }
  }
  return raw.replace(/^Error:\s*/, '').trim();
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function VideoOutput({
  appState,
  videoUrl,
  logs,
  isLooping = true,
  onToggleLoop,
  onDownload,
  onToggleEdit,
  editOpen = false,
  downloading = false,
  versionLabel,
  targetDuration = '10s',
  formatSpecLabel = '4096×1716 · Ultra Cinema HDR',
  renderProgress = 0,
  onVideoTimeUpdate,
  seekToTime,
  emptyHint = 'Configure Prompt Window, Frames & Camera Rig, or Video options, then press Render Reel',
  composition,
  onLog,
}: VideoOutputProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [showTechSummary, setShowTechSummary] = useState(true);
  const [exporterOpen, setExporterOpen] = useState(false);
  const [transparentMode, setTransparentMode] = useState<boolean>(true);
  const [includeShadow, setIncludeShadow] = useState<boolean>(true);
  const [exportScale, setExportScale] = useState<'native' | '1080p'>('native');
  const [sequenceFps, setSequenceFps] = useState<6 | 12 | 24>(12);
  const [exportingKind, setExportingKind] = useState<'still' | 'sequence' | null>(null);
  const [seqProgress, setSeqProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [exportStatusMsg, setExportStatusMsg] = useState<string | null>(null);

  const generating =
    appState === 'GENERATING_ATMOSPHERE' ||
    appState === 'GENERATING_PROMPT' ||
    appState === 'GENERATING_VIDEO';
  const lastLog = logs[logs.length - 1];
  const recentLogs = logs.slice(-6);
  const hasError = lastLog?.type === 'error';

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (seekToTime !== null && seekToTime !== undefined && videoRef.current) {
      videoRef.current.currentTime = seekToTime;
    }
  }, [seekToTime]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const panelAccent =
    generating ? 'red' : appState === 'VIDEO_READY' ? 'cyan' : 'neutral';

  const spec = composition
    ? RESOLUTION_PRESETS.find((r) => r.key === composition.resolution) ?? RESOLUTION_PRESETS[3]
    : null;
  const cutStyleObj = composition?.renderStyle
    ? RENDER_STYLE_PRESETS.find((s) => s.key === composition.renderStyle)
    : RENDER_STYLE_PRESETS[0];
  const cutHdrObj = composition?.hdrGrade
    ? HDR_GRADE_PRESETS.find((g) => g.key === composition.hdrGrade)
    : HDR_GRADE_PRESETS[2];
  const cutCameraObj = composition?.cameraMotion
    ? CAMERA_MOTION_PRESETS.find((c) => c.key === composition.cameraMotion)
    : CAMERA_MOTION_PRESETS[0];
  const cutFps = composition?.fps ?? spec?.fps ?? 60;
  const maxWidthLimit = exportScale === '1080p' ? 1920 : undefined;
  const baseWidth = spec?.width || videoRef.current?.videoWidth || 1920;
  const baseHeight = spec?.height || videoRef.current?.videoHeight || 1080;
  const outScale = maxWidthLimit && baseWidth > maxWidthLimit ? maxWidthLimit / baseWidth : 1;
  const outWidth = Math.max(2, Math.round(baseWidth * outScale));
  const outHeight = Math.max(2, Math.round(baseHeight * outScale));
  const effectiveDurSec =
    composition?.durationSec ||
    (videoRef.current && Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0
      ? videoRef.current.duration
      : parseInt(targetDuration, 10) || 10);
  const estimatedFrames = Math.max(4, Math.round(effectiveDurSec * sequenceFps));
  const cutSlug = (versionLabel || 'cut-1').toLowerCase().replace(/\s+/g, '-');

  const getPlayheadProgress = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return 0.25;
    return Math.min(1, Math.max(0, v.currentTime / v.duration));
  };

  const handleExportStill = async (mode: 'video-png' | 'video-jpg' | 'alpha-png') => {
    if (exportingKind) return;
    setExportingKind('still');
    setExportStatusMsg(null);
    try {
      if (mode === 'alpha-png' && composition) {
        const res = await exportCompositionStillFrame(composition, {
          progress: getPlayheadProgress(),
          transparentBackground: true,
          includeShadow,
          format: 'png',
          maxWidth: maxWidthLimit,
        });
        const filename = `kaya-${cutSlug}-alpha-${res.width}x${res.height}.png`;
        triggerBlobDownload(res.blob, filename);
        const msg = `Exported transparent RGBA frame (${res.width}×${res.height} PNG).`;
        setExportStatusMsg(msg);
        onLog?.(msg, 'success');
      } else if (videoRef.current) {
        const format = mode === 'video-jpg' ? 'jpeg' : 'png';
        const res = await captureVideoElementFrame(videoRef.current, format, maxWidthLimit);
        const ext = format === 'jpeg' ? 'jpg' : 'png';
        const filename = `kaya-${cutSlug}-frame-${res.width}x${res.height}.${ext}`;
        triggerBlobDownload(res.blob, filename);
        const msg = `Exported ${res.width}×${res.height} ${ext.toUpperCase()} frame.`;
        setExportStatusMsg(msg);
        onLog?.(msg, 'success');
      }
    } catch (err: any) {
      const msg = `Frame export failed: ${err?.message || 'Unknown error'}`;
      setExportStatusMsg(msg);
      onLog?.(msg, 'error');
    } finally {
      setExportingKind(null);
    }
  };

  const handleExportSequence = async () => {
    if (exportingKind || !videoUrl) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setExportingKind('sequence');
    setExportStatusMsg(null);
    setSeqProgress({ current: 0, total: estimatedFrames, percent: 0 });

    const useAlpha = transparentMode && !!composition;
    onLog?.(
      `Exporting ${estimatedFrames}-frame ${useAlpha ? 'transparent RGBA PNG' : 'PNG'} sequence (${outWidth}×${outHeight})…`,
      'warn'
    );

    try {
      const result = composition
        ? await exportCompositionSequenceArchive(composition, {
            fps: sequenceFps,
            transparentBackground: useAlpha,
            includeShadow,
            maxWidth: maxWidthLimit,
            signal: controller.signal,
            onProgress: (current, total, percent) => setSeqProgress({ current, total, percent }),
          })
        : await extractVideoSequenceArchive(videoUrl, {
            fps: sequenceFps,
            maxWidth: maxWidthLimit,
            signal: controller.signal,
            onProgress: (current, total, percent) => setSeqProgress({ current, total, percent }),
          });

      const tag = useAlpha ? 'alpha-png-seq' : 'png-seq';
      const filename = `kaya-${cutSlug}-${tag}-${result.width}x${result.height}-${sequenceFps}fps.zip`;
      triggerBlobDownload(result.blob, filename);

      const msg = `Saved ${result.frameCount} ${useAlpha ? 'transparent PNG' : 'PNG'} frames (${result.width}×${result.height}) to ${filename}.`;
      setExportStatusMsg(msg);
      onLog?.(msg, 'success');
    } catch (err: any) {
      const msg = err?.message?.includes('cancelled')
        ? 'PNG sequence export cancelled.'
        : `PNG sequence export failed: ${err?.message || 'Unknown error'}`;
      setExportStatusMsg(msg);
      onLog?.(msg, err?.message?.includes('cancelled') ? 'warn' : 'error');
    } finally {
      abortRef.current = null;
      setExportingKind(null);
      setSeqProgress(null);
    }
  };

  const handleCancelSequence = () => {
    abortRef.current?.abort();
  };

  return (
    <PlateBezel accent={panelAccent} className="p-5 sm:p-6 flex flex-col gap-4">
      {/* Monitor Top Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <h2
            className="text-sm sm:text-base font-bold tracking-wider uppercase text-[#E6ECF5] whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Realtime Preview
          </h2>
          {versionLabel ? (
            <span className="font-mono text-xs text-[#F1F5F9] tabular-nums whitespace-nowrap">
              {versionLabel} · {targetDuration} · {formatSpecLabel}
            </span>
          ) : (
            <span className="font-mono text-xs text-[#E6ECF5]/60 tabular-nums whitespace-nowrap">
              {formatSpecLabel} · {targetDuration}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {appState === 'VIDEO_READY' && videoUrl && (
            <HardwareButton
              size="sm"
              tone="red"
              active={showTechSummary}
              onClick={() => setShowTechSummary((s) => !s)}
              title="Toggle cut technical summary overlay"
            >
              <Info className="w-3.5 h-3.5 text-[#FF3B5C]" />
              <span>Cut Specs HUD</span>
            </HardwareButton>
          )}
          {appState === 'VIDEO_READY' && videoUrl && (
            <HardwareButton
              size="sm"
              tone="cyan"
              active={exporterOpen}
              onClick={() => setExporterOpen((o) => !o)}
              title="Export high-resolution still frames or transparent PNG sequence (.zip)"
            >
              <Camera className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>Frames / PNG</span>
            </HardwareButton>
          )}
          {appState === 'VIDEO_READY' && videoUrl && onDownload && (
            <HardwareButton
              size="sm"
              tone="cyan"
              active={false}
              disabled={downloading}
              onClick={onDownload}
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Save Reel</span>
            </HardwareButton>
          )}
          {appState === 'VIDEO_READY' && videoUrl && onToggleEdit && (
            <HardwareButton
              size="sm"
              tone="magenta"
              active={editOpen}
              onClick={onToggleEdit}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{editOpen ? 'Close Cut' : 'Edit Cut'}</span>
            </HardwareButton>
          )}
          {onToggleLoop && (
            <HardwareButton
              size="sm"
              tone="magenta"
              active={isLooping}
              onClick={onToggleLoop}
              aria-label={isLooping ? 'Disable infinite loop' : 'Enable infinite loop'}
            >
              {isLooping ? <Repeat className="w-3.5 h-3.5 text-[#FF2E63]" /> : <Repeat1 className="w-3.5 h-3.5" />}
              <span>Loop: {isLooping ? 'ON' : 'OFF'}</span>
            </HardwareButton>
          )}
        </div>
      </div>

      {/* Recessed Glass Monitor Frame */}
      <div className="cnc-recess rounded-[10px] p-2 flex flex-col">
        <div
          className={`relative w-full rounded-xl overflow-hidden optical-glass flex items-center justify-center ${
            hasError && appState !== 'VIDEO_READY' ? 'min-h-[260px] py-6' : 'aspect-video max-h-[460px]'
          }`}
        >
          {/* Specular optical glass corner reflection */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/30 z-10"
          />

          {appState === 'VIDEO_READY' && videoUrl ? (
            <>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el) {
                    el.muted = true;
                    el.loop = isLooping;
                  }
                }}
                src={videoUrl}
                controls
                controlsList="nodownload"
                autoPlay
                loop={isLooping}
                playsInline
                muted
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  onVideoTimeUpdate?.(v.currentTime, Number.isFinite(v.duration) ? v.duration : 0);
                }}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  onVideoTimeUpdate?.(v.currentTime, Number.isFinite(v.duration) ? v.duration : 0);
                }}
                className="relative z-0 w-full h-full object-contain bg-black"
              />

              {/* Technical Summary HUD Overlay when render is finished */}
              {showTechSummary && (
                <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-wrap items-start justify-between gap-2">
                  <div className="pointer-events-auto candy-trace-tile rounded-xl bg-[#050304]/82 backdrop-blur-md px-3.5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] shadow-[0_8px_28px_rgba(0,0,0,0.85)]">
                    <div>
                      <span className="text-[#E06844] uppercase text-[9px] block tracking-widest">Cut Master</span>
                      <span className="text-white font-bold">{versionLabel || 'Cut 1'} · {targetDuration}</span>
                    </div>
                    <div>
                      <span className="text-[#FF0A3C] uppercase text-[9px] block tracking-widest">Resolution</span>
                      <span className="text-white font-semibold tabular-nums">
                        {spec?.label || '4K Master'} ({baseWidth}×{baseHeight})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#E06844] uppercase text-[9px] block tracking-widest">Frame Rate</span>
                      <span className="text-white font-semibold tabular-nums">{cutFps} fps</span>
                    </div>
                    <div>
                      <span className="text-[#FF5C8A] uppercase text-[9px] block tracking-widest">Render Style</span>
                      <span className="text-white font-semibold">{cutStyleObj?.label || '4K HDR Ultra'}</span>
                    </div>
                    <div>
                      <span className="text-[#F5E9EA]/55 uppercase text-[9px] block tracking-widest">Camera &amp; Grade</span>
                      <span className="text-[#F5E9EA]/90">
                        {cutCameraObj?.label || '360 Orbit'} {composition?.lensFocalMm ? `· ${composition.lensFocalMm}mm` : ''} · {cutHdrObj?.label || 'Ultra Cinema'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : generating ? (
            <div className="relative z-20 flex flex-col items-center justify-center gap-4 px-6 py-6 w-full max-w-md text-center">
              <div className="w-12 h-12 rounded-[9px] cnc-module flex items-center justify-center border border-[#FF1E42]/50 shadow-[0_0_20px_rgba(255,30,66,0.25)]">
                <Loader2 className="w-6 h-6 text-[#FF1E42] animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-white font-semibold">
                  Rendering Sequence · {renderProgress}%
                </div>
                <div className="w-56 h-1.5 mx-auto rounded-full bg-[#050304] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF1E42] via-[#FF2E63] to-[#F1F5F9] transition-all duration-150"
                    style={{ width: `${Math.max(4, renderProgress)}%` }}
                  />
                </div>
              </div>
              <div className="w-full space-y-1.5 font-mono text-[11px] text-left bg-[#050304]/90 rounded-xl p-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className={logColor(log.type)}>
                    <div className="truncate"><span className="text-white/25">›</span> {log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative z-20 flex flex-col items-center text-center px-6 w-full max-w-md space-y-3">
              <LedStatusIndicator label="Viewport Ready" tone="cyan" />
              <p className="text-sm text-[#E6ECF5]/65 leading-relaxed">
                {emptyHint}
              </p>
              {lastLog?.type === 'error' && (
                <div className="mt-2 w-full flex items-start gap-3 rounded-[6px] border border-[#FF1E42]/45 bg-[#FF1E42]/10 px-4 py-3 text-left">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#FF1E42]" />
                  <p className="font-mono text-xs leading-relaxed text-[#FF9BAE] break-words">
                    {readableError(lastLog.message)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Frame & Transparent PNG Sequence Exporter Drawer */}
      {appState === 'VIDEO_READY' && videoUrl && exporterOpen && (
        <div className="candy-surface rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Film className="w-4 h-4 text-[#F1F5F9] shrink-0" />
              <h3
                className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Frame &amp; Transparent PNG Sequence Export
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <LedStatusIndicator
                label={`${outWidth}×${outHeight} · ${transparentMode && composition ? 'RGBA Alpha' : 'RGB'}`}
                tone={transparentMode && composition ? 'magenta' : 'cyan'}
              />
              <HardwareButton
                size="sm"
                tone="neutral"
                ledIndicator={false}
                onClick={() => setExporterOpen(false)}
                aria-label="Close frame exporter"
              >
                <X className="w-3.5 h-3.5" />
              </HardwareButton>
            </div>
          </div>

          {/* Global Resolution Scale & Alpha Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Output Scale */}
            <div className="cnc-module rounded-[8px] p-3 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/65 block">
                Export Resolution
              </span>
              <div className="grid grid-cols-2 gap-2">
                <HardwareButton
                  size="sm"
                  fullWidth
                  tone="cyan"
                  active={exportScale === 'native'}
                  disabled={!!exportingKind}
                  onClick={() => setExportScale('native')}
                >
                  <span>Master ({baseWidth}×{baseHeight})</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  fullWidth
                  tone="cyan"
                  active={exportScale === '1080p'}
                  disabled={!!exportingKind}
                  onClick={() => setExportScale('1080p')}
                >
                  <span>1080p HD (Fast)</span>
                </HardwareButton>
              </div>
            </div>

            {/* Instant High-Res Still Frame Export */}
            <div className="cnc-module rounded-[8px] p-3 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/65 block">
                Current Frame Snapshot (Playhead)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <HardwareButton
                  size="sm"
                  tone="cyan"
                  active={false}
                  disabled={!!exportingKind}
                  onClick={() => handleExportStill('video-png')}
                >
                  {exportingKind === 'still' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-[#F1F5F9]" />
                  )}
                  <span>Still (.png)</span>
                </HardwareButton>

                <HardwareButton
                  size="sm"
                  tone="neutral"
                  active={false}
                  disabled={!!exportingKind}
                  onClick={() => handleExportStill('video-jpg')}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#E6ECF5]/75" />
                  <span>Still (.jpg)</span>
                </HardwareButton>

                {composition && (
                  <HardwareButton
                    size="sm"
                    tone="magenta"
                    active
                    disabled={!!exportingKind}
                    onClick={() => handleExportStill('alpha-png')}
                    title="Export current frame subject with transparent RGBA alpha channel"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#FF5C8A]" />
                    <span>Alpha Cutout (.png)</span>
                  </HardwareButton>
                )}
              </div>
            </div>
          </div>

          {/* PNG Sequence Archive (.zip) Controls */}
          <div className="cnc-module rounded-[8px] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/70">
                PNG Sequence Archive (.zip) · {estimatedFrames} Frames
              </span>
              {composition && (
                <div className="flex flex-wrap items-center gap-2">
                  <HardwareButton
                    size="sm"
                    tone="magenta"
                    active={transparentMode}
                    disabled={!!exportingKind}
                    onClick={() => setTransparentMode(true)}
                  >
                    <span>Transparent RGBA</span>
                  </HardwareButton>
                  <HardwareButton
                    size="sm"
                    tone="cyan"
                    active={!transparentMode}
                    disabled={!!exportingKind}
                    onClick={() => setTransparentMode(false)}
                  >
                    <span>Full Frame</span>
                  </HardwareButton>
                  {transparentMode && (
                    <HardwareButton
                      size="sm"
                      tone="neutral"
                      active={includeShadow}
                      disabled={!!exportingKind}
                      onClick={() => setIncludeShadow((s) => !s)}
                    >
                      <span>Shadow: {includeShadow ? 'ON' : 'OFF'}</span>
                    </HardwareButton>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Sequence FPS selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-[#E6ECF5]/55">Rate:</span>
                {([6, 12, 24] as const).map((rate) => (
                  <HardwareButton
                    key={rate}
                    size="sm"
                    tone="cyan"
                    active={sequenceFps === rate}
                    disabled={!!exportingKind}
                    onClick={() => setSequenceFps(rate)}
                  >
                    <span className="tabular-nums">{rate} fps</span>
                  </HardwareButton>
                ))}
              </div>

              {/* Export / Cancel Action */}
              <div className="flex items-center gap-2">
                {exportingKind === 'sequence' ? (
                  <HardwareButton
                    size="sm"
                    tone="red"
                    active
                    onClick={handleCancelSequence}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel ({seqProgress?.current ?? 0}/{seqProgress?.total ?? estimatedFrames})</span>
                  </HardwareButton>
                ) : (
                  <HardwareButton
                    size="md"
                    tone={transparentMode && composition ? 'magenta' : 'cyan'}
                    active
                    disabled={!!exportingKind}
                    onClick={handleExportSequence}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {transparentMode && composition
                        ? 'Export Transparent PNG Sequence (.zip)'
                        : 'Export Frame PNG Sequence (.zip)'}
                    </span>
                  </HardwareButton>
                )}
              </div>
            </div>

            {seqProgress && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between font-mono text-[11px] text-[#E6ECF5]/75 tabular-nums">
                  <span>Encoding frame {seqProgress.current} of {seqProgress.total}…</span>
                  <span className="text-[#F1F5F9] font-semibold">{seqProgress.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#050304] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF1E42] via-[#FF2E63] to-[#F1F5F9] transition-all duration-100"
                    style={{ width: `${Math.max(3, seqProgress.percent)}%` }}
                  />
                </div>
              </div>
            )}

            {exportStatusMsg && !seqProgress && (
              <div className="font-mono text-[11px] text-[#F1F5F9] bg-[#07080C] border border-[#F1F5F9]/25 rounded-[6px] px-3 py-2">
                {exportStatusMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </PlateBezel>
  );
}
