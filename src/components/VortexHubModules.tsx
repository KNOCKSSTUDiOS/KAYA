import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Box,
  Cpu,
  Database,
  Download,
  Film,
  FolderKanban,
  GraduationCap,
  Layers,
  Mic,
  Orbit,
  Palette,
  Radio,
  Scissors,
  Search,
  Snowflake,
  Sparkles,
  Swords,
  Thermometer,
  Volume2,
  Waves,
  Workflow,
  Zap,
  Camera,
  Cable,
  Clapperboard,
  Image as ImageIcon,
} from 'lucide-react';
import { HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { StudioPageKey } from './RubiksCubeHubPage.js';
import {
  StudioArtifactDoc,
  StudioConnectorDoc,
  StudioProjectDoc,
  saveConnector,
  saveStudioArtifact,
} from '../lib/firebase.js';
import { stampUnifiedCanvasWatermark } from '../lib/watermarkEngine.js';
import { TileVisualPreview, type PreviewTileId } from './TileVisualPreviews.js';
import { Asset3DPipelineStage } from './Asset3DPipelineStage.js';
import { Asset3DState } from '../lib/studioPipelineTypes.js';
import {
  DaVinciColorProfile,
  DaVinciCutInput,
  exportDaVinciCubeLut,
  exportDaVinciEdl,
  exportDaVinciFcpxml,
} from '../lib/davinciPipeline.js';

export type HubSectionTarget =
  | StudioPageKey
  | 'blender'
  | 'davinci'
  | 'infinity'
  | 'soul'
  | 'connectors';

interface VortexHubModulesProps {
  activeTool: StudioPageKey;
  userId?: string | null;
  userEmail?: string | null;
  projects: StudioProjectDoc[];
  artifacts: StudioArtifactDoc[];
  connectors: StudioConnectorDoc[];
  activeFps?: number;
  activeWidth?: number;
  activeHeight?: number;
  activeStyleLabel?: string;
  cuts?: DaVinciCutInput[];
  asset3DState: Asset3DState;
  onChangeAsset3DState: (patch: Partial<Asset3DState>) => void;
  onSyncAsset3DToVideo?: (assetState: Asset3DState) => void;
  onRefreshCloudData: () => void;
  onSelectTool: (tool: StudioPageKey) => void;
  onJumpSection: (id: string) => void;
}

interface StudioTileDef {
  id: HubSectionTarget;
  previewId: PreviewTileId;
  title: string;
  caption: string;
  decal: string;
  enginePair: string;
  icon: React.ReactNode;
}

interface PairedTileRow {
  pairTitle: string;
  left: [StudioTileDef, StudioTileDef, StudioTileDef];
  right: [StudioTileDef, StudioTileDef, StudioTileDef];
}

const PAIRED_STUDIO_ROWS: PairedTileRow[] = [
  {
    pairTitle: '01 · Cinema Production & 3D Asset (V) Core',
    left: [
      {
        id: 'video',
        previewId: 'video',
        title: 'VIDEO & FRAMES STUDIO',
        caption: '4K HDR compositor, Camera Rig & live generators',
        decal: '24–144 FPS · WEBM/MP4',
        enginePair: 'INFINITY CORE ENGINE -- Cinema',
        icon: <Film className="w-4 h-4 text-[#FF007F]" />,
      },
      {
        id: 'vfx',
        previewId: 'vfx',
        title: 'VFX · SHADERS · TITLES',
        caption: 'VFX Picture, VFX Sound, Shaders, Titles & Generators',
        decal: '5 SUB-VIEWS · GLSL',
        enginePair: 'INFINITY CORE ENGINE -- Tempest Studio',
        icon: <Sparkles className="w-4 h-4 text-[#00D9C0]" />,
      },
      {
        id: 'editor',
        previewId: 'editor',
        title: 'DAVINCI NLE TIMELINE',
        caption: 'Multi-track V1/3D/FX/TTL/A1/A2 razor cut & zoom',
        decal: 'SMPTE · RAZOR NLE',
        enginePair: 'INFINITY CORE ENGINE -- Timeline NLE',
        icon: <Scissors className="w-4 h-4 text-[#FC8EAC]" />,
      },
    ],
    right: [
      {
        id: 'blender',
        previewId: 'blender',
        title: '3D ASSET (V) & BLENDER',
        caption: 'GLB / FBX / OBJ loader & pearlescent shaders',
        decal: '3D ASSET (V) · GLB',
        enginePair: 'INFINITY CORE ENGINE -- Mesh Forge',
        icon: <Box className="w-4 h-4 text-[#FFDAB9]" />,
      },
      {
        id: 'davinci',
        previewId: 'davinci',
        title: 'DAVINCI RESOLVE PIPELINE',
        caption: 'FCPXML timeline, CMX 3600 EDL & 3D .cube LUT',
        decal: 'XML · EDL · .CUBE LUT',
        enginePair: 'INFINITY CORE ENGINE -- Resolve Bridge',
        icon: <Scissors className="w-4 h-4 text-[#FF007F]" />,
      },
      {
        id: 'cube',
        previewId: 'cube',
        title: '360° VIDEO CUBE',
        caption: '27-cubie spatial video matrix & camera choreography',
        decal: '360 VIDEO CUBE',
        enginePair: 'INFINITY CORE ENGINE -- Spatial Cube',
        icon: <Layers className="w-4 h-4 text-[#00D9C0]" />,
      },
    ],
  },
  {
    pairTitle: '02 · Sound, Music, Picture & Motion Suites',
    left: [
      {
        id: 'audio',
        previewId: 'audio',
        title: 'AUDIO & MUSIC SUITE',
        caption: 'SFX, Full Song, Acoustic, Vocals/Score & Sequencer',
        decal: 'SFX · SONG · SCORE · BUSES',
        enginePair: 'INFINITY CORE ENGINE -- Music Master',
        icon: <Volume2 className="w-4 h-4 text-[#FC8EAC]" />,
      },
      {
        id: 'sound',
        previewId: 'sound',
        title: 'SOUND · DTS:X & SONY SDDS',
        caption: '16 foley sample pads & surround cinema buses',
        decal: 'DTS:X / SONY SDDS 7.1',
        enginePair: 'INFINITY CORE ENGINE -- Spatial DSP',
        icon: <Waves className="w-4 h-4 text-[#00D9C0]" />,
      },
      {
        id: 'picture',
        previewId: 'picture',
        title: 'PICTURE & COLOR SUITE',
        caption: 'Upload pics, LUT grading, cutouts & 4K alpha PNG',
        decal: 'RGBA 4K PLATE',
        enginePair: 'INFINITY CORE ENGINE -- Color Suite',
        icon: <ImageIcon className="w-4 h-4 text-[#F5FFFA]" />,
      },
    ],
    right: [
      {
        id: 'storyboard',
        previewId: 'storyboard',
        title: '3D STORYBOARD & PREVIS',
        caption: '3D camera pre-vis & shot sequence beats',
        decal: 'SHOT PREVIS',
        enginePair: 'INFINITY CORE ENGINE -- Previs Rig',
        icon: <Clapperboard className="w-4 h-4 text-[#FC8EAC]" />,
      },
      {
        id: 'animator',
        previewId: 'animator',
        title: 'ACTION ANIMATOR',
        caption: 'Dual-subject motion choreography & optical trails',
        decal: 'MOTION CHOREO',
        enginePair: 'INFINITY CORE ENGINE -- Motion FX',
        icon: <Swords className="w-4 h-4 text-[#FFDAB9]" />,
      },
      {
        id: 'lipsync',
        previewId: 'lipsync',
        title: 'LIP SYNC RIG',
        caption: 'Phoneme viseme & live mic reactivity',
        decal: 'VISEME RIG',
        enginePair: 'INFINITY CORE ENGINE -- Viseme Sync',
        icon: <Mic className="w-4 h-4 text-[#00D9C0]" />,
      },
    ],
  },
  {
    pairTitle: '03 · Live Broadcast, Orbital Core & Telemetry',
    left: [
      {
        id: 'airradio',
        previewId: 'airradio',
        title: 'AIRRADIO FM',
        caption: 'Multi-channel synth broadcast & host mic stereo carrier',
        decal: '88-108 MHZ',
        enginePair: 'INFINITY CORE ENGINE -- FM Broadcast',
        icon: <Radio className="w-4 h-4 text-[#00D9C0]" />,
      },
      {
        id: 'live',
        previewId: 'live',
        title: 'LIVE CAM & STREAM',
        caption: 'Real camera reticle & WebM live stream capture',
        decal: 'LIVE CAM · BROADCAST · STREAM',
        enginePair: 'INFINITY CORE ENGINE -- Live Switcher',
        icon: <Camera className="w-4 h-4 text-[#FF007F]" />,
      },
      {
        id: 'bridge',
        previewId: 'bridge',
        title: 'DESKTOP BRIDGE',
        caption: 'Local workstation socket, paint stack & GLB exchange',
        decal: 'LOCAL SYNC',
        enginePair: 'INFINITY CORE ENGINE -- Bridge Bus',
        icon: <Cable className="w-4 h-4 text-[#E0FFFF]" />,
      },
    ],
    right: [
      {
        id: 'infinity',
        previewId: 'infinity',
        title: 'INFINITY · VALERIUS (V)',
        caption: 'Sentinel of the Ten Galaxies orbital core telemetry',
        decal: '10 GALAXIES',
        enginePair: 'INFINITY CORE ENGINE -- Valerius (V)',
        icon: <Orbit className="w-4 h-4 text-[#FF007F]" />,
      },
      {
        id: 'soul',
        previewId: 'soul',
        title: 'SOUL · COOLING FORGE',
        caption: 'Opus 4.7 thermal governor & 144 FPS pacing lock',
        decal: 'OPUS 4.7 CRYO',
        enginePair: 'INFINITY CORE ENGINE -- Soul Cryo',
        icon: <Snowflake className="w-4 h-4 text-[#00D9C0]" />,
      },
      {
        id: 'school',
        previewId: 'school',
        title: 'INFINITY ACADEMY LAB',
        caption: 'Shader coding, 3D rendering labs & optics analysis',
        decal: 'LIVE LABS',
        enginePair: 'INFINITY CORE ENGINE -- Academy Lab',
        icon: <GraduationCap className="w-4 h-4 text-[#FFDAB9]" />,
      },
    ],
  },
];

export function VortexHubModules({
  activeTool,
  userId,
  projects,
  artifacts,
  connectors,
  activeFps = 60,
  activeWidth = 3840,
  activeHeight = 2160,
  activeStyleLabel = '4K HDR Ultra',
  cuts = [],
  asset3DState,
  onChangeAsset3DState,
  onSyncAsset3DToVideo,
  onRefreshCloudData,
  onSelectTool,
  onJumpSection,
}: VortexHubModulesProps) {
  // DaVinci Resolve Pipeline state
  const [davinciColorProfile, setDavinciColorProfile] = useState<DaVinciColorProfile>('candy_gloss_dwg');
  const [davinciStatus, setDavinciStatus] = useState('DaVinci Resolve XML · EDL · 3D LUT Bridge Ready');

  // Infinity & Valerius (V) state
  const galaxyMountRef = useRef<HTMLDivElement | null>(null);
  const [activeGalaxy, setActiveGalaxy] = useState(0);

  // Soul Cooling Forge / Opus 4.7 state
  const [coolingProfile, setCoolingProfile] = useState<'silent' | 'balanced' | 'opus_47' | 'cryo_144'>('opus_47');
  const coolingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Connectors, Search, MCP & Existing DB Verifier state
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; category: string; target: string; spec: string }[]>([]);
  const [mcpSkill, setMcpSkill] = useState('blender_sync');
  const [mcpLog, setMcpLog] = useState<string>('Ready to execute self-hosted MCP connector skills.');
  const [dbList, setDbList] = useState<{ id: string; name: string; connectorType: string; endpointUrl: string; status: string; latencyMs: number }[]>([]);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState<StudioConnectorDoc['connectorType']>('postgres');
  const [dbEndpoint, setDbEndpoint] = useState('');
  const [dbVerifyMsg, setDbVerifyMsg] = useState('');

  const coolingSpecs = {
    silent: { label: 'Silent Cryo', tempC: 54, fanRpm: 1350, targetFps: 60 },
    balanced: { label: 'Balanced Studio', tempC: 61, fanRpm: 1920, targetFps: 90 },
    opus_47: { label: 'Opus 4.7 Forge', tempC: 64, fanRpm: 2480, targetFps: 120 },
    cryo_144: { label: '144fps Cryo-Boost', tempC: 59, fanRpm: 3100, targetFps: 144 },
  }[coolingProfile];

  useEffect(() => {
    fetch('/api/db/connections')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.connections) setDbList(d.connections);
      })
      .catch(() => {});
  }, []);

  // Interactive Infinity & Valerius (V) Sentinel of the Ten Galaxies Stage
  useEffect(() => {
    const container = galaxyMountRef.current;
    if (!container) return;

    const w = container.clientWidth || 560;
    const h = container.clientHeight || 220;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const coreGeo = new THREE.IcosahedronGeometry(0.82, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0x3b001e,
      metalness: 0.88,
      roughness: 0.16,
    });
    const sentinelCore = new THREE.Mesh(coreGeo, coreMat);
    scene.add(sentinelCore);

    const ringGeo = new THREE.TorusGeometry(2.1, 0.025, 12, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d9c0, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);

    const satellites: THREE.Mesh[] = [];
    const satGeo = new THREE.SphereGeometry(0.11, 14, 14);
    for (let i = 0; i < 10; i++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: i === activeGalaxy ? 0xf5fffa : i % 3 === 0 ? 0xff007f : i % 3 === 1 ? 0x00d9c0 : 0xfc8eac,
      });
      const sat = new THREE.Mesh(satGeo, sMat);
      scene.add(sat);
      satellites.push(sat);
    }

    const pLight = new THREE.PointLight(0xf5fffa, 4, 30);
    pLight.position.set(3, 4, 5);
    scene.add(pLight);

    const timer = new THREE.Timer();
    timer.connect(document);
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed() * 0.85;
      sentinelCore.rotation.y += 0.01;
      sentinelCore.rotation.z += 0.005;
      ring.rotation.z += 0.003;
      satellites.forEach((sat, idx) => {
        const ang = t + (idx * Math.PI * 2) / 10;
        const radius = idx === activeGalaxy ? 1.55 : 2.15;
        sat.position.set(Math.cos(ang) * radius, Math.sin(ang * 1.4) * 0.45, Math.sin(ang) * radius);
        const sc = idx === activeGalaxy ? 1.7 : 1;
        sat.scale.set(sc, sc, sc);
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      timer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      satGeo.dispose();
      satellites.forEach((s) => (s.material as THREE.Material).dispose());
      renderer.dispose();
    };
  }, [activeGalaxy]);

  // Soul Cooling Forge Opus 4.7 Telemetry Wave Canvas
  useEffect(() => {
    const canvas = coolingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let pass = 0;
    const draw = (now: number) => {
      pass += 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, w, h);

      const speed = coolingProfile === 'cryo_144' ? 0.006 : coolingProfile === 'opus_47' ? 0.004 : 0.0024;
      ctx.strokeStyle = coolingProfile === 'cryo_144' || coolingProfile === 'opus_47' ? '#FF007F' : '#00D9C0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y =
          h * 0.52 +
          Math.sin(x * 0.025 + now * speed) * 22 +
          Math.cos(x * 0.012 - now * speed * 0.7) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      stampUnifiedCanvasWatermark(ctx, w, h, { passToken: pass, opacity: 0.45 });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [coolingProfile]);

  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vortex/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchInput }),
      });
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.results || []);
      }
    } catch {
      // ignore transient errors
    }
  };

  const handleRunMcpSkill = async (skill: string) => {
    setMcpSkill(skill);
    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, payload: { activeTool, coolingProfile } }),
      });
      const json = await res.json();
      setMcpLog(json.summary || 'MCP skill completed');
    } catch {
      setMcpLog('Self-hosted MCP endpoint reachable on host server.');
    }
  };

  const handleVerifyDbConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim() || !dbEndpoint.trim()) return;
    setDbVerifyMsg('Verifying endpoint…');
    try {
      const res = await fetch('/api/db/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: dbName, connectorType: dbType, endpointUrl: dbEndpoint }),
      });
      const json = await res.json();
      if (res.ok && json.connection) {
        setDbList((prev) => [json.connection, ...prev.filter((c) => c.id !== json.connection.id)]);
        setDbVerifyMsg(
          json.deduplicated
            ? `Existing connection verified cleanly (${json.connection.latencyMs}ms) — no duplicate created.`
            : `Verified & linked ${json.connection.name} (${json.connection.latencyMs}ms).`
        );
        if (userId) {
          await saveConnector({
            userId,
            name: dbName.trim(),
            connectorType: dbType,
            endpointUrl: dbEndpoint.trim(),
            status: 'verified',
          });
          onRefreshCloudData();
        }
        setDbName('');
        setDbEndpoint('');
      } else {
        setDbVerifyMsg(json.error || 'Verification failed.');
      }
    } catch {
      setDbVerifyMsg('Database verifier unreachable.');
    }
  };

  const activateHubTile = (id: HubSectionTarget) => {
    if (id === 'blender' || id === 'davinci' || id === 'infinity' || id === 'soul' || id === 'connectors') {
      onJumpSection(`vortex-${id}`);
      return;
    }
    onSelectTool(id);
    onJumpSection('page-tools');
  };

  const handleDaVinciXml = () => {
    const fname = exportDaVinciFcpxml({
      projectName: 'KNOCKSSTUDiOS_Hollywood_MOTiON_Pictures_MASTER',
      fps: activeFps,
      width: activeWidth,
      height: activeHeight,
      colorProfile: davinciColorProfile,
      cuts,
      audioCodec: 'DTS:X Cinema & Sony SDDS 7.1',
    });
    setDavinciStatus(`Exported DaVinci Timeline XML (${fname})`);
  };

  const handleDaVinciEdl = () => {
    const fname = exportDaVinciEdl({
      projectName: 'KNOCKSSTUDiOS_Hollywood_MOTiON_Pictures_MASTER',
      fps: activeFps,
      width: activeWidth,
      height: activeHeight,
      colorProfile: davinciColorProfile,
      cuts,
      audioCodec: 'DTS:X Cinema & Sony SDDS 7.1',
    });
    setDavinciStatus(`Exported DaVinci CMX 3600 EDL (${fname})`);
  };

  const handleDaVinciLut = () => {
    const fname = exportDaVinciCubeLut(davinciColorProfile);
    setDavinciStatus(`Exported DaVinci 3D LUT (${fname})`);
  };

  const galaxies = [
    '01 · Crimson Core',
    '02 · Obsidian Rim',
    '03 · Flamingo Aura',
    '04 · Vesper Forge',
    '05 · Chrono Belt',
    '06 · Solis Drift',
    '07 · Apex Crown',
    '08 · Pearl Halo',
    '09 · Peach Rift',
    '10 · Valerius Zenith',
  ];

  const renderTileCard = (tile: StudioTileDef) => {
    const isActive = activeTool === tile.id;
    return (
      <button
        key={tile.id}
        type="button"
        data-active={isActive}
        onClick={() => activateHubTile(tile.id)}
        className="group candy-trace-tile full-tile-window min-h-[192px] text-left p-5 flex flex-col justify-between gap-3 cursor-pointer"
      >
        <TileVisualPreview id={tile.previewId} title={tile.title} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 pearlescent-sheen opacity-0 group-hover:opacity-65 transition-opacity duration-300"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#121212]/48 to-[#0A0A0A]/25"
        />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            {tile.icon}
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00D9C0]">
              {tile.decal}
            </span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E0FFFF]/60 truncate">
            {tile.enginePair}
          </span>
        </div>

        <div className="relative z-10 space-y-1">
          <h3
            className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] see-thru-font truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tile.title}
          </h3>
          <p className="text-xs see-thru-font-subtle leading-snug line-clamp-2">
            {tile.caption}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-10">
      {/* 1. PAIRED STUDIO HUB — 3 LEFT / 3 RIGHT PER ROW DOWN THE PAGE */}
      <section id="vortex-hub" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-base sm:text-xl font-bold uppercase tracking-[0.22em] see-thru-font"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              KNOCKSSTUDiOS · Hollywood MOTiON Pictures Hub
            </h2>
            <p className="text-xs text-[#E0FFFF]/68">
              INFINITY CORE ENGINE · Paired 3-Left / 3-Right Studio Modules — 3D Asset (V), DaVinci Resolve, VFX Shaders &amp; DTS:X / Sony SDDS.
            </p>
          </div>
          <LedStatusIndicator label="18 Paired Studio Modules · 3L / 3R" tone="cyan" />
        </div>

        <div className="space-y-8">
          {PAIRED_STUDIO_ROWS.map((row) => (
            <div key={row.pairTitle} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#FC8EAC]">
                  {row.pairTitle}
                </span>
                <span className="font-mono text-[10px] text-[#E0FFFF]/50">
                  3 Left · 3 Right Paired Deck
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div className="flex flex-col gap-3.5">{row.left.map(renderTileCard)}</div>
                <div className="flex flex-col gap-3.5">{row.right.map(renderTileCard)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 3D ASSET (V) & BLENDER PIPELINE + GLB / FBX / OBJ LOADER & CUSTOM SHADERS */}
      <Asset3DPipelineStage
        assetState={asset3DState}
        onChangeAssetState={onChangeAsset3DState}
        onSendToVideoPipeline={onSyncAsset3DToVideo}
        onExportArtifact={(title, summary) => {
          if (userId) {
            saveStudioArtifact({
              userId,
              studioHub: 'blender',
              title,
              kind: 'blender_scene',
              summary,
            })
              .then(onRefreshCloudData)
              .catch(() => {});
          }
        }}
      />

      {/* 2B. DAVINCI RESOLVE PIPELINE · TIMELINE XML, EDL & 3D LUT INTERCHANGE */}
      <section id="vortex-davinci" className="candy-surface rounded-[18px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-5 h-5 text-[#FF007F]" />
            <div>
              <h2
                className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#F5FFFA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                DaVinci Resolve Pipeline · Timeline XML, CMX 3600 EDL &amp; Color LUT
              </h2>
              <p className="text-xs text-[#E0FFFF]/65">{davinciStatus}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LedStatusIndicator
              label={`${activeWidth}×${activeHeight} · ${activeFps} FPS · ${cuts.length || 1} Cut(s)`}
              tone="cyan"
            />
            <HardwareButton
              size="sm"
              tone="cyan"
              active={false}
              onClick={() => {
                onSelectTool('editor');
                onJumpSection('page-tools');
              }}
            >
              <span>Open Timeline NLE</span>
            </HardwareButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/65 block">
              DaVinci Color Pipeline &amp; 3D LUT Target ({activeStyleLabel})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['candy_gloss_dwg', 'DaVinci Wide · Magenta'],
                  ['burnished_rust_aces', 'ACEScct · Fresnel Peach'],
                  ['cinemax_hdr_rec2020', 'Rec.2020 · 4K Pearl'],
                  ['obsidian_noir_dctl', 'DCTL · Void Obsidian'],
                ] as [DaVinciColorProfile, string][]
              ).map(([k, lbl]) => (
                <HardwareButton
                  key={k}
                  size="sm"
                  fullWidth
                  tone={k.includes('candy') ? 'red' : k.includes('rust') ? 'magenta' : 'cyan'}
                  active={davinciColorProfile === k}
                  onClick={() => setDavinciColorProfile(k)}
                >
                  <span className="truncate">{lbl}</span>
                </HardwareButton>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <HardwareButton size="sm" tone="red" active onClick={handleDaVinciXml}>
              <Download className="w-3.5 h-3.5" />
              <span>Export .FCPXML</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="magenta" active onClick={handleDaVinciEdl}>
              <Download className="w-3.5 h-3.5" />
              <span>Export .EDL</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="cyan" active onClick={handleDaVinciLut}>
              <Palette className="w-3.5 h-3.5" />
              <span>Export .CUBE LUT</span>
            </HardwareButton>
          </div>
        </div>
      </section>

      {/* 3. INFINITY · VALERIUS (V) SENTINEL OF THE TEN GALAXIES + SOUL COOLING FORGE OPUS 4.7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section id="vortex-infinity" className="candy-surface rounded-[18px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-[#FF007F]" />
              <h2
                className="text-sm font-bold uppercase tracking-[0.16em] text-[#F5FFFA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                INFINITY · VALERIUS (V) · Sentinel of the Ten Galaxies
              </h2>
            </div>
            <LedStatusIndicator label={`Sector ${activeGalaxy + 1} / 10`} tone="magenta" />
          </div>

          <div ref={galaxyMountRef} className="w-full h-[220px] rounded-[14px] optical-glass overflow-hidden" />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {galaxies.map((g, i) => (
              <button
                key={g}
                type="button"
                data-active={activeGalaxy === i}
                onClick={() => setActiveGalaxy(i)}
                className="candy-trace-tile px-2.5 py-2 font-mono text-[10px] text-[#F5FFFA]/85 text-left truncate cursor-pointer"
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section id="vortex-soul" className="candy-surface rounded-[18px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-[#00D9C0]" />
              <h2
                className="text-sm font-bold uppercase tracking-[0.16em] text-[#F5FFFA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Soul · Cooling Forge &amp; Opus 4.7
              </h2>
            </div>
            <LedStatusIndicator label={`${coolingSpecs.targetFps} FPS Lock`} tone="cyan" />
          </div>

          <canvas ref={coolingCanvasRef} width={520} height={150} className="w-full h-[150px] rounded-[14px]" />

          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#E0FFFF]/60 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-[#FF007F]" /> CORE TEMP
              </span>
              <span className="text-sm font-bold text-[#F5FFFA] tabular-nums">{coolingSpecs.tempC}°C</span>
            </div>
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#E0FFFF]/60 block">COOLANT RPM</span>
              <span className="text-sm font-bold text-[#FC8EAC] tabular-nums">{coolingSpecs.fanRpm}</span>
            </div>
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#E0FFFF]/60 block">FRAME LOCK</span>
              <span className="text-sm font-bold text-[#00D9C0] tabular-nums">{coolingSpecs.targetFps} FPS</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['silent', 'Silent Cryo'],
                ['balanced', 'Balanced Studio'],
                ['opus_47', 'Opus 4.7 Forge'],
                ['cryo_144', '144fps Cryo-Boost'],
              ] as const
            ).map(([k, lbl]) => (
              <HardwareButton
                key={k}
                size="sm"
                tone={k === 'opus_47' || k === 'cryo_144' ? 'red' : 'magenta'}
                active={coolingProfile === k}
                onClick={() => setCoolingProfile(k)}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>
        </section>
      </div>

      {/* 4. REAL-TIME SEARCH, CONNECTOR SKILLS / MCP, ARTIFACTS, PROJECTS & EXISTING DB VERIFIER */}
      <section id="vortex-connectors" className="candy-surface rounded-[18px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-[#FF007F]" />
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#F5FFFA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Self-Hosted Connectors, MCP Skills, Real-Time Search &amp; Committed Databases
            </h2>
          </div>
          <LedStatusIndicator label="Cloud Vault Synchronized" tone="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <form onSubmit={handleRunSearch} className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#E0FFFF]/45 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Real-time studio & workspace query…"
                  className="w-full rounded-full bg-[#0A0A0A] pl-9 pr-4 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none"
                />
              </div>
              <HardwareButton type="submit" size="sm" tone="red" active>
                <span>Search Hub</span>
              </HardwareButton>
            </form>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => activateHubTile(r.target as HubSectionTarget)}
                    className="candy-trace-tile p-3 text-left cursor-pointer"
                  >
                    <div className="font-mono text-xs font-bold text-[#F5FFFA] truncate">{r.title}</div>
                    <div className="font-mono text-[10px] text-[#FC8EAC] truncate">{r.spec}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/65 block">
                Connector Skills &amp; MCP Dispatch
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ['blender_sync', '3D Asset (V) Sync'],
                  ['opus_cool', 'Opus 4.7 Cool'],
                  ['valerius_nav', 'Valerius Vector'],
                  ['sql_inspector', 'SQL / Cloud Audit'],
                ].map(([skillKey, label]) => (
                  <HardwareButton
                    key={skillKey}
                    size="sm"
                    tone="magenta"
                    active={mcpSkill === skillKey}
                    onClick={() => handleRunMcpSkill(skillKey)}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{label}</span>
                  </HardwareButton>
                ))}
              </div>
              <p className="font-mono text-xs text-[#F5FFFA]/75 pt-1">{mcpLog}</p>
            </div>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleVerifyDbConnection} className="space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/65 block">
                Verify Existing Cloud, SQL or Quantum Storage Endpoint
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="Label (e.g. Primary SQL)"
                  className="rounded-full bg-[#0A0A0A] px-3.5 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none"
                />
                <select
                  value={dbType}
                  onChange={(e) => setDbType(e.target.value as StudioConnectorDoc['connectorType'])}
                  className="rounded-full bg-[#0A0A0A] px-3.5 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">Committed SQLite</option>
                  <option value="firebase">Cloud Document Store</option>
                  <option value="quantum_storage">Quantum Vault</option>
                  <option value="mcp">Self-Hosted MCP</option>
                  <option value="self_hosted_llm">Self-Hosted LLM</option>
                </select>
                <input
                  type="text"
                  value={dbEndpoint}
                  onChange={(e) => setDbEndpoint(e.target.value)}
                  placeholder="host:port or cluster URI"
                  className="rounded-full bg-[#0A0A0A] px-3.5 py-2 font-mono text-xs text-[#F5FFFA] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#FFDAB9]">{dbVerifyMsg}</span>
                <HardwareButton type="submit" size="sm" tone="cyan" active>
                  <span>Verify &amp; Link Database</span>
                </HardwareButton>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dbList.slice(0, 4).map((c) => (
                <div key={c.id} className="candy-trace-tile p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#F5FFFA] truncate">{c.name}</div>
                    <div className="font-mono text-[10px] text-[#E0FFFF]/55 uppercase">
                      {c.connectorType} · {c.latencyMs}ms
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#00D9C0] uppercase shrink-0">{c.status}</span>
                </div>
              ))}
              {connectors.slice(0, 2).map((fc) => (
                <div key={fc.id} className="candy-trace-tile p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#F5FFFA] truncate">{fc.name}</div>
                    <div className="font-mono text-[10px] text-[#FC8EAC] uppercase">{fc.connectorType} · Cloud</div>
                  </div>
                  <span className="font-mono text-[10px] text-[#00D9C0] uppercase shrink-0">{fc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="candy-trace-tile p-4 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#F5FFFA]">
              <span className="flex items-center gap-1.5 font-bold">
                <FolderKanban className="w-3.5 h-3.5 text-[#FF007F]" /> Cloud Projects ({projects.length})
              </span>
              <span className="text-[10px] text-[#E0FFFF]/55">Cloud Committed</span>
            </div>
            <p className="font-mono text-[11px] text-[#E0FFFF]/65">
              {projects.length > 0
                ? projects.slice(0, 2).map((p) => p.label).join(' · ')
                : userId
                ? 'Rendered reels automatically commit to your cloud projects.'
                : 'Sign in with Google or Username & Password to sync studio projects.'}
            </p>
          </div>
          <div className="candy-trace-tile p-4 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#F5FFFA]">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#00D9C0]" /> Studio Artifacts ({artifacts.length})
              </span>
              <span className="text-[10px] text-[#E0FFFF]/55">GLB · Shaders · Cuts</span>
            </div>
            <p className="font-mono text-[11px] text-[#E0FFFF]/65">
              {artifacts.length > 0
                ? artifacts.slice(0, 2).map((a) => a.title).join(' · ')
                : '3D Asset (V) scenes, shader snapshots & cinema masters sync to cloud artifacts.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
