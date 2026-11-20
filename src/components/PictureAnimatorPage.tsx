import React, { useState, useRef, useEffect } from 'react';
import { Swords, Upload, Play, Pause, Download, Sparkles, Video } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { createZipBlob, ZipEntryInput } from '../lib/zipBuilder.js';

interface PictureAnimatorPageProps {
  defaultHeroUrl: string;
  defaultChallengerUrl: string;
  atmosphereUrl: string;
}

type ActionChoreoKey =
  | 'action_clash'
  | 'hero_entrance'
  | 'supercharge_aura'
  | 'mesh_turntable'
  | 'cartoon_bounce'
  | 'anime_slash';

const ACTION_MODES: { key: ActionChoreoKey; label: string; desc: string }[] = [
  { key: 'action_clash', label: 'Action Fight Clash', desc: 'Two characters clash with impact shockwaves & sparks' },
  { key: 'hero_entrance', label: 'Hero Slow-Mo Entrance', desc: 'Cinematic zoom landing + rim flares & motion trails' },
  { key: 'supercharge_aura', label: 'Power Aura Surge', desc: 'Levitating charge pulse + crackling energy rings' },
  { key: 'mesh_turntable', label: 'Mesh 3D Orbit', desc: 'Polygon wireframe lattice & specular rim sweep' },
  { key: 'cartoon_bounce', label: 'Cartoon 3D Squash', desc: 'Elastic kinetic bounce + bold motion speed lines' },
  { key: 'anime_slash', label: 'Anime Impact Slash', desc: 'High-speed diagonal energy blades & burst frames' },
];

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

export function PictureAnimatorPage({
  defaultHeroUrl,
  defaultChallengerUrl,
  atmosphereUrl,
}: PictureAnimatorPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [heroUrl, setHeroUrl] = useState(defaultHeroUrl);
  const [challengerUrl, setChallengerUrl] = useState(defaultChallengerUrl);
  const [mode, setMode] = useState<ActionChoreoKey>('action_clash');
  const [speed, setSpeed] = useState(1.2);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [packingZip, setPackingZip] = useState(false);

  useEffect(() => {
    setHeroUrl(defaultHeroUrl);
  }, [defaultHeroUrl]);

  useEffect(() => {
    let frameId = 0;
    let alive = true;
    const heroImg = new Image();
    const oppImg = new Image();
    const bgImg = new Image();
    heroImg.crossOrigin = 'anonymous';
    oppImg.crossOrigin = 'anonymous';
    bgImg.crossOrigin = 'anonymous';
    heroImg.src = heroUrl;
    oppImg.src = challengerUrl;
    bgImg.src = atmosphereUrl;

    const start = performance.now();

    const draw = (now: number) => {
      if (!alive) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const t = ((now - start) / 1000) * speed;

          // Motion trail fade wash
          ctx.fillStyle = 'rgba(3, 4, 7, 0.34)';
          ctx.fillRect(0, 0, w, h);

          if (bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.save();
            ctx.globalAlpha = 0.42;
            ctx.drawImage(bgImg, 0, 0, w, h);
            ctx.restore();
          }

          const drawFighter = (
            img: HTMLImageElement,
            cx: number,
            cy: number,
            sizeH: number,
            tilt: number,
            sx: number,
            sy: number,
            glowColor: string
          ) => {
            if (!img.complete || img.naturalWidth === 0) return;
            const aspect = img.naturalWidth / img.naturalHeight;
            const dw = sizeH * aspect;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(tilt);
            ctx.scale(sx, sy);
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 24;
            ctx.drawImage(img, -dw / 2, -sizeH / 2, dw, sizeH);
            ctx.restore();
          };

          if (mode === 'action_clash') {
            // Dynamic rhythmic martial clash cadence
            const cycle = (t * 0.9) % 2;
            const strike = cycle < 1 ? Math.pow(Math.sin(cycle * Math.PI), 3) : 0;
            const heroX = w * (0.28 + strike * 0.16);
            const oppX = w * (0.72 - strike * 0.16);
            const bounceY = Math.sin(t * 7) * 10;

            drawFighter(heroImg, heroX, h * 0.54 + bounceY, h * 0.58, strike * 0.14, 1, 1, '#F1F5F9');
            drawFighter(oppImg, oppX, h * 0.54 - bounceY, h * 0.58, -strike * 0.14, -1, 1, '#FF1E42');

            // Shockwave ring + sparks at center impact
            if (strike > 0.45) {
              ctx.save();
              ctx.globalCompositeOperation = 'screen';
              const radius = (strike - 0.45) * 320;
              ctx.strokeStyle = 'rgba(255, 10, 60, 0.85)';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(w / 2, h * 0.5, radius, 0, Math.PI * 2);
              ctx.stroke();

              for (let k = 0; k < 14; k++) {
                const ang = (k / 14) * Math.PI * 2 + t * 5;
                ctx.strokeStyle = k % 2 === 0 ? '#FF1E42' : '#F1F5F9';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(w / 2 + Math.cos(ang) * 20, h * 0.5 + Math.sin(ang) * 20);
                ctx.lineTo(
                  w / 2 + Math.cos(ang) * (40 + strike * 160),
                  h * 0.5 + Math.sin(ang) * (40 + strike * 160)
                );
                ctx.stroke();
              }
              ctx.restore();
            }
          } else if (mode === 'hero_entrance') {
            const zoomH = h * (0.52 + Math.sin(t * 1.4) * 0.1);
            drawFighter(heroImg, w / 2, h * 0.54 + Math.sin(t * 2.5) * 12, zoomH, Math.sin(t * 1.2) * 0.05, 1, 1, '#F1F5F9');
          } else if (mode === 'supercharge_aura') {
            const hoverY = Math.sin(t * 4.5) * 18;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            for (let r = 0; r < 3; r++) {
              const rad = 85 + ((t * 160 + r * 60) % 210);
              ctx.strokeStyle = r % 2 === 0 ? 'rgba(255, 10, 60,0.65)' : 'rgba(255, 46, 99,0.65)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.ellipse(w / 2, h * 0.78, rad * 1.4, rad * 0.38, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
            drawFighter(heroImg, w / 2, h * 0.5 + hoverY, h * 0.62, 0, 1 + Math.sin(t * 12) * 0.02, 1, '#FF2E63');
          } else if (mode === 'mesh_turntable') {
            const turnCos = Math.cos(t * 1.8);
            const sx = Math.abs(turnCos) < 0.14 ? 0.14 : Math.abs(turnCos);
            drawFighter(heroImg, w / 2, h * 0.52, h * 0.62, Math.sin(t * 1.8) * 0.06, sx, 1, '#F1F5F9');
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 10, 60, 0.25)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 16; i++) {
              ctx.beginPath();
              ctx.moveTo((w / 16) * i, 0);
              ctx.lineTo((w / 16) * (16 - i), h);
              ctx.stroke();
            }
            ctx.restore();
          } else if (mode === 'cartoon_bounce') {
            const bounce = Math.abs(Math.sin(t * 4.2));
            const squashX = 1.15 - bounce * 0.22;
            const stretchY = 0.85 + bounce * 0.26;
            const cy = h * 0.68 - bounce * h * 0.22;
            drawFighter(heroImg, w / 2, cy, h * 0.54, Math.sin(t * 4.2) * 0.08, squashX, stretchY, '#FF5C8A');
          } else if (mode === 'anime_slash') {
            drawFighter(heroImg, w * 0.45, h * 0.54, h * 0.6, -0.08, 1, 1, '#F1F5F9');
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const slashProgress = (t * 1.8) % 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.shadowColor = '#FF1E42';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 6 * (1 - slashProgress);
            ctx.beginPath();
            ctx.moveTo(w * 0.15, h * 0.85);
            ctx.lineTo(w * (0.15 + slashProgress * 0.72), h * (0.85 - slashProgress * 0.7));
            ctx.stroke();
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
  }, [heroUrl, challengerUrl, atmosphereUrl, mode, speed, playing]);

  const handleRecordClip = () => {
    const canvas = canvasRef.current;
    if (!canvas || recording) return;
    setRecording(true);
    setPlaying(true);

    const stream = canvas.captureStream(60);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((tr) => tr.stop());
      downloadBlob(new Blob(chunks, { type: mime }), `kaya-animated-${mode}.webm`);
      setRecording(false);
    };
    rec.start(100);
    setTimeout(() => {
      if (rec.state === 'recording') rec.stop();
    }, 4000);
  };

  const handleExportFramesZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPackingZip(true);
    try {
      const entries: ZipEntryInput[] = [];
      for (let i = 0; i < 12; i++) {
        const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
        entries.push({
          name: `kaya-anim-${mode}-${String(i + 1).padStart(3, '0')}.png`,
          data: new Uint8Array(await blob.arrayBuffer()),
        });
        await new Promise((r) => setTimeout(r, 45));
      }
      downloadBlob(createZipBlob(entries), `kaya-anim-frames-${mode}.zip`);
    } finally {
      setPackingZip(false);
    }
  };

  return (
    <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Swords className="w-4 h-4 text-[#FF3B5C]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Picture &amp; Character Action Animator (60 fps)
          </h2>
        </div>
        <LedStatusIndicator label={recording ? 'Recording 4s Clip…' : ACTION_MODES.find((m) => m.key === mode)?.label || 'Ready'} tone={recording ? 'red' : 'cyan'} pulse={recording} />
      </div>

      {/* Live 60fps Animator Viewport */}
      <div className="candy-surface rounded-xl p-2">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full aspect-video max-h-[420px] rounded-lg bg-[#050304]"
        />
      </div>

      {/* Upload Custom Hero / Opponent Pictures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="candy-trace-tile rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <img src={heroUrl} alt="Lead Subject" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <span className="font-mono text-xs font-bold text-[#F1F5F9] block">Lead Picture / Character</span>
              <span className="font-mono text-[11px] text-[#E6ECF5]/60 truncate block">Upload any photo or artwork…</span>
            </div>
          </div>
          <Upload className="w-4 h-4 text-[#F1F5F9] shrink-0" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setHeroUrl(URL.createObjectURL(f));
            }}
          />
        </label>

        <label className="candy-trace-tile rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <img src={challengerUrl} alt="Opponent Character" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <span className="font-mono text-xs font-bold text-[#FF3B5C] block">Challenger / Co-Star Photo</span>
              <span className="font-mono text-[11px] text-[#E6ECF5]/60 truncate block">Upload 2nd fighter or buddy…</span>
            </div>
          </div>
          <Upload className="w-4 h-4 text-[#FF3B5C] shrink-0" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setChallengerUrl(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>

      {/* Action Choreography Matrix */}
      <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ACTION_MODES.map((m) => (
            <HardwareButton
              key={m.key}
              size="sm"
              fullWidth
              tone={m.key === 'action_clash' || m.key === 'anime_slash' ? 'red' : 'cyan'}
              active={mode === m.key}
              onClick={() => setMode(m.key)}
            >
              <span className="truncate">{m.label}</span>
            </HardwareButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#E6ECF5]/75">Speed ({speed.toFixed(1)}x)</span>
            <input
              type="range"
              min={0.5}
              max={2.4}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="hw-capsule-slider w-28"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HardwareButton size="sm" tone="cyan" active={playing} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{playing ? 'Pause' : 'Play'}</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="red" active disabled={recording} onClick={handleRecordClip}>
              <Video className="w-3.5 h-3.5 text-[#FF3B5C]" />
              <span>{recording ? 'Capturing 4s…' : 'Record 4s Video'}</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="magenta" active disabled={packingZip} onClick={handleExportFramesZip}>
              <Download className="w-3.5 h-3.5 text-[#FF5C8A]" />
              <span>{packingZip ? 'Packing…' : 'PNG Sequence (.ZIP)'}</span>
            </HardwareButton>
          </div>
        </div>
      </div>
    </PlateBezel>
  );
}
