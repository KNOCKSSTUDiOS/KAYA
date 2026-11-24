/**
 * Unified Studio Watermark Engine
 * Enforces one consistent KNOCKSSTUDiOS · Hollywood MOTiON Pictures™ mark per canvas/viewport surface
 * so watermarks never stack or collide across compositors.
 */

export const UNIFIED_WATERMARK_TEXT = '© 2024–2026 KNOCKSSTUDiOS · Hollywood MOTiON Pictures™';

export interface UnifiedWatermarkConfig {
  enabled: boolean;
  ownerLabel: string;
  stampCode: string;
  tier: string;
}

const DEFAULT_WATERMARK: UnifiedWatermarkConfig = {
  enabled: true,
  ownerLabel: 'KNOCKSSTUDiOS · Hollywood MOTiON Pictures™',
  stampCode: 'KMP-2026',
  tier: 'studio',
};

let activeConfig: UnifiedWatermarkConfig = { ...DEFAULT_WATERMARK };
const stampedCanvasPass = new WeakMap<HTMLCanvasElement, number>();

export function getUnifiedWatermarkConfig(): UnifiedWatermarkConfig {
  return { ...activeConfig };
}

export function setUnifiedWatermarkConfig(patch: Partial<UnifiedWatermarkConfig>) {
  activeConfig = { ...activeConfig, ...patch };
}

export function getUnifiedWatermarkLabel(customOwner?: string, customCode?: string): string {
  const owner = (customOwner || activeConfig.ownerLabel || 'KNOCKSSTUDiOS · Hollywood MOTiON Pictures™').trim();
  const code = (customCode || activeConfig.stampCode || 'KMP-2026').trim();
  return `© 2024–2026 ${owner} · ${code}`;
}

/**
 * Stamps a single clean studio watermark onto a 2D canvas surface.
 * Deduplicates by frame/pass token so multi-pass compositors never double-stamp.
 */
export function stampUnifiedCanvasWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options?: {
    passToken?: number;
    owner?: string;
    code?: string;
    opacity?: number;
  }
) {
  if (!activeConfig.enabled) return;
  const passToken = options?.passToken;
  if (typeof passToken === 'number' && ctx.canvas) {
    if (stampedCanvasPass.get(ctx.canvas) === passToken) return;
    stampedCanvasPass.set(ctx.canvas, passToken);
  }

  const label = getUnifiedWatermarkLabel(options?.owner, options?.code);
  const alpha = options?.opacity ?? 0.65;

  ctx.save();
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = `rgba(245, 255, 250, ${alpha})`;
  ctx.shadowColor = 'rgba(255, 0, 127, 0.55)';
  ctx.shadowBlur = 8;
  ctx.fillText(label, width - 16, height - 12);
  ctx.restore();
}
