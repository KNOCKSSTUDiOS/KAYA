import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Download, Layers, Play, Pause } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import {
  RENDER_STYLE_PRESETS,
  RenderStyleKey,
  RESOLUTION_PRESETS,
  ResolutionKey,
  exportCompositionStillFrame,
} from '../lib/studioRenderer.js';
import { createZipBlob, ZipEntryInput } from '../lib/zipBuilder.js';

interface PictureStudioPageProps {
  productUrl: string;
  transparentProductUrl?: string;
  atmosphereUrl: string;
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
}: PictureStudioPageProps) {
  const [style, setStyle] = useState<RenderStyleKey>('3d_cyberpunk');
  const [resolution, setResolution] = useState<ResolutionKey>('cinemax_4k');
  const [transparentCutout, setTransparentCutout] = useState(false);
  const [exposure, setExposure] = useState(1.0);
  const [contrast, setContrast] = useState(1.05);
  const [saturation, setSaturation] = useState(1.05);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const activeRes = RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[3];
  const activeStyleObj = RENDER_STYLE_PRESETS.find((s) => s.key === style) ?? RENDER_STYLE_PRESETS[0];

  const renderPreview = async () => {
    setRendering(true);
    try {
      const res = await exportCompositionStillFrame(
        {
          productUrl,
          transparentProductUrl,
          atmosphereUrl,
          durationSec: 10,
          resolution,
          hdrGrade: 'ultra_cinemax',
          renderStyle: style,
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
  }, [productUrl, atmosphereUrl, style, resolution, transparentCutout, exposure, contrast, saturation]);

  const handleSavePicture = async (format: 'png' | 'jpeg') => {
    setRendering(true);
    try {
      const res = await exportCompositionStillFrame(
        {
          productUrl,
          transparentProductUrl,
          atmosphereUrl,
          durationSec: 10,
          resolution,
          hdrGrade: 'ultra_cinemax',
          renderStyle: style,
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
      downloadBlob(res.blob, `kaya-picture-${style}-${res.width}x${res.height}.${ext}`);
    } finally {
      setRendering(false);
    }
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ImageIcon className="w-4 h-4 text-[#F1F5F9]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Picture Tools · 4K Multi-Style Renderer
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 rounded bg-[#050609] border border-white/10 font-mono text-[10px] text-[#E6ECF5]/80 tabular-nums">
            {activeRes.tag} · {activeRes.aspectDesc} · {transparentCutout ? 'RGBA Alpha' : '24-Bit RGB'}
          </span>
          <LedStatusIndicator label={activeStyleObj.label} tone="cyan" />
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="cnc-recess rounded-[10px] p-2">
        <div className="relative w-full aspect-video max-h-[420px] rounded-[7px] overflow-hidden border border-white/10 optical-glass flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Styled 4K Picture Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="font-mono text-xs text-[#E6ECF5]/60">Rendering preview…</span>
          )}
        </div>
      </div>

      {/* Style Matrix */}
      <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60 block">
          Picture Render Style (10 Modes)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {RENDER_STYLE_PRESETS.map((s) => (
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
          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
            <span>Exposure</span>
            <span className="text-[#F1F5F9] tabular-nums">{exposure.toFixed(2)}</span>
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
          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
            <span>Contrast</span>
            <span className="text-[#FF3B5C] tabular-nums">{contrast.toFixed(2)}</span>
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
          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
            <span>Saturation</span>
            <span className="text-[#FF2E63] tabular-nums">{saturation.toFixed(2)}</span>
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
            <Download className="w-3.5 h-3.5 text-[#F1F5F9]" />
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

type VfxLayerKey =
  | 'motion_trails'
  | 'cyber_rain'
  | 'anamorphic_flare'
  | 'glitch_slice'
  | 'scifi_hud'
  | 'animorph_wave'
  | '2d_halftone'
  | '2d_kaleidoscope';

export function VfxStudioPage({ productUrl, atmosphereUrl }: { productUrl: string; atmosphereUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [effect, setEffect] = useState<VfxLayerKey>('motion_trails');
  const [motionTrailsOn, setMotionTrailsOn] = useState<boolean>(true);
  const [intensity, setIntensity] = useState(0.75);
  const [playing, setPlaying] = useState(true);
  const [exportingSeq, setExportingSeq] = useState(false);

  useEffect(() => {
    let frameId = 0;
    let alive = true;
    const prod = new Image();
    const atmo = new Image();
    prod.crossOrigin = 'anonymous';
    atmo.crossOrigin = 'anonymous';
    prod.src = productUrl;
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

          // Motion-trail persistence buffer fade vs clean frame clear
          if (motionTrailsOn) {
            ctx.fillStyle = `rgba(4, 5, 8, ${0.32 - intensity * 0.16})`;
            ctx.fillRect(0, 0, w, h);
          } else {
            ctx.fillStyle = '#040508';
            ctx.fillRect(0, 0, w, h);
          }

          if (atmo.complete && atmo.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = motionTrailsOn ? 0.35 : 0.72;
            ctx.drawImage(atmo, 0, 0, w, h);
            ctx.restore();
          }

          // Compute subject motion path
          const orbitX = Math.sin(t * 2.1) * w * 0.14 * intensity;
          const orbitY = Math.cos(t * 1.6) * h * 0.08 * intensity;
          const curScale = 1 + Math.sin(t * 2.8) * 0.06;
          const curRot = Math.sin(t * 1.4) * 0.08 * intensity;

          if (playing) {
            trailHistory.push({ x: orbitX, y: orbitY, scale: curScale, rot: curRot });
            if (trailHistory.length > 12) trailHistory.shift();
          }

          if (prod.complete && prod.naturalWidth > 0) {
            const aspect = prod.naturalWidth / prod.naturalHeight;
            const ph = h * 0.62;
            const pw = ph * aspect;

            // Render chromatic afterimage motion trails behind main subject
            if (motionTrailsOn && trailHistory.length > 1) {
              for (let i = 0; i < trailHistory.length - 1; i++) {
                const tr = trailHistory[i];
                const ratio = (i + 1) / trailHistory.length;
                ctx.save();
                ctx.globalAlpha = ratio * 0.32 * intensity;
                ctx.translate(w / 2 + tr.x, h / 2 + tr.y);
                ctx.rotate(tr.rot);
                ctx.scale(tr.scale, tr.scale);
                ctx.drawImage(prod, -pw / 2, -ph / 2, pw, ph);
                ctx.restore();
              }
            }

            const waveX = effect === 'animorph_wave' ? Math.sin(t * 4) * 28 * intensity : 0;
            ctx.save();
            ctx.translate(w / 2 + orbitX + waveX, h / 2 + orbitY);
            ctx.rotate(curRot);
            ctx.scale(curScale, curScale);
            ctx.drawImage(prod, -pw / 2, -ph / 2, pw, ph);
            ctx.restore();
          }

          // Active 2D & 3D VFX Passes
          if (effect === 'motion_trails') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            for (let s = 0; s < 14; s++) {
              const ang = (s / 14) * Math.PI * 2 + t * 1.4;
              const r1 = 80 + ((t * 180 + s * 35) % 240);
              const r2 = r1 + 65 * intensity;
              ctx.strokeStyle = s % 2 === 0 ? 'rgba(255, 10, 60, 0.7)' : 'rgba(255, 30, 66, 0.65)';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(w / 2 + orbitX + Math.cos(ang) * r1, h / 2 + orbitY + Math.sin(ang) * r1);
              ctx.lineTo(w / 2 + orbitX + Math.cos(ang) * r2, h / 2 + orbitY + Math.sin(ang) * r2);
              ctx.stroke();
            }
            ctx.restore();
          } else if (effect === 'cyber_rain') {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 10, 60, ${0.35 + 0.45 * intensity})`;
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
            g.addColorStop(0.5, `rgba(255, 10, 60, ${0.65 * intensity})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, h * 0.43, w, h * 0.05);
            const r = ctx.createRadialGradient(fx, h * 0.45, 4, fx, h * 0.45, 220 * intensity);
            r.addColorStop(0, 'rgba(255,255,255,0.85)');
            r.addColorStop(0.4, 'rgba(255, 46, 99, 0.45)');
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
              ctx.fillStyle = s % 2 === 0 ? `rgba(255, 30, 66, ${0.3 * intensity})` : `rgba(255, 10, 60, ${0.3 * intensity})`;
              ctx.fillRect(0, sy, w, sh);
            }
            ctx.restore();
          } else if (effect === 'scifi_hud') {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 10, 60, ${0.55 * intensity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 160, t, t + Math.PI * 1.4);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255, 30, 66, ${0.55 * intensity})`;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 190, -t * 1.3, -t * 1.3 + Math.PI);
            ctx.stroke();
            ctx.restore();
          } else if (effect === '2d_halftone') {
            // 2D Optical Comic / Print Halftone Dot Grid Overlay
            ctx.save();
            ctx.fillStyle = `rgba(255, 10, 60, ${0.28 * intensity})`;
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
            // 2D Geometric Kaleidoscope Optical Overlay
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.translate(w / 2, h / 2);
            for (let k = 0; k < 8; k++) {
              ctx.save();
              ctx.rotate((k * Math.PI) / 4 + t * 0.45);
              ctx.strokeStyle = k % 2 === 0 ? `rgba(255, 46, 99, ${0.55 * intensity})` : `rgba(255, 10, 60, ${0.55 * intensity})`;
              ctx.lineWidth = 2;
              ctx.strokeRect(40, -18, 220 * intensity, 36);
              ctx.restore();
            }
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
  }, [productUrl, atmosphereUrl, effect, motionTrailsOn, intensity, playing]);

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
          name: `kaya-vfx-${effect}-${String(i + 1).padStart(3, '0')}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        await new Promise((r) => setTimeout(r, 45));
      }
      downloadBlob(createZipBlob(entries), `kaya-vfx-${effect}.zip`);
    } finally {
      setExportingSeq(false);
    }
  };

  return (
    <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#FF5C8A]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            VFX Shaders · 2D Effects &amp; Motion Trails Stage
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <LedStatusIndicator label={`Motion Trails: ${motionTrailsOn ? 'ON' : 'OFF'}`} tone={motionTrailsOn ? 'cyan' : 'neutral'} />
          <LedStatusIndicator label={effect.replace('_', ' ')} tone="magenta" />
        </div>
      </div>

      <div className="cnc-recess rounded-[10px] p-2">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full aspect-video max-h-[420px] rounded-[7px] bg-black border border-white/10"
        />
      </div>

      <div className="cnc-recess rounded-[8px] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
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
            <HardwareButton key={k} size="sm" tone="magenta" active={effect === k} onClick={() => setEffect(k)}>
              <span>{lbl}</span>
            </HardwareButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <HardwareButton
              size="sm"
              tone="cyan"
              active={motionTrailsOn}
              onClick={() => setMotionTrailsOn((m) => !m)}
            >
              <span>Trails Buffer: {motionTrailsOn ? 'ON' : 'OFF'}</span>
            </HardwareButton>
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
              <Download className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>{exportingSeq ? 'Packing…' : 'Export VFX PNGs (.zip)'}</span>
            </HardwareButton>
          </div>
        </div>
      </div>
    </PlateBezel>
  );
}
