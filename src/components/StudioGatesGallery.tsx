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
import { TileVisualPreview, type PreviewTileId } from './TileVisualPreviews.js';

interface GalleryTileSpec {
  id: StudioPageKey;
  previewId: PreviewTileId;
  index: string;
  decal: string;
  title: string;
  subtitle: string;
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
  formatSummary,
  cutsCount,
  onSelectTool,
}: StudioGatesGalleryProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [gatesOpen, setGatesOpen] = useState(false);
  const [galleryDeck, setGalleryDeck] = useState<0 | 1 | 2>(0);

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
      previewId: 'audio',
      index: '01',
      decal: '44.1 KHZ MASTER',
      title: 'AUDIO STUDIO',
      subtitle: 'Web Audio Synth · Spectrum · WAV Master',
      icon: <Volume2 className="w-4 h-4 text-[#18F2D8]" />,
    },
    {
      id: 'video',
      previewId: 'video',
      index: '02',
      decal: formatSummary,
      title: 'VIDEO TOOLS · 4K 60FPS',
      subtitle: 'Ultra Cinema · Multi-Style Reel Compositor',
      icon: <Film className="w-4 h-4 text-[#FF4D6A]" />,
    },
    {
      id: 'picture',
      previewId: 'picture',
      index: '03',
      decal: 'RGBA 4K',
      title: 'PICTURE TOOLS · 4K STILL',
      subtitle: 'Color Suite · Aspect Framing · Alpha RGBA',
      icon: <ImageIcon className="w-4 h-4 text-[#E6ECF5]" />,
    },
    {
      id: 'editor',
      previewId: 'editor',
      index: '04',
      decal: `${cutsCount} CUTS · NLE`,
      title: 'TIMELINE TOOLS',
      subtitle: 'Multi-Track Ruler · In/Out Trim · Retiming',
      icon: <Scissors className="w-4 h-4 text-[#C84BFF]" />,
    },
  ];

  const deckOneTiles: GalleryTileSpec[] = [
    {
      id: 'intel',
      previewId: 'intel',
      index: '05',
      decal: 'PRIVATE OPTICS',
      title: 'OPTICS & VISION CONSOLE',
      subtitle: 'Voice Trigger · Pixel Vision · Geo-Grid',
      icon: <Cpu className="w-4 h-4 text-[#18F2D8]" />,
    },
    {
      id: 'vfx',
      previewId: 'vfx',
      index: '06',
      decal: 'PICTURE · SOUND · SHADERS · TITLES',
      title: 'VFX STUDIO',
      subtitle: 'Tempest Studio · Halftone & .ZIP Export',
      icon: <Sparkles className="w-4 h-4 text-[#C84BFF]" />,
    },
    {
      id: 'animator',
      previewId: 'animator',
      index: '07',
      decal: 'MOTION FX',
      title: 'ACTION ANIMATOR · 60FPS',
      subtitle: 'Tempest Studio Clash & Hero Choreography',
      icon: <Swords className="w-4 h-4 text-[#E06D44]" />,
    },
    {
      id: 'sound',
      previewId: 'sound',
      index: '08',
      decal: 'DTS:X / 7.1',
      title: 'SOUND FOLEY & LIP SYNC',
      subtitle: 'Procedural Impact Matrix · Viseme Rig',
      icon: <Waves className="w-4 h-4 text-[#18F2D8]" />,
    },
  ];

  const deckTwoTiles: GalleryTileSpec[] = [
    {
      id: 'airradio',
      previewId: 'airradio',
      index: '09',
      decal: '88-108 MHZ',
      title: 'AIRRADIO FM',
      subtitle: 'Multi-Channel Synth Broadcast & Live Host Mic',
      icon: <Radio className="w-4 h-4 text-[#18F2D8]" />,
    },
    {
      id: 'school',
      previewId: 'school',
      index: '10',
      decal: 'LIVE LABS',
      title: 'INFINITY SCHOOL',
      subtitle: 'Coding School · Rendering School · AI Tutor',
      icon: <GraduationCap className="w-4 h-4 text-[#E06D44]" />,
    },
    {
      id: 'merch',
      previewId: 'merch',
      index: '11',
      decal: 'POD CATALOG',
      title: 'PRINTIFY STUDIO',
      subtitle: 'Mockup Studio · Margin Builder · Cloud Store',
      icon: <ShoppingBag className="w-4 h-4 text-[#FF4D6A]" />,
    },
    {
      id: 'live',
      previewId: 'live',
      index: '12',
      decal: 'BROADCAST',
      title: 'LIVE CAM & STREAM',
      subtitle: 'Camera Recorder & Multi-Platform Simulcast',
      icon: <Camera className="w-4 h-4 text-[#18F2D8]" />,
    },
  ];

  const visibleTiles =
    galleryDeck === 0 ? deckZeroTiles : galleryDeck === 1 ? deckOneTiles : deckTwoTiles;

  return (
    <section id="page-gates" ref={sectionRef} className="relative">
      <PlateBezel accent="red" className="relative overflow-hidden p-5 sm:p-6 min-h-[620px] flex flex-col justify-between gap-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LedStatusIndicator
              label={gatesOpen ? 'KAYA Gates Unlocked' : 'Vault Gates Sealed'}
              tone={gatesOpen ? 'cyan' : 'red'}
            />
            <h2
              className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#E6ECF5]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              KNOCKSSTUDiOS · KAYA Gates &amp; Lineup
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HardwareButton
              size="sm"
              tone={gatesOpen ? 'cyan' : 'red'}
              active
              onClick={() => setGatesOpen((g) => !g)}
              title="Open or seal the obsidian titanium studio gates"
            >
              {gatesOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{gatesOpen ? 'Seal Gates' : 'Open Gates'}</span>
            </HardwareButton>

            <HardwareButton
              size="sm"
              tone="neutral"
              ledIndicator={false}
              onClick={() => setGalleryDeck((d) => (d === 0 ? 0 : ((d - 1) as 0 | 1 | 2)))}
              disabled={galleryDeck === 0}
              aria-label="Previous 4 studio tiles"
            >
              <ChevronLeft className="w-4 h-4" />
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
              <ChevronRight className="w-4 h-4 text-[#FF4D6A]" />
            </HardwareButton>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
          {visibleTiles.map((tile) => {
            const isSelected = activeTool === tile.id;

            return (
              <button
                key={tile.id}
                type="button"
                data-active={isSelected}
                onClick={() => onSelectTool(tile.id)}
                className="group candy-trace-tile full-tile-window p-6 text-left flex flex-col justify-between min-h-[280px] cursor-pointer"
              >
                <TileVisualPreview id={tile.previewId} title={tile.title} />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 pearlescent-sheen opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080B]/95 via-[#0E1117]/45 to-[#07080B]/25"
                />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] see-thru-font-subtle">
                    {tile.icon}
                    <span>{tile.decal}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] see-thru-font-subtle group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="relative z-10 space-y-1.5 mt-4">
                  <h3
                    className="text-lg sm:text-xl font-bold uppercase tracking-[0.2em] see-thru-font"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {tile.title}
                  </h3>
                  <p className="text-xs see-thru-font-subtle">{tile.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Obsidian Vault Gates Overlay */}
        <div
          aria-hidden={gatesOpen}
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 z-30 candy-chassis flex items-center justify-end pr-5 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            gatesOpen ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="text-right space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#FF4D6A] block">
              KNOCKSSTUDiOS
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.28em] text-[#E6ECF5]"
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
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#18F2D8] block">
              INFINITY CORE ENGINE
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.28em] text-[#E6ECF5]"
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
