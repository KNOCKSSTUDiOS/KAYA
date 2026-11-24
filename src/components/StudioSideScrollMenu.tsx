import React, { useState } from 'react';
import { Sparkles, Palette, Type, Zap, Box } from 'lucide-react';
import { HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import {
  GeneratorPresetKey,
  ShaderPresetKey,
  STUDIO_GENERATOR_PRESETS,
  STUDIO_SHADER_PRESETS,
  TitleOverlayConfig,
} from '../lib/studioPipelineTypes.js';
import type { StudioPageKey } from './RubiksCubeHubPage.js';

interface StudioSideScrollMenuProps {
  activeTool: StudioPageKey;
  activeShader: ShaderPresetKey;
  onSelectShader: (shader: ShaderPresetKey) => void;
  activeGenerator: GeneratorPresetKey;
  onSelectGenerator: (gen: GeneratorPresetKey) => void;
  titleOverlay: TitleOverlayConfig;
  onChangeTitleOverlay: (patch: Partial<TitleOverlayConfig>) => void;
  onOpenVfxSubView: (sub: 'vfx_picture' | 'shaders' | 'titles' | 'generators') => void;
  onJumpTo3DAsset: () => void;
}

type SideTab = 'generators' | 'shaders' | 'titles';

export function StudioSideScrollMenu({
  activeShader,
  onSelectShader,
  activeGenerator,
  onSelectGenerator,
  titleOverlay,
  onChangeTitleOverlay,
  onOpenVfxSubView,
  onJumpTo3DAsset,
}: StudioSideScrollMenuProps) {
  const [tab, setTab] = useState<SideTab>('shaders');

  return (
    <aside
      aria-label="Generators, Shaders & Typography Side Rail"
      className="candy-surface rounded-[18px] p-4 flex flex-col gap-3.5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5FFFA]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pipeline Rack
        </span>
        <LedStatusIndicator label="Live Bind" tone="cyan" />
      </div>

      {/* Category Switcher */}
      <div className="grid grid-cols-3 gap-1.5">
        <HardwareButton
          size="sm"
          fullWidth
          tone="cyan"
          ledIndicator={false}
          active={tab === 'shaders'}
          onClick={() => setTab('shaders')}
        >
          <Palette className="w-3 h-3" />
          <span>Shaders</span>
        </HardwareButton>
        <HardwareButton
          size="sm"
          fullWidth
          tone="red"
          ledIndicator={false}
          active={tab === 'generators'}
          onClick={() => setTab('generators')}
        >
          <Zap className="w-3 h-3" />
          <span>Gen FX</span>
        </HardwareButton>
        <HardwareButton
          size="sm"
          fullWidth
          tone="magenta"
          ledIndicator={false}
          active={tab === 'titles'}
          onClick={() => setTab('titles')}
        >
          <Type className="w-3 h-3" />
          <span>Titles</span>
        </HardwareButton>
      </div>

      {/* Shaders List */}
      {tab === 'shaders' && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-[#E0FFFF]/65 leading-relaxed">
            Bind active surface shader across Video, VFX, and 3D Asset (V):
          </p>
          <div className="space-y-2">
            {STUDIO_SHADER_PRESETS.map((sh) => {
              const isSelected = activeShader === sh.key;
              return (
                <button
                  key={sh.key}
                  type="button"
                  data-active={isSelected}
                  onClick={() => onSelectShader(sh.key)}
                  className="w-full candy-trace-tile p-2.5 text-left cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#F5FFFA] truncate">
                      {sh.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: sh.swatch }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-[#E0FFFF]/60 line-clamp-2">{sh.desc}</p>
                </button>
              );
            })}
          </div>
          <HardwareButton
            size="sm"
            fullWidth
            tone="cyan"
            onClick={() => onOpenVfxSubView('shaders')}
          >
            <Sparkles className="w-3 h-3" />
            <span>Open Shader Lab</span>
          </HardwareButton>
        </div>
      )}

      {/* Generators List */}
      {tab === 'generators' && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-[#E0FFFF]/65 leading-relaxed">
            Procedural GPU motion generators composited live behind cuts:
          </p>
          <div className="space-y-2">
            {STUDIO_GENERATOR_PRESETS.map((gen) => {
              const isSelected = activeGenerator === gen.key;
              return (
                <button
                  key={gen.key}
                  type="button"
                  data-active={isSelected}
                  onClick={() => onSelectGenerator(gen.key)}
                  className="w-full candy-trace-tile p-2.5 text-left cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#F5FFFA] truncate">
                      {gen.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: gen.accent }}
                    />
                  </div>
                  <p className="font-mono text-[10px] text-[#E0FFFF]/60 line-clamp-2">{gen.desc}</p>
                </button>
              );
            })}
          </div>
          <HardwareButton
            size="sm"
            fullWidth
            tone="red"
            onClick={() => onOpenVfxSubView('generators')}
          >
            <Zap className="w-3 h-3" />
            <span>Open Generator View</span>
          </HardwareButton>
        </div>
      )}

      {/* Titles & Typography Quick Controls */}
      {tab === 'titles' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase text-[#FC8EAC]">Title Lower-Third</span>
            <HardwareButton
              size="sm"
              tone={titleOverlay.enabled ? 'red' : 'neutral'}
              active={titleOverlay.enabled}
              onClick={() => onChangeTitleOverlay({ enabled: !titleOverlay.enabled })}
            >
              <span>{titleOverlay.enabled ? 'ON' : 'OFF'}</span>
            </HardwareButton>
          </div>

          <input
            type="text"
            value={titleOverlay.headline}
            onChange={(e) => onChangeTitleOverlay({ headline: e.target.value })}
            placeholder="KNOCKSSTUDiOS"
            className="w-full rounded-full bg-[#0A0A0A] border border-[#FF007F]/35 px-3 py-1.5 font-mono text-xs text-[#F5FFFA] focus:outline-none focus:border-[#00D9C0]"
          />

          <input
            type="text"
            value={titleOverlay.subline}
            onChange={(e) => onChangeTitleOverlay({ subline: e.target.value })}
            placeholder="Hollywood MOTiON Pictures"
            className="w-full rounded-full bg-[#0A0A0A] border border-[#00D9C0]/30 px-3 py-1.5 font-mono text-xs text-[#E0FFFF] focus:outline-none focus:border-[#FF007F]"
          />

          <div className="grid grid-cols-3 gap-1">
            {(
              [
                ['chakra_etch', 'Etch'],
                ['hollywood_serif', 'Cinema'],
                ['mono_broadcast', 'Slate'],
              ] as const
            ).map(([k, lbl]) => (
              <HardwareButton
                key={k}
                size="sm"
                fullWidth
                tone="magenta"
                ledIndicator={false}
                active={titleOverlay.typography === k}
                onClick={() => onChangeTitleOverlay({ typography: k })}
              >
                <span>{lbl}</span>
              </HardwareButton>
            ))}
          </div>

          <HardwareButton
            size="sm"
            fullWidth
            tone="magenta"
            onClick={() => onOpenVfxSubView('titles')}
          >
            <Type className="w-3 h-3" />
            <span>Open Title Designer</span>
          </HardwareButton>
        </div>
      )}

      <div className="pt-2 border-t border-white/10">
        <HardwareButton size="sm" fullWidth tone="neutral" onClick={onJumpTo3DAsset}>
          <Box className="w-3.5 h-3.5 text-[#00D9C0]" />
          <span>Inspect 3D Asset (V)</span>
        </HardwareButton>
      </div>
    </aside>
  );
}
