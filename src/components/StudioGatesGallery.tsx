import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Volume2,
  Film,
  Image as ImageIcon,
  Scissors,
  Cpu,
  Sparkles,
  Waves,
  ArrowRight,
  Swords,
  Radio,
  GraduationCap,
  ShoppingBag,
  Camera,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import type { StudioPageKey } from './RubiksCubeHubPage.js';

interface GalleryTileSpec {
  id: StudioPageKey;
  index: string;
  title: string;
  subtitle: string;
  specs: string[];
  previewImage?: string;
  tone: 'red' | 'cyan' | 'magenta';
  icon: React.ReactNode;
}

interface StudioGatesGalleryProps {
  activeTool: StudioPageKey;
  subjectImage: string;
  environmentImage: string;
  formatSummary: string;
  cutsCount: number;
  onSelectTool: (tool: StudioPageKey) => void;
}

export function StudioGatesGallery({
  activeTool,
  subjectImage,
  environmentImage,
  formatSummary,
  cutsCount,
  onSelectTool,
}: StudioGatesGalleryProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [gatesOpen, setGatesOpen] = useState(false);
  const [galleryDeck, setGalleryDeck] = useState<0 | 1 | 2>(0);

  // Automatically unlock and swing open the Aerospace Grade-7 Titanium Studio Gates on scroll into Page 2
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setGatesOpen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setGatesOpen(true);
        }
      },
      { threshold: 0.22 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const deckZeroTiles: GalleryTileSpec[] = [
    {
      id: 'audio',
      index: '01',
      title: 'Audio Studio',
      subtitle: 'Web Audio Synth · Spectrum · WAV Master',
      specs: ['44.1 / 48 kHz', 'Low-Pass Filter', 'Live Spectrum', 'WAV Export'],
      tone: 'cyan',
      icon: <Volume2 className="w-4 h-4 text-[#F1F5F9]" />,
    },
    {
      id: 'video',
      index: '02',
      title: 'Video Tools · 4K 60fps',
      subtitle: 'Ultra Cinema · Multi-Style Reel Compositor',
      specs: ['4096×1716 Scope', '24 / 30 / 60 fps', '19 Render Engines', formatSummary],
      previewImage: environmentImage,
      tone: 'red',
      icon: <Film className="w-4 h-4 text-[#FF3B5C]" />,
    },
    {
      id: 'picture',
      index: '03',
      title: 'Picture Tools · 4K Still',
      subtitle: 'Color Suite · Aspect Framing · Alpha RGBA',
      specs: ['PNG / JPG / Alpha', '16:9 · 2.39 · 9:16', 'Exposure & LUTs', 'Transparent Cutout'],
      previewImage: subjectImage,
      tone: 'cyan',
      icon: <ImageIcon className="w-4 h-4 text-[#F1F5F9]" />,
    },
    {
      id: 'editor',
      index: '04',
      title: 'Timeline Tools',
      subtitle: 'Multi-Track Ruler · In/Out Trim · Retiming',
      specs: [`${cutsCount} Recorded Cuts`, '0.25x – 2x Speed', 'V1 / FX / A1 Tracks', 'LUT Grade Preview'],
      tone: 'magenta',
      icon: <Scissors className="w-4 h-4 text-[#FF5C8A]" />,
    },
  ];

  const deckOneTiles: GalleryTileSpec[] = [
    {
      id: 'intel',
      index: '05',
      title: 'Smart Voice & AI Tools',
      subtitle: 'Voice Trigger · Pixel Vision · Code Grounding',
      specs: ['Zero API Keys', 'Voice Trigger', 'Swatch Analysis', 'Build Grounding'],
      previewImage: subjectImage,
      tone: 'cyan',
      icon: <Cpu className="w-4 h-4 text-[#F1F5F9]" />,
    },
    {
      id: 'vfx',
      index: '06',
      title: 'VFX & Motion Trails',
      subtitle: '60 fps Realtime Effects, Halftone & .ZIP Export',
      specs: ['Motion Trails', '2D Halftone', 'Kaleidoscope', '.ZIP Sequence'],
      previewImage: environmentImage,
      tone: 'magenta',
      icon: <Sparkles className="w-4 h-4 text-[#FF5C8A]" />,
    },
    {
      id: 'animator',
      index: '07',
      title: 'Action Animator · 60fps',
      subtitle: 'Picture-to-Fight & Hero Motion Choreography',
      specs: ['Dual Photo Clash', 'Power Aura & Trails', 'Cartoon 3D Squash', '4s Video + .ZIP'],
      previewImage: subjectImage,
      tone: 'red',
      icon: <Swords className="w-4 h-4 text-[#FF3B5C]" />,
    },
    {
      id: 'sound',
      index: '08',
      title: 'Sound Foley & Lip Sync',
      subtitle: 'Procedural Impact Matrix · Viseme Rig',
      specs: ['Sub Boom & Braam', '0.5x – 2x Pitch', 'WAV Pad Export', '60fps Visemes'],
      tone: 'cyan',
      icon: <Waves className="w-4 h-4 text-[#F1F5F9]" />,
    },
  ];

  const deckTwoTiles: GalleryTileSpec[] = [
    {
      id: 'airradio',
      index: '09',
      title: 'KAYA AirRadio · FM',
      subtitle: 'Multi-Channel Synth Broadcast & Live Host Mic',
      specs: ['88–108 MHz Tuner', '5 Live Channels', 'Live Spectrum', 'Host Mic Feed'],
      tone: 'cyan',
      icon: <Radio className="w-4 h-4 text-[#F1F5F9]" />,
    },
    {
      id: 'school',
      index: '10',
      title: 'Coding & Render School',
      subtitle: 'Rust Systems · Three.js UVs · Shader Lab',
      specs: ['Rust & WASM', 'Mesh 3D Math', 'Telemetry HUD', 'Interactive Sandbox'],
      tone: 'magenta',
      icon: <GraduationCap className="w-4 h-4 text-[#FF5C8A]" />,
    },
    {
      id: 'merch',
      index: '11',
      title: 'Creator Merch & Print',
      subtitle: 'Mockup Studio · Margin Builder · Local Store',
      specs: ['Hoodie / Tee / Mug', 'Custom Print Art', 'Profit Calculator', 'Mockup PNG Export'],
      previewImage: subjectImage,
      tone: 'red',
      icon: <ShoppingBag className="w-4 h-4 text-[#FF3B5C]" />,
    },
    {
      id: 'live',
      index: '12',
      title: 'Live Cam & Social Stream',
      subtitle: 'Camera Recorder & Multi-Platform Simulcast',
      specs: ['Webcam + Mic Live', 'On-Air Lower 3rd', 'Record .WebM', 'Social Share Mesh'],
      previewImage: environmentImage,
      tone: 'cyan',
      icon: <Camera className="w-4 h-4 text-[#F1F5F9]" />,
    },
  ];

  const visibleTiles =
    galleryDeck === 0 ? deckZeroTiles : galleryDeck === 1 ? deckOneTiles : deckTwoTiles;

  return (
    <section id="page-gates" ref={sectionRef} className="relative">
      <PlateBezel accent="red" className="relative overflow-hidden p-4 sm:p-6 min-h-[560px] flex flex-col justify-between gap-4">
        {/* TOP STUDIO GATES HEADER + LEFT/RIGHT GALLERY CONTROLS */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LedStatusIndicator
              label={gatesOpen ? 'KAYA Gates Unlocked' : 'Vault Gates Sealed'}
              tone={gatesOpen ? 'cyan' : 'red'}
            />
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-[0.16em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              KAYA Studio Gates &amp; Lineup
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HardwareButton
              size="sm"
              tone={gatesOpen ? 'cyan' : 'red'}
              active
              onClick={() => setGatesOpen((g) => !g)}
              title="Open or seal the Grade-7 titanium entrance gates"
            >
              {gatesOpen ? <Unlock className="w-3.5 h-3.5 text-[#F1F5F9]" /> : <Lock className="w-3.5 h-3.5 text-[#FF3B5C]" />}
              <span>{gatesOpen ? 'Seal Gates' : 'Open Gates'}</span>
            </HardwareButton>

            {/* Left / Right 4-Tile Gallery Carousel Arrows */}
            <HardwareButton
              size="sm"
              tone="neutral"
              ledIndicator={false}
              onClick={() => setGalleryDeck((d) => (d === 0 ? 0 : ((d - 1) as 0 | 1 | 2)))}
              disabled={galleryDeck === 0}
              aria-label="Previous 4 studio tiles"
            >
              <ChevronLeft className="w-4 h-4 text-[#F1F5F9]" />
              <span>Prev</span>
            </HardwareButton>

            <span className="font-mono text-xs text-[#E6ECF5]/70 tabular-nums px-1">
              Deck {galleryDeck + 1} / 3
            </span>

            <HardwareButton
              size="sm"
              tone="neutral"
              ledIndicator={false}
              onClick={() => setGalleryDeck((d) => (d === 2 ? 2 : ((d + 1) as 0 | 1 | 2)))}
              disabled={galleryDeck === 2}
              aria-label="Next 4 studio tiles"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 text-[#FF5C8A]" />
            </HardwareButton>
          </div>
        </div>

        {/* SEAMLESS SINGLE-TILE 4-UP STUDIO GALLERY (ONE TILE PER ITEM) */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1">
          {visibleTiles.map((tile) => {
            const isSelected = activeTool === tile.id;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onSelectTool(tile.id)}
                className={`group relative candy-trace-tile rounded-xl p-4 sm:p-5 text-left flex flex-col justify-between min-h-[190px] cursor-pointer ${
                  isSelected ? 'shadow-[0_0_24px_rgba(255,10,60,0.22)] bg-[#14070B]/70' : ''
                }`}
              >
                {tile.previewImage && (
                  <img
                    src={tile.previewImage}
                    alt={tile.title}
                    className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-18 group-hover:opacity-28 group-hover:scale-105 transition-all duration-500 rounded-xl"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050304]/95 via-[#090405]/75 to-transparent rounded-xl"
                />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full candy-surface flex items-center justify-center">
                      {tile.icon}
                    </span>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#E6ECF5]/50 block">
                        Station {tile.index}
                      </span>
                      <h3
                        className="text-base font-bold uppercase tracking-wider text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {tile.title}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#F1F5F9] group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="relative z-10 space-y-1.5 mt-3">
                  <p className="text-xs text-[#E6ECF5]/80">{tile.subtitle}</p>
                  <p className="font-mono text-[10px] text-[#FF8C69]/80 tabular-nums">
                    {tile.specs.join(' · ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* HEAVY OBSIDIAN BLACK GRADE-7 TITANIUM ENTRANCE GATES OVERLAY */}
        <div
          aria-hidden={gatesOpen}
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 z-30 candy-chassis flex items-center justify-end pr-5 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            gatesOpen ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="text-right space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#FF3B5C] block">
              Grade-7 Titanium Vault
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.28em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              KA
            </span>
          </div>
        </div>

        <div
          aria-hidden={gatesOpen}
          className={`pointer-events-none absolute inset-y-0 right-0 w-1/2 z-30 candy-chassis flex items-center justify-start pl-5 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            gatesOpen ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="text-left space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#F1F5F9] block">
              Enter Studio Stage
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.28em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              YA
            </span>
          </div>
        </div>

        {!gatesOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            <HardwareButton tone="red" size="lg" active onClick={() => setGatesOpen(true)}>
              <Unlock className="w-4 h-4" />
              <span>Unlock KAYA Studio Gates</span>
            </HardwareButton>
          </div>
        )}
      </PlateBezel>
    </section>
  );
}
