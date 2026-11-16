import androidHoloImg from '../assets/images/hero_android_holo_1794800054600.jpg';
import mechVortexImg from '../assets/images/hero_mech_vortex_1794800053918.jpg';
import neonHypercarImg from '../assets/images/hero_neon_hypercar_1794800054933.jpg';
import orbitalDawnImg from '../assets/images/hero_orbital_dawn_1794800055374.jpg';

export type HeroMotionStyle =
  | 'holo_field'
  | 'mech_orbit'
  | 'cyber_rain'
  | 'orbital_stars'
  | 'warp_tunnel'
  | 'spectrum_stage';

export interface HeroShowcaseReel {
  id: string;
  label: string;
  imageUrl?: string;
  motionStyle: HeroMotionStyle;
}

export const HERO_SHOWCASE_REELS: HeroShowcaseReel[] = [
  {
    id: 'reel-android-holo',
    label: 'Cybernetic Field Projection',
    imageUrl: androidHoloImg,
    motionStyle: 'holo_field',
  },
  {
    id: 'reel-mech-orbit',
    label: 'Kinetic Clockwork Orbit',
    imageUrl: mechVortexImg,
    motionStyle: 'mech_orbit',
  },
  {
    id: 'reel-neon-hypercar',
    label: 'Cyber Night Tracking Shot',
    imageUrl: neonHypercarImg,
    motionStyle: 'cyber_rain',
  },
  {
    id: 'reel-orbital-dawn',
    label: 'Orbital Sunrise Horizon',
    imageUrl: orbitalDawnImg,
    motionStyle: 'orbital_stars',
  },
  {
    id: 'reel-warp-core',
    label: 'Hyperspace Grid Corridor',
    motionStyle: 'warp_tunnel',
  },
  {
    id: 'reel-sonic-stage',
    label: 'Volumetric Laser Arena',
    motionStyle: 'spectrum_stage',
  },
];

/**
 * Draw real-time 60fps procedural motion layers & camera kinematics onto a showcase canvas
 * so every reel plays like an active film/CGI shot rather than a static image.
 */
export function renderAnimatedReelFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  reel: HeroShowcaseReel,
  loadedImage?: HTMLImageElement
) {
  ctx.fillStyle = '#020203';
  ctx.fillRect(0, 0, w, h);

  // 1. Base visual layer with fluid cinema camera motion (dolly + pan + micro breathe)
  if (loadedImage && loadedImage.complete && loadedImage.naturalWidth > 0) {
    const zoom =
      reel.motionStyle === 'cyber_rain'
        ? 1.09 + Math.sin(t * 1.1) * 0.045
        : reel.motionStyle === 'orbital_stars'
        ? 1.05 + (t % 8) * 0.012
        : 1.07 + Math.sin(t * 0.72) * 0.05;
    const panX = Math.cos(t * 0.55) * w * 0.032;
    const panY = Math.sin(t * 0.42) * h * 0.022;
    const sc = Math.max(w / loadedImage.naturalWidth, h / loadedImage.naturalHeight) * zoom;
    const dw = loadedImage.naturalWidth * sc;
    const dh = loadedImage.naturalHeight * sc;
    ctx.drawImage(loadedImage, (w - dw) / 2 + panX, (h - dh) / 2 + panY, dw, dh);
  }

  // 2. Per-reel dynamic real-time CGI effects
  if (reel.motionStyle === 'holo_field') {
    // Holographic scan wave & floating optical amber particles
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sweepX = ((t * 0.35) % 1.4 - 0.2) * w;
    const beam = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
    beam.addColorStop(0, 'rgba(255, 10, 60,0)');
    beam.addColorStop(0.5, 'rgba(255, 10, 60,0.22)');
    beam.addColorStop(1, 'rgba(255, 10, 60,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, w, h);

    // Subtle floating golden dust motes
    for (let i = 0; i < 24; i++) {
      const px = ((i * 197 + t * 38) % (w + 40)) - 20;
      const py = ((i * 113 - t * 22 + h * 10) % (h + 40)) - 20;
      const r = 1.2 + (i % 3) * 0.9;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 10, 60,0.65)' : 'rgba(255,210,130,0.55)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (reel.motionStyle === 'mech_orbit') {
    // Rotating volumetric orbital energy rings + metallic sparkles
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(w / 2, h / 2);
    for (let ring = 0; ring < 2; ring++) {
      ctx.save();
      ctx.rotate(t * (ring === 0 ? 0.55 : -0.4));
      ctx.scale(1.3, 0.52);
      ctx.strokeStyle = ring === 0 ? 'rgba(255, 10, 60,0.42)' : 'rgba(255,30,66,0.38)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * (0.34 + ring * 0.08), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  } else if (reel.motionStyle === 'cyber_rain') {
    // Fast diagonal cinema rain streaks + red/cyan road flare pulse
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(180, 245, 255, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 55; i++) {
      const rx = ((i * 89 + t * 140) % (w + 100)) - 50;
      const ry = ((i * 67 + t * 620) % (h + 100)) - 50;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 26);
      ctx.stroke();
    }
    const pulse = 0.14 + Math.sin(t * 4.5) * 0.06;
    const flare = ctx.createRadialGradient(w * 0.28, h * 0.65, 8, w * 0.28, h * 0.65, w * 0.35);
    flare.addColorStop(0, `rgba(255,30,66,${pulse})`);
    flare.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (reel.motionStyle === 'orbital_stars') {
    // Subtle drifting starlight & solar corona shimmer
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 151 - t * 14 + w * 8) % w);
      const sy = ((i * 79 + Math.sin(t + i) * 6) % (h * 0.72));
      const a = 0.25 + 0.45 * Math.abs(Math.sin(t * 2 + i));
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, 1.8, 1.8);
    }
    ctx.restore();
  } else if (reel.motionStyle === 'warp_tunnel') {
    // Full-screen 3D perspective neon speed grid corridor
    const cx = w / 2;
    const cy = h / 2;
    const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.7);
    bg.addColorStop(0, '#071B24');
    bg.addColorStop(0.5, '#04060B');
    bg.addColorStop(1, '#020203');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (let r = 0; r < 14; r++) {
      const z = ((r / 14 + t * 0.48) % 1);
      const scale = Math.pow(z, 2.1);
      const rw = w * scale * 1.15;
      const rh = h * scale * 1.15;
      ctx.strokeStyle = r % 2 === 0 ? `rgba(255, 10, 60,${z * 0.75})` : `rgba(255,30,66,${z * 0.65})`;
      ctx.lineWidth = 1 + z * 2.2;
      ctx.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
    }
    // Warp light rays
    for (let k = 0; k < 18; k++) {
      const ang = (k / 18) * Math.PI * 2 + t * 0.25;
      const r1 = 35 + ((t * 240 + k * 40) % 280);
      const r2 = r1 + 90;
      ctx.strokeStyle = k % 3 === 0 ? 'rgba(255, 46, 99,0.65)' : 'rgba(255, 10, 60,0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (reel.motionStyle === 'spectrum_stage') {
    // Volumetric laser arena & obsidian mirror floor
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#030407');
    bg.addColorStop(0.65, '#090D16');
    bg.addColorStop(1, '#020203');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bars = 32;
    const bw = w / bars;
    for (let b = 0; b < bars; b++) {
      const amp =
        0.25 +
        0.55 *
          Math.abs(Math.sin(t * 3.8 + b * 0.42)) *
          Math.abs(Math.cos(t * 2.1 - b * 0.25));
      const bh = h * 0.48 * amp;
      const grad = ctx.createLinearGradient(0, h * 0.68 - bh, 0, h * 0.68);
      grad.addColorStop(0, b % 3 === 0 ? '#FF1E42' : b % 3 === 1 ? '#F1F5F9' : '#FF2E63');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(b * bw + 3, h * 0.68 - bh, bw - 6, bh);
      // Floor reflection
      ctx.globalAlpha = 0.28;
      ctx.fillRect(b * bw + 3, h * 0.68, bw - 6, bh * 0.45);
      ctx.globalAlpha = 1;
    }

    // Sweeping concert laser beams
    for (let l = 0; l < 5; l++) {
      const ox = (w * (l + 1)) / 6;
      const dx = ox + Math.sin(t * 1.9 + l * 1.4) * w * 0.35;
      ctx.strokeStyle = l % 2 === 0 ? 'rgba(255, 10, 60,0.45)' : 'rgba(255,30,66,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox, 0);
      ctx.lineTo(dx, h);
      ctx.stroke();
    }
    ctx.restore();
  }
}
