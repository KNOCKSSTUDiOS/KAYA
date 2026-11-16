// Local Ultra Cinema & Cinemax 4K HDR 60fps Renderer
// Renders high-dynamic-range, multi-style showcase reels, full-resolution stills,
// and true-RGBA transparent PNG sequences directly in the browser via HTML5 Canvas.
// 100% self-contained, offline-capable, zero external APIs or third-party servers.

import { createZipBlob, ZipEntryInput } from './zipBuilder.js';

export type ResolutionKey = '720p' | '1080p' | '4k_uhd' | 'cinemax_4k';
export type HDRGradeKey = 'standard' | 'hdr_cinema' | 'ultra_cinemax';
export type FPSKey = 24 | 30 | 60 | 90 | 120 | 144;
export type RenderStyleKey =
  | 'hdr_ultra'
  | 'real_cinema'
  | 'real_hd'
  | 'regular_3d'
  | 'real_3d'
  | 'mesh_3d'
  | 'raytrace_pbr'
  | 'rust_3d'
  | 'telemetry_hud'
  | 'cartoon_3d'
  | '2d_vector'
  | 'realism'
  | '3d_scifi'
  | '3d_cyberpunk'
  | 'anime'
  | 'cartoon'
  | 'bw_noir'
  | 'fiction'
  | 'animorph';

export type CameraMotionKey = 'orbit' | 'dolly' | 'crane' | 'handheld';

export const CAMERA_MOTION_PRESETS: { key: CameraMotionKey; label: string; desc: string }[] = [
  { key: 'orbit', label: '360 Orbit', desc: 'Smooth Parallax' },
  { key: 'dolly', label: 'Dolly Zoom', desc: 'Cinema Push' },
  { key: 'crane', label: 'Crane Sweep', desc: 'Aerial Rise' },
  { key: 'handheld', label: 'Action Rig', desc: 'Dynamic Motion' },
];

export interface ResolutionSpec {
  key: ResolutionKey;
  label: string;
  tag: string;
  width: number;
  height: number;
  aspectDesc: string;
  bitrate: number;
  fps: number;
}

export const RESOLUTION_PRESETS: ResolutionSpec[] = [
  {
    key: '720p',
    label: '720p HD',
    tag: '1280×720',
    width: 1280,
    height: 720,
    aspectDesc: '16:9 HD',
    bitrate: 8_000_000,
    fps: 30,
  },
  {
    key: '1080p',
    label: '1080p Cinema',
    tag: '1920×1080',
    width: 1920,
    height: 1080,
    aspectDesc: '16:9 FHD',
    bitrate: 16_000_000,
    fps: 60,
  },
  {
    key: '4k_uhd',
    label: '4K UHD HDR',
    tag: '3840×2160',
    width: 3840,
    height: 2160,
    aspectDesc: '16:9 4K',
    bitrate: 32_000_000,
    fps: 60,
  },
  {
    key: 'cinemax_4k',
    label: 'Cinemax 4K',
    tag: '4096×1716',
    width: 4096,
    height: 1716,
    aspectDesc: '2.39:1 Scope',
    bitrate: 36_000_000,
    fps: 60,
  },
];

export const FPS_PRESETS: { key: FPSKey; label: string; desc: string }[] = [
  { key: 24, label: '24 fps', desc: 'Cinema Film' },
  { key: 30, label: '30 fps', desc: 'Broadcast' },
  { key: 60, label: '60 fps', desc: 'Ultra Smooth' },
  { key: 90, label: '90 fps', desc: 'High Fluid' },
  { key: 120, label: '120 fps', desc: 'Pro Motion' },
  { key: 144, label: '144 fps', desc: 'Max GPU' },
];

export const HDR_GRADE_PRESETS: { key: HDRGradeKey; label: string; desc: string }[] = [
  { key: 'standard', label: 'Rec.709 Std', desc: 'Balanced' },
  { key: 'hdr_cinema', label: 'High HDR', desc: '10-bit Tone' },
  { key: 'ultra_cinemax', label: 'Ultra Cinema', desc: 'Anamorphic Bloom' },
];

export const RENDER_STYLE_PRESETS: {
  key: RenderStyleKey;
  label: string;
  desc: string;
  filterCss: string;
}[] = [
  {
    key: 'hdr_ultra',
    label: '4K HDR Ultra',
    desc: 'Deep dynamic contrast & specular bloom',
    filterCss: 'contrast(1.14) saturate(1.18) brightness(1.03)',
  },
  {
    key: 'real_cinema',
    label: 'Real Cinema',
    desc: 'Anamorphic lens curve & studio film tonal rolloff',
    filterCss: 'contrast(1.12) saturate(1.10) brightness(1.02)',
  },
  {
    key: 'real_hd',
    label: 'Real HD Master',
    desc: 'Razor-sharp broadcast edge clarity & neutral whites',
    filterCss: 'contrast(1.08) saturate(1.04) brightness(1.03)',
  },
  {
    key: 'regular_3d',
    label: 'Regular 3D',
    desc: 'Standard depth-shaded 3D geometry & soft ambient fill',
    filterCss: 'contrast(1.09) saturate(1.12)',
  },
  {
    key: 'real_3d',
    label: 'Real 3D Volumetric',
    desc: 'Raytraced specular rims & multi-plane depth lighting',
    filterCss: 'contrast(1.16) saturate(1.20) brightness(1.03)',
  },
  {
    key: 'mesh_3d',
    label: 'Mesh 3D Wireframe',
    desc: 'Live polygon wireframe lattice & sculpted PBR core',
    filterCss: 'contrast(1.22) saturate(1.14) hue-rotate(-6deg)',
  },
  {
    key: 'raytrace_pbr',
    label: 'Raytrace 3D PBR',
    desc: 'Mirror specular reflections & path-traced caustics',
    filterCss: 'contrast(1.20) saturate(1.12) brightness(1.04)',
  },
  {
    key: 'rust_3d',
    label: 'Rust Oxidation 3D',
    desc: 'Weathered oxidized alloy patina & forged ember glow',
    filterCss: 'contrast(1.24) saturate(1.18) sepia(0.28)',
  },
  {
    key: 'telemetry_hud',
    label: 'Telemetry HUD 3D',
    desc: 'Optical rangefinder crosshairs, horizon brackets & grid lock',
    filterCss: 'contrast(1.16) saturate(1.14) brightness(1.02)',
  },
  {
    key: 'cartoon_3d',
    label: 'Real Cartoon 3D',
    desc: 'Sculpted 3D volumes with bold studio cel highlights',
    filterCss: 'contrast(1.28) saturate(1.48) brightness(1.06)',
  },
  {
    key: '2d_vector',
    label: '2D Flat Vector',
    desc: 'Clean graphic silhouettes & crisp posterized layers',
    filterCss: 'contrast(1.30) saturate(1.36) brightness(1.05)',
  },
  {
    key: 'realism',
    label: 'Realism / PBR',
    desc: 'True-to-life optical lighting & natural grain',
    filterCss: 'contrast(1.06) saturate(1.05) brightness(1.01)',
  },
  {
    key: '3d_scifi',
    label: '3D Sci-Fi',
    desc: 'Holographic cyan rim light & orbital scanlines',
    filterCss: 'contrast(1.16) saturate(1.15) hue-rotate(-8deg)',
  },
  {
    key: '3d_cyberpunk',
    label: '3D Cyberpunk',
    desc: 'Electric magenta-cyan neon split & chromatic fringe',
    filterCss: 'contrast(1.24) saturate(1.42) brightness(1.04)',
  },
  {
    key: 'anime',
    label: 'Anime 60fps',
    desc: 'Crisp cel-shaded luminance & vibrant highlight flare',
    filterCss: 'contrast(1.22) saturate(1.45) brightness(1.06)',
  },
  {
    key: 'cartoon',
    label: 'Cartoon Bold',
    desc: 'Punchy stepped contrast & graphic contour framing',
    filterCss: 'contrast(1.32) saturate(1.55) brightness(1.05)',
  },
  {
    key: 'bw_noir',
    label: 'B&W Monochrome',
    desc: 'Silver halide monochrome noir & crisp edge grain',
    filterCss: 'grayscale(1) contrast(1.36) brightness(1.02)',
  },
  {
    key: 'fiction',
    label: 'Fiction Fantasy',
    desc: 'Ethereal warm-violet atmospheric haze & soft bloom',
    filterCss: 'contrast(1.08) saturate(1.26) sepia(0.14)',
  },
  {
    key: 'animorph',
    label: 'Animorph Warp',
    desc: 'Kinetic harmonic morph waves & prismatic phase shift',
    filterCss: 'contrast(1.18) saturate(1.35)',
  },
];

export interface CompositionConfig {
  productUrl: string;
  transparentProductUrl?: string;
  atmosphereUrl: string;
  durationSec: number;
  resolution: ResolutionKey;
  hdrGrade: HDRGradeKey;
  fps?: FPSKey;
  renderStyle?: RenderStyleKey;
  cameraMotion?: CameraMotionKey;
  exposure?: number;
  contrast?: number;
  saturation?: number;
  instructions?: string;
}

interface RenderOptions {
  productUrl: string;
  atmosphereUrl: string;
  durationSec: number;
  resolution?: ResolutionKey;
  hdrGrade?: HDRGradeKey;
  fps?: FPSKey;
  renderStyle?: RenderStyleKey;
  cameraMotion?: CameraMotionKey;
  instructions?: string;
  onProgress?: (progress: number, logMessage: string) => void;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image asset for rendering'));
    img.src = src;
  });
}

function createSoftShadowSprite(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(2, w);
  c.height = Math.max(2, h);
  const gctx = c.getContext('2d')!;
  const grad = gctx.createRadialGradient(
    c.width / 2,
    c.height / 2,
    c.width * 0.08,
    c.width / 2,
    c.height / 2,
    c.width * 0.48
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  gctx.save();
  gctx.translate(c.width / 2, c.height / 2);
  gctx.scale(1, c.height / c.width);
  gctx.translate(-c.width / 2, -c.height / 2);
  gctx.fillStyle = grad;
  gctx.beginPath();
  gctx.arc(c.width / 2, c.height / 2, c.width * 0.48, 0, Math.PI * 2);
  gctx.fill();
  gctx.restore();
  return c;
}

function createAnamorphicFlareSprite(
  w: number,
  h: number,
  primary: string,
  secondary: string
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(2, w);
  c.height = Math.max(2, h);
  const fctx = c.getContext('2d')!;
  const streak = fctx.createLinearGradient(0, c.height / 2, c.width, c.height / 2);
  streak.addColorStop(0, 'rgba(0,0,0,0)');
  streak.addColorStop(0.35, secondary);
  streak.addColorStop(0.5, primary);
  streak.addColorStop(0.65, secondary);
  streak.addColorStop(1, 'rgba(0,0,0,0)');
  fctx.fillStyle = streak;
  fctx.fillRect(0, c.height * 0.46, c.width, c.height * 0.08);

  const core = fctx.createRadialGradient(c.width / 2, c.height / 2, 2, c.width / 2, c.height / 2, c.height * 0.48);
  core.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
  core.addColorStop(0.35, primary);
  core.addColorStop(1, 'rgba(0,0,0,0)');
  fctx.fillStyle = core;
  fctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function prepareTransparentProductSource(img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  const natW = img.naturalWidth || 800;
  const natH = img.naturalHeight || 600;
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(natW, natH));
  const w = Math.max(2, Math.round(natW * scale));
  const h = Math.max(2, Math.round(natH * scale));

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const wctx = work.getContext('2d', { willReadFrequently: true })!;
  wctx.drawImage(img, 0, 0, w, h);

  const imageData = wctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const corners = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
  ];
  const hasExistingAlpha = corners.some((idx) => data[idx + 3] < 240);
  if (hasExistingAlpha) {
    return img;
  }

  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const idx of corners) {
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= corners.length;
  bgG /= corners.length;
  bgB /= corners.length;

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  const enqueue = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    const i = pos * 4;
    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= 52) {
      visited[pos] = 1;
      queue[qTail++] = pos;
    }
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (qHead < qTail) {
    const pos = queue[qHead++];
    const x = pos % w;
    const y = (pos / w) | 0;
    const i = pos * 4;
    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= 28) {
      data[i + 3] = 0;
    } else {
      const feather = Math.min(1, Math.max(0, (dist - 28) / 24));
      data[i + 3] = Math.round(data[i + 3] * feather);
    }

    if (x > 0) enqueue(x - 1, y);
    if (x < w - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < h - 1) enqueue(x, y + 1);
  }

  wctx.putImageData(imageData, 0, 0);
  return work;
}

function getStyleFilter(style: RenderStyleKey, hdrGrade: HDRGradeKey, t: number): string {
  const basePreset = RENDER_STYLE_PRESETS.find((s) => s.key === style);
  let filter = basePreset ? basePreset.filterCss : '';
  if (style === 'animorph') {
    const hueShift = Math.round(Math.sin(t * Math.PI * 2) * 38);
    filter = `contrast(1.18) saturate(1.38) hue-rotate(${hueShift}deg)`;
  } else if (hdrGrade === 'ultra_cinemax' && style === 'hdr_ultra') {
    filter = 'contrast(1.16) saturate(1.22) brightness(1.04)';
  } else if (hdrGrade === 'standard' && style === 'realism') {
    filter = 'contrast(1.02) saturate(1.0)';
  }
  return filter;
}

function applyPostStylePass(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  style: RenderStyleKey
) {
  if (style === '3d_cyberpunk') {
    // Neon magenta/cyan atmospheric split + subtle perspective laser grid floor
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const split = ctx.createLinearGradient(0, 0, width, height);
    split.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    split.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    split.addColorStop(1, 'rgba(230, 57, 155, 0.22)');
    ctx.fillStyle = split;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
    ctx.lineWidth = Math.max(1, Math.round(height / 720));
    const horizonY = height * 0.68;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + i * (width * 0.03), horizonY);
      ctx.lineTo(width / 2 + i * (width * 0.18), height);
      ctx.stroke();
    }
    ctx.restore();
  } else if (style === '3d_scifi') {
    // Holographic scanlines & orbital targeting reticle ticks
    ctx.save();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.045)';
    const step = Math.max(4, Math.round(height / 140));
    for (let y = 0; y < height; y += step * 2) {
      ctx.fillRect(0, y, width, 1);
    }
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.lineWidth = Math.max(1, Math.round(width / 1280));
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.42, t * Math.PI * 2, t * Math.PI * 2 + Math.PI * 0.65);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'mesh_3d') {
    // Sculpted 3D triangular wireframe mesh overlay + vertex markers
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.24)';
    ctx.lineWidth = Math.max(1, Math.round(height / 720));
    const cols = 12;
    const rows = 7;
    const cw = width / cols;
    const ch = height / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = c * cw;
        const y0 = r * ch;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + cw, y0);
        ctx.lineTo(x0 + cw, y0 + ch);
        ctx.lineTo(x0, y0);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (style === 'real_3d' || style === 'regular_3d' || style === 'real_cinema') {
    // Volumetric 3D studio rim vignette & subtle depth light arc
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const arc = ctx.createRadialGradient(width * 0.5, height * 0.25, 10, width * 0.5, height * 0.5, width * 0.65);
    arc.addColorStop(0, style === 'real_3d' ? 'rgba(0, 229, 255, 0.14)' : 'rgba(255, 220, 180, 0.10)');
    arc.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = arc;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'anime' || style === 'cartoon' || style === 'cartoon_3d' || style === '2d_vector') {
    // Bold cel-ink inner frame border & crisp diagonal speed sheen
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sheenX = ((t * 1.4) % 1.4 - 0.2) * width;
    const sheen = ctx.createLinearGradient(sheenX - width * 0.15, 0, sheenX + width * 0.15, height);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, style === 'anime' || style === 'cartoon_3d' ? 'rgba(255,235,190,0.16)' : 'rgba(255,255,255,0.12)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'fiction') {
    // Warm violet-gold storybook glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const dream = ctx.createRadialGradient(width * 0.35, height * 0.28, 10, width * 0.5, height * 0.5, width * 0.72);
    dream.addColorStop(0, 'rgba(255, 195, 130, 0.18)');
    dream.addColorStop(0.6, 'rgba(180, 95, 255, 0.10)');
    dream.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dream;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'animorph') {
    // Prismatic horizontal wave band refraction across canvas
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bandY = ((Math.sin(t * Math.PI * 2) + 1) * 0.5) * height;
    const prism = ctx.createLinearGradient(0, bandY - height * 0.18, 0, bandY + height * 0.18);
    prism.addColorStop(0, 'rgba(0,0,0,0)');
    prism.addColorStop(0.35, 'rgba(0, 229, 255, 0.18)');
    prism.addColorStop(0.5, 'rgba(230, 57, 155, 0.22)');
    prism.addColorStop(0.65, 'rgba(255, 210, 90, 0.14)');
    prism.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = prism;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'telemetry_hud') {
    // Optical rangefinder horizon reticle, grid locks & bracket frame
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.34)';
    ctx.lineWidth = Math.max(1, Math.round(height / 720));
    const pad = Math.round(Math.min(width, height) * 0.06);
    const arm = Math.round(Math.min(width, height) * 0.05);
    // Corner optical brackets
    [
      [pad, pad, 1, 1],
      [width - pad, pad, -1, 1],
      [pad, height - pad, 1, -1],
      [width - pad, height - pad, -1, -1],
    ].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * arm);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * arm, cy);
      ctx.stroke();
    });
    // Center reticle circle + animated tick sweep
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.16, t * Math.PI * 2, t * Math.PI * 2 + Math.PI * 1.35);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'rust_3d') {
    // Oxidized weathered bronze/iron patina + warm forged ember glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const ember = ctx.createRadialGradient(width * 0.5, height * 0.72, 10, width * 0.5, height * 0.5, width * 0.72);
    ember.addColorStop(0, 'rgba(255, 118, 42, 0.24)');
    ember.addColorStop(0.6, 'rgba(168, 64, 24, 0.14)');
    ember.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ember;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'raytrace_pbr') {
    // Crisp mirror caustic sweep
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const caustic = ctx.createLinearGradient(0, 0, width, height);
    caustic.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    caustic.addColorStop(0.45, 'rgba(0, 229, 255, 0.08)');
    caustic.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    ctx.fillStyle = caustic;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (style === 'bw_noir') {
    // Subtle monochrome enforcement overlay
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

interface FrameDrawParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  t: number;
  frameIndex: number;
  productSource: HTMLImageElement | HTMLCanvasElement;
  atmoImg: HTMLImageElement | null;
  shadowSprite: HTMLCanvasElement;
  flareSprite: HTMLCanvasElement;
  hdrGrade: HDRGradeKey;
  renderStyle: RenderStyleKey;
  cameraMotion?: CameraMotionKey;
  exposure?: number;
  contrast?: number;
  saturation?: number;
  transparentBackground: boolean;
  includeShadow: boolean;
  instructions?: string;
}

function drawCompositionFrame(params: FrameDrawParams) {
  const {
    ctx,
    width,
    height,
    t,
    frameIndex,
    productSource,
    atmoImg,
    shadowSprite,
    flareSprite,
    hdrGrade,
    renderStyle,
    cameraMotion = 'orbit',
    exposure = 1,
    contrast = 1,
    saturation = 1,
    transparentBackground,
    includeShadow,
    instructions = '',
  } = params;

  const lowerInstructions = instructions.toLowerCase();
  const isWarmer = lowerInstructions.includes('warm') || lowerInstructions.includes('golden') || lowerInstructions.includes('sun');
  const isCooler = lowerInstructions.includes('cool') || lowerInstructions.includes('blue') || lowerInstructions.includes('silver');
  const isDramatic = lowerInstructions.includes('dramatic') || lowerInstructions.includes('contrast') || lowerInstructions.includes('dark');
  const isFast = lowerInstructions.includes('fast') || lowerInstructions.includes('rapid') || lowerInstructions.includes('quick');

  const isHDR = hdrGrade !== 'standard';
  const isUltra = hdrGrade === 'ultra_cinemax';
  const baseStyleFilter = getStyleFilter(renderStyle, hdrGrade, t);
  const customTune =
    exposure !== 1 || contrast !== 1 || saturation !== 1
      ? ` brightness(${exposure.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(${saturation.toFixed(2)})`
      : '';
  const styleFilter = `${baseStyleFilter}${customTune}`.trim();

  let camScale = 1.0;
  let camOffsetX = 0;
  let camOffsetY = 0;
  const lightAngle = t * Math.PI * 2 * (isFast ? 2 : 1);

  if (cameraMotion === 'dolly') {
    camScale = 1.02 + 0.24 * Math.sin(t * Math.PI);
    camOffsetX = 0;
    camOffsetY = -height * 0.012 * t;
  } else if (cameraMotion === 'crane') {
    camScale = 1.15 - 0.1 * Math.cos(t * Math.PI);
    camOffsetX = Math.sin(t * Math.PI) * (width * 0.024);
    camOffsetY = (0.5 - t) * (height * 0.045);
  } else if (cameraMotion === 'handheld') {
    camScale = 1.1 + Math.sin(t * Math.PI * 6) * 0.025;
    camOffsetX = Math.sin(t * Math.PI * 10) * (width * 0.015);
    camOffsetY = Math.cos(t * Math.PI * 8) * (height * 0.015);
  } else if (t < 0.4) {
    const p1 = t / 0.4;
    const ease = 1 - Math.pow(1 - p1, 3);
    camScale = 1.04 + 0.13 * ease;
    camOffsetX = Math.sin(p1 * Math.PI) * (width * 0.018);
    camOffsetY = Math.cos(p1 * Math.PI * 0.5) * (height * 0.014);
  } else if (t < 0.72) {
    const p2 = (t - 0.4) / 0.32;
    camScale = 1.17 + 0.07 * Math.sin(p2 * Math.PI);
    camOffsetX = (p2 - 0.5) * (width * 0.032);
    camOffsetY = -(height * 0.018) + Math.sin(p2 * Math.PI) * (height * 0.018);
  } else {
    const p3 = (t - 0.72) / 0.28;
    camScale = 1.17 - 0.07 * p3;
    camOffsetX = Math.sin(p3 * Math.PI * 2) * (width * 0.006);
    camOffsetY = 0;
  }

  // Animorph dynamic kinetic stretch
  const morphScaleX = renderStyle === 'animorph' ? 1 + Math.sin(t * Math.PI * 6) * 0.045 : 1;
  const morphScaleY = renderStyle === 'animorph' ? 1 + Math.cos(t * Math.PI * 6) * 0.045 : 1;

  ctx.save();

  if (transparentBackground) {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#050609';
    ctx.fillRect(0, 0, width, height);

    if (atmoImg) {
      ctx.save();
      if (styleFilter) ctx.filter = styleFilter;
      ctx.translate(width / 2, height / 2);
      ctx.scale(camScale * 1.05, camScale * 1.05);
      ctx.translate(-width / 2 + camOffsetX * 0.28, -height / 2 + camOffsetY * 0.28);

      const atmoAspect = atmoImg.naturalWidth / atmoImg.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (atmoAspect > canvasAspect) {
        drawW = height * atmoAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawH = width / atmoAspect;
        drawY = (height - drawH) / 2;
      }
      ctx.drawImage(atmoImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    if (isHDR && renderStyle !== 'bw_noir') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const haloX = width / 2 + camOffsetX * 0.5;
      const haloY = height * 0.48 + camOffsetY * 0.5;
      const halo = ctx.createRadialGradient(haloX, haloY, width * 0.03, haloX, haloY, width * 0.42);
      halo.addColorStop(
        0,
        renderStyle === '3d_cyberpunk'
          ? 'rgba(230, 57, 155, 0.32)'
          : isWarmer
          ? 'rgba(255, 195, 130, 0.26)'
          : 'rgba(0, 229, 255, 0.24)'
      );
      halo.addColorStop(0.55, isUltra ? 'rgba(230, 57, 155, 0.14)' : 'rgba(255, 255, 255, 0.06)');
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  // Contact shadow
  if (!transparentBackground || includeShadow) {
    ctx.save();
    const shadowOsc = 1 + 0.04 * Math.sin(t * Math.PI * 4);
    const sw = shadowSprite.width * shadowOsc;
    const sh = shadowSprite.height * shadowOsc;
    const sx = width / 2 + camOffsetX * 0.85 - sw / 2;
    const sy = height * 0.80 + camOffsetY * 0.85 - sh / 2;
    if (transparentBackground) ctx.globalAlpha = 0.55;
    ctx.drawImage(shadowSprite, sx, sy, sw, sh);
    ctx.restore();
  }

  // Hero Subject Foreground
  ctx.save();
  if (styleFilter) ctx.filter = styleFilter;
  ctx.translate(width / 2, height / 2);
  ctx.scale(camScale * morphScaleX, camScale * morphScaleY);
  ctx.translate(-width / 2 + camOffsetX, -height / 2 + camOffsetY);

  const srcW = productSource instanceof HTMLImageElement ? productSource.naturalWidth : productSource.width;
  const srcH = productSource instanceof HTMLImageElement ? productSource.naturalHeight : productSource.height;
  const prodAspect = Math.max(0.1, srcW / Math.max(1, srcH));
  const maxProdH = height * 0.70;
  const maxProdW = width * 0.52;
  let pW = maxProdW;
  let pH = maxProdW / prodAspect;
  if (pH > maxProdH) {
    pH = maxProdH;
    pW = maxProdH * prodAspect;
  }
  const pX = (width - pW) / 2;
  const pY = (height - pH) / 2 + height * 0.015 + Math.sin(t * Math.PI * 2) * (height * 0.008);

  if (!transparentBackground || includeShadow) {
    ctx.shadowColor = renderStyle === '3d_scifi'
      ? 'rgba(0, 229, 255, 0.35)'
      : renderStyle === '3d_cyberpunk'
      ? 'rgba(230, 57, 155, 0.42)'
      : 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.round(height * 0.035);
    ctx.shadowOffsetY = Math.round(height * 0.018);
  }
  ctx.drawImage(productSource, pX, pY, pW, pH);
  ctx.restore();

  if (!transparentBackground) {
    // Volumetric Key Light Sweep
    ctx.save();
    const lx = width * 0.5 + Math.cos(lightAngle) * width * 0.42;
    const ly = height * 0.34 + Math.sin(lightAngle) * height * 0.32;
    const lightGrad = ctx.createRadialGradient(lx, ly, width * 0.015, lx, ly, width * 0.62);

    if (renderStyle === 'bw_noir') {
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
      lightGrad.addColorStop(0.45, 'rgba(200, 200, 200, 0.08)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.46)');
    } else if (isWarmer || renderStyle === 'fiction') {
      lightGrad.addColorStop(0, isHDR ? 'rgba(255, 224, 178, 0.34)' : 'rgba(254, 215, 170, 0.26)');
      lightGrad.addColorStop(0.45, 'rgba(234, 88, 12, 0.14)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    } else if (isCooler || renderStyle === '3d_scifi') {
      lightGrad.addColorStop(0, isHDR ? 'rgba(186, 240, 255, 0.36)' : 'rgba(186, 230, 253, 0.26)');
      lightGrad.addColorStop(0.45, 'rgba(0, 229, 255, 0.16)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    } else {
      lightGrad.addColorStop(0, isHDR ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.20)');
      lightGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.07)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.36)');
    }
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (isUltra && renderStyle !== 'bw_noir') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * Math.PI * 3);
      const fx = lx - flareSprite.width / 2;
      const fy = ly - flareSprite.height / 2;
      ctx.drawImage(flareSprite, fx, fy);
      ctx.restore();
    }

    // Studio Style Post-Processing Pass
    applyPostStylePass(ctx, width, height, t, renderStyle);

    // Cinema Edge Vignette
    ctx.save();
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.30,
      width / 2,
      height / 2,
      width * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(
      1,
      isDramatic || isUltra || renderStyle === 'bw_noir' || renderStyle === '3d_cyberpunk'
        ? 'rgba(0,0,0,0.68)'
        : 'rgba(0,0,0,0.42)'
    );
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Subtle Cinema Sensor Micro-Grain
    ctx.save();
    ctx.fillStyle = frameIndex % 2 === 0 ? 'rgba(255, 255, 255, 0.012)' : 'rgba(0, 0, 0, 0.012)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}

function createWideGamutContext(canvas: HTMLCanvasElement, alpha: boolean): CanvasRenderingContext2D {
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d', { alpha, colorSpace: 'display-p3' } as any) as CanvasRenderingContext2D | null;
  } catch {
    ctx = null;
  }
  if (!ctx) {
    ctx = canvas.getContext('2d', { alpha })!;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to encode image as ${type}`));
      },
      type,
      quality
    );
  });
}

export async function renderCinematicReel(
  options: RenderOptions
): Promise<{ videoUrl: string; blob: Blob; mimeType: string; width: number; height: number }> {
  const {
    productUrl,
    atmosphereUrl,
    durationSec,
    resolution = '4k_uhd',
    hdrGrade = 'ultra_cinemax',
    fps: requestedFps,
    renderStyle = 'hdr_ultra',
    cameraMotion = 'orbit',
    instructions,
    onProgress,
  } = options;

  const spec = RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[2];
  const fps = requestedFps || spec.fps;

  onProgress?.(5, 'Loading source assets into local optical buffer...');
  const [productImg, atmoImg] = await Promise.all([
    loadImage(productUrl),
    loadImage(atmosphereUrl),
  ]);

  const width = spec.width;
  const height = spec.height;
  const totalFrames = Math.max(fps * 3, Math.round(durationSec * fps));

  const styleLabel = RENDER_STYLE_PRESETS.find((s) => s.key === renderStyle)?.label || renderStyle;
  onProgress?.(14, `Calibrating ${spec.label} (${width}×${height} · ${fps}fps · ${styleLabel})…`);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = createWideGamutContext(canvas, false);

  const shadowSprite = createSoftShadowSprite(Math.round(width * 0.42), Math.round(height * 0.14));
  const lowerInstructions = (instructions || '').toLowerCase();
  const isWarmer = lowerInstructions.includes('warm') || lowerInstructions.includes('golden') || lowerInstructions.includes('sun');
  const isCooler = lowerInstructions.includes('cool') || lowerInstructions.includes('blue') || lowerInstructions.includes('silver');

  const flarePrimary =
    renderStyle === '3d_cyberpunk'
      ? 'rgba(230, 57, 155, 0.5)'
      : isWarmer
      ? 'rgba(255, 210, 140, 0.45)'
      : isCooler || renderStyle === '3d_scifi'
      ? 'rgba(100, 235, 255, 0.48)'
      : 'rgba(0, 229, 255, 0.36)';
  const flareSecondary = isWarmer ? 'rgba(255, 120, 60, 0.2)' : 'rgba(230, 57, 155, 0.22)';
  const flareSprite = createAnamorphicFlareSprite(
    Math.round(width * 0.72),
    Math.round(height * 0.22),
    flarePrimary,
    flareSecondary
  );

  const mimeTypes = width > 1920
    ? [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=avc1',
        'video/mp4',
      ]
    : [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];

  let selectedMime = '';
  for (const m of mimeTypes) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      selectedMime = m;
      break;
    }
  }

  const stream = canvas.captureStream(fps);
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      ...(selectedMime ? { mimeType: selectedMime } : {}),
      videoBitsPerSecond: fps >= 120 ? Math.round(spec.bitrate * 1.5) : spec.bitrate,
    });
  } catch {
    recorder = selectedMime
      ? new MediaRecorder(stream, { mimeType: selectedMime })
      : new MediaRecorder(stream);
  }
  const actualMime = recorder.mimeType || selectedMime || 'video/webm';

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: actualMime }));
    };
    recorder.onerror = (e) => reject((e as any).error || new Error('MediaRecorder error'));
  });

  recorder.start();

  const gradeLabel = HDR_GRADE_PRESETS.find((g) => g.key === hdrGrade)?.label || hdrGrade;
  onProgress?.(24, `Rendering ${styleLabel} · ${gradeLabel} HDR (${fps} fps)…`);

  const frameIntervalMs = 1000 / fps;
  let currentFrame = 0;

  return new Promise((resolve, reject) => {
    function renderNext() {
      if (currentFrame >= totalFrames) {
        onProgress?.(95, `Encoding final ${spec.label} (${fps} fps) master stream…`);
        recorder.stop();
        recordingPromise
          .then((blob) => {
            const videoUrl = URL.createObjectURL(blob);
            onProgress?.(100, `${spec.label} (${width}×${height} @ ${fps}fps) master complete.`);
            resolve({ videoUrl, blob, mimeType: actualMime, width, height });
          })
          .catch(reject);
        return;
      }

      drawCompositionFrame({
        ctx,
        width,
        height,
        t: currentFrame / totalFrames,
        frameIndex: currentFrame,
        productSource: productImg,
        atmoImg,
        shadowSprite,
        flareSprite,
        hdrGrade,
        renderStyle,
        cameraMotion,
        transparentBackground: false,
        includeShadow: true,
        instructions,
      });

      currentFrame++;
      if (currentFrame % Math.max(12, Math.round(fps * 0.5)) === 0) {
        const percent = 24 + Math.round((currentFrame / totalFrames) * 68);
        onProgress?.(
          percent,
          `Rendering ${spec.label} frame ${currentFrame}/${totalFrames} (${Math.round((currentFrame / fps) * 10) / 10}s)…`
        );
      }

      setTimeout(renderNext, frameIntervalMs);
    }

    renderNext();
  });
}

export async function captureVideoElementFrame(
  video: HTMLVideoElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  maxWidth?: number
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const natW = video.videoWidth || 1920;
  const natH = video.videoHeight || 1080;
  const scale = maxWidth && natW > maxWidth ? maxWidth / natW : 1;
  const width = Math.max(2, Math.round(natW * scale));
  const height = Math.max(2, Math.round(natH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = createWideGamutContext(canvas, format === 'png');
  ctx.drawImage(video, 0, 0, width, height);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const quality = format === 'png' ? undefined : 0.96;
  const blob = await canvasToBlob(canvas, mimeType, quality);
  return { blob, width, height, mimeType };
}

export async function exportCompositionStillFrame(
  config: CompositionConfig,
  options: {
    progress: number;
    transparentBackground: boolean;
    includeShadow?: boolean;
    format?: 'png' | 'jpeg';
    maxWidth?: number;
  }
): Promise<{ blob: Blob; width: number; height: number; mimeType: string }> {
  const {
    progress,
    transparentBackground,
    includeShadow = true,
    format = 'png',
    maxWidth,
  } = options;

  const spec = RESOLUTION_PRESETS.find((r) => r.key === config.resolution) ?? RESOLUTION_PRESETS[3];
  const scale = maxWidth && spec.width > maxWidth ? maxWidth / spec.width : 1;
  const width = Math.max(2, Math.round(spec.width * scale));
  const height = Math.max(2, Math.round(spec.height * scale));

  const productAssetUrl = transparentBackground
    ? config.transparentProductUrl || config.productUrl
    : config.productUrl;

  const [productImg, atmoImg] = await Promise.all([
    loadImage(productAssetUrl),
    transparentBackground ? Promise.resolve(null) : loadImage(config.atmosphereUrl),
  ]);

  const productSource = transparentBackground
    ? prepareTransparentProductSource(productImg)
    : productImg;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = createWideGamutContext(canvas, transparentBackground);

  const shadowSprite = createSoftShadowSprite(Math.round(width * 0.42), Math.round(height * 0.14));
  const flareSprite = createAnamorphicFlareSprite(
    Math.round(width * 0.72),
    Math.round(height * 0.22),
    'rgba(0, 229, 255, 0.36)',
    'rgba(230, 57, 155, 0.22)'
  );

  drawCompositionFrame({
    ctx,
    width,
    height,
    t: Math.min(1, Math.max(0, progress)),
    frameIndex: 0,
    productSource,
    atmoImg,
    shadowSprite,
    flareSprite,
    hdrGrade: config.hdrGrade,
    renderStyle: config.renderStyle || 'hdr_ultra',
    cameraMotion: config.cameraMotion,
    exposure: config.exposure,
    contrast: config.contrast,
    saturation: config.saturation,
    transparentBackground,
    includeShadow,
    instructions: config.instructions,
  });

  const targetFormat = transparentBackground ? 'png' : format;
  const mimeType = targetFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await canvasToBlob(canvas, mimeType, targetFormat === 'jpeg' ? 0.96 : undefined);
  return { blob, width, height, mimeType };
}

export async function exportCompositionSequenceArchive(
  config: CompositionConfig,
  options: {
    fps: number;
    transparentBackground: boolean;
    includeShadow?: boolean;
    maxWidth?: number;
    signal?: AbortSignal;
    onProgress?: (current: number, total: number, percent: number) => void;
  }
): Promise<{ blob: Blob; frameCount: number; width: number; height: number }> {
  const {
    fps,
    transparentBackground,
    includeShadow = true,
    maxWidth,
    signal,
    onProgress,
  } = options;

  const spec = RESOLUTION_PRESETS.find((r) => r.key === config.resolution) ?? RESOLUTION_PRESETS[3];
  const scale = maxWidth && spec.width > maxWidth ? maxWidth / spec.width : 1;
  const width = Math.max(2, Math.round(spec.width * scale));
  const height = Math.max(2, Math.round(spec.height * scale));
  const totalFrames = Math.max(6, Math.round(config.durationSec * fps));

  const productAssetUrl = transparentBackground
    ? config.transparentProductUrl || config.productUrl
    : config.productUrl;

  const [productImg, atmoImg] = await Promise.all([
    loadImage(productAssetUrl),
    transparentBackground ? Promise.resolve(null) : loadImage(config.atmosphereUrl),
  ]);

  const productSource = transparentBackground
    ? prepareTransparentProductSource(productImg)
    : productImg;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = createWideGamutContext(canvas, transparentBackground);

  const shadowSprite = createSoftShadowSprite(Math.round(width * 0.42), Math.round(height * 0.14));
  const flareSprite = createAnamorphicFlareSprite(
    Math.round(width * 0.72),
    Math.round(height * 0.22),
    'rgba(0, 229, 255, 0.36)',
    'rgba(230, 57, 155, 0.22)'
  );

  const entries: ZipEntryInput[] = [];
  const prefix = transparentBackground ? 'kaya-alpha' : 'kaya-frame';

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      throw new Error('PNG sequence export cancelled');
    }

    drawCompositionFrame({
      ctx,
      width,
      height,
      t: i / totalFrames,
      frameIndex: i,
      productSource,
      atmoImg,
      shadowSprite,
      flareSprite,
      hdrGrade: config.hdrGrade,
      renderStyle: config.renderStyle || 'hdr_ultra',
      cameraMotion: config.cameraMotion,
      transparentBackground,
      includeShadow,
      instructions: config.instructions,
    });

    const frameBlob = await canvasToBlob(canvas, 'image/png');
    const bytes = new Uint8Array(await frameBlob.arrayBuffer());
    const padded = String(i + 1).padStart(4, '0');
    entries.push({ name: `${prefix}-${padded}.png`, data: bytes });

    const percent = Math.round(((i + 1) / totalFrames) * 95);
    onProgress?.(i + 1, totalFrames, percent);

    await new Promise((r) => setTimeout(r, 0));
  }

  onProgress?.(totalFrames, totalFrames, 98);
  const blob = createZipBlob(entries);
  onProgress?.(totalFrames, totalFrames, 100);
  return { blob, frameCount: totalFrames, width, height };
}

export async function extractVideoSequenceArchive(
  videoUrl: string,
  options: {
    fps: number;
    maxWidth?: number;
    signal?: AbortSignal;
    onProgress?: (current: number, total: number, percent: number) => void;
  }
): Promise<{ blob: Blob; frameCount: number; width: number; height: number }> {
  const { fps, maxWidth, signal, onProgress } = options;

  const probe = document.createElement('video');
  probe.crossOrigin = 'anonymous';
  probe.muted = true;
  probe.playsInline = true;
  probe.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    probe.onloadedmetadata = () => resolve();
    probe.onerror = () => reject(new Error('Failed to load video stream for frame extraction'));
  });

  const duration = Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 10;
  const natW = probe.videoWidth || 1920;
  const natH = probe.videoHeight || 1080;
  const scale = maxWidth && natW > maxWidth ? maxWidth / natW : 1;
  const width = Math.max(2, Math.round(natW * scale));
  const height = Math.max(2, Math.round(natH * scale));
  const totalFrames = Math.max(4, Math.floor(duration * fps));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = createWideGamutContext(canvas, false);

  const entries: ZipEntryInput[] = [];

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      throw new Error('Frame extraction cancelled');
    }

    const seekTime = Math.min(duration - 0.01, i / fps);
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        probe.removeEventListener('seeked', onSeeked);
        resolve();
      };
      probe.addEventListener('seeked', onSeeked);
      probe.currentTime = seekTime;
    });

    ctx.drawImage(probe, 0, 0, width, height);
    const frameBlob = await canvasToBlob(canvas, 'image/png');
    const bytes = new Uint8Array(await frameBlob.arrayBuffer());
    const padded = String(i + 1).padStart(4, '0');
    entries.push({ name: `kaya-frame-${padded}.png`, data: bytes });

    onProgress?.(i + 1, totalFrames, Math.round(((i + 1) / totalFrames) * 95));
  }

  const blob = createZipBlob(entries);
  onProgress?.(totalFrames, totalFrames, 100);
  return { blob, frameCount: totalFrames, width, height };
}
