import React from 'react';

export type AccentTone = 'cyan' | 'red' | 'magenta' | 'neutral';

/**
 * Realistic CNC-chamfered black steel screw head with socket & thread collar.
 */
export function HexScrew({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-[4px] bg-[#06070A] border border-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.98),0_1px_0_rgba(255,255,255,0.1)] pointer-events-none select-none shrink-0 ${className}`}
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3">
        <defs>
          <radialGradient id="steelScrewCap" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="48%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#08090D" />
          </radialGradient>
        </defs>
        <circle cx="8" cy="8" r="6.8" fill="url(#steelScrewCap)" stroke="#050608" strokeWidth="1" />
        <polygon
          points="8,4.2 11.3,6.1 11.3,9.9 8,11.8 4.7,9.9 4.7,6.1"
          fill="#06070A"
          stroke="#94A3B8"
          strokeWidth="0.65"
        />
        <path d="M5.6 8H10.4M8 5.6V10.4" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Pro Chrome & Candy Apple Finish geometric unit mark.
 */
export function GeometricMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-[9px] p-[3px] machined-ring shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-[6px] bg-[#07080C] hw-glass-sheen flex items-center justify-center border border-[#F1F5F9]/35 shadow-[inset_0_0_12px_rgba(255,10,60,0.28)]">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#F1F5F9]" fill="none">
          <polygon
            points="12,2.5 20.5,7.5 20.5,16.5 12,21.5 3.5,16.5 3.5,7.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="8.25"
            y="8.25"
            width="7.5"
            height="7.5"
            rx="1.6"
            stroke="#FF0A3C"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="1.7" fill="#FF2E63" />
        </svg>
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
 * Pro Obsidian & Candy Finish machined plate with corner steel screws.
 */
export function PlateBezel({
  children,
  className = '',
  accent = 'neutral',
  screws = true,
}: PlateBezelProps) {
  const accentRim =
    accent === 'red'
      ? 'border-[#FF0A3C]/55 shadow-[0_0_22px_rgba(255,10,60,0.2)]'
      : accent === 'cyan'
      ? 'border-[#F1F5F9]/35 shadow-[0_0_20px_rgba(241,245,249,0.12)]'
      : accent === 'magenta'
      ? 'border-[#FF2E63]/50 shadow-[0_0_22px_rgba(255,46,99,0.18)]'
      : '';

  return (
    <div className={`relative cnc-plate rounded-[11px] ${accentRim} ${className}`}>
      {screws && (
        <>
          <HexScrew className="absolute top-2.5 left-2.5 z-10" />
          <HexScrew className="absolute top-2.5 right-2.5 z-10" />
          <HexScrew className="absolute bottom-2.5 left-2.5 z-10" />
          <HexScrew className="absolute bottom-2.5 right-2.5 z-10" />
        </>
      )}
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
 * Pro & Candy Finish hardware switch with glossy clear-coat black glass center and Candy/Chrome LED.
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
  const coreGlass =
    active && tone === 'red'
      ? 'bg-gradient-to-b from-[#160509] via-[#060203] to-[#000000] text-white border-[#FF0A3C] shadow-[inset_0_0_14px_rgba(255,10,60,0.28),0_0_18px_rgba(255,10,60,0.44)]'
      : active && tone === 'magenta'
      ? 'bg-gradient-to-b from-[#16050D] via-[#060204] to-[#000000] text-white border-[#FF2E63] shadow-[inset_0_0_14px_rgba(255,46,99,0.26),0_0_18px_rgba(255,46,99,0.4)]'
      : active && tone === 'cyan'
      ? 'bg-gradient-to-b from-[#14171F] via-[#050609] to-[#000000] text-white border-[#F1F5F9] shadow-[inset_0_0_12px_rgba(241,245,249,0.2),0_0_16px_rgba(241,245,249,0.3)]'
      : active
      ? 'bg-gradient-to-b from-[#12141A] via-[#040507] to-[#000000] text-white border-white/60 shadow-[inset_0_0_10px_rgba(255,255,255,0.12),0_0_12px_rgba(255,255,255,0.18)]'
      : 'bg-gradient-to-b from-[#07080B] via-[#020203] to-[#000000] text-[#F1F5F9]/90 border-white/15 hover:text-white hover:border-[#FF0A3C]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.9)]';

  const hoverGlow =
    tone === 'red'
      ? 'hover:shadow-[0_0_22px_rgba(255,10,60,0.46)]'
      : tone === 'magenta'
      ? 'hover:shadow-[0_0_22px_rgba(255,46,99,0.42)]'
      : tone === 'cyan'
      ? 'hover:shadow-[0_0_18px_rgba(241,245,249,0.26)]'
      : 'hover:shadow-[0_0_14px_rgba(241,245,249,0.18)]';

  const ledColor =
    active && tone === 'red'
      ? 'bg-[#FF0A3C] shadow-[0_0_10px_#FF0A3C]'
      : active && tone === 'magenta'
      ? 'bg-[#FF2E63] shadow-[0_0_10px_#FF2E63]'
      : active && tone === 'cyan'
      ? 'bg-[#F8FAFC] shadow-[0_0_10px_#FFFFFF]'
      : active
      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
      : 'bg-[#08090C]';

  const padding =
    size === 'sm'
      ? 'px-3 py-1.5 min-h-[36px] text-xs'
      : size === 'lg'
      ? 'px-6 py-3 min-h-[46px] text-xs'
      : 'px-4 py-2 min-h-[40px] text-xs';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`group relative inline-flex rounded-[10px] p-[3px] machined-ring transition-all duration-150 ease-out active:translate-y-[1px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#FF0A3C] ${hoverGlow} ${
        fullWidth ? 'w-full' : 'shrink-0'
      } ${className}`}
      {...props}
    >
      <span
        className={`relative flex items-center justify-between gap-2.5 w-full rounded-[7px] border hw-glass-sheen font-mono font-medium tracking-wide whitespace-nowrap transition-all duration-150 ${padding} ${coreGlass}`}
      >
        <span className="inline-flex items-center gap-2 min-w-0 truncate">{children}</span>
        {ledIndicator && (
          <span
            aria-hidden="true"
            className={`w-2.5 h-2.5 rounded-[3px] border border-black/50 shrink-0 transition-all duration-200 ${ledColor}`}
          />
        )}
      </span>
    </button>
  );
}

/**
 * Candy & Pro Chrome status diode indicator paired with explicit label text.
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
      ? 'bg-[#FF0A3C] border-[#FF8FA3] shadow-[0_0_10px_#FF0A3C]'
      : tone === 'magenta'
      ? 'bg-[#FF2E63] border-[#FF9EB5] shadow-[0_0_10px_#FF2E63]'
      : tone === 'emerald'
      ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_10px_#34d399]'
      : tone === 'cyan'
      ? 'bg-[#F8FAFC] border-white shadow-[0_0_10px_rgba(248,250,252,0.85)]'
      : 'bg-[#363E52] border-white/20';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[7px] cnc-recess whitespace-nowrap shrink-0">
      <span
        aria-hidden="true"
        className={`w-2.5 h-2.5 rounded-[3px] border ${diodeStyle} ${pulse ? 'animate-led-pulse' : ''}`}
      />
      <span className="font-mono text-[11px] font-semibold tracking-wider text-[#F1F5F9] uppercase">
        {label}
      </span>
    </div>
  );
}
