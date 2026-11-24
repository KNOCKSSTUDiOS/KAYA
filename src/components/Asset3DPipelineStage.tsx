import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Box, Download, Flame, Palette, Sparkles, Upload, Layers } from 'lucide-react';
import { HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import {
  Asset3DState,
  ShaderPresetKey,
  STUDIO_SHADER_PRESETS,
} from '../lib/studioPipelineTypes.js';

interface Asset3DPipelineStageProps {
  assetState: Asset3DState;
  onChangeAssetState: (patch: Partial<Asset3DState>) => void;
  onExportArtifact?: (title: string, summary: string) => void;
  onSendToVideoPipeline?: (assetState: Asset3DState) => void;
}

/**
 * Multi-part procedural 'V' Sentinel Crest (KNOCKSSTUDiOS · INFINITY VALERIUS V).
 */
function buildProceduralVAssetGroup(
  primaryMat: THREE.Material,
  accentMat: THREE.Material,
  haloMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'KNOCKSSTUDiOS_Asset_V';

  // Left & Right sculpted beveled V-wings
  const leftShape = new THREE.Shape();
  leftShape.moveTo(-1.18, 1.15);
  leftShape.lineTo(-0.72, 1.15);
  leftShape.lineTo(-0.08, -0.78);
  leftShape.lineTo(-0.36, -1.15);
  leftShape.closePath();

  const rightShape = new THREE.Shape();
  rightShape.moveTo(0.72, 1.15);
  rightShape.lineTo(1.18, 1.15);
  rightShape.lineTo(0.36, -1.15);
  rightShape.lineTo(0.08, -0.78);
  rightShape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 3,
  };

  const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
  leftGeo.center();
  const leftWing = new THREE.Mesh(leftGeo, primaryMat);
  leftWing.position.set(-0.52, 0.05, 0);
  group.add(leftWing);

  const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
  rightGeo.center();
  const rightWing = new THREE.Mesh(rightGeo, primaryMat);
  rightWing.position.set(0.52, 0.05, 0);
  group.add(rightWing);

  // Apex Diamond Core at V Vertex
  const diamondGeo = new THREE.OctahedronGeometry(0.36, 0);
  const diamond = new THREE.Mesh(diamondGeo, accentMat);
  diamond.position.set(0, -0.82, 0.04);
  diamond.scale.set(0.95, 1.35, 0.72);
  group.add(diamond);

  // Inner Precision Halo Ring
  const haloGeo = new THREE.TorusGeometry(1.42, 0.045, 18, 72);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI * 0.16;
  group.add(halo);

  // Gunmetal Anchor Pedestal Ring
  const baseGeo = new THREE.CylinderGeometry(0.92, 1.08, 0.1, 36);
  const base = new THREE.Mesh(baseGeo, accentMat);
  base.position.set(0, -1.42, 0);
  group.add(base);

  return group;
}

function createMaterialForShader(
  shaderKey: ShaderPresetKey,
  wireframe: boolean,
  customUniformsRef: React.MutableRefObject<{ time: { value: number } }[]>
): { primary: THREE.Material; accent: THREE.Material; halo: THREE.Material } {
  if (shaderKey === 'quantum_teal_holo' || shaderKey === 'bioluminescent_magenta') {
    const primaryColor = shaderKey === 'bioluminescent_magenta' ? new THREE.Color(0xff007f) : new THREE.Color(0x00d9c0);
    const rimColor = shaderKey === 'bioluminescent_magenta' ? new THREE.Color(0x00d9c0) : new THREE.Color(0xfc8eac);
    const timeUniform = { value: 0 };
    customUniformsRef.current.push({ time: timeUniform });

    const shaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: timeUniform,
        uBaseColor: { value: primaryColor },
        uRimColor: { value: rimColor },
      },
      wireframe,
      transparent: true,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uRimColor;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, normalize(vNormal))), 2.4);
          float pulse = 0.55 + 0.45 * sin(vWorldPos.y * 6.0 - uTime * 3.2);
          vec3 base = mix(vec3(0.04, 0.04, 0.04), uBaseColor, 0.55 + 0.25 * pulse);
          vec3 col = mix(base, uRimColor * 1.25, clamp(fresnel * 1.15, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.96);
        }
      `,
    });

    const accentMat = new THREE.MeshPhysicalMaterial({
      color: shaderKey === 'bioluminescent_magenta' ? 0x00d9c0 : 0xff007f,
      emissive: shaderKey === 'bioluminescent_magenta' ? 0x00332d : 0x330019,
      metalness: 0.9,
      roughness: 0.14,
      clearcoat: 1.0,
      wireframe,
    });
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xf5fffa,
      emissive: shaderKey === 'bioluminescent_magenta' ? 0xfc8eac : 0xe0ffff,
      emissiveIntensity: 0.45,
      metalness: 0.95,
      roughness: 0.12,
      wireframe,
    });
    return { primary: shaderMat, accent: accentMat, halo: haloMat };
  }

  const pbrSpec =
    shaderKey === 'candy_pearlescent'
      ? { color: 0xfc8eac, emissive: 0x260015, sheenColor: 0xe0ffff, metalness: 0.72, roughness: 0.12, clearcoat: 1.0 }
      : shaderKey === 'fresnel_peach_rim'
      ? { color: 0xffdab9, emissive: 0x2b1708, sheenColor: 0xff007f, metalness: 0.9, roughness: 0.18, clearcoat: 0.92 }
      : { color: 0x121212, emissive: 0x0a0a0a, sheenColor: 0xf5fffa, metalness: 0.96, roughness: 0.14, clearcoat: 1.0 };

  const primary = new THREE.MeshPhysicalMaterial({
    color: pbrSpec.color,
    emissive: pbrSpec.emissive,
    metalness: pbrSpec.metalness,
    roughness: pbrSpec.roughness,
    clearcoat: pbrSpec.clearcoat,
    clearcoatRoughness: 0.08,
    iridescence: 0.85,
    iridescenceIOR: 1.45,
    sheen: 0.85,
    sheenColor: new THREE.Color(pbrSpec.sheenColor),
    wireframe,
  });

  const accent = new THREE.MeshPhysicalMaterial({
    color: 0xff007f,
    emissive: 0x2b0015,
    metalness: 0.88,
    roughness: 0.16,
    clearcoat: 1.0,
    wireframe,
  });

  const halo = new THREE.MeshStandardMaterial({
    color: 0x00d9c0,
    emissive: 0x003d35,
    metalness: 0.92,
    roughness: 0.14,
    wireframe,
  });

  return { primary, accent, halo };
}

export function Asset3DPipelineStage({
  assetState,
  onChangeAssetState,
  onExportArtifact,
  onSendToVideoPipeline,
}: Asset3DPipelineStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRootRef = useRef<THREE.Object3D | null>(null);
  const uploadedObjectRef = useRef<THREE.Object3D | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shaderUniformsRef = useRef<{ time: { value: number } }[]>([]);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, rotY: 0, rotX: 0.12 });

  const [statusMsg, setStatusMsg] = useState('3D Asset (V) & GLB/FBX/OBJ Shader Pipeline Ready');
  const [uploadTick, setUploadTick] = useState(0);

  // Mount Three.js Studio Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const w = container.clientWidth || 560;
    const h = container.clientHeight || 290;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(assetState.focalMm, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 4.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setSize(w, h);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    scene.add(new THREE.HemisphereLight(0xe0ffff, 0x0a0a0a, 1.1));

    const keyLight = new THREE.DirectionalLight(0xfff5fa, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const magentaLight = new THREE.PointLight(0xff007f, 6.0, 24);
    magentaLight.position.set(3.2, 2.5, 3.6);
    scene.add(magentaLight);

    const tealLight = new THREE.PointLight(0x00d9c0, 5.2, 24);
    tealLight.position.set(-3.5, -2.0, 3.2);
    scene.add(tealLight);

    // Subtle Studio Turntable Grid
    const grid = new THREE.GridHelper(7, 14, 0xff007f, 0x1e1e1e);
    grid.position.y = -1.55;
    scene.add(grid);

    // Build / Bind 3D Asset + Shader
    shaderUniformsRef.current = [];
    const { primary, accent, halo } = createMaterialForShader(
      assetState.shader,
      assetState.wireframe,
      shaderUniformsRef
    );

    let rootObj: THREE.Object3D;
    const disposedGeos: THREE.BufferGeometry[] = [];

    if (assetState.sourceKind === 'uploaded' && uploadedObjectRef.current) {
      rootObj = uploadedObjectRef.current.clone();
      rootObj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = primary;
        }
      });
    } else if (assetState.sourceKind === 'torus') {
      const geo = new THREE.TorusKnotGeometry(0.92, 0.28, 110, 18);
      disposedGeos.push(geo);
      rootObj = new THREE.Mesh(geo, primary);
    } else if (assetState.sourceKind === 'cube') {
      const geo = new THREE.BoxGeometry(1.55, 1.55, 1.55, 4, 4, 4);
      disposedGeos.push(geo);
      rootObj = new THREE.Mesh(geo, primary);
    } else if (assetState.sourceKind === 'sentinel') {
      const geo = new THREE.IcosahedronGeometry(1.28, 1);
      disposedGeos.push(geo);
      rootObj = new THREE.Mesh(geo, primary);
    } else {
      rootObj = buildProceduralVAssetGroup(primary, accent, halo);
    }

    const s = Math.max(0.45, Math.min(1.6, assetState.scalePct / 100));
    rootObj.scale.multiplyScalar(s);
    scene.add(rootObj);
    modelRootRef.current = rootObj;

    const timer = new THREE.Timer();
    timer.connect(document);
    let raf = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      timer.update();
      const dt = Math.min(0.05, timer.getDelta());
      const elapsed = timer.getElapsed();

      shaderUniformsRef.current.forEach((u) => {
        u.time.value = elapsed;
      });

      if (!dragRef.current.active) {
        dragRef.current.rotY += dt * 0.55;
      }
      rootObj.rotation.y = dragRef.current.rotY;
      rootObj.rotation.x = THREE.MathUtils.damp(rootObj.rotation.x, dragRef.current.rotX, 6, dt);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || 560;
      const nh = container.clientHeight || 290;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      timer.dispose();
      disposedGeos.forEach((g) => g.dispose());
      primary.dispose();
      accent.dispose();
      halo.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [
    assetState.sourceKind,
    assetState.shader,
    assetState.wireframe,
    assetState.focalMm,
    assetState.scalePct,
    uploadTick,
  ]);

  const handleLoad3DFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setStatusMsg(`Loading ${file.name}…`);

    try {
      let loadedRoot: THREE.Object3D;

      if (ext === 'glb' || ext === 'gltf') {
        const buf = await file.arrayBuffer();
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(buf, '', resolve, reject);
        });
        loadedRoot = gltf.scene;
      } else if (ext === 'fbx') {
        const buf = await file.arrayBuffer();
        const loader = new FBXLoader();
        loadedRoot = loader.parse(buf, '');
      } else if (ext === 'obj') {
        const text = await file.text();
        const loader = new OBJLoader();
        loadedRoot = loader.parse(text);
      } else {
        setStatusMsg('Unsupported format — upload .glb, .gltf, .fbx, or .obj');
        return;
      }

      // Normalize bounds cleanly to stage volume (~2.4 units)
      const box = new THREE.Box3().setFromObject(loadedRoot);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scaleFactor = 2.4 / maxDim;
      loadedRoot.position.sub(center).multiplyScalar(scaleFactor);
      loadedRoot.scale.multiplyScalar(scaleFactor);

      const wrapper = new THREE.Group();
      wrapper.add(loadedRoot);
      uploadedObjectRef.current = wrapper;

      onChangeAssetState({
        assetName: file.name,
        sourceKind: 'uploaded',
      });
      setUploadTick((t) => t + 1);
      setStatusMsg(`Loaded 3D Asset: ${file.name} · Bound to ${assetState.shader.replace(/_/g, ' ')}`);
    } catch (err: any) {
      setStatusMsg(`3D Load error: ${err?.message || 'Invalid geometry file'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportGlb = () => {
    if (!sceneRef.current) return;
    setStatusMsg('Exporting binary .GLB asset…');
    const exporter = new GLTFExporter();
    exporter.parse(
      modelRootRef.current || sceneRef.current,
      (res) => {
        const blob =
          res instanceof ArrayBuffer
            ? new Blob([res], { type: 'model/gltf-binary' })
            : new Blob([JSON.stringify(res)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knocksstudios-${assetState.sourceKind}-${assetState.shader}.glb`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        setStatusMsg(`Exported .GLB (${assetState.assetName})`);
        onExportArtifact?.(
          `3D Asset (${assetState.assetName})`,
          `Shader ${assetState.shader} · Focal ${assetState.focalMm}mm`
        );
      },
      () => setStatusMsg('GLB export encountered an error'),
      { binary: true }
    );
  };

  return (
    <section id="vortex-blender" className="candy-surface rounded-[18px] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Box className="w-5 h-5 text-[#FF007F]" />
          <div>
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#F5FFFA]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              3D Asset (V) &amp; Blender Pipeline · GLB / FBX / OBJ Loader
            </h2>
            <p className="text-xs text-[#E0FFFF]/65">{statusMsg}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.fbx,.obj"
            className="hidden"
            onChange={(e) => handleLoad3DFile(e.target.files)}
          />
          <HardwareButton size="sm" tone="cyan" active onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            <span>Load GLB / FBX / OBJ</span>
          </HardwareButton>
          <HardwareButton size="sm" tone="red" active onClick={handleExportGlb}>
            <Download className="w-3.5 h-3.5" />
            <span>Export .GLB</span>
          </HardwareButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-5 items-center">
        {/* Interactive Drag-Orbit 3D Viewport */}
        <div className="relative">
          <div
            ref={mountRef}
            onPointerDown={(e) => {
              dragRef.current.active = true;
              dragRef.current.lastX = e.clientX;
              dragRef.current.lastY = e.clientY;
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.active) return;
              const dx = e.clientX - dragRef.current.lastX;
              const dy = e.clientY - dragRef.current.lastY;
              dragRef.current.lastX = e.clientX;
              dragRef.current.lastY = e.clientY;
              dragRef.current.rotY += dx * 0.012;
              dragRef.current.rotX = Math.max(-0.9, Math.min(0.9, dragRef.current.rotX + dy * 0.01));
            }}
            onPointerUp={() => {
              dragRef.current.active = false;
            }}
            onPointerLeave={() => {
              dragRef.current.active = false;
            }}
            className="w-full h-[290px] rounded-[14px] optical-glass overflow-hidden cursor-grab active:cursor-grabbing"
          />
          <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2">
            <LedStatusIndicator label={`3D ASSET: ${assetState.assetName}`} tone="cyan" />
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-[#E0FFFF]/65">
            Drag to orbit · Shader: {assetState.shader.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Geometry, Custom Shader Binding & Scale Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#00D9C0]" />
              <span>3D Asset Geometry (Built-in V Crest or Uploaded Mesh)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['procedural_v', 'Asset (V) Crest'],
                  ['torus', 'Torus Knot'],
                  ['cube', 'Rubik Sub-Mesh'],
                  ['sentinel', 'Valerius Core'],
                ] as const
              ).map(([k, lbl]) => (
                <HardwareButton
                  key={k}
                  size="sm"
                  tone={k === 'procedural_v' ? 'red' : 'cyan'}
                  active={assetState.sourceKind === k}
                  onClick={() => onChangeAssetState({ sourceKind: k, assetName: lbl })}
                >
                  <span>{lbl}</span>
                </HardwareButton>
              ))}
              {uploadedObjectRef.current && (
                <HardwareButton
                  size="sm"
                  tone="magenta"
                  active={assetState.sourceKind === 'uploaded'}
                  onClick={() => onChangeAssetState({ sourceKind: 'uploaded' })}
                >
                  <span>Uploaded Mesh</span>
                </HardwareButton>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#E0FFFF]/70 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#FF007F]" />
              <span>Custom GLSL &amp; Pearlescent Surface Shaders</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STUDIO_SHADER_PRESETS.map((sh) => (
                <HardwareButton
                  key={sh.key}
                  size="sm"
                  fullWidth
                  tone={
                    sh.key === 'bioluminescent_magenta'
                      ? 'red'
                      : sh.key === 'candy_pearlescent' || sh.key === 'fresnel_peach_rim'
                      ? 'magenta'
                      : 'cyan'
                  }
                  active={assetState.shader === sh.key}
                  onClick={() => onChangeAssetState({ shader: sh.key })}
                >
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: sh.swatch }}
                  />
                  <span className="truncate">{sh.label}</span>
                </HardwareButton>
              ))}
              <HardwareButton
                size="sm"
                fullWidth
                tone="neutral"
                active={assetState.wireframe}
                onClick={() => onChangeAssetState({ wireframe: !assetState.wireframe })}
              >
                <Flame className="w-3.5 h-3.5 text-[#FFDAB9]" />
                <span>{assetState.wireframe ? 'Wireframe ON' : 'Wireframe Edge'}</span>
              </HardwareButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-[#E0FFFF]/75">
                <span>Camera Lens</span>
                <span className="text-[#F5FFFA] tabular-nums">{assetState.focalMm}mm</span>
              </div>
              <input
                type="range"
                min={24}
                max={85}
                value={assetState.focalMm}
                onChange={(e) => onChangeAssetState({ focalMm: Number(e.target.value) })}
                className="hw-capsule-slider w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-[#E0FFFF]/75">
                <span>Asset Scale</span>
                <span className="text-[#FC8EAC] tabular-nums">{assetState.scalePct}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={145}
                value={assetState.scalePct}
                onChange={(e) => onChangeAssetState({ scalePct: Number(e.target.value) })}
                className="hw-capsule-slider w-full"
              />
            </div>
          </div>

          {onSendToVideoPipeline && (
            <HardwareButton
              size="md"
              fullWidth
              tone="red"
              active
              onClick={() => {
                onSendToVideoPipeline(assetState);
                setStatusMsg(`Synced 3D Asset (${assetState.assetName}) & ${assetState.shader} to Video Render`);
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sync 3D Asset (V) &amp; Shader to Video Pipeline</span>
            </HardwareButton>
          )}
        </div>
      </div>
    </section>
  );
}
