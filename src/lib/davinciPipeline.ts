export type DaVinciColorProfile =
  | 'candy_gloss_dwg'
  | 'burnished_rust_aces'
  | 'cinemax_hdr_rec2020'
  | 'obsidian_noir_dctl';

export interface DaVinciCutInput {
  label: string;
  specLabel: string;
  prompt: string;
  duration?: string;
}

export interface DaVinciExportConfig {
  projectName?: string;
  fps: number;
  width: number;
  height: number;
  colorProfile: DaVinciColorProfile;
  cuts: DaVinciCutInput[];
  audioCodec?: string;
}

function downloadTextBlob(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function parseSeconds(dur?: string): number {
  const n = parseInt(dur || '10', 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

function formatEdlTimecode(totalSec: number, fps: number): string {
  const clamped = Math.max(0, totalSec);
  const frames = Math.floor(clamped * fps) % fps;
  const s = Math.floor(clamped) % 60;
  const m = Math.floor(clamped / 60) % 60;
  const h = Math.floor(clamped / 3600) + 1; // Broadcast timeline start 01:00:00:00
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportDaVinciFcpxml(cfg: DaVinciExportConfig): string {
  const fps = Math.max(24, cfg.fps || 60);
  const projectTitle = cfg.projectName || 'KAYA_KNOCKSSTUDiOS_MASTER';
  const cuts =
    cfg.cuts.length > 0
      ? cfg.cuts
      : [
          {
            label: 'Cut 1',
            specLabel: `${cfg.width}x${cfg.height} · ${fps}fps`,
            prompt: 'KAYA Master Timeline Sequence',
            duration: '10s',
          },
        ];

  let totalSec = 0;
  const assetsXml: string[] = [];
  const clipsXml: string[] = [];

  cuts.forEach((cut, idx) => {
    const durSec = parseSeconds(cut.duration);
    const assetId = `r${idx + 2}`;
    const frameDur = `1/${fps}s`;
    assetsXml.push(
      `    <asset id="${assetId}" name="${escapeXml(cut.label)}" start="0s" duration="${durSec}s" hasVideo="1" hasAudio="1" format="r1" audioSources="1" audioChannels="6" audioRate="48000" />`
    );
    clipsXml.push(
      `          <asset-clip ref="${assetId}" offset="${totalSec}s" name="${escapeXml(cut.label)}" duration="${durSec}s" start="0s" tcFormat="NDF">
            <note>${escapeXml(`${cut.specLabel} | ${cut.prompt} | Audio: ${cfg.audioCodec || 'DTS:X / Sony SDDS 7.1'}`)}</note>
            <metadata>
              <md key="com.apple.proapps.studio.colorProfile" value="${cfg.colorProfile}" />
              <md key="com.blackmagic.resolve.frameRate" value="${fps}" />
              <md key="com.knocksstudios.frameDuration" value="${frameDur}" />
            </metadata>
          </asset-clip>`
    );
    totalSec += durSec;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat${cfg.height}p${fps}" frameDuration="1/${fps}s" width="${cfg.width}" height="${cfg.height}" colorSpace="1-1-1 (Rec. 709 / DWG)" />
${assetsXml.join('\n')}
  </resources>
  <library>
    <event name="KNOCKSSTUDiOS KAYA Timeline">
      <project name="${escapeXml(projectTitle)}">
        <sequence format="r1" duration="${totalSec}s" tcStart="3600s" tcFormat="NDF" audioLayout="surround" audioRate="48k">
          <spine>
${clipsXml.join('\n')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;

  const fname = `kaya-davinci-${fps}fps-${Date.now()}.fcpxml`;
  downloadTextBlob(xml, fname, 'application/xml');
  return fname;
}

export function exportDaVinciEdl(cfg: DaVinciExportConfig): string {
  const fps = Math.max(24, cfg.fps || 60);
  const title = (cfg.projectName || 'KAYA_KNOCKSSTUDiOS_MASTER').toUpperCase();
  const cuts =
    cfg.cuts.length > 0
      ? cfg.cuts
      : [
          {
            label: 'Cut 1',
            specLabel: `${cfg.width}x${cfg.height} · ${fps}fps`,
            prompt: 'KAYA Master Cut',
            duration: '10s',
          },
        ];

  const lines: string[] = [
    `TITLE: ${title}`,
    `FCM: NON-DROP FRAME`,
    `* COLOR PIPELINE: ${cfg.colorProfile.toUpperCase()}`,
    `* AUDIO CODEC: ${cfg.audioCodec || 'DTS:X & SONY SDDS 7.1'}`,
    '',
  ];

  let timelineCursor = 0;
  cuts.forEach((cut, idx) => {
    const durSec = parseSeconds(cut.duration);
    const editNum = String(idx + 1).padStart(3, '0');
    const recIn = formatEdlTimecode(timelineCursor, fps);
    const recOut = formatEdlTimecode(timelineCursor + durSec, fps);
    const srcIn = formatEdlTimecode(0, fps);
    const srcOut = formatEdlTimecode(durSec, fps);
    lines.push(`${editNum}  AX       V     C        ${srcIn} ${srcOut} ${recIn} ${recOut}`);
    lines.push(`* FROM CLIP NAME: ${cut.label} (${cut.specLabel})`);
    lines.push(`* COMMENT: ${cut.prompt.slice(0, 88)}`);
    lines.push('');
    timelineCursor += durSec;
  });

  const fname = `kaya-davinci-${fps}fps-${Date.now()}.edl`;
  downloadTextBlob(lines.join('\n'), fname, 'text/plain');
  return fname;
}

export function exportDaVinciCubeLut(profile: DaVinciColorProfile): string {
  const size = 17;
  const lines: string[] = [
    `TITLE "KNOCKSSTUDiOS KAYA - ${profile.toUpperCase()}"`,
    `# Compatible with DaVinci Resolve Color Page (.cube 3D LUT)`,
    `LUT_3D_SIZE ${size}`,
    `DOMAIN_MIN 0.0 0.0 0.0`,
    `DOMAIN_MAX 1.0 1.0 1.0`,
    '',
  ];

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const rn = r / (size - 1);
        const gn = g / (size - 1);
        const bn = b / (size - 1);

        let ro = rn;
        let go = gn;
        let bo = bn;

        if (profile === 'candy_gloss_dwg') {
          // Deep obsidian toe + Candy-Gloss crimson lift + crisp highlight roll-off
          ro = clamp01(Math.pow(rn, 0.92) * 1.06 + (1 - gn) * 0.045);
          go = clamp01(Math.pow(gn, 1.08) * 0.94);
          bo = clamp01(Math.pow(bn, 1.06) * 0.96 + rn * 0.02);
        } else if (profile === 'burnished_rust_aces') {
          // Warm burnished copper/rust midtones + rich shadows
          ro = clamp01(Math.pow(rn, 0.9) * 1.08 + 0.015);
          go = clamp01(Math.pow(gn, 1.02) * 0.97);
          bo = clamp01(Math.pow(bn, 1.15) * 0.88);
        } else if (profile === 'cinemax_hdr_rec2020') {
          // S-curve filmic punch for 4K HDR scopes
          const sCurve = (x: number) => x * x * (3 - 2 * x);
          ro = clamp01(rn * 0.45 + sCurve(rn) * 0.55);
          go = clamp01(gn * 0.48 + sCurve(gn) * 0.52);
          bo = clamp01(bn * 0.46 + sCurve(bn) * 0.54);
        } else {
          // Obsidian Noir DCTL monochrome with subtle crimson split-tone
          const lum = rn * 0.299 + gn * 0.587 + bn * 0.114;
          const contrastLum = clamp01((lum - 0.5) * 1.28 + 0.5);
          ro = clamp01(contrastLum * 1.04 + 0.012);
          go = clamp01(contrastLum * 0.96);
          bo = clamp01(contrastLum * 0.98);
        }

        lines.push(`${ro.toFixed(6)} ${go.toFixed(6)} ${bo.toFixed(6)}`);
      }
    }
  }

  const fname = `kaya-davinci-${profile}.cube`;
  downloadTextBlob(lines.join('\n'), fname, 'text/plain');
  return fname;
}
