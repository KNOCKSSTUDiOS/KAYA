import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Clapperboard, Sparkles, Download, RotateCcw, Box, ShieldCheck } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';

interface StoryboardLogoPageProps {
  subjectUrl: string;
  environmentUrl: string;
  formatSummary: string;
}

type LogoMode = 'logo' | 'storyboard' | 'overdrive';

interface StoryboardBeat {
  shot: string;
  timecode: string;
  camera: string;
  lighting: string;
  action: string;
}

const STORYBOARD_BEATS: StoryboardBeat[] = [
  {
    shot: 'Shot 01 · Hero Silhouette',
    timecode: '00:00 – 00:02',
    camera: '24mm Wide Low-Angle Tracking',
    lighting: 'Deep Obsidian Rim + Cyan Edge Fill',
    action: '3D Icosahedron cage unfolds into primary subject silhouette.',
  },
  {
    shot: 'Shot 02 · Macro Texture Sweep',
    timecode: '00:02 – 00:04',
    camera: '85mm Prime Rack Focus',
    lighting: 'Anamorphic Flare + Specular Catch',
    action: 'Surface grain, brushed alloy bevels, and neon perimeter glow lock in.',
  },
  {
    shot: 'Shot 03 · 360° Orbital Push',
    timecode: '00:04 – 00:06',
    camera: '360° Continuous Gimbal Orbit',
    lighting: 'Dual Neon Red & Electric Cyan Cross-Key',
    action: 'Dynamic motion trails wrap subject across environment horizon.',
  },
  {
    shot: 'Shot 04 · Beat Drop Action Cut',
    timecode: '00:06 – 00:08',
    camera: 'Dolly Zoom Speed-Ramp (120fps)',
    lighting: 'High-Contrast Magenta Pulse',
    action: 'KAYA™ Music 2024–2026 bass transient drives camera impact frame.',
  },
  {
    shot: 'Shot 05 · Volumetric Finale',
    timecode: '00:08 – 00:10',
    camera: 'Locked Anamorphic Cinema 2.39:1',
    lighting: 'Balanced HDR Studio Master',
    action: 'Clean held final lockup with © 2024–2026 KAYA™ watermark seal.',
  },
];

export function StoryboardLogoPage({
  subjectUrl,
  environmentUrl,
  formatSummary,
}: StoryboardLogoPageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const shapeRef = useRef<THREE.Mesh | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const speedRef = useRef({ x: 0.006, y: 0.01 });

  const [mode, setMode] = useState<LogoMode>('logo');
  const [statusBanner, setStatusBanner] = useState('KAYA™ 3D Interactive Engine Active.');
  const [selectedShot, setSelectedShot] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.z = 5.4;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00e5ff, 2.8, 100);
    pointLight.position.set(8, 8, 10);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    const rimLight = new THREE.PointLight(0xff1e42, 2.2, 100);
    rimLight.position.set(-8, -6, 6);
    scene.add(rimLight);

    const geometry = new THREE.IcosahedronGeometry(2.05, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0x002433,
    });
    const shape = new THREE.Mesh(geometry, material);
    scene.add(shape);
    shapeRef.current = shape;

    // Inner obsidian core so wireframe gleams like hardware
    const coreGeo = new THREE.IcosahedronGeometry(1.42, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x080a10,
      roughness: 0.35,
      metalness: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    shape.add(core);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (autoSpin) {
        shape.rotation.x += speedRef.current.x;
        shape.rotation.y += speedRef.current.y;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
    };
  }, [autoSpin]);

  const triggerMode = (next: LogoMode) => {
    setMode(next);
    const mat = shapeRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (next === 'logo') {
      if (mat) {
        mat.color.setHex(0x00e5ff);
        mat.emissive.setHex(0x002433);
      }
      if (pointLightRef.current) pointLightRef.current.color.setHex(0x00e5ff);
      speedRef.current = { x: 0.006, y: 0.01 };
      setStatusBanner('KAYA™ 3D Interactive Engine Active · © 2024–2026 Protected.');
    } else if (next === 'storyboard') {
      if (mat) {
        mat.color.setHex(0xe6399b);
        mat.emissive.setHex(0x3a0024);
      }
      if (pointLightRef.current) pointLightRef.current.color.setHex(0xe6399b);
      speedRef.current = { x: 0.009, y: 0.014 };
      setStatusBanner('5-Shot 3D Cinema Storyboard Sequence Generated & Synced.');
    } else {
      if (mat) {
        mat.color.setHex(0xff1e42);
        mat.emissive.setHex(0x450010);
      }
      if (pointLightRef.current) pointLightRef.current.color.setHex(0xff1e42);
      speedRef.current = { x: 0.016, y: 0.024 };
      setStatusBanner('Overdrive 120fps Wireframe Telemetry Pulse Active.');
    }
  };

  const handleExportStoryboard = () => {
    const payload = {
      studio: 'KAYA™ 4K HDR Studio',
      copyright: '© 2024–2026 KAYA™ Music & Studio — All Rights Reserved',
      format: formatSummary,
      mode,
      beats: STORYBOARD_BEATS,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaya-3d-storyboard-2024-2026.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const beat = STORYBOARD_BEATS[selectedShot];

  return (
    <PlateBezel accent={mode === 'storyboard' ? 'magenta' : mode === 'overdrive' ? 'red' : 'cyan'} className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clapperboard className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            3D Interactive Logo &amp; Storyboard Deck
          </h2>
        </div>
        <LedStatusIndicator
          label="© 2024–2026 KAYA™"
          tone={mode === 'storyboard' ? 'magenta' : mode === 'overdrive' ? 'red' : 'cyan'}
          pulse
        />
      </div>

      {/* Interactive 3D Viewport */}
      <div className="cnc-recess rounded-[12px] p-2 relative overflow-hidden">
        <div
          className="relative w-full h-[340px] sm:h-[380px] rounded-[9px] overflow-hidden border border-white/10"
          style={{
            background: 'radial-gradient(circle at center, #140826 0%, #050510 68%, #020305 100%)',
          }}
        >
          <div ref={mountRef} className="w-full h-full" />

          {/* Top Watermark Stamp Badge */}
          <div className="pointer-events-none absolute top-3 left-3 px-2.5 py-1 rounded bg-black/75 border border-white/15 font-mono text-[10px] uppercase tracking-widest text-[#00E5FF] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#FF3B5C]" />
            <span>© 2024–2026 KAYA™ · {formatSummary}</span>
          </div>

          {/* Floating Glass Action Output Pill (from interactive 3D Storyboard engine) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl flex flex-col items-center gap-2.5">
            <div className="w-full rounded-[10px] bg-black/75 backdrop-blur-md border border-white/15 px-4 py-2.5 text-center">
              <p className="font-mono text-xs text-white font-semibold">{statusBanner}</p>
              <p className="font-mono text-[11px] text-[#E6ECF5]/70 mt-0.5">
                Active Scene: {beat.shot} ({beat.timecode}) — {beat.camera}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <HardwareButton size="sm" tone="cyan" active={mode === 'logo'} onClick={() => triggerMode('logo')}>
                <Box className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>3D KAYA™ Logo</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="magenta" active={mode === 'storyboard'} onClick={() => triggerMode('storyboard')}>
                <Sparkles className="w-3.5 h-3.5 text-[#FF64B8]" />
                <span>Generate Storyboard</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="red" active={mode === 'overdrive'} onClick={() => triggerMode('overdrive')}>
                <span>Overdrive Pulse</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="neutral" active={autoSpin} onClick={() => setAutoSpin((s) => !s)}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{autoSpin ? 'Spin ON' : 'Paused'}</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="cyan" active={false} onClick={handleExportStoryboard}>
                <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Export Storyboard</span>
              </HardwareButton>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Shot Storyboard Filmstrip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {STORYBOARD_BEATS.map((item, idx) => (
          <button
            key={item.shot}
            type="button"
            onClick={() => {
              setSelectedShot(idx);
              triggerMode('storyboard');
            }}
            className={`text-left p-3 rounded-[9px] cnc-module transition-all cursor-pointer border ${
              selectedShot === idx
                ? 'border-[#FF64B8] shadow-[0_0_16px_rgba(230,57,155,0.28)]'
                : 'border-white/10 hover:border-[#00E5FF]/50'
            }`}
          >
            <div className="relative aspect-video rounded-[6px] overflow-hidden bg-black mb-2 border border-white/10">
              <img
                src={idx % 2 === 0 ? environmentUrl : subjectUrl}
                alt={item.shot}
                className="w-full h-full object-cover opacity-80"
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-[#00E5FF]">
                {item.timecode}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-white truncate">{item.shot}</div>
            <div className="font-mono text-[10px] text-[#00E5FF] mt-0.5 truncate">{item.camera}</div>
            <p className="text-[11px] text-[#E6ECF5]/65 mt-1 line-clamp-2">{item.action}</p>
          </button>
        ))}
      </div>
    </PlateBezel>
  );
}
