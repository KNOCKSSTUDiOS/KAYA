import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  DoorOpen,
  User,
  Cable,
  Swords,
  Crown,
  Radio,
  GraduationCap,
  ShoppingBag,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Clapperboard,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { PRODUCTS, ATMOSPHERES, MediaSelection } from './data.js';
import { ImageUploader } from './components/ImageUploader.js';
import { VideoOutput, LogEntry } from './components/VideoOutput.js';
import { ScrollRow } from './components/ScrollRow.js';
import { PWAInstallButton } from './components/PWAInstallButton.js';
import { usePWAInstall } from './hooks/usePWAInstall.js';
import { MasterControlDeck } from './components/MasterControlDeck.js';
import { HeroVideoCubeStage } from './components/HeroVideoCubeStage.js';
import { KayaAuthModal, KayaUserProfile } from './components/KayaAuthModal.js';
import { AdminPortalModal } from './components/AdminPortalModal.js';
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
import {
  HexScrew,
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

type LogType = 'info' | 'success' | 'warn' | 'error';
type AppState = 'IDLE' | 'GENERATING_VIDEO' | 'VIDEO_READY';
type ActiveModule = 'all' | 'subject' | 'environment' | 'optics';

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
  { key: 'video', label: 'Video Tools', tone: 'red', icon: <Film className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
  { key: 'picture', label: 'Picture Tools', tone: 'cyan', icon: <ImageIcon className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'cube', label: '360° Video Cube', tone: 'red', icon: <Box className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
  { key: 'storyboard', label: '3D Storyboard', tone: 'magenta', icon: <Clapperboard className="w-3.5 h-3.5 text-[#FF5C8A]" /> },
  { key: 'editor', label: 'Timeline Tools', tone: 'magenta', icon: <Scissors className="w-3.5 h-3.5 text-[#FF5C8A]" /> },
  { key: 'intel', label: 'AI Tools & Code', tone: 'cyan', icon: <Cpu className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'audio', label: 'Audio Studio', tone: 'cyan', icon: <Volume2 className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'vfx', label: 'VFX Shaders', tone: 'magenta', icon: <Sparkles className="w-3.5 h-3.5 text-[#FF5C8A]" /> },
  { key: 'sound', label: 'Sound Foley', tone: 'cyan', icon: <Waves className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'lipsync', label: 'Lip Sync Rig', tone: 'magenta', icon: <Mic className="w-3.5 h-3.5 text-[#FF5C8A]" /> },
  { key: 'animator', label: 'Action Animator', tone: 'red', icon: <Swords className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
  { key: 'airradio', label: 'AirRadio FM', tone: 'cyan', icon: <Radio className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'school', label: 'Code & Render School', tone: 'magenta', icon: <GraduationCap className="w-3.5 h-3.5 text-[#FF5C8A]" /> },
  { key: 'merch', label: 'Merch & Print', tone: 'red', icon: <ShoppingBag className="w-3.5 h-3.5 text-[#FF3B5C]" /> },
  { key: 'live', label: 'Live Cam & Stream', tone: 'cyan', icon: <Camera className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
  { key: 'bridge', label: 'Desktop Bridge', tone: 'cyan', icon: <Cable className="w-3.5 h-3.5 text-[#F1F5F9]" /> },
];

export default function App() {
  const [activeTool, setActiveTool] = useState<StudioPageKey>('video');
  const [activeModule, setActiveModule] = useState<ActiveModule>('all');
  const [product, setProduct] = useState<MediaSelection | null>({
    id: `preset-${PRODUCTS[0].id}`,
    source: 'suggestion',
    images: [PRODUCTS[0].image],
    description: PRODUCTS[0].description,
  });
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
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [videoTime, setVideoTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);
  const { isInstalled } = usePWAInstall();
  const [installModalOpen, setInstallModalOpen] = useState<boolean>(() => {
    try {
      const standalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true);
      if (standalone) return false;
      return !sessionStorage.getItem('kaya_install_prompt_closed');
    } catch {
      return true;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup' | 'owner'>('signin');
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<LegalTabKey>('brand');
  const [kayaUser, setKayaUser] = useState<KayaUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('kaya_studio_user');
      return saved ? (JSON.parse(saved) as KayaUserProfile) : null;
    } catch {
      return null;
    }
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

  useEffect(() => {
    if (isInstalled) setInstallModalOpen(false);
  }, [isInstalled]);

  // Secret Owner Portal keyboard trigger: Ctrl+Shift+K or Alt+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') || (e.altKey && e.key.toLowerCase() === 'k')) {
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
      addLog('Connection restored — Auto-Sync & runtime check active.', 'success');
    };
    const onOffline = () => {
      setIsOnline(false);
      addLog('Offline mode active — running 100% on local cached workstation engine.', 'warn');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleManualAutoSync = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      addLog('Offline — local cached workstation remains fully operational.', 'info');
      return;
    }
    setSyncingApp(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            addLog('New update synced — refreshing runtime…', 'success');
            setTimeout(() => window.location.reload(), 500);
            return;
          }
        }
      }
      const res = await fetch('/api/app-version', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { version?: string };
        addLog(`Auto-Sync verified latest build (#${(data.version || 'live').slice(-6)}).`, 'success');
      }
    } catch {
      addLog('Sync unreachable — continuing in Offline Local Ready mode.', 'warn');
    } finally {
      setSyncingApp(false);
    }
  };

  const handleEnhancePromptWithAI = async () => {
    if (aiEnhancing) return;
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/ai/prompt-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      if (!res.ok) {
        addLog(data.error || 'AI Prompt Enhancer unavailable.', 'warn');
        return;
      }
      if (data.enhancedPrompt) setEditText(data.enhancedPrompt);
      setAiDirectorMeta({
        directorNotes: data.directorNotes,
        lightingCue: data.lightingCue,
        cameraTip: data.cameraTip,
      });
      addLog('KAYA AI enhanced scene prompt & lighting cues.', 'success');
    } catch {
      const subj = product ? describe(product) : 'Hero Subject';
      const env = atmosphere ? describe(atmosphere) : 'Obsidian Studio Stage';
      const base = editText.trim();
      setEditText(
        base
          ? `${base} — ${subj} inside ${env}, Obsidian Matte (#050608), Platinum Chrome rim & Candy Apple Red (#FF0A3C) flare at ${fps}fps.`
          : `Anamorphic ${fps}fps ${cameraMotion} hero reel of ${subj} inside ${env}, Obsidian Matte depth & Candy Apple Red accent flare.`
      );
      setAiDirectorMeta({
        directorNotes: 'Local KAYA Native AI Engine applied 60-144fps framing.',
        lightingCue: 'Platinum Chrome top-rim + Candy Apple Red side key.',
        cameraTip: `Locked ${cameraMotion} inertia curve.`,
      });
      addLog('KAYA Offline Native AI enhanced scene prompt.', 'success');
    } finally {
      setAiEnhancing(false);
    }
  };
  const [studioPlan, setStudioPlan] = useState<StudioSubscriptionState>(() => {
    try {
      const saved = localStorage.getItem('kaya_studio_plan');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<StudioSubscriptionState>;
        const validTiers = ['free', 'beginner', 'ultra', 'pro', 'enterprise_business'];
        const tier = parsed.tier && validTiers.includes(parsed.tier) ? parsed.tier : 'free';
        return {
          tier,
          billingCycle: parsed.billingCycle === 'yearly' ? 'yearly' : 'monthly',
          addons: Array.isArray(parsed.addons) ? parsed.addons : [],
        };
      }
      return { tier: 'free', billingCycle: 'monthly', addons: [] };
    } catch {
      return { tier: 'free', billingCycle: 'monthly', addons: [] };
    }
  });

  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const versionCount = useRef(0);

  const [uploadedCubeAssets, setUploadedCubeAssets] = useState<WorkspaceMediaAsset[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogType = 'info', image?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        message,
        type,
        image,
      },
    ]);
  };

  const describe = (sel: MediaSelection) =>
    sel.description || `${sel.images.length} uploaded image${sel.images.length > 1 ? 's' : ''}`;

  const activeResSpec =
    RESOLUTION_PRESETS.find((r) => r.key === resolution) ?? RESOLUTION_PRESETS[3];
  const activeHdrSpec =
    HDR_GRADE_PRESETS.find((g) => g.key === hdrGrade) ?? HDR_GRADE_PRESETS[2];
  const activeStyleSpec =
    RENDER_STYLE_PRESETS.find((s) => s.key === renderStyle) ?? RENDER_STYLE_PRESETS[0];
  const currentFormatLabel = `${activeResSpec.tag} · ${fps}fps · ${activeStyleSpec.label}`;

  const isGenerating = appState === 'GENERATING_VIDEO';
  const canSubmit = !!product && !!atmosphere && !isGenerating;

  const selected = versions.find((v) => v.label === selectedLabel) ?? null;
  const otherVersions = versions.filter((v) => v.label !== selectedLabel);

  const selectedProductUrl = product?.images[0] || PRODUCTS[0].image;
  const selectedAtmosphereUrl = atmosphere?.images[0] || ATMOSPHERES[0].image;
  const selectedProductTransparentUrl = PRODUCTS.find((p) => `preset-${p.id}` === product?.id)?.transparentImage;

  // Aggregate EVERY workspace photo, user upload, and rendered reel into the 3D Rubik's Video Cube
  const workspaceMedia = useMemo<WorkspaceMediaAsset[]>(() => {
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

    return [...uploadedCubeAssets, ...renderedVids, ...baseImages];
  }, [uploadedCubeAssets, versions, product, atmosphere]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleJumpSection = (sectionId: string, tool: StudioPageKey = 'video') => {
    setActiveTool(tool);
    if (tool === 'video') {
      setActiveModule('all');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSelectToolFromGalleryOrNav = (tool: StudioPageKey) => {
    setActiveTool(tool);
    scrollToSection('page-tools');
  };

  const triggerGlobalSmartVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      handleSelectToolFromGalleryOrNav('intel');
      addLog('Opened Smart Voice & AI Console (Web Speech requires supported browser).', 'info');
      return;
    }
    if (voiceActive) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setVoiceActive(true);
    addLog('Smart Voice Trigger listening (say Video, AirRadio, School, Merch, Live, Fight)...', 'info');
    rec.onresult = (ev: any) => {
      const phrase = String(ev.results?.[0]?.[0]?.transcript || '').toLowerCase();
      const map: [string, StudioPageKey][] = [
        ['radio', 'airradio'],
        ['school', 'school'],
        ['coding', 'school'],
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
      ];
      for (const [kw, key] of map) {
        if (phrase.includes(kw)) {
          handleSelectToolFromGalleryOrNav(key);
          addLog(`Smart Voice Trigger launched "${key.toUpperCase()}" from "${phrase}".`, 'success');
          return;
        }
      }
      addLog(`Voice recognized: "${phrase}".`, 'info');
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
    if (!product || !atmosphere) {
      addLog('Select both a Subject and an Environment before rendering.', 'error');
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
      `Initializing ${activeResSpec.label} (${fps}fps · ${activeStyleSpec.label} · ${cameraMotion}) · ${duration}…`,
      'info'
    );
    addLog(`Subject: ${describe(product)}`, 'info');
    addLog(`Environment: ${describe(atmosphere)}`, 'info');

    try {
      const durSec = parseInt(duration, 10) || 10;
      const promptInstructions = editText.trim() || undefined;
      const compositionSnapshot: CompositionConfig = {
        productUrl: product.images[0],
        transparentProductUrl: selectedProductTransparentUrl,
        atmosphereUrl: atmosphere.images[0],
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        instructions: promptInstructions,
      };
      const result = await renderCinematicReel({
        productUrl: product.images[0],
        atmosphereUrl: atmosphere.images[0],
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
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
        `local-${Date.now()}`,
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
    } catch (e: any) {
      setAppState('IDLE');
      setRenderProgress(0);
      addLog(`Render error: ${e.message}`, 'error');
    }
  };

  const handleEdit = async () => {
    if (!selected || !editText.trim() || isGenerating || !product || !atmosphere) return;
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
        productUrl: product.images[0],
        transparentProductUrl: selectedProductTransparentUrl,
        atmosphereUrl: atmosphere.images[0],
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
        instructions,
      };
      const result = await renderCinematicReel({
        productUrl: product.images[0],
        atmosphereUrl: atmosphere.images[0],
        durationSec: durSec,
        resolution,
        hdrGrade,
        fps,
        renderStyle,
        cameraMotion,
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
      a.download = `kaya-cinemax-4k-${version.label.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addLog(`Saved ${version.label} (.${ext}) media file.`, 'success');
    } catch (e: any) {
      addLog(`Download failed: ${e.message}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const showSubject = activeModule === 'all' || activeModule === 'subject';
  const showEnvironment = activeModule === 'all' || activeModule === 'environment';
  const showOptics = activeModule === 'all' || activeModule === 'optics';

  return (
    <div className="min-h-screen w-full bg-[#030406] text-[#E6ECF5] p-0">
      {/* OUTER GRADE-7 OBSIDIAN TITANIUM WORKSTATION CHASSIS WITH NEON RED PERIMETER LED */}
      <div className="relative w-full mx-auto cnc-chassis rounded-[16px] p-0 flex flex-col">
        <HexScrew className="absolute top-2.5 left-2.5 z-10 pointer-events-none" />
        <HexScrew className="absolute top-2.5 right-2.5 z-10 pointer-events-none" />
        <HexScrew className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none" />
        <HexScrew className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none" />

        {/* ====================================================================
            PAGE 01: PURE FULL-VIEWPORT PROJECTOR VIDEO -> RUBIK'S CUBE STAGE
            ==================================================================== */}
        <HeroVideoCubeStage
          workspaceMedia={workspaceMedia}
          latestVideoUrl={selected?.videoUrl ?? null}
          user={kayaUser}
          isOnline={isOnline}
          isAppInstalled={isInstalled}
          onOpenInstall={() => setInstallModalOpen(true)}
          onOpenAdmin={() => setAdminPortalOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onNavigateTool={handleSelectToolFromGalleryOrNav}
          onNavigateGates={() => scrollToSection('page-gates')}
          onOpenPlans={() => setPlansModalOpen(true)}
          onAddWorkspaceMedia={(asset) => setUploadedCubeAssets((prev) => [asset, ...prev])}
          onJumpSection={handleJumpSection}
        />

        {/* LOWER WORKSTATION DECK (RESPONSIVE FOR TABLET, PHONE & DESKTOP) */}
        <div className="w-full max-w-[1440px] mx-auto p-3 sm:p-5 flex flex-col gap-5">
        {/* HARDWARE BAR POSITIONED UNDERNEATH PAGE 01 */}
        <header className="sticky top-2 z-40 cnc-plate rounded-[11px] px-3 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer select-none"
            onDoubleClick={() => setAdminPortalOpen(true)}
            title="KAYA · Double-click or press Ctrl+Shift+K for Secret Owner Portal"
          >
            <GeometricMark />
            <div className="flex items-baseline gap-2.5 min-w-0">
              <h1
                className="text-base sm:text-lg font-bold uppercase tracking-[0.22em] text-white whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                KAYA
              </h1>
              <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-widest text-[#E6ECF5]/55 whitespace-nowrap">
                Pro &amp; Candy Finish
              </span>
            </div>
          </div>

          {/* 3-Page Vertical Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <HardwareButton size="sm" tone="red" active onClick={() => scrollToSection('page-cube')}>
              <Box className="w-3.5 h-3.5 text-[#FF3B5C]" />
              <span>1. Video Cube Stage</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="cyan" active={false} onClick={() => scrollToSection('page-gates')}>
              <DoorOpen className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span>2. Gates &amp; 4-Tile Gallery</span>
            </HardwareButton>
            <HardwareButton size="sm" tone="magenta" active={false} onClick={() => scrollToSection('page-tools')}>
              <Sliders className="w-3.5 h-3.5 text-[#FF5C8A]" />
              <span>3. Tools Suite</span>
            </HardwareButton>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <HardwareButton
              size="sm"
              tone={voiceActive ? 'red' : 'cyan'}
              active={voiceActive}
              onClick={triggerGlobalSmartVoice}
              title="Smart Voice Trigger: speak any tool name"
            >
              <Mic className="w-3.5 h-3.5 text-[#F1F5F9]" />
              <span className="hidden sm:inline">{voiceActive ? 'Listening…' : 'Voice'}</span>
            </HardwareButton>
            <HardwareButton
              size="sm"
              tone="magenta"
              active={plansModalOpen}
              onClick={() => setPlansModalOpen(true)}
              title="Membership Tiers (Free, Beginner, Ultra, Pro, Enterprise Business)"
            >
              <Crown className="w-3.5 h-3.5 text-[#FF5C8A]" />
              <span>
                {studioPlan.tier === 'enterprise_business'
                  ? 'Enterprise'
                  : studioPlan.tier === 'pro'
                  ? 'Pro'
                  : studioPlan.tier === 'ultra'
                  ? 'Ultra'
                  : studioPlan.tier === 'beginner'
                  ? 'Beginner'
                  : 'Free Tier'}
              </span>
            </HardwareButton>
            {kayaUser?.role === 'owner' && (
              <HardwareButton
                size="sm"
                tone="red"
                active={adminPortalOpen}
                onClick={() => setAdminPortalOpen(true)}
                title="Secret Owner & Admin Portal (Ctrl+Shift+K)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF0A3C]" />
                <span>Admin Portal</span>
              </HardwareButton>
            )}
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
              title={
                isOnline
                  ? 'Online · Click to check & sync runtime updates now'
                  : 'Offline Mode · Local studio engine cached and ready'
              }
            >
              {syncingApp ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#F1F5F9] animate-spin" />
              ) : isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-[#F1F5F9]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#FF0A3C]" />
              )}
              <span className={isOnline ? 'text-[#F1F5F9]' : 'text-[#FF2E63]'}>
                {syncingApp ? 'Syncing…' : isOnline ? 'Online · Sync' : 'Offline Ready'}
              </span>
            </HardwareButton>
            <PWAInstallButton
              externalOpen={installModalOpen}
              onExternalOpenChange={setInstallModalOpen}
            />
            <HardwareButton
              size="sm"
              tone="red"
              active={legalModalOpen}
              onClick={() => {
                setLegalInitialTab('brand');
                setLegalModalOpen(true);
              }}
              title="KAYA™ Brand, Policies, Protections, Terms & GPU 120fps Menu"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF3B5C]" />
              <span className="hidden md:inline">Policies &amp; ™</span>
            </HardwareButton>
          </div>
        </header>

        {/* ====================================================================
            PAGE 02: OPENING STUDIO GATES + LEFT/RIGHT 4-TILE STUDIO GALLERY
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
            PAGE 03: FULL ACTIVE KAYA TOOLS WORKBENCH (ALL STUDIO TOOLS)
            ==================================================================== */}
        <section id="page-tools" className="space-y-4">
          <PlateBezel screws={false} accent="cyan" className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E6ECF5]/70"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Page 03 · Complete KAYA Tool Workbench
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

          {/* TOOL 1: VIDEO TOOLS (4K HDR 60FPS CINEMA STUDIO) */}
          {activeTool === 'video' && (
            <>
              <PlateBezel screws={false} className="px-4 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <HardwareButton
                      size="sm"
                      tone="cyan"
                      active={activeModule === 'all'}
                      onClick={() => setActiveModule('all')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-[#F1F5F9]" />
                      <span>All Video Tools</span>
                    </HardwareButton>
                    <HardwareButton
                      size="sm"
                      tone="cyan"
                      active={activeModule === 'subject'}
                      onClick={() => setActiveModule('subject')}
                    >
                      <Box className="w-3.5 h-3.5 text-[#F1F5F9]" />
                      <span>Subject Input</span>
                    </HardwareButton>
                    <HardwareButton
                      size="sm"
                      tone="magenta"
                      active={activeModule === 'environment'}
                      onClick={() => setActiveModule('environment')}
                    >
                      <Layers className="w-3.5 h-3.5 text-[#FF5C8A]" />
                      <span>Employee Environment</span>
                    </HardwareButton>
                    <HardwareButton
                      size="sm"
                      tone="red"
                      active={activeModule === 'optics'}
                      onClick={() => setActiveModule('optics')}
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#FF3B5C]" />
                      <span>Optics, 60fps &amp; Styles</span>
                    </HardwareButton>
                  </div>

                  {/* Direct Section Jump: Display · Prompt Window · Timeline */}
                  <div className="flex flex-wrap items-center gap-2">
                    <HardwareButton
                      size="sm"
                      tone="red"
                      active={false}
                      onClick={() => handleJumpSection('studio-display', 'video')}
                    >
                      <MonitorPlay className="w-3.5 h-3.5 text-[#FF3B5C]" />
                      <span>Display</span>
                    </HardwareButton>
                    <HardwareButton
                      size="sm"
                      tone="magenta"
                      active={false}
                      onClick={() => handleJumpSection('studio-prompt', 'video')}
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
                      <span>Timeline</span>
                    </HardwareButton>
                  </div>
                </div>
              </PlateBezel>

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

              {/* ALWAYS-VISIBLE PROMPT WINDOW */}
              <div id="studio-prompt" className="scroll-mt-20">
                <PlateBezel accent="magenta" className="p-5 sm:p-6 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#FF2E63]" />
                      <h3
                        className="text-sm font-bold uppercase tracking-wider text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Prompt Window · Scene Direction &amp; Cut Adjustments
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        'Candy Apple Red Studio Rim',
                        'Fast 360 Orbit',
                        'Dramatic Optical Contrast',
                        'Warm Golden Flare',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setEditText((prev) =>
                              prev.trim() ? `${prev.trim()}, ${preset.toLowerCase()}` : preset
                            )
                          }
                          className="px-2.5 py-1 rounded-[6px] bg-[#040507] border border-white/15 hover:border-[#FF2E63] font-mono text-[10px] text-[#F1F5F9]/80 hover:text-white transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder={
                      selected
                        ? `Enter scene prompt or lighting/camera adjustments for ${selected.label}…`
                        : 'Type your scene prompt, lighting mood, or camera direction before pressing Render Reel…'
                    }
                    className="w-full bg-[#040507] border border-white/15 text-[#E6ECF5] p-3.5 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#FF0A3C] rounded-[7px] resize-y min-h-[84px]"
                  />
                  {aiDirectorMeta && (
                    <div className="cnc-recess rounded-[6px] p-2.5 border border-[#FF0A3C]/35 grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                      {aiDirectorMeta.directorNotes && (
                        <div className="text-[#F1F5F9]/85">
                          <span className="text-[#FF2E63] uppercase">Director: </span>
                          {aiDirectorMeta.directorNotes}
                        </div>
                      )}
                      {aiDirectorMeta.lightingCue && (
                        <div className="text-[#F1F5F9]/85">
                          <span className="text-[#FF0A3C] uppercase">Lighting: </span>
                          {aiDirectorMeta.lightingCue}
                        </div>
                      )}
                      {aiDirectorMeta.cameraTip && (
                        <div className="text-[#F1F5F9]/85">
                          <span className="text-white uppercase">Rig: </span>
                          {aiDirectorMeta.cameraTip}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="font-mono text-[11px] text-[#E6ECF5]/50">
                      KAYA AI Prompt Enhancer + direct Render Reel scene control.
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
                        <span>{aiEnhancing ? 'Enhancing…' : 'AI Enhance Prompt'}</span>
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
                        <span>Render Reel with Prompt</span>
                      </HardwareButton>
                    </div>
                  </div>
                </PlateBezel>
              </div>

              {showSubject && (
                <ImageUploader
                  indexLabel="01."
                  title="Enterprise Subject Input"
                  type="product"
                  suggestions={PRODUCTS}
                  selection={product}
                  onSelect={setProduct}
                  disabled={isGenerating}
                />
              )}

              {showEnvironment && (
                <ImageUploader
                  indexLabel="02."
                  title="Employee &amp; Enterprise Environment"
                  type="atmosphere"
                  suggestions={ATMOSPHERES}
                  selection={atmosphere}
                  onSelect={setAtmosphere}
                  disabled={isGenerating}
                />
              )}

              {showOptics && (
                <PlateBezel
                  accent={editOpen ? 'magenta' : 'cyan'}
                  className="p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-xs font-bold tracking-widest text-[#FF1E42] tabular-nums">
                        03.
                      </span>
                      <h3
                        className="text-sm sm:text-base font-bold tracking-wide text-[#E6ECF5] uppercase"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Video Tools · Resolution, 60fps, Camera Rig &amp; Render Styles
                      </h3>
                    </div>
                    <LedStatusIndicator
                      label={`${activeResSpec.label} · ${fps}fps · ${activeStyleSpec.label}`}
                      tone="cyan"
                    />
                  </div>

                  {/* Resolution & Aspect Format Matrix */}
                  <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                      <span className="flex items-center gap-2">
                        <MonitorPlay className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>Master Video Resolution &amp; Frame Type</span>
                      </span>
                      <span className="text-[#F1F5F9] tabular-nums">
                        {activeResSpec.tag} · {activeResSpec.aspectDesc}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
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

                  {/* Frame Rate + HDR Grade */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                        <Gauge className="w-3.5 h-3.5 text-[#FF3B5C]" />
                        <span>Frame Rate (24 / 30 / 60 / 90 / 120 / 144 fps)</span>
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

                    <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF2E63]" />
                        <span>HDR Dynamic Range Grade</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {HDR_GRADE_PRESETS.map((g) => (
                          <HardwareButton
                            key={g.key}
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

                  {/* Camera Rig Motion + Sequence Duration */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                        <Compass className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>Camera Rig Motion</span>
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

                    <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                        <Clock className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>Sequence Duration</span>
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
                    </div>
                  </div>

                  {/* 19 Render Styles & Engines Matrix */}
                  <div className="cnc-recess rounded-[8px] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60">
                      <span className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-[#F1F5F9]" />
                        <span>Visual Render Style (19 Engines: 3D, Mesh, Rust, Telemetry &amp; 2D)</span>
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
                    <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#E6ECF5]/60 block">
                        Recorded Cuts
                      </span>
                      <ScrollRow className="w-full" rowClassName="gap-3" deps={[otherVersions.length]}>
                        {otherVersions.map((v) => (
                          <button
                            key={v.label}
                            type="button"
                            onClick={() => selectVersion(v.label)}
                            className="group flex-none text-left p-2 cnc-module hover:border-[#F1F5F9]/60 rounded-[8px] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 font-mono text-xs text-[#E6ECF5] mb-1.5 tabular-nums">
                              <span className="font-bold">{v.label}</span>
                              <span className="text-[10px] text-[#F1F5F9]">{v.duration || '10s'}</span>
                            </div>
                            <video
                              src={v.videoUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="w-32 aspect-video object-cover rounded-[4px] bg-black opacity-85 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        ))}
                      </ScrollRow>
                    </div>
                  )}
                </PlateBezel>
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

          {activeTool === 'merch' && <MerchPrintPage defaultArtworkUrl={selectedProductUrl} />}

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

        {/* WORKSTATION GOVERNANCE, BRAND™ & PROTECTION BAR */}
        <footer className="cnc-plate rounded-[11px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 font-mono text-[11px] text-[#E6ECF5]/65">
            <ShieldCheck className="w-4 h-4 text-[#F1F5F9] shrink-0" />
            <span>
              © 2024–2026 KAYA™ Music &amp; Pro &amp; Candy Finish · 24–144fps · Protected Runtime
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['brand', 'Brand™ & IP'],
                ['security', 'Protections'],
                ['policies', 'Policies'],
                ['terms', 'Terms & Privacy'],
                ['gpu', 'GPU & 120fps+'],
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
        </footer>
        </div>
      </div>

      {/* KAYA MEMBER & OWNER AUTHENTICATION MODAL */}
      <KayaAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={kayaUser}
        onAuthChange={setKayaUser}
        initialMode={authInitialMode}
        onOpenAdminPortal={() => setAdminPortalOpen(true)}
      />

      {/* SECRET OWNER & ADMIN PORTAL */}
      <AdminPortalModal
        isOpen={adminPortalOpen}
        onClose={() => setAdminPortalOpen(false)}
        user={kayaUser}
        onAuthChange={setKayaUser}
        onRequestOwnerLogin={() => {
          setAuthInitialMode('owner');
          setAuthModalOpen(true);
        }}
      />

      {/* STUDIO MEMBERSHIP TIERS & OPTIONAL PRO MODULES MODAL */}
      <StudioMembershipModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        subscription={studioPlan}
        onUpdateSubscription={(next) => {
          setStudioPlan(next);
          try {
            localStorage.setItem('kaya_studio_plan', JSON.stringify(next));
          } catch {
            // ignore storage quota errors
          }
        }}
      />

      {/* STUDIO POLICIES, BRAND™ & PROTECTIONS MODAL */}
      <StudioLegalModal
        isOpen={legalModalOpen}
        initialTab={legalInitialTab}
        onClose={() => setLegalModalOpen(false)}
        activeFps={fps}
        activeTierLabel={
          studioPlan.tier === 'enterprise_business'
            ? 'Enterprise Business'
            : studioPlan.tier === 'pro'
            ? 'Pro'
            : studioPlan.tier === 'ultra'
            ? 'Ultra'
            : studioPlan.tier === 'beginner'
            ? 'Beginner'
            : 'Free Tier'
        }
      />
    </div>
  );
}
