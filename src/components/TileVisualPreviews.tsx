import React, { useEffect, useRef, useState } from 'react';
import { Camera, VideoOff } from 'lucide-react';
import { BACKGROUND_CUBE_VIDEOS, STUDIO_COLLAGE_BRAND_IMG, STUDIO_IRON_GATES_IMG } from '../data.js';

export type PreviewTileId =
  | 'video'
  | 'davinci'
  | 'blender'
  | 'vfx'
  | 'sound'
  | 'audio'
  | 'picture'
  | 'editor'
  | 'cube'
  | 'storyboard'
  | 'animator'
  | 'lipsync'
  | 'infinity'
  | 'soul'
  | 'school'
  | 'merch'
  | 'airradio'
  | 'live'
  | 'bridge'
  | 'intel'
  | 'connectors';

const UNIQUE_VIDEO_MAP: Partial<Record<PreviewTileId, string>> = {
  video: BACKGROUND_CUBE_VIDEOS[0].url,
  cube: BACKGROUND_CUBE_VIDEOS[1].url,
  davinci: BACKGROUND_CUBE_VIDEOS[2].url,
  sound: BACKGROUND_CUBE_VIDEOS[3].url,
  animator: BACKGROUND_CUBE_VIDEOS[4].url,
};

function ProceduralTileCanvas({ kind }: { kind: PreviewTileId }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      // Void Black (#0A0A0A) canvas base
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, w, h);

      // Subtle Bioluminescent Magenta (#FF007F) + Quantum Teal (#00D9C0) + Fresnel Peach (#FFDAB9) gradient
      const bg = ctx.createRadialGradient(w * 0.72, h * 0.3, 10, w * 0.5, h * 0.5, w * 0.78);
      bg.addColorStop(
        0,
        kind === 'soul' || kind === 'airradio' ? 'rgba(0, 217, 192, 0.16)' : 'rgba(255, 0, 127, 0.18)'
      );
      bg.addColorStop(0.55, 'rgba(252, 142, 172, 0.08)');
      bg.addColorStop(1, 'rgba(10, 10, 10, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      if (kind === 'airradio') {
        // Live FM Radio Tuner (88 - 108 MHz) + RF carrier wave
        ctx.strokeStyle = 'rgba(224, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        const scaleY = h * 0.34;
        ctx.beginPath();
        ctx.moveTo(28, scaleY);
        ctx.lineTo(w - 28, scaleY);
        ctx.stroke();

        for (let i = 0; i <= 20; i++) {
          const x = 28 + ((w - 56) * i) / 20;
          const tall = i % 5 === 0 ? 14 : 7;
          ctx.strokeStyle = i % 5 === 0 ? 'rgba(245, 255, 250, 0.65)' : 'rgba(224, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x, scaleY - tall);
          ctx.lineTo(x, scaleY + 4);
          ctx.stroke();
        }

        const needleRatio = 0.5 + Math.sin(t * 0.55) * 0.34;
        const nx = 28 + (w - 56) * needleRatio;
        const mhz = (88 + needleRatio * 20).toFixed(1);
        ctx.strokeStyle = '#00D9C0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(nx, scaleY - 24);
        ctx.lineTo(nx, scaleY + 22);
        ctx.stroke();

        ctx.fillStyle = '#F5FFFA';
        ctx.font = '700 13px monospace';
        ctx.fillText(`FM ${mhz} MHz · 88–108 MHZ STEREO`, 28, scaleY - 32);

        ctx.strokeStyle = '#FF007F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 28; x <= w - 28; x += 4) {
          const env = Math.sin(((x - 28) / (w - 56)) * Math.PI);
          const y =
            h * 0.68 +
            Math.sin(x * 0.065 + t * 5.2) * 18 * env +
            Math.cos(x * 0.14 - t * 3.1) * 9 * env;
          if (x === 28) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        for (let b = 0; b < 24; b++) {
          const bx = 28 + b * ((w - 56) / 24);
          const bh = 8 + Math.abs(Math.sin(t * 6.4 + b * 0.55)) * 28;
          ctx.fillStyle = b % 3 === 0 ? 'rgba(0, 217, 192, 0.75)' : 'rgba(252, 142, 172, 0.65)';
          ctx.fillRect(bx, h - 22 - bh, 7, bh);
        }
      } else if (kind === 'vfx') {
        ctx.save();
        ctx.translate(w * 0.58, h * 0.48);
        for (let k = 0; k < 7; k++) {
          ctx.save();
          ctx.rotate(t * 0.35 + (k * Math.PI) / 7);
          ctx.strokeStyle =
            k % 3 === 0 ? 'rgba(0, 217, 192, 0.78)' : k % 3 === 1 ? 'rgba(252, 142, 172, 0.72)' : 'rgba(255, 0, 127, 0.8)';
          ctx.lineWidth = 2;
          const s = 54 + k * 14;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.86, s * 0.5);
          ctx.lineTo(-s * 0.86, s * 0.5);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        const beamGrad = ctx.createLinearGradient(0, h * 0.48, w, h * 0.48);
        beamGrad.addColorStop(0, 'rgba(0, 217, 192, 0)');
        beamGrad.addColorStop(0.55, 'rgba(224, 255, 255, 0.58)');
        beamGrad.addColorStop(0.75, 'rgba(255, 0, 127, 0.48)');
        beamGrad.addColorStop(1, 'rgba(255, 218, 185, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, h * 0.47, w, 4);
      } else if (kind === 'infinity') {
        const cx = w * 0.58;
        const cy = h * 0.48;
        for (let r = 1; r <= 4; r++) {
          ctx.strokeStyle = r % 2 === 0 ? 'rgba(0, 217, 192, 0.3)' : 'rgba(255, 0, 127, 0.34)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 36, r * 17, -0.25, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#FF007F';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E0FFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let g = 0; g < 10; g++) {
          const ang = t * (0.45 + (g % 3) * 0.14) + (g * Math.PI * 2) / 10;
          const rx = 54 + (g % 4) * 28;
          const ry = rx * 0.46;
          const px = cx + Math.cos(ang) * rx;
          const py = cy + Math.sin(ang) * ry;
          ctx.fillStyle = g % 3 === 0 ? '#00D9C0' : g % 3 === 1 ? '#FC8EAC' : '#FFDAB9';
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind === 'soul') {
        ctx.strokeStyle = '#00D9C0';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let x = 20; x < w - 20; x += 6) {
          const y = h * 0.46 + Math.sin(x * 0.03 + t * 3.8) * 24 + Math.cos(x * 0.014 - t * 2.1) * 12;
          if (x === 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(252, 142, 172, 0.78)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let x = 20; x < w - 20; x += 6) {
          const y = h * 0.56 + Math.cos(x * 0.025 + t * 2.9) * 18;
          if (x === 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (kind === 'audio') {
        const bars = 32;
        const bw = (w - 48) / bars;
        for (let i = 0; i < bars; i++) {
          const amp = (0.25 + 0.7 * Math.abs(Math.sin(t * 4.2 + i * 0.38))) * (h * 0.48);
          const grad = ctx.createLinearGradient(0, h - 30 - amp, 0, h - 30);
          grad.addColorStop(0, '#E0FFFF');
          grad.addColorStop(0.55, '#FC8EAC');
          grad.addColorStop(1, '#FF007F');
          ctx.fillStyle = grad;
          ctx.fillRect(24 + i * bw, h - 30 - amp, Math.max(3, bw - 4), amp);
        }
      } else if (kind === 'editor') {
        const trackLabels = ['V1', '3D', 'FX', 'A1', 'A2'];
        const colors = ['#FF007F', '#FC8EAC', '#FFDAB9', '#00D9C0', '#E0FFFF'];
        trackLabels.forEach((lbl, idx) => {
          const ty = 42 + idx * 32;
          ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
          ctx.fillRect(24, ty, w - 48, 22);
          ctx.fillStyle = colors[idx];
          ctx.globalAlpha = 0.62;
          ctx.fillRect(62 + (idx % 2) * 26, ty + 3, w - 140 - idx * 14, 16);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#F5FFFA';
          ctx.font = '600 10px monospace';
          ctx.fillText(lbl, 30, ty + 15);
        });
        const phX = 64 + ((t * 48) % (w - 110));
        ctx.strokeStyle = '#00D9C0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(phX, 34);
        ctx.lineTo(phX, 204);
        ctx.stroke();
      } else if (kind === 'school') {
        ctx.strokeStyle = 'rgba(0, 217, 192, 0.35)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 32) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(w * 0.68, h * 0.48);
        ctx.rotate(t * 0.6);
        ctx.strokeStyle = '#00D9C0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-44, -44, 88, 88);
        ctx.rotate(0.78);
        ctx.strokeStyle = '#FF007F';
        ctx.strokeRect(-44, -44, 88, 88);
        ctx.restore();
      } else if (kind === 'storyboard' || kind === 'lipsync' || kind === 'bridge' || kind === 'intel' || kind === 'connectors') {
        const nodes = 8;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < nodes; i++) {
          const ang = t * 0.4 + (i * Math.PI * 2) / nodes;
          pts.push({
            x: w * 0.56 + Math.cos(ang) * (72 + (i % 2) * 34),
            y: h * 0.46 + Math.sin(ang) * (44 + (i % 3) * 20),
          });
        }
        ctx.strokeStyle = kind === 'intel' ? 'rgba(0, 217, 192, 0.5)' : 'rgba(252, 142, 172, 0.45)';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < pts.length; i++) {
          const next = pts[(i + 1) % pts.length];
          const diag = pts[(i + 3) % pts.length];
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(next.x, next.y);
          ctx.lineTo(diag.x, diag.y);
          ctx.stroke();
        }
        pts.forEach((p, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? '#00D9C0' : '#FF007F';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [kind]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={320}
      className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
    />
  );
}

function LiveCameraTilePreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camLive, setCamLive] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Automatically mirror user camera if already permitted, fallback cleanly to standby reticle
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((s) => {
          if (!active) {
            s.getTracks().forEach((tr) => tr.stop());
            return;
          }
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setCamLive(true);
          setCamErr(null);
        })
        .catch(() => {
          // User has not granted camera permission yet — keep clean optical reticle
        });
    }
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleLiveTileCam = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (camLive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamLive(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCamLive(true);
      setCamErr(null);
    } catch {
      setCamErr('Grant camera permission for live preview');
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0A] overflow-hidden">
      <video
        ref={videoRef}
        muted
        playsInline
        className={`pointer-events-none absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          camLive ? 'opacity-90' : 'opacity-0'
        }`}
      />
      {!camLive && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-40 h-24 flex items-center justify-center">
            <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00D9C0]/80" />
            <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00D9C0]/80" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00D9C0]/80" />
            <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00D9C0]/80" />
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.22em] text-[#FF007F] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#FF007F]" />
                LIVE CAM STANDBY
              </span>
              <span className="font-mono text-[10px] text-[#E0FFFF]/65">
                {camErr || 'Optical Reticle Ready'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-3.5 right-3.5 z-20">
        <span
          role="button"
          tabIndex={0}
          onClick={toggleLiveTileCam}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleLiveTileCam(e as unknown as React.MouseEvent);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] border border-[#00D9C0]/55 font-mono text-[10px] uppercase tracking-wider text-[#F5FFFA] hover:border-[#FF007F] cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
        >
          {camLive ? <VideoOff className="w-3 h-3 text-[#FF007F]" /> : <Camera className="w-3 h-3 text-[#00D9C0]" />}
          <span>{camLive ? 'Stop Cam' : 'Live Cam'}</span>
        </span>
      </div>
    </div>
  );
}

export function TileVisualPreview({ id, title }: { id: PreviewTileId; title: string }) {
  const uniqueVideo = UNIQUE_VIDEO_MAP[id];

  if (id === 'live') {
    return <LiveCameraTilePreview />;
  }

  if (uniqueVideo) {
    return (
      <video
        src={uniqueVideo}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-82 group-hover:scale-105 transition-all duration-500"
      />
    );
  }

  if (id === 'blender' || id === 'merch') {
    return (
      <>
        <img
          src={STUDIO_COLLAGE_BRAND_IMG}
          alt={title}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-76 group-hover:scale-105 transition-all duration-500"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,0,127,0.22),transparent_55%)]"
        />
      </>
    );
  }

  if (id === 'picture') {
    return (
      <img
        src={STUDIO_IRON_GATES_IMG}
        alt={title}
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-52 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
      />
    );
  }

  return <ProceduralTileCanvas kind={id} />;
}
