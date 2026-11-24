import React from 'react';

export type AccentTone = 'cyan' | 'red' | 'magenta' | 'neutral';

/**
 * Forged pearlescent / obsidian corner stud.
 */
export function HexScrew({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center w-3 h-3 rounded-full bg-gradient-to-br from-[#F5FFFA]/65 via-[#2A2A2A] to-[#0A0A0A] shadow-[inset_0_1px_1px_rgba(224,255,255,0.4),0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none select-none shrink-0 ${className}`}
    />
  );
}

/**
 * KNOCKSSTUDiOS · Hollywood MOTiON Pictures™ Candy Pearlescent Medallion.
 */
export function GeometricMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full p-[2px] bg-gradient-to-br from-[#FF007F] via-[#FC8EAC] to-[#00D9C0] shadow-[0_0_18px_rgba(255,0,127,0.42)] shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#121212] to-[#0A0A0A] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(245,255,250,0.38)]">
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F5FFFA] via-[#E0FFFF] to-[#FF007F] shadow-[0_0_10px_#00D9C0]" />
      </div>
    </div>
  );
}

interface PlateBezelProps {
  children: React.ReactNode;
  className?: string;
  accent?: AccentTone;
  screws?: boolean;
}

/**
 * Seamless Gunmetal Dark (#121212) & Void Black (#0A0A0A) surface.
 */
export function PlateBezel({
  children,
  className = '',
  accent = 'neutral',
}: PlateBezelProps) {
  const subtleAmbient =
    accent === 'red'
      ? 'shadow-[0_14px_44px_rgba(255,0,127,0.14)]'
      : accent === 'magenta'
      ? 'shadow-[0_14px_44px_rgba(252,142,172,0.13)]'
      : accent === 'cyan'
      ? 'shadow-[0_14px_44px_rgba(0,217,192,0.12)]'
      : 'shadow-[0_14px_44px_rgba(0,0,0,0.58)]';

  return (
    <div className={`relative candy-surface rounded-[18px] ${subtleAmbient} ${className}`}>
      {children}
    </div>
  );
}

interface HardwareButtonProps {
  key?: React.Key;
  active?: boolean;
  tone?: AccentTone;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  ledIndicator?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  children: React.ReactNode;
}

/**
 * Solid, round, metallic sculpted Candy Pearlescent / Bioluminescent Magenta / Quantum Teal button.
 */
export function HardwareButton({
  active = false,
  tone = 'cyan',
  size = 'md',
  fullWidth = false,
  ledIndicator = true,
  className = '',
  disabled = false,
  children,
  type = 'button',
  ...props
}: HardwareButtonProps) {
  const metallicShell =
    tone === 'red'
      ? active
        ? 'bg-gradient-to-b from-[#FC8EAC] via-[#FF007F] to-[#8C0046] text-[#F5FFFA] shadow-[inset_0_1.5px_1.5px_rgba(245,255,250,0.72),inset_0_-3px_6px_rgba(28,0,14,0.88),0_4px_18px_rgba(255,0,127,0.48)]'
        : 'bg-gradient-to-b from-[#2A101B] via-[#170A10] to-[#0A0A0A] text-[#F5FFFA] hover:from-[#3D1426] hover:via-[#210D16] shadow-[inset_0_1px_1px_rgba(252,142,172,0.34),inset_0_-2px_5px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.72)]'
      : tone === 'magenta'
      ? active
        ? 'bg-gradient-to-b from-[#FFDAB9] via-[#FC8EAC] to-[#A63A64] text-[#0A0A0A] font-bold shadow-[inset_0_1.5px_1.5px_rgba(245,255,250,0.78),inset_0_-3px_6px_rgba(40,10,22,0.72),0_4px_18px_rgba(252,142,172,0.45)]'
        : 'bg-gradient-to-b from-[#26191D] via-[#150E11] to-[#0A0A0A] text-[#FFDAB9] hover:from-[#362228] hover:via-[#1E1317] shadow-[inset_0_1px_1px_rgba(255,218,185,0.3),inset_0_-2px_5px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.72)]'
      : tone === 'cyan'
      ? active
        ? 'bg-gradient-to-b from-[#F5FFFA] via-[#E0FFFF] to-[#00D9C0] text-[#0A0A0A] font-bold shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,48,42,0.55),0_4px_18px_rgba(0,217,192,0.38)]'
        : 'bg-gradient-to-b from-[#1A2424] via-[#121212] to-[#0A0A0A] text-[#E0FFFF] hover:from-[#223232] hover:via-[#161B1B] shadow-[inset_0_1px_1px_rgba(224,255,255,0.28),inset_0_-2px_5px_rgba(0,0,0,0.92),0_4px_12px_rgba(0,0,0,0.72)]'
      : active
      ? 'bg-gradient-to-b from-[#3A3A3A] via-[#1E1E1E] to-[#121212] text-[#F5FFFA] shadow-[inset_0_1px_1.5px_rgba(245,255,250,0.42),inset_0_-2px_5px_rgba(0,0,0,0.9),0_4px_14px_rgba(0,0,0,0.78)]'
      : 'bg-gradient-to-b from-[#1B1B1B] via-[#121212] to-[#0A0A0A] text-[#F5FFFA]/85 hover:from-[#262626] hover:via-[#181818] shadow-[inset_0_1px_1px_rgba(245,255,250,0.2),inset_0_-2px_5px_rgba(0,0,0,0.94),0_3px_10px_rgba(0,0,0,0.7)]';

  const diodeColor =
    active && tone === 'red'
      ? 'bg-[#F5FFFA] shadow-[0_0_8px_#FF007F]'
      : active && tone === 'magenta'
      ? 'bg-[#FFDAB9] shadow-[0_0_8px_#FC8EAC]'
      : active && tone === 'cyan'
      ? 'bg-[#00D9C0] shadow-[0_0_9px_#00D9C0]'
      : active
      ? 'bg-[#E0FFFF] shadow-[0_0_9px_#E0FFFF]'
      : 'bg-black/65';

  const sizing =
    size === 'sm'
      ? 'px-3.5 py-1.5 min-h-[34px] text-[11px]'
      : size === 'lg'
      ? 'px-6 py-2.5 min-h-[44px] text-xs'
      : 'px-4 py-2 min-h-[38px] text-xs';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`group relative overflow-hidden inline-flex items-center justify-between gap-2 rounded-full font-mono font-semibold tracking-wide whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] hover:-translate-y-[0.5px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#00D9C0] ${sizing} ${metallicShell} ${
        fullWidth ? 'w-full' : 'shrink-0'
      } ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full hw-glass-sheen opacity-60"
      />
      <span className="relative z-10 inline-flex items-center gap-1.5 min-w-0 truncate">{children}</span>
      {ledIndicator && (
        <span
          aria-hidden="true"
          className={`relative z-10 w-2 h-2 rounded-full shrink-0 transition-all duration-200 ${diodeColor}`}
        />
      )}
    </button>
  );
}

/**
 * Minimal static status indicator with KNOCKSSTUDiOS bioluminescent diodes.
 */
export function LedStatusIndicator({
  label,
  tone = 'cyan',
}: {
  label: string;
  tone?: AccentTone | 'emerald';
  pulse?: boolean;
}) {
  const diodeStyle =
    tone === 'red'
      ? 'bg-[#FF007F] shadow-[0_0_10px_#FF007F]'
      : tone === 'magenta'
      ? 'bg-[#FC8EAC] shadow-[0_0_10px_#FC8EAC]'
      : tone === 'emerald'
      ? 'bg-[#00D9C0] shadow-[0_0_10px_#00D9C0]'
      : tone === 'cyan'
      ? 'bg-[#00D9C0] shadow-[0_0_10px_#00D9C0]'
      : 'bg-[#F5FFFA]/40';

  return (
    <div className="inline-flex items-center gap-2 px-1 py-0.5 whitespace-nowrap shrink-0">
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full ${diodeStyle}`}
      />
      <span className="font-mono text-[11px] font-medium tracking-wider text-[#E0FFFF]/85 uppercase">
        {label}
      </span>
    </div>
  );
}
