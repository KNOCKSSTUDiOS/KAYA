import React from 'react';

export type AccentTone = 'cyan' | 'red' | 'magenta' | 'neutral';

/**
 * Forged dark bronze-titanium hex stud (optional structural corner accent).
 */
export function HexScrew({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center w-3 h-3 rounded-full bg-gradient-to-br from-[#52302A] via-[#1C0E10] to-[#070304] shadow-[inset_0_1px_1px_rgba(255,220,210,0.22),0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none select-none shrink-0 ${className}`}
    />
  );
}

/**
 * Candy-Gloss & Rust sculpted brand medallion.
 */
export function GeometricMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full p-[2px] bg-gradient-to-br from-[#FF5E7E] via-[#9E0622] to-[#B84323] shadow-[0_0_18px_rgba(255,10,60,0.38)] shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#20090D] to-[#080304] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.28)]">
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#FFFFFF] via-[#FF0A3C] to-[#7C2A12] shadow-[0_0_10px_#FF0A3C]" />
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
 * Seamless see-through studio surface (eliminates fragmented hard borders and white line breaks).
 */
export function PlateBezel({
  children,
  className = '',
  accent = 'neutral',
}: PlateBezelProps) {
  const subtleAmbient =
    accent === 'red'
      ? 'shadow-[0_14px_44px_rgba(255,10,60,0.08)]'
      : accent === 'magenta'
      ? 'shadow-[0_14px_44px_rgba(184,67,35,0.08)]'
      : 'shadow-[0_14px_44px_rgba(0,0,0,0.42)]';

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
 * Solid, round, metallic sculpted Candy-Gloss & Rust studio button (no flat designs).
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
        ? 'bg-gradient-to-b from-[#FF3D64] via-[#B8062B] to-[#590214] text-white shadow-[inset_0_1.5px_1px_rgba(255,245,245,0.58),inset_0_-3px_6px_rgba(40,0,8,0.85),0_4px_18px_rgba(255,10,60,0.44)]'
        : 'bg-gradient-to-b from-[#3A1118] via-[#1C070B] to-[#0B0305] text-[#F5E9EA] hover:from-[#571521] hover:via-[#2B0910] shadow-[inset_0_1px_1px_rgba(255,210,218,0.32),inset_0_-2px_5px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.68)]'
      : tone === 'magenta'
      ? active
        ? 'bg-gradient-to-b from-[#E06844] via-[#A33719] to-[#4F1608] text-white shadow-[inset_0_1.5px_1px_rgba(255,235,220,0.55),inset_0_-3px_6px_rgba(38,10,2,0.85),0_4px_18px_rgba(184,67,35,0.42)]'
        : 'bg-gradient-to-b from-[#361A12] via-[#1B0C08] to-[#0A0403] text-[#F5E9EA] hover:from-[#4C2418] hover:via-[#26110A] shadow-[inset_0_1px_1px_rgba(255,215,195,0.28),inset_0_-2px_5px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.68)]'
      : tone === 'cyan'
      ? active
        ? 'bg-gradient-to-b from-[#69565A] via-[#312527] to-[#120C0D] text-white shadow-[inset_0_1.5px_1px_rgba(255,245,245,0.55),inset_0_-3px_6px_rgba(0,0,0,0.85),0_4px_16px_rgba(245,233,234,0.2)]'
        : 'bg-gradient-to-b from-[#2B1F21] via-[#150E10] to-[#080405] text-[#F5E9EA]/90 hover:from-[#3D2C2F] hover:via-[#1E1416] shadow-[inset_0_1px_1px_rgba(255,230,235,0.24),inset_0_-2px_5px_rgba(0,0,0,0.88),0_4px_12px_rgba(0,0,0,0.68)]'
      : active
      ? 'bg-gradient-to-b from-[#422F32] via-[#1F1416] to-[#0C0708] text-white shadow-[inset_0_1px_1px_rgba(255,235,235,0.36),inset_0_-2px_5px_rgba(0,0,0,0.88),0_4px_14px_rgba(0,0,0,0.72)]'
      : 'bg-gradient-to-b from-[#23181A] via-[#110A0B] to-[#060304] text-[#F5E9EA]/85 hover:from-[#332325] hover:via-[#1A0F11] shadow-[inset_0_1px_1px_rgba(255,220,220,0.2),inset_0_-2px_5px_rgba(0,0,0,0.9),0_3px_10px_rgba(0,0,0,0.65)]';

  const diodeColor =
    active && tone === 'red'
      ? 'bg-[#FFE4E9] shadow-[0_0_8px_#FFFFFF]'
      : active && tone === 'magenta'
      ? 'bg-[#FFE7D6] shadow-[0_0_8px_#FFB48A]'
      : active && tone === 'cyan'
      ? 'bg-[#FFFFFF] shadow-[0_0_8px_#FFFFFF]'
      : active
      ? 'bg-emerald-300 shadow-[0_0_8px_#34d399]'
      : 'bg-black/60';

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
      className={`group relative inline-flex items-center justify-between gap-2 rounded-full font-mono font-semibold tracking-wide whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] hover:-translate-y-[0.5px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#FF0A3C] ${sizing} ${metallicShell} ${
        fullWidth ? 'w-full' : 'shrink-0'
      } ${className}`}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5 min-w-0 truncate">{children}</span>
      {ledIndicator && (
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full shrink-0 transition-all duration-200 ${diodeColor}`}
        />
      )}
    </button>
  );
}

/**
 * Minimal seamless status indicator without enclosing boxes or outlines.
 */
export function LedStatusIndicator({
  label,
  tone = 'cyan',
  pulse = false,
}: {
  label: string;
  tone?: AccentTone | 'emerald';
  pulse?: boolean;
}) {
  const diodeStyle =
    tone === 'red'
      ? 'bg-[#FF0A3C] shadow-[0_0_10px_#FF0A3C]'
      : tone === 'magenta'
      ? 'bg-[#B84323] shadow-[0_0_10px_#D95A34]'
      : tone === 'emerald'
      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
      : tone === 'cyan'
      ? 'bg-[#F5E9EA] shadow-[0_0_10px_rgba(245,233,234,0.85)]'
      : 'bg-[#6E4B4E]';

  return (
    <div className="inline-flex items-center gap-2 px-1 py-0.5 whitespace-nowrap shrink-0">
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full ${diodeStyle} ${pulse ? 'animate-led-pulse' : ''}`}
      />
      <span className="font-mono text-[11px] font-medium tracking-wider text-[#F5E9EA]/85 uppercase">
        {label}
      </span>
    </div>
  );
}
