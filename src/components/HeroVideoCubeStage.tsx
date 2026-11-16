import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronUp, ChevronDown, DownloadCloud, ShieldAlert, User, Wifi, WifiOff } from 'lucide-react';
import type { StudioPageKey, WorkspaceMediaAsset } from './RubiksCubeHubPage.js';
import type { KayaUserProfile } from './KayaAuthModal.js';
import { HERO_SHOWCASE_REELS, renderAnimatedReelFrame } from '../lib/heroVideoReels.js';

interface HeroVideoCubeStageProps {
  workspaceMedia: WorkspaceMediaAsset[];
  latestVideoUrl?: string | null;
  user: KayaUserProfile | null;
  isOnline?: boolean;
  isAppInstalled?: boolean;
  onOpenInstall?: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth: () => void;
  onNavigateTool: (tool: StudioPageKey) => void;
  onNavigateGates: () => void;
  onOpenPlans?: () => void;
  onAddWorkspaceMedia?: (asset: WorkspaceMediaAsset) => void;
  onJumpSection?: (sectionId: string, tool?: StudioPageKey) => void;
}

type TransitionStyle = 'split_shuffle' | 'turn_in_place' | 'middle_split' | 'spiral_cascade';

const TRANSITION_ORDER: TransitionStyle[] = [
  'split_shuffle',
  'turn_in_place',
  'middle_split',
  'spiral_cascade',
];

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Create a 1×1×1 BoxGeometry whose front (+Z, verts 16..19) and back (-Z, verts 20..23)
 * UVs cleanly sample one cropped 3×3 sector (col=0..2, row=0..2) of a full-screen video feed.
 */
function createMosaicCubieGeometry(col: number, row: number): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const uv = geo.attributes.uv;
  const uMin = col / 3;
  const uMax = (col + 1) / 3;
  const vMin = row / 3;
  const vMax = (row + 1) / 3;

  uv.setXY(16, uMin, vMax);
  uv.setXY(17, uMax, vMax);
  uv.setXY(18, uMin, vMin);
  uv.setXY(19, uMax, vMin);

  uv.setXY(20, uMin, vMax);
  uv.setXY(21, uMax, vMax);
  uv.setXY(22, uMin, vMin);
  uv.setXY(23, uMax, vMin);

  uv.needsUpdate = true;
  return geo;
}

export function HeroVideoCubeStage({
  workspaceMedia,
  latestVideoUrl,
  user,
  isOnline = true,
  isAppInstalled = false,
  onOpenInstall,
  onOpenAdmin,
  onOpenAuth,
  onNavigateTool,
  onNavigateGates,
  onOpenPlans,
  onAddWorkspaceMedia,
  onJumpSection,
}: HeroVideoCubeStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const mediaImagesRef = useRef<{ label: string; img: HTMLImageElement }[]>([]);
  const mediaVideosRef = useRef<{ label: string; video: HTMLVideoElement }[]>([]);
  const showcaseImgsRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const map: Record<string, HTMLImageElement> = {};
    HERO_SHOWCASE_REELS.forEach((reel) => {
      if (reel.imageUrl) {
        const img = new Image();
        img.src = reel.imageUrl;
        map[reel.id] = img;
      }
    });
    showcaseImgsRef.current = map;
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  // Sync rendered/uploaded videos & workspace photography into active rotation
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
        vid.play().catch(() => {});
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
      vid.play().catch(() => {});
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
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020203);
    scene.fog = new THREE.FogExp2(0x020203, 0.02);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const FOV_DEG = 38;
    const CAM_Z = 12.0;
    const camera = new THREE.PerspectiveCamera(FOV_DEG, width / height, 0.1, 100);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    // Pro & Candy Finish Lighting Rig for cube edges & clockwork splits
    scene.add(new THREE.HemisphereLight(0xf1f5f9, 0x050608, 0.95));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(6, 8, 9);
    scene.add(keyLight);

    const redRim = new THREE.DirectionalLight(0xff1e42, 2.1);
    redRim.position.set(-7, 3, 4);
    scene.add(redRim);

    const cyanRim = new THREE.DirectionalLight(0xf1f5f9, 1.7);
    cyanRim.position.set(7, -4, 3);
    scene.add(cyanRim);

    // Dual Live Offscreen Cinema Canvases (Current Video Feed A & Next Video Feed B)
    const feedCanvasA = document.createElement('canvas');
    feedCanvasA.width = 960;
    feedCanvasA.height = 540;
    const ctxA = feedCanvasA.getContext('2d')!;
    const texA = new THREE.CanvasTexture(feedCanvasA);
    texA.colorSpace = THREE.SRGBColorSpace;
    texA.minFilter = THREE.LinearFilter;
    texA.magFilter = THREE.LinearFilter;
    texA.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const feedCanvasB = document.createElement('canvas');
    feedCanvasB.width = 960;
    feedCanvasB.height = 540;
    const ctxB = feedCanvasB.getContext('2d')!;
    const texB = new THREE.CanvasTexture(feedCanvasB);
    texB.colorSpace = THREE.SRGBColorSpace;
    texB.minFilter = THREE.LinearFilter;
    texB.magFilter = THREE.LinearFilter;
    texB.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Draw rich varied cinema feeds combining uploaded/rendered videos, showcase animated reels, and workspace photos
    const drawFeed = (ctx: CanvasRenderingContext2D, feedIndex: number, t: number) => {
      const w = feedCanvasA.width;
      const h = feedCanvasA.height;
      const vids = mediaVideosRef.current;
      const imgs = mediaImagesRef.current;
      const reels = HERO_SHOWCASE_REELS;
      const totalSlots = vids.length + reels.length + imgs.length;
      if (totalSlots === 0) return;

      const slot = Math.abs(feedIndex) % totalSlots;

      // 1. Real user-rendered / dropped videos take priority slots when present
      if (slot < vids.length) {
        const vEntry = vids[slot];
        if (vEntry && vEntry.video.readyState >= 2) {
          ctx.fillStyle = '#020203';
          ctx.fillRect(0, 0, w, h);
          const vw = vEntry.video.videoWidth || 1280;
          const vh = vEntry.video.videoHeight || 720;
          const sc = Math.max(w / vw, h / vh);
          const dw = vw * sc;
          const dh = vh * sc;
          ctx.drawImage(vEntry.video, (w - dw) / 2, (h - dh) / 2, dw, dh);
          return;
        }
      }

      // 2. Diverse Animated Sample Cinema Reels (Cyber Android Holo, Mech Orbit, Cyber Rain Car, Orbital Sunrise, Warp Tunnel, Laser Arena)
      const reelOffset = slot - vids.length;
      if (reelOffset >= 0 && reelOffset < reels.length) {
        const reel = reels[reelOffset];
        renderAnimatedReelFrame(ctx, w, h, t, reel, showcaseImgsRef.current[reel.id]);
        return;
      }

      // 3. Enterprise Workspace Scenes with smooth cinema camera motion + optical flare
      if (imgs.length > 0) {
        const imgIdx = Math.max(0, slot - vids.length - reels.length) % imgs.length;
        const imgEntry = imgs[imgIdx];
        if (imgEntry?.img.complete && imgEntry.img.naturalWidth > 0) {
          ctx.fillStyle = '#020203';
          ctx.fillRect(0, 0, w, h);
          const zoom = 1.07 + Math.sin(t * 0.65 + feedIndex) * 0.055;
          const panX = Math.cos(t * 0.48 + feedIndex) * w * 0.035;
          const panY = Math.sin(t * 0.36 + feedIndex) * h * 0.025;
          const sc = Math.max(w / imgEntry.img.naturalWidth, h / imgEntry.img.naturalHeight) * zoom;
          const dw = imgEntry.img.naturalWidth * sc;
          const dh = imgEntry.img.naturalHeight * sc;
          ctx.drawImage(imgEntry.img, (w - dw) / 2 + panX, (h - dh) / 2 + panY, dw, dh);
        }
      }
    };

    const obsidianSideMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.94,
      roughness: 0.22,
    });
    const frontVideoMat = new THREE.MeshBasicMaterial({ map: texA, toneMapped: false });
    const backVideoMat = new THREE.MeshBasicMaterial({ map: texB, toneMapped: false });
    const innerFrontMat = new THREE.MeshStandardMaterial({
      color: 0x08090c,
      metalness: 0.92,
      roughness: 0.24,
    });

    const mosaicRoot = new THREE.Group();
    scene.add(mosaicRoot);

    interface HeroCubie {
      mesh: THREE.Mesh;
      gx: -1 | 0 | 1;
      gy: -1 | 0 | 1;
      gz: -1 | 0 | 1;
      geometry: THREE.BoxGeometry;
    }

    const cubies: HeroCubie[] = [];
    for (let gx of [-1, 0, 1] as (-1 | 0 | 1)[]) {
      for (let gy of [-1, 0, 1] as (-1 | 0 | 1)[]) {
        for (let gz of [-1, 0, 1] as (-1 | 0 | 1)[]) {
          const col = gx + 1;
          const row = gy + 1;
          const geometry = createMosaicCubieGeometry(col, row);
          const materials =
            gz === 1
              ? [
                  obsidianSideMat,
                  obsidianSideMat,
                  obsidianSideMat,
                  obsidianSideMat,
                  frontVideoMat,
                  backVideoMat,
                ]
              : [
                  obsidianSideMat,
                  obsidianSideMat,
                  obsidianSideMat,
                  obsidianSideMat,
                  innerFrontMat,
                  obsidianSideMat,
                ];
          const mesh = new THREE.Mesh(geometry, materials);
          mesh.position.set(gx, gy, gz);
          mosaicRoot.add(mesh);
          cubies.push({ mesh, gx, gy, gz, geometry });
        }
      }
    }

    let viewAspect = width / height;
    const computeFullBleedScale = (aspect: number) => {
      const dist = CAM_Z - 1.5;
      const visH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV_DEG) / 2) * dist;
      const visW = visH * aspect;
      return {
        fullX: visW / 3,
        fullY: visH / 3,
        cubeScale: Math.min(visW, visH) * 0.215,
      };
    };

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      viewAspect = w / h;
      camera.aspect = viewAspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    if (!isSoftwareGl) renderer.compile(scene, camera);

    const pickRandomNextIndex = (curr: number) => {
      const total =
        Math.max(2, mediaVideosRef.current.length + HERO_SHOWCASE_REELS.length + mediaImagesRef.current.length);
      let candidate = Math.floor(Math.random() * total);
      if (candidate === curr % total) {
        candidate = (candidate + 1 + Math.floor(Math.random() * (total - 1))) % total;
      }
      return candidate;
    };

    let phase: 'PLAY' | 'TRANSITION' = 'PLAY';
    let phaseElapsed = 0;
    let currentFeedIdx = 0;
    let nextFeedIdx = 1;
    let transitionIdx = 0;
    let videoSwappedThisTurn = false;

    const PLAY_DURATION = 4.2;
    const TRANSITION_DURATION = 2.8;

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let totalTime = 0;
    let tickCounter = 0;

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
      totalTime += delta;
      phaseElapsed += delta;
      tickCounter++;

      if (phase === 'PLAY' && phaseElapsed >= PLAY_DURATION) {
        phase = 'TRANSITION';
        phaseElapsed = 0;
        videoSwappedThisTurn = false;
        nextFeedIdx = pickRandomNextIndex(currentFeedIdx);
      } else if (phase === 'TRANSITION' && phaseElapsed >= TRANSITION_DURATION) {
        phase = 'PLAY';
        phaseElapsed = 0;
        currentFeedIdx = nextFeedIdx;
        transitionIdx = (transitionIdx + 1) % TRANSITION_ORDER.length;
        mosaicRoot.rotation.set(0, 0, 0);
        cubies.forEach((c) => {
          c.mesh.position.set(c.gx, c.gy, c.gz);
          c.mesh.rotation.set(0, 0, 0);
          c.mesh.scale.set(1, 1, 1);
          c.mesh.visible = c.gz === 1;
        });
      }

      if (!isSoftwareGl || tickCounter % 2 === 1 || phase === 'TRANSITION') {
        drawFeed(ctxA, currentFeedIdx, totalTime);
        texA.needsUpdate = true;
      }
      if (phase === 'TRANSITION') {
        drawFeed(ctxB, nextFeedIdx, totalTime);
        texB.needsUpdate = true;
      }

      const { fullX, fullY, cubeScale } = computeFullBleedScale(viewAspect);

      if (phase === 'PLAY') {
        mosaicRoot.scale.set(fullX, fullY, 1.0);
        mosaicRoot.rotation.set(0, 0, 0);
        cubies.forEach((c) => {
          c.mesh.visible = c.gz === 1;
          c.mesh.position.set(c.gx, c.gy, c.gz);
          c.mesh.rotation.set(0, 0, 0);
          c.mesh.scale.set(1, 1, 1);
        });
      } else {
        const u = Math.min(1, phaseElapsed / TRANSITION_DURATION);
        const mode = TRANSITION_ORDER[transitionIdx];

        cubies.forEach((c) => {
          c.mesh.visible = true;
        });

        if (mode === 'split_shuffle') {
          const bell = Math.sin(u * Math.PI);
          const morph = smoothstep(bell * 1.15);

          mosaicRoot.scale.set(
            THREE.MathUtils.lerp(fullX, cubeScale, morph),
            THREE.MathUtils.lerp(fullY, cubeScale, morph),
            THREE.MathUtils.lerp(1.0, cubeScale, morph)
          );
          mosaicRoot.rotation.set(
            Math.sin(u * Math.PI * 2) * 0.28 * bell,
            Math.sin(u * Math.PI) * 0.42,
            0
          );

          if (u >= 0.5 && !videoSwappedThisTurn) {
            currentFeedIdx = nextFeedIdx;
            videoSwappedThisTurn = true;
          }

          const spread = 1 + bell * 0.32;
          const twistA = smoothstep(Math.max(0, Math.min(1, (u - 0.12) / 0.35))) * Math.PI * 2;
          const twistB = smoothstep(Math.max(0, Math.min(1, (u - 0.42) / 0.42))) * Math.PI * 2;

          cubies.forEach((c) => {
            c.mesh.position.set(c.gx * spread, c.gy * spread, c.gz * spread);
            c.mesh.rotation.set(0, 0, 0);
            if (c.gy === 1) c.mesh.rotation.y += twistA;
            if (c.gx === 0) c.mesh.rotation.x += twistB;
            if (c.gy === -1) c.mesh.rotation.y -= twistB;
          });
        } else if (mode === 'turn_in_place') {
          const bell = Math.sin(u * Math.PI);
          const morph = smoothstep(bell * 0.45);
          mosaicRoot.scale.set(
            THREE.MathUtils.lerp(fullX, fullX * 0.94, morph),
            THREE.MathUtils.lerp(fullY, fullY * 0.94, morph),
            THREE.MathUtils.lerp(1.0, cubeScale, morph)
          );
          mosaicRoot.rotation.set(0, 0, 0);

          const spread = 1 + bell * 0.08;
          cubies.forEach((c) => {
            const stagger = (c.gx + 1) * 0.07 + (1 - c.gy) * 0.07;
            const localU = Math.max(0, Math.min(1, (u - stagger) / 0.62));
            const flipAngle = smoothstep(localU) * Math.PI;
            c.mesh.position.set(c.gx * spread, c.gy * spread, c.gz);
            c.mesh.rotation.set(0, flipAngle, 0);
          });
        } else if (mode === 'middle_split') {
          const bell = Math.sin(u * Math.PI);
          const morph = smoothstep(bell * 1.1);
          mosaicRoot.scale.set(
            THREE.MathUtils.lerp(fullX, cubeScale * 1.15, morph),
            THREE.MathUtils.lerp(fullY, cubeScale * 1.15, morph),
            THREE.MathUtils.lerp(1.0, cubeScale * 1.15, morph)
          );
          mosaicRoot.rotation.set(bell * 0.22, Math.sin(u * Math.PI * 2) * 0.16, 0);

          if (u >= 0.5 && !videoSwappedThisTurn) {
            currentFeedIdx = nextFeedIdx;
            videoSwappedThisTurn = true;
          }

          const splitGap = bell * 1.25;
          cubies.forEach((c) => {
            const shiftX = c.gx === -1 ? -splitGap : c.gx === 1 ? splitGap : 0;
            const shiftY = c.gy === 0 ? 0 : c.gy * bell * 0.35;
            const surgeZ = c.gx === 0 ? bell * 0.85 : -bell * 0.35;
            c.mesh.position.set(c.gx + shiftX, c.gy + shiftY, c.gz + surgeZ);
            if (c.gx === 0) {
              c.mesh.rotation.set(smoothstep(u) * Math.PI * 2, 0, 0);
            } else {
              c.mesh.rotation.set(0, c.gx * bell * 0.6, 0);
            }
          });
        } else {
          const bell = Math.sin(u * Math.PI);
          const morph = smoothstep(bell * 1.05);
          mosaicRoot.scale.set(
            THREE.MathUtils.lerp(fullX, cubeScale * 1.1, morph),
            THREE.MathUtils.lerp(fullY, cubeScale * 1.1, morph),
            THREE.MathUtils.lerp(1.0, cubeScale * 1.1, morph)
          );
          mosaicRoot.rotation.set(0, 0, bell * 0.14);

          if (u >= 0.5 && !videoSwappedThisTurn) {
            currentFeedIdx = nextFeedIdx;
            videoSwappedThisTurn = true;
          }

          cubies.forEach((c) => {
            const ringOrder = Math.abs(c.gx) + Math.abs(c.gy);
            const localU = Math.max(0, Math.min(1, (u - ringOrder * 0.08) / 0.72));
            const rot = smoothstep(localU) * Math.PI * 2;
            c.mesh.position.set(
              c.gx * (1 + bell * 0.25),
              c.gy * (1 + bell * 0.25),
              c.gz + (ringOrder === 0 ? bell * 0.6 : 0)
            );
            c.mesh.rotation.set(rot * (c.gy || 0.5), rot * (c.gx || 0.5), 0);
          });
        }
      }

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
      cubies.forEach((c) => c.geometry.dispose());
      obsidianSideMat.dispose();
      innerFrontMat.dispose();
      frontVideoMat.dispose();
      backVideoMat.dispose();
      texA.dispose();
      texB.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleMenuNavigate = (tool: StudioPageKey) => {
    setMenuOpen(false);
    onNavigateTool(tool);
  };

  const handleUploadVideosOrMedia = (files: FileList | null) => {
    if (!files || !onAddWorkspaceMedia) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      onAddWorkspaceMedia({
        id: `hero-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: file.name,
        url,
        kind,
      });
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMenuOpen(false);
  };

  return (
    <section
      id="page-cube"
      onClick={onOpenAuth}
      className="relative z-20 w-full h-[calc(100vh-4px)] min-h-[560px] rounded-t-[14px] overflow-hidden bg-[#020203]/92 cursor-pointer select-none"
      aria-label="KAYA Full-Screen Video Rubik's Cube Stage"
    >
      {/* Pure Edge-to-Edge Projector Full-Page Three.js Video->Cube Stage (Touches Red Edge & Projects Over Corner Screws) */}
      <div ref={mountRef} className="w-full h-full opacity-95" />

      {/* Top Quick-Action HUD Bar: Always Visible Above The Fold */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 inset-x-3 sm:inset-x-6 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto"
      >
        <div
          onDoubleClick={onOpenAdmin}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#040507]/90 border border-white/15 shadow-[0_4px_18px_rgba(0,0,0,0.8)] backdrop-blur-sm"
        >
          <img
            src="/pwa-192x192.png"
            alt="KAYA"
            className="w-5 h-5 rounded-[4px] border border-[#FF0A3C]/60 object-cover"
          />
          <span
            className="text-xs font-bold uppercase tracking-[0.24em] text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            KAYA
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 pl-2 ml-1 border-l border-white/15 font-mono text-[10px] uppercase tracking-wider">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-[#F1F5F9]" />
                <span className="text-[#F1F5F9]/85">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-[#FF0A3C]" />
                <span className="text-[#FF2E63]">Offline</span>
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenInstall && (
            <button
              type="button"
              onClick={onOpenInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#0B0407]/95 hover:bg-[#19050B] text-white border border-[#FF0A3C] shadow-[0_0_18px_rgba(255,10,60,0.5)] font-mono text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-[#FF0A3C]" />
              <span>{isAppInstalled ? 'App Ready' : 'Install App'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#040507]/92 hover:bg-black text-[#F1F5F9] border border-white/25 hover:border-[#F1F5F9] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#F1F5F9]" />
            <span>{user ? user.handle : 'Sign In'}</span>
          </button>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#040507]/92 hover:bg-black text-[#FF2E63] hover:text-white border border-[#FF2E63]/55 hover:border-[#FF0A3C] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
              title="Open KAYA Owner Admin Portal"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF0A3C]" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*"
        className="hidden"
        onChange={(e) => handleUploadVideosOrMedia(e.target.files)}
      />

      {/* Bottom Reveal Bar: KAYA on left; Home/Display/Prompt/Timeline/Video/Audio/Picture + Main Menu on right */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 opacity-85 hover:opacity-100 focus-within:opacity-100"
      >
        {/* Left: Strictly KAYA letters only */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="bg-transparent border-0 p-0 text-white font-bold text-sm sm:text-base uppercase tracking-[0.28em] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F1F5F9]"
          style={{ fontFamily: 'var(--font-display)' }}
          title={user ? `Signed in as ${user.handle}` : 'Sign In / Sign Up'}
        >
          KAYA
        </button>

        {/* Right: Minimal All-Black Navigation Selections + Main Drop-Down Menu */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('page-cube');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#E6ECF5] hover:text-white border border-white/20 hover:border-white/45 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              onJumpSection ? onJumpSection('studio-display', 'video') : onNavigateTool('video')
            }
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#F1F5F9] hover:text-white border border-[#FF0A3C]/50 hover:border-[#FF0A3C] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Display
          </button>

          <button
            type="button"
            onClick={() =>
              onJumpSection ? onJumpSection('studio-prompt', 'video') : onNavigateTool('video')
            }
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#F1F5F9] hover:text-white border border-[#FF2E63]/50 hover:border-[#FF2E63] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Prompt
          </button>

          <button
            type="button"
            onClick={() =>
              onJumpSection ? onJumpSection('studio-timeline', 'video') : onNavigateTool('editor')
            }
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#F1F5F9] hover:text-white border border-[#F1F5F9]/35 hover:border-[#F1F5F9] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            Timeline
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool('video')}
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#E6ECF5] hover:text-white border border-white/20 hover:border-[#FF1E42]/70 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer hidden md:inline-flex"
          >
            Video
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool('audio')}
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#E6ECF5] hover:text-white border border-white/20 hover:border-[#F1F5F9]/70 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer hidden sm:inline-flex"
          >
            Audio
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool('picture')}
            className="px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-[#E6ECF5] hover:text-white border border-white/20 hover:border-[#F1F5F9]/70 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer hidden md:inline-flex"
          >
            Picture
          </button>

          {/* Main Drop-Down Menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#020203] hover:bg-black text-white border border-white/25 hover:border-[#FF1E42] font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Menu</span>
              {menuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#FF3B5C]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#F1F5F9]" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-60 rounded-[10px] bg-[#020203] border border-white/25 shadow-[0_12px_36px_rgba(0,0,0,0.98)] p-1.5 space-y-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateGates();
                  }}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF1E42]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Studio Gates &amp; Gallery
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('cube')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  360° Video Cube
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('picture')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer sm:hidden"
                >
                  Picture Tools
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('editor')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF2E63]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Timeline Tools
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('intel')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  AI Tools &amp; Code
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('vfx')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF2E63]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  VFX Shaders
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('sound')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Sound Foley
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('lipsync')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF1E42]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Lip Sync Rig
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('airradio')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  KAYA AirRadio (Live FM Synth)
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('school')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF2E63]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Coding &amp; Rendering School
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('merch')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF1E42]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Creator Merch &amp; Print Store
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('live')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Live Camera &amp; Social Stream
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('animator')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF1E42]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Action Animator (Fight &amp; Motion)
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuNavigate('bridge')}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-white transition-colors cursor-pointer"
                >
                  Desktop Bridge (.GLB / .SVG)
                </button>
                {onOpenPlans && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPlans();
                    }}
                    className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF5C8A]/60 font-mono text-xs text-[#FF5C8A] transition-colors cursor-pointer"
                  >
                    Studio Plans &amp; Pro Modules
                  </button>
                )}

                <div className="h-[1px] bg-white/15 my-1" />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#F1F5F9]/60 font-mono text-xs text-[#F1F5F9] transition-colors cursor-pointer"
                >
                  + Load Workspace Videos / Media
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3 py-2 rounded-[6px] bg-[#020203] hover:bg-black border border-transparent hover:border-[#FF1E42]/60 font-mono text-xs text-[#FF5C8A] transition-colors cursor-pointer"
                >
                  {user ? `Account · ${user.handle}` : 'Sign In / Sign Up'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
