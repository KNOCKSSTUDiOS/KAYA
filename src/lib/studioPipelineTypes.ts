export type ShaderPresetKey =
  | 'bioluminescent_magenta'
  | 'candy_pearlescent'
  | 'quantum_teal_holo'
  | 'fresnel_peach_rim'
  | 'void_chrome';

export type GeneratorPresetKey =
  | 'none'
  | 'bio_aurora'
  | 'quantum_matrix'
  | 'candy_plasma'
  | 'optical_grid';

export type VideoExportFormat = 'webm' | 'mp4' | 'png_seq';

export interface TitleOverlayConfig {
  enabled: boolean;
  headline: string;
  subline: string;
  typography: 'chakra_etch' | 'hollywood_serif' | 'mono_broadcast';
  accentHex: '#FF007F' | '#00D9C0' | '#FC8EAC' | '#FFDAB9' | '#F5FFFA';
  placement: 'bottom' | 'center' | 'top';
}

export interface Asset3DState {
  assetName: string;
  sourceKind: 'procedural_v' | 'torus' | 'cube' | 'sentinel' | 'uploaded';
  shader: ShaderPresetKey;
  wireframe: boolean;
  focalMm: number;
  scalePct: number;
}

export interface ShaderPresetSpec {
  key: ShaderPresetKey;
  label: string;
  swatch: string;
  cssFilter: string;
  desc: string;
}

export const STUDIO_SHADER_PRESETS: ShaderPresetSpec[] = [
  {
    key: 'bioluminescent_magenta',
    label: 'Bioluminescent Magenta',
    swatch: '#FF007F',
    cssFilter: 'contrast(1.18) saturate(1.36)',
    desc: 'Fresnel #FF007F plasma edge glow over Void Black',
  },
  {
    key: 'candy_pearlescent',
    label: 'Candy Pearlescent',
    swatch: '#FC8EAC',
    cssFilter: 'contrast(1.12) saturate(1.24) brightness(1.04)',
    desc: 'Iridescent Flamingo Pink #FC8EAC & Pearl Cyan #E0FFFF coat',
  },
  {
    key: 'quantum_teal_holo',
    label: 'Quantum Teal Holo',
    swatch: '#00D9C0',
    cssFilter: 'contrast(1.2) saturate(1.28) hue-rotate(-8deg)',
    desc: 'Holographic #00D9C0 refraction scan & depth rim',
  },
  {
    key: 'fresnel_peach_rim',
    label: 'Fresnel Peach Chrome',
    swatch: '#FFDAB9',
    cssFilter: 'contrast(1.16) saturate(1.15) sepia(0.14)',
    desc: 'Warm #FFDAB9 anodized rim highlight',
  },
  {
    key: 'void_chrome',
    label: 'Void Obsidian Chrome',
    swatch: '#F5FFFA',
    cssFilter: 'contrast(1.26) brightness(1.02)',
    desc: 'High-contrast #0A0A0A gunmetal mirror finish',
  },
];

export const STUDIO_GENERATOR_PRESETS: {
  key: GeneratorPresetKey;
  label: string;
  accent: string;
  desc: string;
}[] = [
  { key: 'none', label: 'Stage Backdrop', accent: '#121212', desc: 'Use selected scene backdrop plate' },
  { key: 'bio_aurora', label: 'Bio Aurora', accent: '#FF007F', desc: 'Swirling #FF007F & #00D9C0 aurora waves' },
  { key: 'quantum_matrix', label: 'Quantum Matrix', accent: '#00D9C0', desc: '3D starfield & telemetry pulse grid' },
  { key: 'candy_plasma', label: 'Candy Plasma', accent: '#FC8EAC', desc: 'Liquid pearlescent #FC8EAC & #FFDAB9 shear' },
  { key: 'optical_grid', label: 'Optical Horizon', accent: '#E0FFFF', desc: 'Precision perspective anamorphic grid' },
];

export interface TimelineCutSegment {
  id: string;
  label: string;
  trackId: 'v1' | 'v2' | '3d' | 'fx' | 'ttl' | 'a1' | 'a2';
  inPct: number;
  outPct: number;
  fps: number;
  resolutionTag: string;
  formatTag: VideoExportFormat;
  shader: ShaderPresetKey;
  audioBus: string;
  titleHeadline: string;
}
