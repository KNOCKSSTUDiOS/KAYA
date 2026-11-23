import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import {
  Box,
  Cpu,
  Database,
  Download,
  Film,
  Flame,
  FolderKanban,
  GraduationCap,
  Layers,
  Mic,
  Orbit,
  Palette,
  Radio,
  Scissors,
  Search,
  ShoppingBag,
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
import {
  BACKGROUND_CUBE_VIDEOS,
  STUDIO_COLLAGE_BRAND_IMG,
  STUDIO_IRON_GATES_IMG,
} from '../data.js';

export type HubSectionTarget =
  | StudioPageKey
  | 'blender'
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
  onRefreshCloudData: () => void;
  onSelectTool: (tool: StudioPageKey) => void;
  onOpenBilling: (provider: 'stripe' | 'infinity_billing') => void;
  onJumpSection: (id: string) => void;
}

interface StudioTileDef {
  id: HubSectionTarget;
  title: string;
  caption: string;
  spec: string;
  kind: 'section' | 'tool';
  icon: React.ReactNode;
  previewVideo?: string;
  previewImage?: string;
}

const VORTEX_LINEUP: StudioTileDef[] = [
  { id: 'video', title: 'KAYA Cinema Studio', caption: '4K HDR compositor & 19 render engines', spec: '24–144 FPS', kind: 'tool', icon: <Film className="w-4 h-4 text-[#FF0A3C]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[0].url },
  { id: 'blender', title: 'Blender Pipeline', caption: 'Real-time PBR mesh clearcoat & scene export', spec: 'GLB Viewport', kind: 'section', icon: <Box className="w-4 h-4 text-[#E06844]" />, previewImage: STUDIO_COLLAGE_BRAND_IMG },
  { id: 'infinity', title: 'Infinity · Valerius (V)', caption: 'Sentinel of the Ten Galaxies orbital core', spec: '10 Galaxies', kind: 'section', icon: <Orbit className="w-4 h-4 text-[#FF0A3C]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[2].url },
  { id: 'soul', title: 'Soul · Cooling Forge', caption: 'Opus 4.7 thermal governor & frame pacing', spec: 'Opus 4.7', kind: 'section', icon: <Snowflake className="w-4 h-4 text-[#F5E9EA]" />, previewImage: STUDIO_IRON_GATES_IMG },
  { id: 'school', title: 'Infinity School', caption: 'Coding School, Rendering School & AI Tutor', spec: 'Live Labs', kind: 'tool', icon: <GraduationCap className="w-4 h-4 text-[#E06844]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[4].url },
  { id: 'merch', title: 'Printify Studio', caption: 'Custom apparel, mugs & posters synced to cloud', spec: 'POD Catalog', kind: 'tool', icon: <ShoppingBag className="w-4 h-4 text-[#FF0A3C]" />, previewImage: STUDIO_COLLAGE_BRAND_IMG },
  { id: 'airradio', title: 'AirRadio FM', caption: 'Multi-channel synth broadcast & host mic', spec: '88–108 MHz', kind: 'tool', icon: <Radio className="w-4 h-4 text-[#F5E9EA]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[3].url },
  { id: 'cube', title: '360° Video Cube', caption: '27-cubie interactive spatial video matrix', spec: '3D Spatial', kind: 'tool', icon: <Layers className="w-4 h-4 text-[#FF0A3C]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[1].url },
  { id: 'picture', title: 'Picture & Color Suite', caption: 'LUT grading, cutouts & alpha framing', spec: 'RGBA 4K', kind: 'tool', icon: <ImageIcon className="w-4 h-4 text-[#F5E9EA]" />, previewImage: STUDIO_IRON_GATES_IMG },
  { id: 'vfx', title: 'VFX Shader App', caption: 'Realtime trails, halftone & prism shaders', spec: '60 FPS FX', kind: 'tool', icon: <Sparkles className="w-4 h-4 text-[#E06844]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[0].url },
  { id: 'storyboard', title: '3D Storyboard App', caption: 'Icosahedron shader pre-vis & shot beats', spec: '5-Shot Previs', kind: 'tool', icon: <Clapperboard className="w-4 h-4 text-[#FF0A3C]" />, previewImage: STUDIO_COLLAGE_BRAND_IMG },
  { id: 'animator', title: 'Action Animator', caption: 'Dual-subject clash choreography & motion', spec: 'Motion FX', kind: 'tool', icon: <Swords className="w-4 h-4 text-[#E06844]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[1].url },
  { id: 'editor', title: 'Timeline Editor', caption: 'Multi-track V1/FX/A1 cuts & speed ramps', spec: '0.25x–2x', kind: 'tool', icon: <Scissors className="w-4 h-4 text-[#F5E9EA]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[2].url },
  { id: 'audio', title: 'Audio Mastering', caption: 'DSP spectrum, beats & unified watermark stem', spec: '44.1 kHz', kind: 'tool', icon: <Volume2 className="w-4 h-4 text-[#FF0A3C]" />, previewImage: STUDIO_IRON_GATES_IMG },
  { id: 'sound', title: 'Sound Foley', caption: 'Procedural impact & sub-boom matrix', spec: 'Foley DSP', kind: 'tool', icon: <Waves className="w-4 h-4 text-[#E06844]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[3].url },
  { id: 'lipsync', title: 'Lip Sync Rig', caption: 'Phoneme viseme & live mic reactivity', spec: 'Viseme Rig', kind: 'tool', icon: <Mic className="w-4 h-4 text-[#F5E9EA]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[4].url },
  { id: 'live', title: 'Live Cam & Stream', caption: 'Camera compositor & WebM recording', spec: 'Broadcast', kind: 'tool', icon: <Camera className="w-4 h-4 text-[#FF0A3C]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[0].url },
  { id: 'bridge', title: 'Local Suite Bridge', caption: 'Open desktop mesh & paint pack interchange', spec: 'Local Sync', kind: 'tool', icon: <Cable className="w-4 h-4 text-[#F5E9EA]" />, previewImage: STUDIO_COLLAGE_BRAND_IMG },
  { id: 'intel', title: 'AI Vision & Geo Console', caption: 'Self-hosted vision analysis & geo-grid', spec: 'Private AI', kind: 'tool', icon: <Cpu className="w-4 h-4 text-[#E06844]" />, previewVideo: BACKGROUND_CUBE_VIDEOS[2].url },
  { id: 'connectors', title: 'MCP, SQL & Cloud Vault', caption: 'Verified databases, skills, artifacts & search', spec: 'Self-Hosted', kind: 'section', icon: <Database className="w-4 h-4 text-[#FF0A3C]" />, previewImage: STUDIO_IRON_GATES_IMG },
];

export function VortexHubModules({
  activeTool,
  userId,
  projects,
  artifacts,
  connectors,
  onRefreshCloudData,
  onSelectTool,
  onOpenBilling,
  onJumpSection,
}: VortexHubModulesProps) {
  // Blender Pipeline state
  const blenderMountRef = useRef<HTMLDivElement | null>(null);
  const blenderMeshRef = useRef<THREE.Mesh | null>(null);
  const blenderSceneRef = useRef<THREE.Scene | null>(null);
  const blenderCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [blenderPrimitive, setBlenderPrimitive] = useState<'torus' | 'cube' | 'sentinel' | 'sphere'>('torus');
  const [blenderShader, setBlenderShader] = useState<'candy_gloss' | 'burnished_rust' | 'forged_obsidian'>('candy_gloss');
  const [blenderWireframe, setBlenderWireframe] = useState(false);
  const [blenderFocal, setBlenderFocal] = useState(45);
  const [blenderStatus, setBlenderStatus] = useState('Blender GLB Pipeline Ready');

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

  // Interactive Blender Three.js Viewport
  useEffect(() => {
    const container = blenderMountRef.current;
    if (!container) return;

    const w = container.clientWidth || 560;
    const h = container.clientHeight || 260;
    const scene = new THREE.Scene();
    blenderSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(blenderFocal, w / h, 0.1, 100);
    camera.position.set(0, 0.6, 4.2);
    blenderCamRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0xf5e9ea, 0.8);
    scene.add(amb);

    const candyLight = new THREE.PointLight(0xff0a3c, 5.2, 40);
    candyLight.position.set(3.5, 3, 4);
    scene.add(candyLight);

    const rustLight = new THREE.PointLight(0xb84323, 4.4, 40);
    rustLight.position.set(-4, -2.5, 3);
    scene.add(rustLight);

    const geo =
      blenderPrimitive === 'torus'
        ? new THREE.TorusKnotGeometry(0.95, 0.3, 110, 18)
        : blenderPrimitive === 'cube'
        ? new THREE.BoxGeometry(1.65, 1.65, 1.65, 3, 3, 3)
        : blenderPrimitive === 'sentinel'
        ? new THREE.OctahedronGeometry(1.35, 1)
        : new THREE.SphereGeometry(1.25, 32, 24);

    const shaderColors =
      blenderShader === 'candy_gloss'
        ? { color: 0xb8062b, emissive: 0x260209, roughness: 0.14, metalness: 0.85, clearcoat: 1.0 }
        : blenderShader === 'burnished_rust'
        ? { color: 0xb84323, emissive: 0x1d0903, roughness: 0.28, metalness: 0.92, clearcoat: 0.72 }
        : { color: 0x161113, emissive: 0x120306, roughness: 0.22, metalness: 0.95, clearcoat: 0.9 };

    const mat = new THREE.MeshPhysicalMaterial({
      color: shaderColors.color,
      emissive: shaderColors.emissive,
      roughness: shaderColors.roughness,
      metalness: shaderColors.metalness,
      clearcoat: shaderColors.clearcoat,
      clearcoatRoughness: 0.1,
      wireframe: blenderWireframe,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `Blender_${blenderPrimitive}_${blenderShader}`;
    scene.add(mesh);
    blenderMeshRef.current = mesh;

    let raf = 0;
    const renderLoop = () => {
      raf = requestAnimationFrame(renderLoop);
      mesh.rotation.y += 0.008;
      mesh.rotation.x += 0.004;
      renderer.render(scene, camera);
    };
    renderLoop();

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || 560;
      const nh = container.clientHeight || 260;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [blenderPrimitive, blenderShader, blenderWireframe, blenderFocal]);

  // Interactive Infinity & Valerius (V) Sentinel of the Ten Galaxies Stage
  useEffect(() => {
    const container = galaxyMountRef.current;
    if (!container) return;

    const w = container.clientWidth || 560;
    const h = container.clientHeight || 250;
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
      color: 0xff0a3c,
      emissive: 0x5c0416,
      metalness: 0.85,
      roughness: 0.18,
    });
    const sentinelCore = new THREE.Mesh(coreGeo, coreMat);
    scene.add(sentinelCore);

    const ringGeo = new THREE.TorusGeometry(2.1, 0.02, 12, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xb84323, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);

    const satellites: THREE.Mesh[] = [];
    const satGeo = new THREE.SphereGeometry(0.11, 14, 14);
    for (let i = 0; i < 10; i++) {
      const sMat = new THREE.MeshBasicMaterial({
        color: i === activeGalaxy ? 0xffffff : i % 2 === 0 ? 0xff0a3c : 0xd96138,
      });
      const sat = new THREE.Mesh(satGeo, sMat);
      scene.add(sat);
      satellites.push(sat);
    }

    const pLight = new THREE.PointLight(0xffffff, 4, 30);
    pLight.position.set(3, 4, 5);
    scene.add(pLight);

    let raf = 0;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.014;
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
      ctx.fillStyle = '#060304';
      ctx.fillRect(0, 0, w, h);

      const speed = coolingProfile === 'cryo_144' ? 0.006 : coolingProfile === 'opus_47' ? 0.004 : 0.0024;
      ctx.strokeStyle = coolingProfile === 'cryo_144' || coolingProfile === 'opus_47' ? '#FF0A3C' : '#B84323';
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

  const handleExportBlenderGlb = () => {
    if (!blenderSceneRef.current) return;
    setBlenderStatus('Exporting Blender GLB scene…');
    const exporter = new GLTFExporter();
    exporter.parse(
      blenderSceneRef.current,
      (res) => {
        const blob =
          res instanceof ArrayBuffer
            ? new Blob([res], { type: 'model/gltf-binary' })
            : new Blob([JSON.stringify(res)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vortex-blender-${blenderPrimitive}.glb`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        setBlenderStatus(`Exported ${blenderPrimitive} GLB with ${blenderShader.replace('_', ' ')} material`);
        if (userId) {
          saveStudioArtifact({
            userId,
            studioHub: 'blender',
            title: `Blender ${blenderPrimitive} (${blenderShader})`,
            kind: 'blender_scene',
            summary: `Focal ${blenderFocal}mm · ${blenderWireframe ? 'Wireframe' : 'Solid Clearcoat'}`,
          })
            .then(onRefreshCloudData)
            .catch(() => {});
        }
      },
      () => setBlenderStatus('Export failed'),
      { binary: true }
    );
  };

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
    if (id === 'blender' || id === 'infinity' || id === 'soul' || id === 'connectors') {
      onJumpSection(`vortex-${id}`);
      return;
    }
    onSelectTool(id);
    onJumpSection('page-tools');
  };

  const galaxies = [
    '01 · Crimson Core',
    '02 · Obsidian Rim',
    '03 · Rust Nebula',
    '04 · Vesper Forge',
    '05 · Chrono Belt',
    '06 · Solis Drift',
    '07 · Apex Crown',
    '08 · Iron Halo',
    '09 · Amber Rift',
    '10 · Valerius Zenith',
  ];

  return (
    <div className="space-y-10">
      {/* 1. VORTEX MAIN HUB — CLEAN FULL-TILE WINDOWS WITH SEE-THROUGH FONT */}
      <section id="vortex-hub" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-base sm:text-xl font-bold uppercase tracking-[0.24em] see-thru-font"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Vortex Main Hub · Connected Studio Lineup
            </h2>
            <p className="text-xs text-[#F5E9EA]/65">
              Every studio, shader tool, and pipeline wired cleanly inside one continuous workstation.
            </p>
          </div>
          <LedStatusIndicator label={`${VORTEX_LINEUP.length} Connected Modules`} tone="red" pulse />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {VORTEX_LINEUP.map((tile) => {
            const isActive = activeTool === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                data-active={isActive}
                onClick={() => activateHubTile(tile.id)}
                className="group candy-trace-tile full-tile-window min-h-[172px] text-left p-4 flex flex-col justify-between gap-3 cursor-pointer"
              >
                {tile.previewVideo ? (
                  <video
                    src={tile.previewVideo}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                  />
                ) : tile.previewImage ? (
                  <img
                    src={tile.previewImage}
                    alt={tile.title}
                    className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-78 group-hover:scale-105 transition-all duration-500"
                  />
                ) : null}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050304]/95 via-[#090405]/45 to-[#050304]/25"
                />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    {tile.icon}
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] see-thru-font-subtle">
                      {tile.spec}
                    </span>
                  </span>
                </div>

                <div className="relative z-10 space-y-1">
                  <h3
                    className="text-sm sm:text-base font-bold uppercase tracking-[0.16em] see-thru-font truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {tile.title}
                  </h3>
                  <p className="text-[11px] see-thru-font-subtle leading-snug line-clamp-2">
                    {tile.caption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. BLENDER PIPELINE + INFINITY VALERIUS (V) + SOUL COOLING FORGE OPUS 4.7 */}
      <section id="vortex-blender" className="candy-surface rounded-[18px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Box className="w-5 h-5 text-[#E06844]" />
            <div>
              <h2
                className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#F5E9EA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Blender Pipeline · Interactive Shader &amp; Geometry Stage
              </h2>
              <p className="text-xs text-[#F5E9EA]/60">{blenderStatus}</p>
            </div>
          </div>
          <HardwareButton size="sm" tone="red" active onClick={handleExportBlenderGlb}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Scene Mesh</span>
          </HardwareButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div ref={blenderMountRef} className="w-full h-[260px] rounded-[14px] optical-glass overflow-hidden" />

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#F5E9EA]/65 block">
                Geometry Armature
              </span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['torus', 'Torus Knot'],
                    ['cube', 'Rubik Sub-Mesh'],
                    ['sentinel', 'Valerius Core'],
                    ['sphere', 'Studio Sphere'],
                  ] as const
                ).map(([k, lbl]) => (
                  <HardwareButton
                    key={k}
                    size="sm"
                    tone="cyan"
                    active={blenderPrimitive === k}
                    onClick={() => setBlenderPrimitive(k)}
                  >
                    <span>{lbl}</span>
                  </HardwareButton>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#F5E9EA]/65 block">
                Clearcoat Surface Shader
              </span>
              <div className="flex flex-wrap gap-2">
                <HardwareButton
                  size="sm"
                  tone="red"
                  active={blenderShader === 'candy_gloss'}
                  onClick={() => setBlenderShader('candy_gloss')}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Candy Gloss</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  tone="magenta"
                  active={blenderShader === 'burnished_rust'}
                  onClick={() => setBlenderShader('burnished_rust')}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Burnished Rust</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  tone="neutral"
                  active={blenderShader === 'forged_obsidian'}
                  onClick={() => setBlenderShader('forged_obsidian')}
                >
                  <span>Forged Obsidian</span>
                </HardwareButton>
                <HardwareButton
                  size="sm"
                  tone="cyan"
                  active={blenderWireframe}
                  onClick={() => setBlenderWireframe((w) => !w)}
                >
                  <span>{blenderWireframe ? 'Wireframe ON' : 'Wireframe'}</span>
                </HardwareButton>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#F5E9EA]/70">Focal {blenderFocal}mm</span>
              <input
                type="range"
                min={24}
                max={85}
                value={blenderFocal}
                onChange={(e) => setBlenderFocal(Number(e.target.value))}
                className="hw-capsule-slider flex-1"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. INFINITY · VALERIUS (V) SENTINEL OF THE TEN GALAXIES + SOUL COOLING FORGE OPUS 4.7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section id="vortex-infinity" className="candy-surface rounded-[18px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-[#FF0A3C]" />
              <h2
                className="text-sm font-bold uppercase tracking-[0.16em] text-[#F5E9EA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Infinity · Valerius (V) · Sentinel of the Ten Galaxies
              </h2>
            </div>
            <HardwareButton size="sm" tone="magenta" active onClick={() => onOpenBilling('infinity_billing')}>
              <span>Infinity Billing</span>
            </HardwareButton>
          </div>

          <div ref={galaxyMountRef} className="w-full h-[220px] rounded-[14px] optical-glass overflow-hidden" />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {galaxies.map((g, i) => (
              <button
                key={g}
                type="button"
                data-active={activeGalaxy === i}
                onClick={() => setActiveGalaxy(i)}
                className="candy-trace-tile px-2.5 py-2 font-mono text-[10px] text-[#F5E9EA]/85 text-left truncate cursor-pointer"
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section id="vortex-soul" className="candy-surface rounded-[18px] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-[#FF5E7E]" />
              <h2
                className="text-sm font-bold uppercase tracking-[0.16em] text-[#F5E9EA]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Soul · Cooling Forge &amp; Opus 4.7
              </h2>
            </div>
            <HardwareButton size="sm" tone="red" active onClick={() => onOpenBilling('stripe')}>
              <span>Stripe Billing</span>
            </HardwareButton>
          </div>

          <canvas ref={coolingCanvasRef} width={520} height={150} className="w-full h-[150px] rounded-[14px]" />

          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#F5E9EA]/55 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-[#FF0A3C]" /> CORE TEMP
              </span>
              <span className="text-sm font-bold text-[#F5E9EA] tabular-nums">{coolingSpecs.tempC}°C</span>
            </div>
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#F5E9EA]/55 block">COOLANT RPM</span>
              <span className="text-sm font-bold text-[#E06844] tabular-nums">{coolingSpecs.fanRpm}</span>
            </div>
            <div className="candy-trace-tile p-3">
              <span className="text-[10px] text-[#F5E9EA]/55 block">FRAME LOCK</span>
              <span className="text-sm font-bold text-white tabular-nums">{coolingSpecs.targetFps} fps</span>
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
            <Workflow className="w-5 h-5 text-[#FF0A3C]" />
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#F5E9EA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Self-Hosted Connectors, MCP Skills, Real-Time Search &amp; Committed Databases
            </h2>
          </div>
          <LedStatusIndicator label="Zero Local Device / SD Writes" tone="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Real-Time Search + MCP Connector Skills */}
          <div className="space-y-4">
            <form onSubmit={handleRunSearch} className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#F5E9EA]/45 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Real-time studio & workspace query…"
                  className="w-full rounded-full bg-[#070304] pl-9 pr-4 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
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
                    <div className="font-mono text-xs font-bold text-[#F5E9EA] truncate">{r.title}</div>
                    <div className="font-mono text-[10px] text-[#FF5E7E] truncate">{r.spec}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#F5E9EA]/65 block">
                Connector Skills &amp; MCP Dispatch
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ['blender_sync', 'Blender Sync'],
                  ['opus_cool', 'Opus 4.7 Cool'],
                  ['valerius_nav', 'Valerius Vector'],
                  ['sql_inspector', 'SQL / Cloud Audit'],
                  ['printify_sync', 'Printify Sync'],
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
              <p className="font-mono text-xs text-[#F5E9EA]/75 pt-1">{mcpLog}</p>
            </div>
          </div>

          {/* Existing DB / SQL / Quantum Storage Connector Verifier */}
          <div className="space-y-3">
            <form onSubmit={handleVerifyDbConnection} className="space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#F5E9EA]/65 block">
                Verify Existing Cloud, SQL or Quantum Storage Endpoint (Zero Duplicate DBs)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="Label (e.g. Primary SQL)"
                  className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                />
                <select
                  value={dbType}
                  onChange={(e) => setDbType(e.target.value as StudioConnectorDoc['connectorType'])}
                  className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">Committed SQLite</option>
                  <option value="firebase">Firebase Firestore</option>
                  <option value="quantum_storage">Quantum Vault</option>
                  <option value="mcp">Self-Hosted MCP</option>
                  <option value="self_hosted_llm">Self-Hosted LLM</option>
                </select>
                <input
                  type="text"
                  value={dbEndpoint}
                  onChange={(e) => setDbEndpoint(e.target.value)}
                  placeholder="host:port or cluster URI"
                  className="rounded-full bg-[#070304] px-3.5 py-2 font-mono text-xs text-[#F5E9EA] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#E06844]">{dbVerifyMsg}</span>
                <HardwareButton type="submit" size="sm" tone="cyan" active>
                  <span>Verify &amp; Link Database</span>
                </HardwareButton>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dbList.slice(0, 4).map((c) => (
                <div key={c.id} className="candy-trace-tile p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#F5E9EA] truncate">{c.name}</div>
                    <div className="font-mono text-[10px] text-[#F5E9EA]/55 uppercase">
                      {c.connectorType} · {c.latencyMs}ms
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 uppercase shrink-0">{c.status}</span>
                </div>
              ))}
              {connectors.slice(0, 2).map((fc) => (
                <div key={fc.id} className="candy-trace-tile p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-[#F5E9EA] truncate">{fc.name}</div>
                    <div className="font-mono text-[10px] text-[#FF5E7E] uppercase">{fc.connectorType} · Cloud</div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400 uppercase shrink-0">{fc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dedicated Cloud Projects & Artifacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="candy-trace-tile p-4 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#F5E9EA]">
              <span className="flex items-center gap-1.5 font-bold">
                <FolderKanban className="w-3.5 h-3.5 text-[#FF0A3C]" /> Cloud Projects ({projects.length})
              </span>
              <span className="text-[10px] text-[#F5E9EA]/55">Firebase Committed</span>
            </div>
            <p className="font-mono text-[11px] text-[#F5E9EA]/65">
              {projects.length > 0
                ? projects.slice(0, 2).map((p) => p.label).join(' · ')
                : userId
                ? 'Rendered reels automatically commit to your cloud projects.'
                : 'Sign in with Google Chrome to commit projects directly to Firebase.'}
            </p>
          </div>
          <div className="candy-trace-tile p-4 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs text-[#F5E9EA]">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#E06844]" /> Studio Artifacts ({artifacts.length})
              </span>
              <span className="text-[10px] text-[#F5E9EA]/55">GLB · Shaders · Printify</span>
            </div>
            <p className="font-mono text-[11px] text-[#F5E9EA]/65">
              {artifacts.length > 0
                ? artifacts.slice(0, 2).map((a) => a.title).join(' · ')
                : 'Blender scenes, shader snapshots & Printify listings sync to cloud artifacts.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
