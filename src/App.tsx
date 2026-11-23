import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Box,
  Layers,
  Sliders,
  Loader2,
  Clock,
  MonitorPlay,
  Sparkles,
  Volume2,
  Film,
  Image as ImageIcon,
  Waves,
  Mic,
  Scissors,
  Cpu,
  Gauge,
  Palette,
  Compass,
  User,
  Cable,
  Swords,
  Crown,
  Radio,
  GraduationCap,
  ShoppingBag,
  Camera,
  ShieldCheck,
  Clapperboard,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Menu,
  ChevronDown,
  Phone,
  Mail,
  Orbit,
  Snowflake,
  Database,
} from 'lucide-react';
import { PRODUCTS, ATMOSPHERES, BACKGROUND_CUBE_VIDEOS, MediaSelection } from './data.js';
import { ImageUploader } from './components/ImageUploader.js';
import { VideoOutput, LogEntry } from './components/VideoOutput.js';
import { ScrollRow } from './components/ScrollRow.js';
import { PWAInstallButton } from './components/PWAInstallButton.js';
import { usePWAInstall } from './hooks/usePWAInstall.js';
import { MasterControlDeck } from './components/MasterControlDeck.js';
import { HeroVideoCubeStage } from './components/HeroVideoCubeStage.js';
import { KayaAuthModal, KayaUserProfile } from './components/KayaAuthModal.js';
import { ProtectedAdminModal } from './components/ProtectedAdminModal.js';
import { LocalSuiteBridgePage } from './components/LocalSuiteBridgePage.js';
import { PictureAnimatorPage } from './components/PictureAnimatorPage.js';
import { AirRadioPage, CodingRenderingSchoolPage } from './components/AirRadioSchoolPage.js';
import { MerchPrintPage, LiveBroadcastStreamPage } from './components/MerchStoreLivePage.js';
import {
  StudioMembershipModal,
  StudioSubscriptionState,
} from './components/StudioMembershipModal.js';
import { StudioLegalModal, LegalTabKey } from './components/StudioLegalModal.js';
import {
  RubiksCubeHubPage,
  StudioPageKey,
  WorkspaceMediaAsset,
} from './components/RubiksCubeHubPage.js';
import { StudioGatesGallery } from './components/StudioGatesGallery.js';
import { AudioStudioPage, SoundFoleyPage } from './components/AudioSoundPages.js';
import { PictureStudioPage, VfxStudioPage } from './components/PictureVfxPages.js';
import { LipSyncPage, EditorPage, IntelCodePage } from './components/LipSyncEditorIntelPages.js';
import { StoryboardLogoPage } from './components/StoryboardLogoPage.js';
import { VortexHubModules } from './components/VortexHubModules.js';
import {
  GeometricMark,
  PlateBezel,
  HardwareButton,
  LedStatusIndicator,
} from './components/HardwarePrimitives.js';
import {
  renderCinematicReel,
  RESOLUTION_PRESETS,
  HDR_GRADE_PRESETS,
  FPS_PRESETS,
  RENDER_STYLE_PRESETS,
  CAMERA_MOTION_PRESETS,
  ResolutionKey,
  HDRGradeKey,
  FPSKey,
  RenderStyleKey,
  CameraMotionKey,
  CompositionConfig,
} from './lib/studioRenderer.js';
import {
  StudioArtifactDoc,
  StudioConnectorDoc,
  StudioProjectDoc,
  fetchBillingRecord,
  fetchConnectors,
  fetchStudioArtifacts,
  fetchStudioProjects,
  fetchUserProfile,
  saveStudioArtifact,
  saveStudioProject,
  subscribeAuth,
  testFirestoreConnection,
  verifyStaffAccess,
} from './lib/firebase.js';
import { UNIFIED_WATERMARK_TEXT } from './lib/watermarkEngine.js';

type LogType = 'info' | 'success' | 'warn' | 'error';
type AppState = 'IDLE' | 'GENERATING_VIDEO' | 'VIDEO_READY';
type ActiveModule = 'video' | 'frames' | 'all';

interface VideoVersion {
  label: string;
  interactionId: string;
  videoUrl: string;
  mimeType: string;
  specLabel: string;
  prompt: string;
  duration?: string;
  composition?: CompositionConfig;
}

const DURATION_PRESETS = [
  { value: '5s', time: '05s', desc: 'Short Cut' },
  { value: '10s', time: '10s', desc: 'Standard' },
  { value: '15s', time: '15s', desc: 'Extended' },
];

const WORKBENCH_TOOLS: {
  key: StudioPageKey;
  label: string;
  tone: 'red' | 'cyan' | 'magenta' | 'neutral';
  icon: React.ReactNode;
}[] = [
  { key: 'video', label: 'Video & Frames', tone: 'red', icon: <Film className="w-3.5 h-3.5 text-[#FF0A3C]" /> },
  { key: 'vfx', label: 'VFX & BFX', tone: 'magenta', icon: <Sparkles className="w-3.5 h-3.5 text-[#E06844]" /> },
  { key: 'sound', label: 'Sound · DTS / Sony', tone: 'cyan', icon: <Waves className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'audio', label: 'Audio & Music', tone: 'cyan', icon: <Volume2 className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'editor', label: 'Timeline NLE', tone: 'magenta', icon: <Scissors className="w-3.5 h-3.5 text-[#E06844]" /> },
  { key: 'picture', label: 'Picture Suite', tone: 'cyan', icon: <ImageIcon className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'cube', label: '360° Video Cube', tone: 'red', icon: <Box className="w-3.5 h-3.5 text-[#FF0A3C]" /> },
  { key: 'storyboard', label: '3D Storyboard', tone: 'magenta', icon: <Clapperboard className="w-3.5 h-3.5 text-[#E06844]" /> },
  { key: 'intel', label: 'Vortex Vision', tone: 'cyan', icon: <Cpu className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'lipsync', label: 'Lip Sync Rig', tone: 'magenta', icon: <Mic className="w-3.5 h-3.5 text-[#E06844]" /> },
  { key: 'animator', label: 'Action Animator', tone: 'red', icon: <Swords className="w-3.5 h-3.5 text-[#FF0A3C]" /> },
  { key: 'airradio', label: 'AirRadio FM', tone: 'cyan', icon: <Radio className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'school', label: 'Infinity School', tone: 'magenta', icon: <GraduationCap className="w-3.5 h-3.5 text-[#E06844]" /> },
  { key: 'merch', label: 'Printify Studio', tone: 'red', icon: <ShoppingBag className="w-3.5 h-3.5 text-[#FF0A3C]" /> },
  { key: 'live', label: 'Live Stream', tone: 'cyan', icon: <Camera className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
  { key: 'bridge', label: 'Suite Bridge', tone: 'cyan', icon: <Cable className="w-3.5 h-3.5 text-[#F5E9EA]" /> },
];

const SUITE_MENU_ENTRIES: {
  id: string;
  label: string;
  category: string;
  targetType: 'section' | 'tool';
  target: string;
}[] = [
  { id: 'vortex', label: 'Vortex Main Hub Lineup', category: 'Hub', targetType: 'section', target: 'vortex-hub' },
  { id: 'blender', label: 'Blender 3D Pipeline & Shaders', category: '3D Suite', targetType: 'section', target: 'vortex-blender' },
  { id: 'infinity', label: 'Infinity · Valerius (V) Sentinel of Ten Galaxies', category: 'Core', targetType: 'section', target: 'vortex-infinity' },
  { id: 'soul', label: 'Soul · Cooling Forge Opus 4.7 & Billing', category: 'Cooling', targetType: 'section', target: 'vortex-soul' },
  { id: 'connectors', label: 'MCP Skills, SQL, Search & Artifacts', category: 'Backend', targetType: 'section', target: 'vortex-connectors' },
  { id: 'gates', label: 'KAYA Studio Gates & Lineup', category: 'Gallery', targetType: 'section', target: 'page-gates' },
  ...WORKBENCH_TOOLS.map((t) => ({
    id: `tool-${t.key}`,
    label: t.label,
    category: 'Workbench',
    targetType: 'tool' as const,
    target: t.key,
  })),
];

function formatTierLabel(tier: StudioSubscriptionState['tier']): string {
  switch (tier) {
    case 'enterprise':
      return 'Enterprise';
    case 'business':
      return 'Business';
    case 'ultra':
      return 'Ultra';
    case 'pro':
      return 'Pro';
    case 'beginner':
      return 'Beginner';
    default:
      return 'Free Tier';
  }
}

export default function App() {
  const [activeTool, setActiveTool] = useState<StudioPageKey>('video');
  const [activeModule, setActiveModule] = useState<ActiveModule>('video');
  // Pure prompt cinema by default (no forced still cutout floating over the scene)
  const [product, setProduct] = useState<MediaSelection | null>(null);
  const [atmosphere, setAtmosphere] = useState<MediaSelection | null>({
    id: `preset-${ATMOSPHERES[0].id}`,
    source: 'suggestion',
    images: [ATMOSPHERES[0].image],
    description: ATMOSPHERES[0].description,
  });
  const [duration, setDuration] = useState<string>('10s');
  const [resolution, setResolution] = useState<ResolutionKey>('cinemax_4k');
  const [hdrGrade, setHdrGrade] = useState<HDRGradeKey>('ultra_cinemax');
  const [fps, setFps] = useState<FPSKey>(60);
  const [renderStyle, setRenderStyle] = useState<RenderStyleKey>('hdr_ultra');
  const [cameraMotion, setCameraMotion] = useState<CameraMotionKey>('orbit');
  const [lensFocalMm, setLensFocalMm] = useState<number>(35);
  const [shutterAngleDeg, setShutterAngleDeg] = useState<number>(180);
  const [grainLevel, setGrainLevel] = useState<number>(0.18);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [videoTime, setVideoTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const { isInstalled } = usePWAInstall();
  // Never auto-popup install modal on Screen 1
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('brand');

  // Navigation bar Search & Dropdown Menu state
  const [suiteSearch, setSuiteSearch] = useState('');
  const [suiteMenuOpen, setSuiteMenuOpen] = useState(false);

  // Firebase Auth & Dedicated Cloud Workspace State (Zero localStorage)
  const [kayaUser, setKayaUser] = useState<KayaUserProfile | null>(null);
  const [cloudProjects, setCloudProjects] = useState<StudioProjectDoc[]>([]);
  const [cloudArtifacts, setCloudArtifacts] = useState<StudioArtifactDoc[]>([]);
  const [cloudConnectors, setCloudConnectors] = useState<StudioConnectorDoc[]>([]);

  const [studioPlan, setStudioPlan] = useState<StudioSubscriptionState>({
    tier: 'free',
    billingCycle: 'monthly',
    provider: 'stripe',
    addons: [],
  });

  const [voiceActive, setVoiceActive] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncingApp, setSyncingApp] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiDirectorMeta, setAiDirectorMeta] = useState<{
    directorNotes?: string;
    lightingCue?: string;
    cameraTip?: string;
  } | null>(null);

  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const versionCount = useRef(0);
  const [uploadedCubeAssets, setUploadedCubeAssets] = useState<WorkspaceMediaAsset[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogType = 'info', image?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        message,
        type,
        image,
      },
    ]);
  }, []);

  const hydrateCloudWorkspace = useCallback(async (uid: string) => {
    try {
      const [profile, projects, artifacts, connectors, billing] = await Promise.all([
        fetchUserProfile(uid),
        fetchStudioProjects(uid),
        fetchStudioArtifacts(uid),
        fetchConnectors(uid),
        fetchBillingRecord(uid),
      ]);
      setCloudProjects(projects);
      setCloudArtifacts(artifacts);
      setCloudConnectors(connectors);
      if (billing || profile) {
        setStudioPlan((prev) => ({
          ...prev,
          tier: billing?.tier || profile?.tier || prev.tier,
          billingCycle: billing?.billingCycle || profile?.billingCycle || prev.billingCycle,
          provider: billing?.provider || prev.provider,
        }));
      }
    } catch {
      // Cloud read fallback stays silent without creating device copies
    }
  }, []);

  // Verify Firestore connection and subscribe to Chrome Google Firebase Auth on boot
  useEffect(() => {
    testFirestoreConnection().catch(() => false);
    const unsub = subscribeAuth(async (fbUser) => {
      if (!fbUser) {
        setKayaUser(null);
        setCloudProjects([]);
        setCloudArtifacts([]);
        setCloudConnectors([]);
        return;
      }
      const staff = await verifyStaffAccess(fbUser).catch(() => null);
      const profile = await fetchUserProfile(fbUser.uid).catch(() => null);
      setKayaUser({
        uid: fbUser.uid,
        handle: profile?.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Creator',
        email: fbUser.email || '',
        signedInAt: new Date().toISOString(),
        role: staff?.role || 'member',
        tier: profile?.tier || 'free',
        billingCycle: profile?.billingCycle || 'monthly',
      });
      await hydrateCloudWorkspace(fbUser.uid);
    });
    return () => unsub();
  }, [hydrateCloudWorkspace]);

  useEffect(() => {
    if (isInstalled) setInstallModalOpen(false);
  }, [isInstalled]);

  // Discreet protected Staff Portal keyboard shortcut: Ctrl+Shift+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAdminPortalOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      addLog('Connection active — Firebase workspace sync online.', 'success');
    };
    const onOffline = () => {
      setIsOnline(false);
      addLog('Network offline — local studio workstation operational.', 'warn');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [addLog]);

  const handleManualAutoSync = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      addLog('Offline — local studio workstation operational.', 'info');
      return;
    }
    setSyncingApp(true);
    try {
      const res = await fetch('/api/app-version', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { version?: string };
        addLog(`Workspace synchronized (#${(data.version || 'vortex').slice(-6)}).`, 'success');
      }
      if (kayaUser?.uid) {
        await hydrateCloudWorkspace(kayaUser.uid);
      }
    } catch {
      addLog('Sync check skipped — local studio active.', 'warn');
    } finally {
      setSyncingApp(false);
    }
  };

  const handleEnhancePromptWithAI = async () => {
    if (aiEnhancing) return;
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/vortex/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prompt_enhance',
          prompt: editText.trim(),
          subject: product ? describe(product) : 'Studio Subject',
          environment: atmosphere ? describe(atmosphere) : 'Obsidian Studio',
          style: activeStyleSpec.label,
          fps,
          cameraMotion,
        }),
      });
      const data = (await res.json()) as {
        enhancedPrompt?: string;
        directorNotes?: string;
        lightingCue?: string;
        cameraTip?: string;
        error?: string;
      };
      if (data.enhancedPrompt) setEditText(data.enhancedPrompt);
      setAiDirectorMeta({
        directorNotes: data.directorNotes,
        lightingCue: data.lightingCue,
        cameraTip: data.cameraTip,
      });
      addLog('Vortex self-hosted director enhanced scene prompt & lighting cues.', 'success');
    } catch {
      const subj = product ? describe(product) : 'Hero Subject';
      const env = atmosphere ? describe(atmosphere) : 'Obsidian Studio Stage';
      const base = editText.trim();
      setEditText(
        base
          ? `${base} — ${subj} inside ${env}, Candy-Gloss (#FF0A3C) specular clearcoat & Burnished Rust (#B84323) rim at ${fps}fps.`
          : `Anamorphic ${fps}fps ${cameraMotion} hero reel of ${subj} inside ${env}, Candy-Gloss & Burnished Rust optical contrast.`
      );
      setAiDirectorMeta({
        directorNotes: `Self-hosted director locked ${fps}fps cinematic curve.`,
        lightingCue: 'Burnished Rust side fill + Candy-Gloss primary rim.',
        cameraTip: `Smooth ${cameraMotion} sweep.`,
      });
      addLog('Vortex local scene director updated prompt cues.', 'success');
    } finally {
      setAiEnhancing(false);
    }
  };

  const describe = (sel: MediaSelection) =>
    sel.description || `${sel.images.length} uploaded image${sel.images.length > 1 ? 's' : ''}`;

  const activeResSpec =
    RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[3];
  const activeStyleSpec =
    RENDER_STYLE_PRESETS.find((s) => s.key === renderStyle) ?? RENDER_STYLE_PRESETS[0];
  const currentFormatLabel = `${activeResSpec.tag} · ${fps}fps · ${activeStyleSpec.label}`;

  const isGenerating = appState === 'GENERATING_VIDEO';
  const canSubmit = !isGenerating && (!!editText.trim() || !!product || !!atmosphere);

  const selected = versions.find((v) => v.label === selectedLabel) ?? null;
  const otherVersions = versions.filter((v) => v.label !== selectedLabel);

  const selectedProductUrl = product?.images[0] || PRODUCTS[0].image;
  const selectedAtmosphereUrl = atmosphere?.images[0] || ATMOSPHERES[0].image;
  const selectedProductTransparentUrl = PRODUCTS.find((p) => `preset-${p.id}` === product?.id)?.transparentImage;

  const workspaceMedia = useMemo<WorkspaceMediaAsset[]>(() => {
    const defaultBackgroundVideos: WorkspaceMediaAsset[] = BACKGROUND_CUBE_VIDEOS.map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
      kind: 'video' as const,
    }));

    const baseImages: WorkspaceMediaAsset[] = [
      ...PRODUCTS.map((p) => ({
        id: `prod-${p.id}`,
        label: p.label,
        url: p.image,
        kind: 'image' as const,
      })),
      ...ATMOSPHERES.map((a) => ({
        id: `atmo-${a.id}`,
        label: a.label,
        url: a.image,
        kind: 'image' as const,
      })),
    ];

    if (product?.source === 'upload' && product.images[0]) {
      baseImages.unshift({
        id: product.id,
        label: product.description,
        url: product.images[0],
        kind: 'image',
      });
    }
    if (atmosphere?.source === 'upload' && atmosphere.images[0]) {
      baseImages.unshift({
        id: atmosphere.id,
        label: atmosphere.description,
        url: atmosphere.images[0],
        kind: 'image',
      });
    }

    const renderedVids: WorkspaceMediaAsset[] = versions.map((v) => ({
      id: `cut-${v.label}`,
      label: v.label,
      url: v.videoUrl,
      kind: 'video',
    }));

    return [...uploadedCubeAssets, ...renderedVids, ...defaultBackgroundVideos, ...baseImages];
  }, [uploadedCubeAssets, versions, product, atmosphere]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleJumpSection = (sectionId: string, tool: StudioPageKey = 'video') => {
    setActiveTool(tool);
    if (tool === 'video') setActiveModule('all');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSelectToolFromGalleryOrNav = (tool: StudioPageKey) => {
    setActiveTool(tool);
    setSuiteMenuOpen(false);
    scrollToSection('page-tools');
  };

  const handleOpenBillingFromHub = (provider: 'stripe' | 'infinity_billing') => {
    setStudioPlan((prev) => ({ ...prev, provider }));
    setPlansModalOpen(true);
  };

  // Real-Time Voice Command -> Executes actual studio/render/navigation actions
  const triggerGlobalSmartVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      handleSelectToolFromGalleryOrNav('intel');
      addLog('Opened Vortex Vision & Voice Console (browser SpeechRecognition needed for mic capture).', 'info');
      return;
    }
    if (voiceActive) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setVoiceActive(true);
    addLog('Voice action listener active (say "Render", "Blender", "Infinity", "Cooling", "School", "Printify", "Radio")…', 'info');
    rec.onresult = (ev: any) => {
      const phrase = String(ev.results?.[0]?.[0]?.transcript || '').toLowerCase();
      if (phrase.includes('render') || phrase.includes('action') || phrase.includes('shoot')) {
        handleSubmit();
        return;
      }
      if (phrase.includes('blender')) {
        scrollToSection('vortex-blender');
        addLog(`Voice jumped to Blender Pipeline from "${phrase}".`, 'success');
        return;
      }
      if (phrase.includes('infinity') || phrase.includes('valerius') || phrase.includes('galaxy')) {
        scrollToSection('vortex-infinity');
        addLog(`Voice jumped to Infinity · Valerius (V) from "${phrase}".`, 'success');
        return;
      }
      if (phrase.includes('cool') || phrase.includes('soul') || phrase.includes('opus')) {
        scrollToSection('vortex-soul');
        addLog(`Voice jumped to Soul · Cooling Forge Opus 4.7 from "${phrase}".`, 'success');
        return;
      }
      if (phrase.includes('connector') || phrase.includes('database') || phrase.includes('sql') || phrase.includes('search')) {
        scrollToSection('vortex-connectors');
        addLog(`Voice jumped to Connectors & Databases from "${phrase}".`, 'success');
        return;
      }
      const map: [string, StudioPageKey][] = [
        ['radio', 'airradio'],
        ['school', 'school'],
        ['coding', 'school'],
        ['printify', 'merch'],
        ['merch', 'merch'],
        ['print', 'merch'],
        ['live', 'live'],
        ['stream', 'live'],
        ['camera', 'live'],
        ['fight', 'animator'],
        ['animate', 'animator'],
        ['bridge', 'bridge'],
        ['cube', 'cube'],
        ['audio', 'audio'],
        ['video', 'video'],
        ['picture', 'picture'],
        ['vfx', 'vfx'],
        ['sound', 'sound'],
        ['lip', 'lipsync'],
        ['editor', 'editor'],
        ['storyboard', 'storyboard'],
      ];
      for (const [kw, key] of map) {
        if (phrase.includes(kw)) {
          handleSelectToolFromGalleryOrNav(key);
          addLog(`Voice launched "${key.toUpperCase()}" from "${phrase}".`, 'success');
          return;
        }
      }
      setEditText((prev) => (prev.trim() ? `${prev.trim()} — ${phrase}` : phrase));
      addLog(`Voice injected scene instruction: "${phrase}"`, 'info');
    };
    rec.onend = () => setVoiceActive(false);
    rec.onerror = () => setVoiceActive(false);
    rec.start();
  };

  const addVersion = (
    interactionId: string,
    videoUrl: string,
    mimeType: string,
    specLabel: string,
    promptText: string,
    videoDurationStr?: string,
    composition?: CompositionConfig
  ) => {
    const label = `Cut ${++versionCount.current}`;
    setVersions((prev) => [
      ...prev,
      {
        label,
        interactionId,
        videoUrl,
        mimeType,
        specLabel,
        prompt: promptText,
        duration: videoDurationStr || duration,
        composition,
      },
    ]);
    setSelectedLabel(label);
  };

  const handleSubmit = async () => {
    if (!editText.trim() && !product && !atmosphere) {
      addLog('Enter a scene prompt or pick a stage backdrop / frame plate before rendering.', 'error');
      return;
    }

    versionCount.current = 0;
    setVersions([]);
    setSelectedLabel(null);
    setEditOpen(false);
    setVideoTime(0);
    setVideoDuration(0);
    setRenderProgress(0);
    setAppState('GENERATING_VIDEO');

    addLog(
      `Initializing ${activeResSpec.label} (${fps}fps · ${activeStyleSpec.label} · ${lensFocalMm}mm ${shutterAngleDeg}° · ${cameraMotion}) · ${duration}…`,
      'info'
    );

    try {
      const durSec = parseInt(duration, 10) || 10;
      const promptInstructions = editText.trim() || undefined;
      const compositionSnapshot: CompositionConfig = {
        productUrl: product?.images[0],
        transparentProductUrl: selectedProductTransparentUrl,
        atmosphereUrl: atmosphere?.images[0] || ATMOSPHERES[0].image,
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        lensFocalMm,
        shutterAngleDeg,
        grainLevel,
        instructions: promptInstructions,
      };
      const result = await renderCinematicReel({
        productUrl: product?.images[0],
        atmosphereUrl: atmosphere?.images[0] || ATMOSPHERES[0].image,
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        lensFocalMm,
        shutterAngleDeg,
        grainLevel,
        instructions: promptInstructions,
        onProgress: (percent, msg) => {
          setRenderProgress(percent);
          addLog(msg, percent >= 90 ? 'success' : 'warn');
        },
      });

      const promptText = promptInstructions
        ? `${promptInstructions} · ${activeResSpec.label} · ${fps}fps`
        : `${activeResSpec.label} · ${fps}fps · ${activeStyleSpec.label} · ${duration}`;
      addVersion(
        `render-${Date.now()}`,
        result.videoUrl,
        result.mimeType,
        currentFormatLabel,
        promptText,
        duration,
        compositionSnapshot
      );
      setRenderProgress(100);
      setAppState('VIDEO_READY');
      addLog(`${activeResSpec.label} master complete (${result.width}×${result.height} @ ${fps}fps).`, 'success');

      if (kayaUser?.uid) {
        await Promise.all([
          saveStudioProject({
            userId: kayaUser.uid,
            studioHub: 'VORTEX · KAYA',
            label: `${activeResSpec.tag} Master (${fps}fps)`,
            duration,
            prompt: promptText,
          }),
          saveStudioArtifact({
            userId: kayaUser.uid,
            studioHub: 'KAYA Cinema',
            title: `${activeResSpec.label} · ${activeStyleSpec.label}`,
            kind: 'render',
            summary: `${result.width}×${result.height} @ ${fps}fps`,
          }),
        ]);
        hydrateCloudWorkspace(kayaUser.uid);
      }
    } catch (e: any) {
      setAppState('IDLE');
      setRenderProgress(0);
      addLog(`Render error: ${e.message}`, 'error');
    }
  };

  const handleEdit = async () => {
    if (!selected || !editText.trim() || isGenerating) return;
    const instructions = editText.trim();
    const fromLabel = selected.label;
    const editDuration = selected.duration || duration;

    setEditOpen(false);
    setEditText('');
    setRenderProgress(0);
    setAppState('GENERATING_VIDEO');
    addLog(`Applying adjustment to ${fromLabel} (${activeResSpec.label} @ ${fps}fps · ${editDuration}): "${instructions}"`, 'warn');

    try {
      const durSec = parseInt(editDuration, 10) || 10;
      const compositionSnapshot: CompositionConfig = {
        productUrl: product?.images[0],
        transparentProductUrl: selectedProductTransparentUrl,
        atmosphereUrl: atmosphere?.images[0] || ATMOSPHERES[0].image,
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        lensFocalMm,
        shutterAngleDeg,
        grainLevel,
        instructions,
      };
      const result = await renderCinematicReel({
        productUrl: product?.images[0],
        atmosphereUrl: atmosphere?.images[0] || ATMOSPHERES[0].image,
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        lensFocalMm,
        shutterAngleDeg,
        grainLevel,
        instructions,
        onProgress: (percent, msg) => {
          setRenderProgress(percent);
          addLog(msg, percent >= 90 ? 'success' : 'warn');
        },
      });

      addVersion(
        `edit-${Date.now()}`,
        result.videoUrl,
        result.mimeType,
        currentFormatLabel,
        instructions,
        editDuration,
        compositionSnapshot
      );
      setRenderProgress(100);
      setAppState('VIDEO_READY');
      addLog('Adjusted master cut rendered successfully.', 'success');
    } catch (e: any) {
      setAppState('VIDEO_READY');
      addLog(`Adjustment failed: ${e.message}`, 'error');
    }
  };

  const selectVersion = (label: string) => {
    setSelectedLabel(label);
    setEditOpen(false);
    setVideoTime(0);
  };

  const downloadVideo = (version: Pick<VideoVersion, 'label' | 'videoUrl' | 'mimeType'>) => {
    try {
      setDownloading(true);
      const ext = version.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = version.videoUrl;
      a.download = `vortex-kaya-4k-${version.label.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addLog(`Exported ${version.label} (.${ext}).`, 'success');
    } catch (e: any) {
      addLog(`Export failed: ${e.message}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const matchingSuiteEntries = useMemo(() => {
    const q = suiteSearch.trim().toLowerCase();
    if (!q) return [];
    return SUITE_MENU_ENTRIES.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [suiteSearch]);

  const showVideoStation = activeModule === 'video' || activeModule === 'all';
  const showFramesStation = activeModule === 'frames' || activeModule === 'all';

  return (
    <div className="min-h-screen w-full bg-[#050304] text-[#F5E9EA] p-0">
      <div className="relative w-full mx-auto candy-chassis flex flex-col">
        {/* ====================================================================
            SCREEN 1: UNTOUCHED THREE.JS FLIPPING RUBIK'S CUBES STAGE
            ==================================================================== */}
        <HeroVideoCubeStage
          workspaceMedia={workspaceMedia}
          latestVideoUrl={selected?.videoUrl ?? null}
          user={kayaUser}
          isOnline={isOnline}
          isAppInstalled={isInstalled}
          onOpenInstall={() => setInstallModalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onNavigateTool={handleSelectToolFromGalleryOrNav}
          onNavigateGates={() => scrollToSection('page-gates')}
          onOpenPlans={() => setPlansModalOpen(true)}
          onAddWorkspaceMedia={(asset) => setUploadedCubeAssets((prev) => [asset, ...prev])}
          onJumpSection={handleJumpSection}
        />

        {/* CONTINUOUS EDGE-TO-EDGE ENDLESS SCROLL SUITE BELOW SCREEN 1 */}
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-4 flex flex-col gap-5">
          {/* TOP CONTROL BAR: Search & Menu Left/Center · Prominent VORTEX · KAYA Branding Top Right */}
          <header className="sticky top-2 z-40 candy-surface rounded-2xl px-3.5 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Search & Dropdown Menu Left/Center */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              {/* Accessible Suite Dropdown Menu */}
              <div className="relative">
                <HardwareButton
                  size="sm"
                  tone="red"
                  active={suiteMenuOpen}
                  onClick={() => setSuiteMenuOpen((o) => !o)}
                  aria-expanded={suiteMenuOpen}
                  aria-label="Open VORTEX · KAYA Suite Navigation Menu"
                >
                  <Menu className="w-3.5 h-3.5 text-[#FF0A3C]" />
                  <span>Suite Menu</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </HardwareButton>

                {suiteMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 max-h-96 overflow-y-auto candy-chassis rounded-2xl p-2 z-50 space-y-1 shadow-[0_18px_40px_rgba(0,0,0,0.85)]">
                    {SUITE_MENU_ENTRIES.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setSuiteMenuOpen(false);
                          if (entry.targetType === 'section') {
                            scrollToSection(entry.target);
                          } else {
                            handleSelectToolFromGalleryOrNav(entry.target as StudioPageKey);
                          }
                        }}
                        className="w-full candy-trace-tile rounded-xl px-3 py-2 text-left flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="font-mono text-xs text-white truncate">{entry.label}</span>
                        <span className="font-mono text-[10px] text-[#E06844] shrink-0">{entry.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Suite Search Input */}
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-[#E6ECF5]/50 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={suiteSearch}
                  onChange={(e) => setSuiteSearch(e.target.value)}
                  placeholder="Search studios, Blender, Infinity…"
                  className="w-full bg-[#050304] border border-[#B84323]/30 rounded-full pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-[#FF0A3C]"
                />
                {matchingSuiteEntries.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 candy-chassis rounded-2xl p-2 z-50 space-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.9)]">
                    {matchingSuiteEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setSuiteSearch('');
                          if (entry.targetType === 'section') {
                            scrollToSection(entry.target);
                          } else {
                            handleSelectToolFromGalleryOrNav(entry.target as StudioPageKey);
                          }
                        }}
                        className="w-full candy-trace-tile rounded-xl px-3 py-1.5 text-left flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="font-mono text-xs text-white truncate">{entry.label}</span>
                        <span className="font-mono text-[10px] text-[#FF0A3C]">{entry.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <HardwareButton
                size="sm"
                tone={voiceActive ? 'red' : 'cyan'}
                active={voiceActive}
                onClick={triggerGlobalSmartVoice}
                title="Voice Command: executes studio navigation or rendering directly"
              >
                <Mic className="w-3.5 h-3.5 text-[#F1F5F9]" />
                <span className="hidden sm:inline">{voiceActive ? 'Listening…' : 'Voice'}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="magenta"
                active={plansModalOpen}
                onClick={() => setPlansModalOpen(true)}
                title="Membership Tiers (Free, Beginner, Pro, Ultra, Business, Enterprise)"
              >
                <Crown className="w-3.5 h-3.5 text-[#FF5C8A]" />
                <span>{formatTierLabel(studioPlan.tier)}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="cyan"
                active={!!kayaUser}
                onClick={() => {
                  setAuthInitialMode('signin');
                  setAuthModalOpen(true);
                }}
              >
                <User className="w-3.5 h-3.5 text-[#F1F5F9]" />
                <span>{kayaUser ? kayaUser.handle : 'Sign In'}</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone={isOnline ? 'cyan' : 'red'}
                active={!isOnline || syncingApp}
                onClick={handleManualAutoSync}
              >
                {syncingApp ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-[#F1F5F9]" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#FF0A3C]" />
                )}
                <span className="hidden md:inline">
                  {syncingApp ? 'Syncing…' : isOnline ? 'Cloud Sync' : 'Offline Ready'}
                </span>
              </HardwareButton>

              <PWAInstallButton
                externalOpen={installModalOpen}
                onExternalOpenChange={setInstallModalOpen}
              />
            </div>

            {/* PROMINENT TOP-RIGHT STUDIO BRANDING */}
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              <div className="text-right leading-tight">
                <h1
                  className="text-base sm:text-xl font-bold uppercase tracking-[0.28em] see-thru-font whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  VORTEX · KAYA
                </h1>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] see-thru-font-subtle block whitespace-nowrap">
                  Chrome-Ready Suite · Candy-Gloss &amp; Rust
                </span>
              </div>
              <GeometricMark />
            </div>
          </header>

          {/* SECTION NAVIGATION STRIP */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <HardwareButton size="sm" tone="red" active onClick={() => scrollToSection('vortex-hub')}>
                <Layers className="w-3.5 h-3.5 text-[#FF0A3C]" />
                <span>Vortex Hub</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="cyan" active={false} onClick={() => scrollToSection('vortex-blender')}>
                <Box className="w-3.5 h-3.5 text-[#E06844]" />
                <span>Blender Pipeline</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="red" active={false} onClick={() => scrollToSection('vortex-infinity')}>
                <Orbit className="w-3.5 h-3.5 text-[#FF0A3C]" />
                <span>Infinity · Valerius (V)</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="cyan" active={false} onClick={() => scrollToSection('vortex-soul')}>
                <Snowflake className="w-3.5 h-3.5 text-[#F1F5F9]" />
                <span>Soul Cooling Opus 4.7</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="magenta" active={false} onClick={() => scrollToSection('vortex-connectors')}>
                <Database className="w-3.5 h-3.5 text-[#E06844]" />
                <span>MCP &amp; Databases</span>
              </HardwareButton>
              <HardwareButton size="sm" tone="neutral" active={false} onClick={() => scrollToSection('page-tools')}>
                <Sliders className="w-3.5 h-3.5 text-[#F1F5F9]" />
                <span>Workbench</span>
              </HardwareButton>
            </div>
            <span className="font-mono text-[10px] text-[#E06844]/85 uppercase tracking-widest">
              {UNIFIED_WATERMARK_TEXT}
            </span>
          </div>

          {/* ====================================================================
              VORTEX MAIN HUB: BLENDER, INFINITY (VALERIUS V), SOUL COOLING, CONNECTORS
              ==================================================================== */}
          <VortexHubModules
            activeTool={activeTool}
            userId={kayaUser?.uid}
            userEmail={kayaUser?.email}
            projects={cloudProjects}
            artifacts={cloudArtifacts}
            connectors={cloudConnectors}
            onRefreshCloudData={() => kayaUser?.uid && hydrateCloudWorkspace(kayaUser.uid)}
            onSelectTool={handleSelectToolFromGalleryOrNav}
            onOpenBilling={handleOpenBillingFromHub}
            onJumpSection={scrollToSection}
          />

          {/* ====================================================================
              KAYA STUDIO GATES & SEAMLESS LINEUP GALLERY
              ==================================================================== */}
          <StudioGatesGallery
            activeTool={activeTool}
            subjectImage={selectedProductUrl}
            environmentImage={selectedAtmosphereUrl}
            formatSummary={currentFormatLabel}
            cutsCount={versions.length}
            onSelectTool={handleSelectToolFromGalleryOrNav}
          />

          {/* ====================================================================
              COMPLETE ACTIVE STUDIO WORKBENCH (ALL CONNECTED STUDIOS & SHADERS)
              ==================================================================== */}
          <section id="page-tools" className="space-y-4">
            <PlateBezel screws={false} accent="cyan" className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6ECF5]/75"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Active Studio &amp; Shader Workbench
                </span>
                <nav aria-label="Workbench tool selector" className="flex flex-wrap items-center gap-2">
                  {WORKBENCH_TOOLS.map((tool) => (
                    <HardwareButton
                      key={tool.key}
                      size="sm"
                      tone={tool.tone}
                      active={activeTool === tool.key}
                      onClick={() => setActiveTool(tool.key)}
                    >
                      {tool.icon}
                      <span>{tool.label}</span>
                    </HardwareButton>
                  ))}
                </nav>
              </div>
            </PlateBezel>

            {activeTool === 'video' && (
              <>
                <PlateBezel screws={false} className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <HardwareButton
                        size="sm"
                        tone="red"
                        active={activeModule === 'video'}
                        onClick={() => setActiveModule('video')}
                      >
                        <MonitorPlay className="w-3.5 h-3.5 text-[#FF0A3C]" />
                        <span>Video &amp; Options</span>
                      </HardwareButton>
                      <HardwareButton
                        size="sm"
                        tone="cyan"
                        active={activeModule === 'frames'}
                        onClick={() => setActiveModule('frames')}
                      >
                        <Camera className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>Frames &amp; Camera Rig</span>
                      </HardwareButton>
                      <HardwareButton
                        size="sm"
                        tone="magenta"
                        active={activeModule === 'all'}
                        onClick={() => setActiveModule('all')}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-[#FF5C8A]" />
                        <span>All Video &amp; Frame Stations</span>
                      </HardwareButton>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <HardwareButton
                        size="sm"
                        tone="red"
                        active={false}
                        onClick={() => {
                          setActiveModule('video');
                          handleJumpSection('studio-display', 'video');
                        }}
                      >
                        <MonitorPlay className="w-3.5 h-3.5 text-[#FF3B5C]" />
                        <span>Display</span>
                      </HardwareButton>
                      <HardwareButton
                        size="sm"
                        tone="magenta"
                        active={false}
                        onClick={() => {
                          setActiveModule('video');
                          handleJumpSection('studio-prompt', 'video');
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FF5C8A]" />
                        <span>Prompt Window</span>
                      </HardwareButton>
                      <HardwareButton
                        size="sm"
                        tone="cyan"
                        active={false}
                        onClick={() => handleJumpSection('studio-timeline', 'video')}
                      >
                        <Scissors className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>DaVinci Timeline</span>
                      </HardwareButton>
                    </div>
                  </div>
                </PlateBezel>

                {/* STATION A: FRAMES & CAMERA SETTINGS (IN ITS OWN CLEAN TILE) */}
                {showFramesStation && (
                  <div className="space-y-4">
                    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-mono text-xs font-bold tracking-widest text-[#F1F5F9] tabular-nums">
                            CAM
                          </span>
                          <h3
                            className="text-sm sm:text-base font-bold tracking-wide text-[#F5E9EA] uppercase"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            Frames &amp; Camera Settings Rig
                          </h3>
                        </div>
                        <LedStatusIndicator
                          label={`${lensFocalMm}mm Lens · ${shutterAngleDeg}° Shutter · ${fps} FPS · Grain ${Math.round(grainLevel * 100)}%`}
                          tone="cyan"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                        {/* Lens Focal Length */}
                        <div className="candy-surface rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
                            <span>Anamorphic Prime Lens</span>
                            <span className="text-[#FF0A3C] font-bold tabular-nums">{lensFocalMm}mm</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[24, 35, 50, 85].map((mm) => (
                              <HardwareButton
                                key={mm}
                                size="sm"
                                fullWidth
                                tone="cyan"
                                active={lensFocalMm === mm}
                                disabled={isGenerating}
                                onClick={() => setLensFocalMm(mm)}
                              >
                                <span className="tabular-nums">{mm}mm</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>

                        {/* Shutter Angle */}
                        <div className="candy-surface rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
                            <span>Shutter Angle Motion</span>
                            <span className="text-[#E06844] font-bold tabular-nums">{shutterAngleDeg}°</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[90, 180, 360].map((deg) => (
                              <HardwareButton
                                key={deg}
                                size="sm"
                                fullWidth
                                tone="magenta"
                                active={shutterAngleDeg === deg}
                                disabled={isGenerating}
                                onClick={() => setShutterAngleDeg(deg)}
                              >
                                <span className="tabular-nums">{deg}°</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>

                        {/* Film Grain & Camera Rig Motion */}
                        <div className="candy-surface rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between font-mono text-xs text-[#E6ECF5]/80">
                            <span>35mm Optical Grain</span>
                            <span className="text-[#F5E9EA] font-bold tabular-nums">{Math.round(grainLevel * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={0.6}
                            step={0.05}
                            disabled={isGenerating}
                            value={grainLevel}
                            onChange={(e) => setGrainLevel(parseFloat(e.target.value))}
                            className="hw-capsule-slider w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="candy-surface rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                            <Gauge className="w-3.5 h-3.5 text-[#FF3B5C]" />
                            <span>Capture Frame Rate (24–144 fps)</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {FPS_PRESETS.map((f) => (
                              <HardwareButton
                                key={f.key}
                                fullWidth
                                tone={f.key >= 90 ? 'red' : 'cyan'}
                                active={fps === f.key}
                                disabled={isGenerating}
                                onClick={() => setFps(f.key)}
                              >
                                <span className="font-bold tabular-nums">{f.label}</span>
                                <span className="text-[11px] text-[#E6ECF5]/65 hidden sm:inline">{f.desc}</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>

                        <div className="candy-surface rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                            <Compass className="w-3.5 h-3.5 text-[#F1F5F9]" />
                            <span>Camera Crane &amp; Gimbal Path</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CAMERA_MOTION_PRESETS.map((cm) => (
                              <HardwareButton
                                key={cm.key}
                                size="sm"
                                fullWidth
                                tone="cyan"
                                active={cameraMotion === cm.key}
                                disabled={isGenerating}
                                onClick={() => setCameraMotion(cm.key)}
                              >
                                <span>{cm.label}</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PlateBezel>

                    <ImageUploader
                      indexLabel="PLATE A ·"
                      title="Optional Foreground Crest / Overlay Plate (Off = Pure Scene Render)"
                      type="product"
                      suggestions={PRODUCTS}
                      selection={product}
                      onSelect={setProduct}
                      disabled={isGenerating}
                    />

                    <ImageUploader
                      indexLabel="PLATE B ·"
                      title="Stage Backdrop Frame"
                      type="atmosphere"
                      suggestions={ATMOSPHERES}
                      selection={atmosphere}
                      onSelect={setAtmosphere}
                      disabled={isGenerating}
                    />
                  </div>
                )}

                {/* STATION B: VIDEO OUTPUT + PROMPT + VIDEO OPTIONS */}
                {showVideoStation && (
                  <>
                    <div id="studio-display" className="scroll-mt-20">
                      <VideoOutput
                        appState={appState}
                        videoUrl={selected?.videoUrl ?? null}
                        logs={logs}
                        isLooping={isLooping}
                        onToggleLoop={() => setIsLooping((l) => !l)}
                        onDownload={selected ? () => downloadVideo(selected) : undefined}
                        onToggleEdit={() => {
                          setEditOpen((o) => !o);
                          scrollToSection('studio-prompt');
                        }}
                        editOpen={editOpen}
                        downloading={downloading}
                        versionLabel={selected?.label}
                        targetDuration={selected?.duration || duration}
                        formatSpecLabel={selected?.specLabel || currentFormatLabel}
                        renderProgress={renderProgress}
                        onVideoTimeUpdate={(cur, dur) => {
                          setVideoTime(cur);
                          setVideoDuration(dur);
                        }}
                        seekToTime={seekToTime}
                        composition={selected?.composition}
                        onLog={addLog}
                      />
                    </div>

                    {/* PROMPT WINDOW */}
                    <div id="studio-prompt" className="scroll-mt-20">
                      <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-[#FF0A3C]" />
                            <h3
                              className="text-sm font-bold uppercase tracking-wider text-white"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              Prompt Window · Pure Cinema Scene Director
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              'Candy-Gloss Specular Rim',
                              'Burnished Rust Volumetrics',
                              'Fast 360 Orbit',
                              'Neon Rain Reflections',
                            ].map((preset) => (
                              <HardwareButton
                                key={preset}
                                size="sm"
                                tone="neutral"
                                ledIndicator={false}
                                onClick={() =>
                                  setEditText((prev) =>
                                    prev.trim() ? `${prev.trim()}, ${preset.toLowerCase()}` : preset
                                  )
                                }
                              >
                                <span>+ {preset}</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder={
                            selected
                              ? `Enter scene prompt or lighting/camera adjustments for ${selected.label}…`
                              : 'Describe your scene motion, optical rays, sparks, rain, or camera move — renders cleanly without any floating photo overlay…'
                          }
                          className="w-full bg-[#050304] border border-[#B84323]/30 text-[#F5E9EA] p-3.5 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#FF0A3C] rounded-xl resize-y min-h-[84px]"
                        />
                        {aiDirectorMeta && (
                          <div className="candy-surface rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                            {aiDirectorMeta.directorNotes && (
                              <div className="text-[#F5E9EA]/85">
                                <span className="text-[#FF0A3C] uppercase">Director: </span>
                                {aiDirectorMeta.directorNotes}
                              </div>
                            )}
                            {aiDirectorMeta.lightingCue && (
                              <div className="text-[#F5E9EA]/85">
                                <span className="text-[#E06844] uppercase">Lighting: </span>
                                {aiDirectorMeta.lightingCue}
                              </div>
                            )}
                            {aiDirectorMeta.cameraTip && (
                              <div className="text-[#F5E9EA]/85">
                                <span className="text-white uppercase">Rig: </span>
                                {aiDirectorMeta.cameraTip}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <span className="font-mono text-[11px] text-[#E6ECF5]/60">
                            Plate A: {product ? product.description : 'None (Pure Scene Rendering Active)'} · Stage: {atmosphere ? atmosphere.description : 'Obsidian Void'}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <HardwareButton
                              size="sm"
                              tone="cyan"
                              active={aiEnhancing}
                              disabled={aiEnhancing || isGenerating}
                              onClick={handleEnhancePromptWithAI}
                            >
                              {aiEnhancing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Cpu className="w-3.5 h-3.5 text-[#F1F5F9]" />
                              )}
                              <span>{aiEnhancing ? 'Enhancing…' : 'Enhance Scene Prompt'}</span>
                            </HardwareButton>
                            {selected && (
                              <HardwareButton
                                size="sm"
                                tone="magenta"
                                active={!!editText.trim()}
                                disabled={!editText.trim() || isGenerating}
                                onClick={handleEdit}
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Applying…</span>
                                  </>
                                ) : (
                                  <span>Apply Cut Adjustment</span>
                                )}
                              </HardwareButton>
                            )}
                            <HardwareButton
                              size="sm"
                              tone="red"
                              active={canSubmit}
                              disabled={!canSubmit}
                              onClick={handleSubmit}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#FF3B5C]" />
                              <span>Render Cut</span>
                            </HardwareButton>
                          </div>
                        </div>
                      </PlateBezel>
                    </div>

                    {/* VIDEO OPTIONS: RESOLUTION, DURATION, HDR GRADE & RENDER STYLES */}
                    <PlateBezel accent={editOpen ? 'magenta' : 'cyan'} className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-mono text-xs font-bold tracking-widest text-[#FF0A3C] tabular-nums">
                            VIDEO
                          </span>
                          <h3
                            className="text-sm sm:text-base font-bold tracking-wide text-[#F5E9EA] uppercase"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            Video Mastering Options &amp; Render Shaders
                          </h3>
                        </div>
                        <LedStatusIndicator
                          label={`${activeResSpec.label} · ${fps}fps · ${activeStyleSpec.label}`}
                          tone="cyan"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="candy-surface rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                            <span className="flex items-center gap-2">
                              <MonitorPlay className="w-3.5 h-3.5 text-[#F1F5F9]" />
                              <span>Output Resolution</span>
                            </span>
                            <span className="text-[#F1F5F9] tabular-nums">
                              {activeResSpec.tag} · {activeResSpec.aspectDesc}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {RESOLUTION_PRESETS.map((r) => (
                              <HardwareButton
                                key={r.key}
                                fullWidth
                                tone={r.key === 'cinemax_4k' ? 'red' : 'cyan'}
                                active={resolution === r.key}
                                disabled={isGenerating}
                                onClick={() => setResolution(r.key)}
                              >
                                <span className="font-bold">{r.label}</span>
                                <span className="text-[11px] text-[#E6ECF5]/65 tabular-nums hidden sm:inline">
                                  {r.tag}
                                </span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>

                        <div className="candy-surface rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                            <span className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-[#F1F5F9]" />
                              <span>Cut Duration &amp; HDR Grade</span>
                            </span>
                            <span className="text-[#FF5C8A]">{hdrGrade.replace('_', ' ')}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {DURATION_PRESETS.map((p) => (
                              <HardwareButton
                                key={p.value}
                                fullWidth
                                tone="cyan"
                                active={duration === p.value}
                                disabled={isGenerating}
                                onClick={() => setDuration(p.value)}
                              >
                                <span className="font-bold tabular-nums">{p.time}</span>
                                <span className="text-[11px] text-[#E6ECF5]/65 hidden sm:inline">{p.desc}</span>
                              </HardwareButton>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            {HDR_GRADE_PRESETS.map((g) => (
                              <HardwareButton
                                key={g.key}
                                size="sm"
                                fullWidth
                                tone="magenta"
                                active={hdrGrade === g.key}
                                disabled={isGenerating}
                                onClick={() => setHdrGrade(g.key)}
                              >
                                <span className="font-semibold truncate">{g.label}</span>
                              </HardwareButton>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="candy-surface rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                          <span className="flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-[#F1F5F9]" />
                            <span>Video Render Style (19 Engines &amp; Shaders)</span>
                          </span>
                          <span className="text-[#F1F5F9] normal-case">{activeStyleSpec.desc}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {RENDER_STYLE_PRESETS.map((s) => (
                            <HardwareButton
                              key={s.key}
                              size="sm"
                              fullWidth
                              tone={
                                s.key.includes('cyberpunk') || s.key === 'animorph' || s.key === 'cartoon_3d'
                                  ? 'magenta'
                                  : s.key === 'mesh_3d' || s.key === 'real_3d'
                                  ? 'red'
                                  : 'cyan'
                              }
                              active={renderStyle === s.key}
                              disabled={isGenerating}
                              onClick={() => setRenderStyle(s.key)}
                            >
                              <span className="truncate">{s.label}</span>
                            </HardwareButton>
                          ))}
                        </div>
                      </div>

                      {otherVersions.length > 0 && (
                        <div className="candy-surface rounded-xl p-3.5 space-y-2.5">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#E6ECF5]/60 block">
                            Recorded Cuts
                          </span>
                          <ScrollRow className="w-full" rowClassName="gap-3" deps={[otherVersions.length]}>
                            {otherVersions.map((v) => (
                              <button
                                key={v.label}
                                type="button"
                                onClick={() => selectVersion(v.label)}
                                className="group flex-none text-left p-2 candy-trace-tile rounded-xl cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2 font-mono text-xs text-[#E6ECF5] mb-1.5 tabular-nums">
                                  <span className="font-bold">{v.label}</span>
                                  <span className="text-[10px] text-[#FF0A3C]">{v.duration || '10s'}</span>
                                </div>
                                <video
                                  src={v.videoUrl}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="w-32 aspect-video object-cover rounded-lg bg-[#050304] opacity-85 group-hover:opacity-100 transition-opacity"
                                />
                              </button>
                            ))}
                          </ScrollRow>
                        </div>
                      )}
                    </PlateBezel>
                  </>
                )}

                <MasterControlDeck
                  appState={appState}
                  renderProgress={renderProgress}
                  currentTime={videoTime}
                  videoDuration={videoDuration}
                  targetDuration={duration}
                  onSelectDuration={setDuration}
                  onSeek={(t) => {
                    setVideoTime(t);
                    setSeekToTime(t);
                  }}
                  isLooping={isLooping}
                  onToggleLoop={() => setIsLooping((l) => !l)}
                  canSubmit={canSubmit}
                  onLaunchRender={handleSubmit}
                  onSaveVideo={() => selected && downloadVideo(selected)}
                  hasReadyVideo={appState === 'VIDEO_READY' && !!selected}
                  downloading={downloading}
                  logs={logs}
                  activeStyleLabel={activeStyleSpec.label}
                  activeFps={fps}
                  onOpenFullTimeline={() => {
                    setActiveTool('editor');
                    scrollToSection('page-tools');
                  }}
                />
              </>
            )}

            {activeTool === 'picture' && (
              <PictureStudioPage
                productUrl={selectedProductUrl}
                transparentProductUrl={selectedProductTransparentUrl}
                atmosphereUrl={selectedAtmosphereUrl}
              />
            )}

            {activeTool === 'cube' && (
              <RubiksCubeHubPage
                workspaceMedia={workspaceMedia}
                latestVideoUrl={selected?.videoUrl ?? null}
                onAddWorkspaceMedia={(asset) => setUploadedCubeAssets((prev) => [asset, ...prev])}
                onEnterGates={() => scrollToSection('page-gates')}
              />
            )}

            {activeTool === 'editor' && (
              <EditorPage
                versions={versions}
                selectedLabel={selectedLabel}
                onSelectVersion={selectVersion}
                onDownloadVersion={downloadVideo}
                onGoToVideo={() => setActiveTool('video')}
              />
            )}

            {activeTool === 'intel' && (
              <IntelCodePage
                productUrl={selectedProductUrl}
                onNavigatePage={handleSelectToolFromGalleryOrNav}
              />
            )}

            {activeTool === 'audio' && <AudioStudioPage />}

            {activeTool === 'vfx' && (
              <VfxStudioPage
                productUrl={selectedProductUrl}
                atmosphereUrl={selectedAtmosphereUrl}
              />
            )}

            {activeTool === 'sound' && <SoundFoleyPage />}

            {activeTool === 'lipsync' && <LipSyncPage />}

            {activeTool === 'animator' && (
              <PictureAnimatorPage
                defaultHeroUrl={selectedProductUrl}
                defaultChallengerUrl={selectedAtmosphereUrl}
                atmosphereUrl={selectedAtmosphereUrl}
              />
            )}

            {activeTool === 'airradio' && <AirRadioPage />}

            {activeTool === 'school' && <CodingRenderingSchoolPage />}

            {activeTool === 'merch' && (
              <MerchPrintPage defaultArtworkUrl={selectedProductUrl} userId={kayaUser?.uid} />
            )}

            {activeTool === 'live' && <LiveBroadcastStreamPage fallbackBackdropUrl={selectedAtmosphereUrl} />}

            {activeTool === 'bridge' && (
              <LocalSuiteBridgePage
                productUrl={selectedProductUrl}
                transparentProductUrl={selectedProductTransparentUrl}
                atmosphereUrl={selectedAtmosphereUrl}
              />
            )}

            {activeTool === 'storyboard' && (
              <StoryboardLogoPage
                subjectUrl={selectedProductUrl}
                environmentUrl={selectedAtmosphereUrl}
                formatSummary={currentFormatLabel}
              />
            )}
          </section>

          {/* FOOTER: CONTACT INFO, PHONE NUMBERS, UNIFIED WATERMARK, POLICIES & DISCREET STAFF ACCESS */}
          <footer className="candy-surface rounded-2xl px-5 py-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#FF0A3C] shrink-0" />
                  <span>{UNIFIED_WATERMARK_TEXT} · Chrome &amp; Firebase Studio Cloud</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-[#F5E9EA]/75">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#E06844]" />
                    <span>Studio Desk: +1 (415) 890-4720</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#FF0A3C]" />
                    <span>Enterprise Line: +1 (415) 890-4729</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F1F5F9]" />
                    <span>GTamayo36@gmail.com</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ['brand', 'Brand™ & IP'],
                    ['security', 'Protections'],
                    ['policies', 'Policies'],
                    ['terms', 'Terms & Privacy'],
                    ['gpu', 'Cooling & GPU'],
                  ] as [LegalTabKey, string][]
                ).map(([key, label]) => (
                  <HardwareButton
                    key={key}
                    size="sm"
                    tone={key === 'brand' || key === 'gpu' ? 'red' : key === 'policies' ? 'magenta' : 'cyan'}
                    active={legalModalOpen && legalInitialTab === key}
                    onClick={() => {
                      setLegalInitialTab(key);
                      setLegalModalOpen(true);
                    }}
                  >
                    <span>{label}</span>
                  </HardwareButton>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 font-mono text-[10px] text-[#E6ECF5]/45">
              <span>
                Dedicated Cloud Persistence Active · Self-Hosted MCP &amp; Inference Routing · Zero Local/SD Copies
              </span>
              <button
                type="button"
                onClick={() => setAdminPortalOpen(true)}
                className="text-[#E6ECF5]/35 hover:text-[#E06844] transition-colors cursor-pointer"
                title="Staff & Administrator Portal (Ctrl+Shift+K)"
              >
                Staff Portal
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* MEMBER AUTH MODAL (Chrome Google Sign-In + Server Captcha Verification) */}
      <KayaAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={kayaUser}
        onAuthChange={(nextUser) => {
          setKayaUser(nextUser);
          if (nextUser?.uid) hydrateCloudWorkspace(nextUser.uid);
        }}
        initialMode={authInitialMode}
      />

      {/* DISCREET PROTECTED STAFF & ADMIN PORTAL (Firebase Verified Roles + Captcha) */}
      <ProtectedAdminModal
        isOpen={adminPortalOpen}
        onClose={() => setAdminPortalOpen(false)}
        user={kayaUser}
        onAuthChange={(nextUser) => {
          setKayaUser(nextUser);
          if (nextUser.uid) hydrateCloudWorkspace(nextUser.uid);
        }}
      />

      {/* 6-TIER MEMBERSHIP MODAL (Stripe + Infinity Billing, Monthly & Yearly) */}
      <StudioMembershipModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        userId={kayaUser?.uid}
        subscription={studioPlan}
        onUpdateSubscription={setStudioPlan}
      />

      {/* STUDIO POLICIES, BRAND™, WATERMARK & PROTECTION MODAL */}
      <StudioLegalModal
        isOpen={legalModalOpen}
        initialTab={legalInitialTab}
        onClose={() => setLegalModalOpen(false)}
        activeFps={fps}
        activeTierLabel={formatTierLabel(studioPlan.tier)}
      />
    </div>
  );
}
