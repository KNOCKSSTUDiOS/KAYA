import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Shuffle,
  RotateCcw,
  Play,
  Pause,
  Shapes,
  Upload,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Film,
} from 'lucide-react';
import { HardwareButton } from './HardwarePrimitives.js';

export type StudioPageKey =
  | 'cube'
  | 'audio'
  | 'video'
  | 'picture'
  | 'animator'
  | 'airradio'
  | 'school'
  | 'merch'
  | 'live'
  | 'vfx'
  | 'sound'
  | 'lipsync'
  | 'editor'
  | 'storyboard'
  | 'intel'
  | 'bridge';

export interface WorkspaceMediaAsset {
  id: string;
  label: string;
  url: string;
  kind: 'image' | 'video';
}

interface RubiksCubeHubPageProps {
  workspaceMedia: WorkspaceMediaAsset[];
  latestVideoUrl?: string | null;
  onAddWorkspaceMedia?: (asset: WorkspaceMediaAsset) => void;
  onEnterGates?: () => void;
}

type ShapeMode = 'square' | 'bevel' | 'sphere' | 'prism';

interface CubeMove {
  axis: 'x' | 'y' | 'z';
  layer: -1 | 0 | 1;
  dir: 1 | -1;
}

const AXES: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
const LAYERS: (-1 | 0 | 1)[] = [-1, 0, 1];
const SHAPE_ORDER: ShapeMode[] = ['square', 'bevel', 'sphere', 'prism'];

function randomMove(prev?: CubeMove): CubeMove {
  let axis = AXES[Math.floor(Math.random() * 3)];
  let layer = LAYERS[Math.floor(Math.random() * 3)];
  if (prev && axis === prev.axis && layer === prev.layer) {
    axis = AXES[(AXES.indexOf(axis) + 1) % 3];
  }
  const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  return { axis, layer, dir };
}

// Create a 3x3 UV-cropped tile geometry so each of the 9 cubies on a face displays its quadrant of the playing video
function createFaceTileGeometry(uIndex: number, vIndex: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(0.84, 0.84);
  const uv = geo.attributes.uv;
  const uMin = uIndex / 3;
  const uMax = (uIndex + 1) / 3;
  const vMin = vIndex / 3;
  const vMax = (vIndex + 1) / 3;
  // PlaneGeometry vertex order: top-left(0), top-right(1), bottom-left(2), bottom-right(3)
  uv.setXY(0, uMin, vMax);
  uv.setXY(1, uMax, vMax);
  uv.setXY(2, uMin, vMin);
  uv.setXY(3, uMax, vMin);
  uv.needsUpdate = true;
  return geo;
}

export function RubiksCubeHubPage({
  workspaceMedia,
  latestVideoUrl,
  onAddWorkspaceMedia,
  onEnterGates,
}: RubiksCubeHubPageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [autoShuffle, setAutoShuffle] = useState(true);
  const [autoShapeShift, setAutoShapeShift] = useState(true);
  const [shapeMode, setShapeMode] = useState<ShapeMode>('square');
  const [speedMult, setSpeedMult] = useState<1 | 2>(1);
  const [dockOpen, setDockOpen] = useState(true);
  const [turnCount, setTurnCount] = useState(0);
  const [activeMixLabel, setActiveMixLabel] = useState<string>('6-Channel Workspace Mix');
  const [contextLost, setContextLost] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  const autoShuffleRef = useRef(autoShuffle);
  const autoShapeShiftRef = useRef(autoShapeShift);
  const shapeModeRef = useRef(shapeMode);
  const speedMultRef = useRef(speedMult);
  const queueMoveRef = useRef<(moves: CubeMove[]) => void>(() => {});
  const solveCubeRef = useRef<() => void>(() => {});
  const shuffleMixRef = useRef<() => void>(() => {});

  // Keep loaded HTMLImageElement / HTMLVideoElement sources accessible inside WebGL loop without rebuilding Three.js
  const mediaImagesRef = useRef<{ label: string; img: HTMLImageElement }[]>([]);
  const mediaVideosRef = useRef<{ label: string; video: HTMLVideoElement }[]>([]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    mediaVideosRef.current.forEach(({ video }) => {
      if (isPlaying) video.play().catch(() => {});
      else video.pause();
    });
  }, [isPlaying]);

  useEffect(() => {
    autoShuffleRef.current = autoShuffle;
  }, [autoShuffle]);

  useEffect(() => {
    autoShapeShiftRef.current = autoShapeShift;
  }, [autoShapeShift]);

  useEffect(() => {
    shapeModeRef.current = shapeMode;
  }, [shapeMode]);

  useEffect(() => {
    speedMultRef.current = speedMult;
  }, [speedMult]);

  // Sync all workspace assets (photos & rendered videos) into preloaded media elements
  useEffect(() => {
    const imgs: { label: string; img: HTMLImageElement }[] = [];
    const vids: { label: string; video: HTMLVideoElement }[] = [];

    workspaceMedia.forEach((asset) => {
      if (asset.kind === 'video') {
        const vid = document.createElement('video');
        vid.src = asset.url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.crossOrigin = 'anonymous';
        if (isPlayingRef.current) vid.play().catch(() => {});
        vids.push({ label: asset.label, video: vid });
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = asset.url;
        imgs.push({ label: asset.label, img });
      }
    });

    if (latestVideoUrl) {
      const vid = document.createElement('video');
      vid.src = latestVideoUrl;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.crossOrigin = 'anonymous';
      if (isPlayingRef.current) vid.play().catch(() => {});
      vids.unshift({ label: 'Rendered 4K Master', video: vid });
    }

    mediaImagesRef.current = imgs;
    mediaVideosRef.current = vids;

    return () => {
      vids.forEach(({ video }) => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
  }, [workspaceMedia, latestVideoUrl]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(320, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030406);
    scene.fog = new THREE.FogExp2(0x030406, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(5.4, 3.8, 6.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 12;
    controls.target.set(0, 0.15, 0);
    controls.update();

    // Grade-7 Titanium Metallic Studio Lighting Rig
    scene.add(new THREE.HemisphereLight(0x88e8ff, 0x050608, 0.9));

    const keyLight = new THREE.DirectionalLight(0xfff4e2, 2.5);
    keyLight.position.set(6, 9, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const redRim = new THREE.DirectionalLight(0xff1e42, 1.8);
    redRim.position.set(-6, 3, -5);
    scene.add(redRim);

    const cyanRim = new THREE.DirectionalLight(0x00e5ff, 1.4);
    cyanRim.position.set(4, -3, -6);
    scene.add(cyanRim);

    // Grade-7 Obsidian Black Titanium Turntable Plinth
    const plinthGeo = new THREE.CylinderGeometry(3.2, 3.55, 0.2, 56);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x07080c,
      metalness: 0.94,
      roughness: 0.24,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -2.42;
    plinth.receiveShadow = !isSoftwareGl;
    scene.add(plinth);

    const ringGeo = new THREE.TorusGeometry(3.22, 0.032, 16, 72);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff1e42,
      emissive: 0xff1e42,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.6,
    });
    const neonRing = new THREE.Mesh(ringGeo, ringMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = -2.31;
    scene.add(neonRing);

    // FULL-PAGE BACKGROUND CINEMA VIDEO SCREEN BEHIND THE CUBE
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 960;
    bgCanvas.height = 540;
    const bgCtx = bgCanvas.getContext('2d')!;
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    bgTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const bgScreenGeo = new THREE.PlaneGeometry(24, 13.5);
    const bgScreenMat = new THREE.MeshBasicMaterial({
      map: bgTex,
      transparent: false,
    });
    const bgScreen = new THREE.Mesh(bgScreenGeo, bgScreenMat);
    bgScreen.position.set(0, 0.35, -8.5);
    scene.add(bgScreen);

    // 6 INDEPENDENT LIVE VIDEO FACE CHANNELS (+X, -X, +Y, -Y, +Z, -Z)
    interface VideoChannel {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      texture: THREE.CanvasTexture;
      material: THREE.MeshStandardMaterial;
      assetOffset: number;
      tintHue: number;
    }

    const faceChannels: VideoChannel[] = Array.from({ length: 6 }, (_, idx) => {
      const c = document.createElement('canvas');
      c.width = 360;
      c.height = 360;
      const ctx = c.getContext('2d')!;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.16,
        metalness: 0.18,
        emissive: new THREE.Color(0x090b10),
        emissiveMap: texture,
        emissiveIntensity: 0.35,
      });
      return {
        canvas: c,
        ctx,
        texture,
        material,
        assetOffset: idx,
        tintHue: idx * 55,
      };
    });

    // Helper: draw animated live multi-source motion feed onto any face canvas or background canvas
    let videoClock = 0;
    const drawFeedCanvas = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      t: number,
      channelIdx: number,
      assetIdx: number,
      isBackdrop: boolean
    ) => {
      const imgs = mediaImagesRef.current;
      const vids = mediaVideosRef.current;

      ctx.fillStyle = '#030406';
      ctx.fillRect(0, 0, w, h);

      // Prefer real Video elements first when present, mixed with workspace enterprise imagery
      const useVideo = vids.length > 0 && (isBackdrop || channelIdx % 2 === 0);
      if (useVideo) {
        const vEntry = vids[assetIdx % vids.length];
        if (vEntry && vEntry.video.readyState >= 2) {
          const vw = vEntry.video.videoWidth || 1280;
          const vh = vEntry.video.videoHeight || 720;
          const scale = Math.max(w / vw, h / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(vEntry.video, (w - dw) / 2, (h - dh) / 2, dw, dh);
        }
      } else if (imgs.length > 0) {
        const entry = imgs[assetIdx % imgs.length];
        const nextEntry = imgs[(assetIdx + 1) % imgs.length];
        if (entry?.img.complete && entry.img.naturalWidth > 0) {
          // Continuous smooth cinema dolly + cross-dissolve between workspace photos
          const cycle = (t * 0.22 + channelIdx * 0.35) % 1;
          const zoom = 1.06 + Math.sin(t * 0.8 + channelIdx) * 0.08;
          const panX = Math.cos(t * 0.65 + channelIdx) * w * 0.05;
          const panY = Math.sin(t * 0.55 + channelIdx) * h * 0.04;

          const drawFitted = (img: HTMLImageElement, alpha: number, z: number) => {
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, (w - dw) / 2 + panX, (h - dh) / 2 + panY, dw, dh);
            ctx.restore();
          };

          drawFitted(entry.img, 1, zoom);
          if (cycle > 0.72 && nextEntry?.img.complete && nextEntry.img.naturalWidth > 0) {
            const blend = (cycle - 0.72) / 0.28;
            drawFitted(nextEntry.img, blend, 1.08);
          }
        }
      }

      // Subtle motion light sweep & cyberpunk / cinema frame accent
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const sx = w * (0.5 + Math.cos(t * 1.1 + channelIdx) * 0.35);
      const sy = h * (0.5 + Math.sin(t * 0.9 + channelIdx) * 0.35);
      const sweep = ctx.createRadialGradient(sx, sy, 4, sx, sy, w * 0.55);
      if (channelIdx % 3 === 0) {
        sweep.addColorStop(0, 'rgba(0, 229, 255, 0.28)');
      } else if (channelIdx % 3 === 1) {
        sweep.addColorStop(0, 'rgba(255, 30, 66, 0.26)');
      } else {
        sweep.addColorStop(0, 'rgba(230, 57, 155, 0.26)');
      }
      sweep.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sweep;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      if (!isBackdrop) {
        // Sleek chamfer metal border around each cube face channel
        ctx.strokeStyle =
          channelIdx % 2 === 0 ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 30, 66, 0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      }
    };

    // COMPOSITE 27-CUBIE ELASTIC SHAPE-SHIFTING VIDEO CUBE
    const cubeRoot = new THREE.Group();
    cubeRoot.position.y = 0.15;
    scene.add(cubeRoot);

    const pivotGroup = new THREE.Group();
    cubeRoot.add(pivotGroup);

    // 4 Morphable Core Geometries (Shape-Shift capability)
    const coreSquareGeo = new THREE.BoxGeometry(0.93, 0.93, 0.93);
    const coreBevelGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.92, 8);
    const coreSphereGeo = new THREE.SphereGeometry(0.54, 24, 18);
    const corePrismGeo = new THREE.OctahedronGeometry(0.62, 0);

    // Aerospace Grade-7 Obsidian Black Titanium Material
    const blackMetalCoreMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.95,
      roughness: 0.22,
    });
    const collarGeo = new THREE.BoxGeometry(0.955, 0.12, 0.955);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x161a24,
      metalness: 0.96,
      roughness: 0.18,
    });

    const tileGeosToDispose: THREE.BufferGeometry[] = [];

    interface CubieRecord {
      group: THREE.Group;
      grid: THREE.Vector3;
      coreMesh: THREE.Mesh;
      collarMesh: THREE.Mesh;
    }
    const cubies: CubieRecord[] = [];
    const spacing = 1.02;

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gz = -1; gz <= 1; gz++) {
          const cubie = new THREE.Group();
          cubie.position.set(gx * spacing, gy * spacing, gz * spacing);

          // Primary Grade-7 Titanium Core
          const coreMesh = new THREE.Mesh(coreSquareGeo, blackMetalCoreMat);
          coreMesh.castShadow = !isSoftwareGl;
          coreMesh.receiveShadow = !isSoftwareGl;
          cubie.add(coreMesh);

          // CNC Chamfer Belt Accent
          const collarMesh = new THREE.Mesh(collarGeo, collarMat);
          cubie.add(collarMesh);

          // Attach UV-cropped Video Screen Tiles to outer faces
          const attachVideoTile = (
            faceIdx: number,
            uIdx: number,
            vIdx: number,
            px: number,
            py: number,
            pz: number,
            rx: number,
            ry: number
          ) => {
            const tileGeo = createFaceTileGeometry(uIdx, vIdx);
            tileGeosToDispose.push(tileGeo);
            const tile = new THREE.Mesh(tileGeo, faceChannels[faceIdx].material);
            tile.position.set(px, py, pz);
            tile.rotation.set(rx, ry, 0);
            cubie.add(tile);
          };

          if (gx === 1) attachVideoTile(0, 1 - gz, gy + 1, 0.472, 0, 0, 0, Math.PI / 2);
          if (gx === -1) attachVideoTile(1, gz + 1, gy + 1, -0.472, 0, 0, 0, -Math.PI / 2);
          if (gy === 1) attachVideoTile(2, gx + 1, 1 - gz, 0, 0.472, 0, -Math.PI / 2, 0);
          if (gy === -1) attachVideoTile(3, gx + 1, gz + 1, 0, -0.472, 0, Math.PI / 2, 0);
          if (gz === 1) attachVideoTile(4, gx + 1, gy + 1, 0, 0, 0.472, 0, 0);
          if (gz === -1) attachVideoTile(5, 1 - gx, gy + 1, 0, 0, -0.472, 0, Math.PI);

          cubeRoot.add(cubie);
          cubies.push({
            group: cubie,
            grid: new THREE.Vector3(gx, gy, gz),
            coreMesh,
            collarMesh,
          });
        }
      }
    }

    // Move Queue & Shuffle Video Mix Engine
    const moveQueue: CubeMove[] = [];
    const historyStack: CubeMove[] = [];
    let activeMove: {
      move: CubeMove;
      progress: number;
      members: CubieRecord[];
    } | null = null;
    let lastQueuedMove: CubeMove | undefined;
    let lastShapeApplied: ShapeMode = 'square';
    let localTurnCount = 0;

    const _axisVec = new THREE.Vector3();
    const _quat = new THREE.Quaternion();
    const _pos = new THREE.Vector3();

    const triggerFaceMixShuffle = () => {
      const totalImgs = Math.max(1, mediaImagesRef.current.length);
      faceChannels.forEach((ch, idx) => {
        ch.assetOffset = (ch.assetOffset + idx + 1 + Math.floor(Math.random() * 3)) % totalImgs;
      });
      const leadAsset =
        mediaVideosRef.current[0]?.label ||
        mediaImagesRef.current[faceChannels[4].assetOffset % totalImgs]?.label ||
        'Workspace Mix';
      setActiveMixLabel(`Mix Active · ${leadAsset}`);
    };

    shuffleMixRef.current = triggerFaceMixShuffle;

    const startNextMove = () => {
      if (activeMove || moveQueue.length === 0) return;
      const next = moveQueue.shift()!;
      const members = cubies.filter((c) => Math.round(c.grid[next.axis]) === next.layer);
      pivotGroup.rotation.set(0, 0, 0);
      pivotGroup.updateMatrixWorld();
      members.forEach((m) => pivotGroup.attach(m.group));
      activeMove = { move: next, progress: 0, members };
    };

    const finishActiveMove = () => {
      if (!activeMove) return;
      const { move, members } = activeMove;
      const targetAngle = (Math.PI / 2) * move.dir;
      pivotGroup.rotation[move.axis] = targetAngle;
      pivotGroup.updateMatrixWorld();

      _axisVec.set(
        move.axis === 'x' ? 1 : 0,
        move.axis === 'y' ? 1 : 0,
        move.axis === 'z' ? 1 : 0
      );
      _quat.setFromAxisAngle(_axisVec, targetAngle);

      members.forEach((m) => {
        cubeRoot.attach(m.group);
        m.grid.applyQuaternion(_quat);
        m.grid.set(Math.round(m.grid.x), Math.round(m.grid.y), Math.round(m.grid.z));
        _pos.set(m.grid.x * spacing, m.grid.y * spacing, m.grid.z * spacing);
        m.group.position.copy(_pos);
      });

      pivotGroup.rotation.set(0, 0, 0);
      activeMove = null;
      localTurnCount++;

      // Whenever a turn completes: shuffle/mix video channels + optional elastic shape shift every 3 turns
      triggerFaceMixShuffle();
      if (autoShapeShiftRef.current && localTurnCount % 3 === 0) {
        const nextIdx = (SHAPE_ORDER.indexOf(shapeModeRef.current) + 1) % SHAPE_ORDER.length;
        setShapeMode(SHAPE_ORDER[nextIdx]);
      }
    };

    queueMoveRef.current = (moves: CubeMove[]) => {
      moves.forEach((mv) => {
        moveQueue.push(mv);
        historyStack.push(mv);
        lastQueuedMove = mv;
      });
      setTurnCount((c) => c + moves.length);
    };

    solveCubeRef.current = () => {
      moveQueue.length = 0;
      const reverseMoves = historyStack
        .splice(0, historyStack.length)
        .reverse()
        .map((mv) => ({ ...mv, dir: (mv.dir * -1) as 1 | -1 }));
      moveQueue.push(...reverseMoves);
      setTurnCount(0);
    };

    // Kick off in live motion
    queueMoveRef.current(
      Array.from({ length: 4 }, () => {
        lastQueuedMove = randomMove(lastQueuedMove);
        return lastQueuedMove;
      })
    );

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    if (!isSoftwareGl) renderer.compile(scene, camera);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let bgTickCounter = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      if (isPlayingRef.current) {
        videoClock += delta;
      }

      // Sync shape morph geometry across all 27 cubies
      if (shapeModeRef.current !== lastShapeApplied) {
        lastShapeApplied = shapeModeRef.current;
        const targetGeo =
          lastShapeApplied === 'bevel'
            ? coreBevelGeo
            : lastShapeApplied === 'sphere'
            ? coreSphereGeo
            : lastShapeApplied === 'prism'
            ? corePrismGeo
            : coreSquareGeo;
        cubies.forEach((c) => {
          c.coreMesh.geometry = targetGeo;
          c.collarMesh.visible = lastShapeApplied === 'square';
        });
      }

      // Render playing video feeds onto Background Screen + all 6 Rubik's Cube channels
      bgTickCounter++;
      if (isPlayingRef.current || bgTickCounter === 1) {
        drawFeedCanvas(bgCtx, bgCanvas.width, bgCanvas.height, videoClock, 0, 0, true);
        bgTex.needsUpdate = true;

        // Stagger face redraws slightly in software GL for crisp frame rate; redraw all on GPU
        for (let f = 0; f < faceChannels.length; f++) {
          if (isSoftwareGl && (bgTickCounter + f) % 2 !== 0) continue;
          const ch = faceChannels[f];
          drawFeedCanvas(ch.ctx, ch.canvas.width, ch.canvas.height, videoClock, f, ch.assetOffset, false);
          ch.texture.needsUpdate = true;
        }
      }

      // Elastic breathing expansion of cubie lattice + auto shuffle
      const elasticBreath = activeMove
        ? 1.0 + Math.sin(activeMove.progress * Math.PI) * 0.085
        : 1.0 + Math.sin(elapsed * 2.2) * 0.015;
      cubies.forEach((c) => {
        const s = spacing * elasticBreath;
        if (c.group.parent === cubeRoot) {
          c.group.position.set(c.grid.x * s, c.grid.y * s, c.grid.z * s);
        }
      });

      if (autoShuffleRef.current && moveQueue.length === 0 && !activeMove) {
        const mv = randomMove(lastQueuedMove);
        lastQueuedMove = mv;
        moveQueue.push(mv);
        historyStack.push(mv);
        if (historyStack.length > 48) historyStack.shift();
        setTurnCount((c) => c + 1);
      }

      if (!activeMove) startNextMove();
      if (activeMove) {
        const turnRate = speedMultRef.current === 2 ? 3.8 : 2.0;
        activeMove.progress = Math.min(1, activeMove.progress + delta * turnRate);
        // Elastic spring-back curve (slight overshoot then settles crisply to 1.0)
        const p = activeMove.progress;
        const c4 = (2 * Math.PI) / 3;
        const elasticEase =
          p === 0
            ? 0
            : p === 1
            ? 1
            : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
        pivotGroup.rotation[activeMove.move.axis] =
          elasticEase * (Math.PI / 2) * activeMove.move.dir;
        if (activeMove.progress >= 1) {
          finishActiveMove();
        }
      }

      if (isPlayingRef.current) {
        cubeRoot.rotation.y += delta * (speedMultRef.current === 2 ? 0.45 : 0.24);
        cubeRoot.rotation.x = Math.sin(elapsed * 0.65) * 0.14;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      coreSquareGeo.dispose();
      coreBevelGeo.dispose();
      coreSphereGeo.dispose();
      corePrismGeo.dispose();
      collarGeo.dispose();
      blackMetalCoreMat.dispose();
      collarMat.dispose();
      tileGeosToDispose.forEach((g) => g.dispose());
      faceChannels.forEach((ch) => {
        ch.texture.dispose();
        ch.material.dispose();
      });
      plinthGeo.dispose();
      plinthMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      bgScreenGeo.dispose();
      bgScreenMat.dispose();
      bgTex.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleUploadWorkspaceFiles = (files: FileList | null) => {
    if (!files || !onAddWorkspaceMedia) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      onAddWorkspaceMedia({
        id: `cube-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: file.name,
        url,
        kind,
      });
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section
      id="workbench-cube"
      className="relative w-full h-[580px] sm:h-[640px] rounded-[12px] overflow-hidden border border-[#FF1E42]/55 bg-[#020203] shadow-[0_0_32px_rgba(255,30,66,0.18)]"
    >
      {/* Dedicated Three.js 360° Interactive Elastic Rubik's Cube Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal Corner Stage Badge (Static — No Pulsing Dots, Zero Center Occlusion) */}
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-3 px-3.5 py-2 rounded-[8px] bg-[#020203]/95 border border-white/15">
        <Film className="w-4 h-4 text-[#FF1E42] shrink-0" />
        <div className="font-mono text-xs text-white flex items-center gap-2 whitespace-nowrap">
          <span className="font-bold tracking-wider uppercase">KAYA 360° Video Cube</span>
          <span className="text-[#E6ECF5]/40">·</span>
          <span className="text-[#00E5FF] tabular-nums">{turnCount} turns</span>
          <span className="text-[#E6ECF5]/40 hidden sm:inline">·</span>
          <span className="text-[#E6ECF5]/70 hidden sm:inline uppercase">{shapeMode}</span>
          <span className="text-[#E6ECF5]/40 hidden md:inline">·</span>
          <span className="text-[#FF64B8] hidden md:inline truncate max-w-[180px]">{activeMixLabel}</span>
        </div>
      </div>

      {/* Top-Right Studio Gate Scroll CTA */}
      {onEnterGates && (
        <div className="absolute top-4 right-4 z-10">
          <HardwareButton size="sm" tone="red" active onClick={onEnterGates}>
            <span>Studio Gates</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </HardwareButton>
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020203]/95 text-center p-6">
          <p className="font-mono text-xs text-[#FF8DA1]">
            WebGL context paused by browser. Reload or scroll to restore 360° Video Cube.
          </p>
        </div>
      )}

      {/* Clean Collapsible JS Video Cube Player Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(920px,96%)] flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setDockOpen((o) => !o)}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-[7px] bg-[#020203] hover:bg-[#08090C] border border-white/20 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5] transition-colors cursor-pointer"
        >
          {dockOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#00E5FF]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#00E5FF]" />}
          <span>{dockOpen ? 'Hide Cube Player' : 'Show Video Cube Player'}</span>
        </button>

        {dockOpen && (
          <div className="w-full rounded-[11px] cnc-plate p-3 flex flex-wrap items-center justify-between gap-2 bg-[#020203]/95 border border-white/15">
            <div className="flex flex-wrap items-center gap-2">
              <HardwareButton
                size="sm"
                tone={isPlaying ? 'cyan' : 'red'}
                active
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Playing' : 'Paused'}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="red"
                active={autoShuffle}
                onClick={() => setAutoShuffle((s) => !s)}
              >
                <span>Auto Turn: {autoShuffle ? 'ON' : 'OFF'}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="cyan"
                active={false}
                onClick={() => {
                  const batch: CubeMove[] = [];
                  let prev: CubeMove | undefined;
                  for (let i = 0; i < 6; i++) {
                    prev = randomMove(prev);
                    batch.push(prev);
                  }
                  queueMoveRef.current(batch);
                  shuffleMixRef.current();
                }}
              >
                <Shuffle className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Shuffle &amp; Mix</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="neutral"
                ledIndicator={false}
                onClick={() => {
                  setAutoShuffle(false);
                  solveCubeRef.current();
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </HardwareButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <HardwareButton
                size="sm"
                tone="magenta"
                active={autoShapeShift}
                onClick={() => {
                  const nextIdx = (SHAPE_ORDER.indexOf(shapeMode) + 1) % SHAPE_ORDER.length;
                  setShapeMode(SHAPE_ORDER[nextIdx]);
                  setAutoShapeShift(true);
                }}
                title="Morph 3D cube geometry while rotating"
              >
                <Shapes className="w-3.5 h-3.5 text-[#FF64B8]" />
                <span className="capitalize">Shape: {shapeMode}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="neutral"
                active={speedMult === 2}
                onClick={() => setSpeedMult((s) => (s === 1 ? 2 : 1))}
              >
                <span>{speedMult}x</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="cyan"
                active={false}
                onClick={() => fileInputRef.current?.click()}
                title="Load local videos or pictures directly onto spinning Rubik's Cube faces"
              >
                <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>+ Workspace Media</span>
              </HardwareButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleUploadWorkspaceFiles(e.target.files)}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
