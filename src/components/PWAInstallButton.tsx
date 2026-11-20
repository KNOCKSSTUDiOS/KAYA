import { useState, useEffect } from 'react';
import {
  DownloadCloud,
  Smartphone,
  CheckCircle2,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Share,
  PlusSquare,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { HardwareButton, PlateBezel, LedStatusIndicator } from './HardwarePrimitives.js';

interface PWAInstallButtonProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  renderTrigger?: boolean;
}

export function PWAInstallButton({
  externalOpen,
  onExternalOpenChange,
  renderTrigger = true,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<'idle' | 'checking' | 'updated' | 'latest' | 'offline'>('idle');
  const [liveVersion, setLiveVersion] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [downloadedBat, setDownloadedBat] = useState(false);

  const modalOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setModalOpen = (next: boolean) => {
    if (!next) {
      try {
        sessionStorage.setItem('kaya_install_prompt_closed', '1');
      } catch {
        // ignore
      }
    }
    if (onExternalOpenChange) {
      onExternalOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleAction = () => {
    setModalOpen(true);
  };

  const handleCheckUpdates = async () => {
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }
    setSyncState('checking');
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            setSyncState('updated');
            setTimeout(() => window.location.reload(), 650);
            return;
          }
        }
      }
      const res = await fetch('/api/app-version', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { version?: string };
        if (data.version) setLiveVersion(data.version);
      }
      setSyncState('latest');
    } catch {
      setSyncState('offline');
    }
  };

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const windowsShortcutCmd =
    `$u="${appOrigin}";$d="$env:LOCALAPPDATA\\KAYA";New-Item -ItemType Directory -Force -Path $d|Out-Null;$ico="$d\\kaya.ico";try{Invoke-WebRequest -Uri "$u/favicon.ico" -OutFile $ico -UseBasicParsing}catch{};$b=@("$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe","\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe","$env:LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe","$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe","\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe")|Where-Object{Test-Path $_}|Select-Object -First 1;if(-not $b){throw "Desktop host runtime not found"};$sh=New-Object -ComObject WScript.Shell;$cliArgs="--app=$u --user-data-dir=\`"$d\\Profile\`" --ignore-gpu-blocklist --disable-frame-rate-limit";foreach($dir in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){if($dir -and (Test-Path $dir)){$s=$sh.CreateShortcut((Join-Path $dir "KAYA.lnk"));$s.TargetPath=$b;$s.Arguments=$cliArgs;if(Test-Path $ico){$s.IconLocation="$ico,0"};$s.Save()}};Start-Process $b $cliArgs`;

  const downloadOneClickInstaller = () => {
    const batContent = [
      '@echo off',
      'title KAYA Studio App Installer',
      'echo Installing KAYA Standalone App with Pro ^& Candy Finish icon...',
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${windowsShortcutCmd.replace(/"/g, '\\"')}"`,
      'if %ERRORLEVEL% EQU 0 (',
      '  echo KAYA installed to Desktop ^& Start Menu and launched!',
      ') else (',
      '  echo Please ensure the KAYA local server is reachable.',
      ')',
      'exit /b 0',
      '',
    ].join('\r\n');
    const blob = new Blob([batContent], { type: 'application/x-msdos-program' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KAYA-Install-App.bat';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setDownloadedBat(true);
    setTimeout(() => setDownloadedBat(false), 4000);
  };

  const copyDesktopInstallCmd = async () => {
    try {
      await navigator.clipboard.writeText(windowsShortcutCmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <>
      {renderTrigger && (
        <HardwareButton
          size="sm"
          tone={isInstalled ? 'cyan' : 'red'}
          active={!isInstalled || modalOpen}
          onClick={handleAction}
          title="Install KAYA App & Sync Runtime Updates"
        >
          {isInstalled ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F1F5F9] shrink-0" />
              <span>App Installed</span>
            </>
          ) : (
            <>
              <DownloadCloud className="w-3.5 h-3.5 text-[#FF0A3C] shrink-0" />
              <span>Install App</span>
            </>
          )}
        </HardwareButton>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setModalOpen(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <PlateBezel accent="red" className="w-full overflow-hidden p-5 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-3">
                  <img
                    src="/pwa-192x192.png"
                    alt="VORTEX KAYA App"
                    className="w-11 h-11 rounded-full shadow-[0_0_16px_rgba(255,10,60,0.45)] shrink-0 object-cover"
                  />
                  <div>
                    <h3
                      className="text-sm font-bold uppercase tracking-wider text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Install Chrome &amp; Desktop App
                    </h3>
                    <p className="text-xs text-[#F5E9EA]/65 font-mono">VORTEX · KAYA Standalone</p>
                  </div>
                </div>
                <HardwareButton
                  size="sm"
                  tone="red"
                  ledIndicator={false}
                  onClick={() => setModalOpen(false)}
                  aria-label="Close install modal"
                >
                  <X className="w-4 h-4" />
                </HardwareButton>
              </div>

              {/* Offline / Auto-Update Runtime Status */}
              <div className="candy-trace-tile p-3.5 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 font-mono text-xs">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-[#F5E9EA] shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-[#FF0A3C] shrink-0" />
                  )}
                  <span className={isOnline ? 'text-[#F5E9EA] font-semibold' : 'text-[#FF2E63] font-semibold'}>
                    {isOnline ? 'Chrome Ready · Auto-Sync Active' : 'Offline · Local Cache Ready'}
                  </span>
                </div>
                <HardwareButton
                  size="sm"
                  tone="cyan"
                  active={syncState === 'checking'}
                  onClick={handleCheckUpdates}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'checking' ? 'animate-spin' : ''}`} />
                  <span>
                    {syncState === 'checking'
                      ? 'Syncing…'
                      : syncState === 'updated'
                      ? 'Updating…'
                      : syncState === 'latest'
                      ? 'Up to Date'
                      : 'Check & Sync'}
                  </span>
                </HardwareButton>
              </div>

              {/* Install Controls */}
              <div className="space-y-3 text-xs text-[#F5E9EA]/85">
                {isInstalled ? (
                  <div className="candy-trace-tile p-3.5 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#F5E9EA] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Running in Standalone App Mode</p>
                      <p className="text-[#F5E9EA]/65 mt-0.5">
                        Chrome &amp; offline worker sync active.
                      </p>
                    </div>
                  </div>
                ) : isIOS ? (
                  <div className="candy-trace-tile p-4 space-y-2.5">
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#FF2E63]" /> Install on iOS / Tablet
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-[#F5E9EA]/80 leading-relaxed">
                      <li className="flex items-center gap-2">
                        <span>1. Tap</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0A0405] rounded-full font-mono text-[11px] text-white">
                          <Share className="w-3 h-3 text-[#FF2E63]" /> Share
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>2. Select</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0A0405] rounded-full font-mono text-[11px] text-white">
                          <PlusSquare className="w-3 h-3 text-[#F5E9EA]" /> Add to Home Screen
                        </span>
                      </li>
                      <li>3. Tap <strong>Add</strong></li>
                    </ol>
                  </div>
                ) : (
                  <div className="candy-trace-tile p-4 space-y-3">
                    <p className="text-[#F5E9EA]/90 leading-relaxed">
                      Install VORTEX · KAYA as a standalone Google Chrome &amp; Desktop app with GPU acceleration.
                    </p>

                    {isInstallable && (
                      <HardwareButton
                        fullWidth
                        tone="red"
                        active
                        onClick={async () => {
                          const res = await promptInstall();
                          if (res) setModalOpen(false);
                        }}
                      >
                        <DownloadCloud className="w-4 h-4 text-white" />
                        <span>Install Chrome App Now</span>
                      </HardwareButton>
                    )}

                    <HardwareButton
                      fullWidth
                      tone="red"
                      active={!isInstallable || downloadedBat}
                      onClick={downloadOneClickInstaller}
                    >
                      {downloadedBat ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Download className="w-4 h-4 text-white" />
                      )}
                      <span>
                        {downloadedBat
                          ? 'Downloaded Desktop Launcher'
                          : 'Download Chrome Desktop Launcher'}
                      </span>
                    </HardwareButton>

                    <HardwareButton
                      fullWidth
                      size="sm"
                      tone="magenta"
                      active={copiedCmd}
                      onClick={copyDesktopInstallCmd}
                    >
                      {copiedCmd ? (
                        <Check className="w-3.5 h-3.5 text-[#F5E9EA]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#FF8C66]" />
                      )}
                      <span>{copiedCmd ? 'Copied PowerShell Launcher' : 'Copy PowerShell Launcher'}</span>
                    </HardwareButton>
                  </div>
                )}

                <div className="candy-trace-tile p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-[#F5E9EA]/60">
                    <span>Runtime Build:</span>
                    <span className="text-[#F5E9EA] font-semibold">
                      {liveVersion ? `Live #${liveVersion.slice(-6)}` : 'kaya-v5'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#F5E9EA]/60">
                    <span>Offline Cache:</span>
                    <LedStatusIndicator label={isOnline ? 'Synced' : 'Offline Ready'} tone={isOnline ? 'cyan' : 'red'} />
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <HardwareButton
                  size="sm"
                  tone="neutral"
                  ledIndicator={false}
                  onClick={() => setModalOpen(false)}
                >
                  Close &amp; Enter Studio
                </HardwareButton>
              </div>
            </PlateBezel>
          </div>
        </div>
      )}
    </>
  );
}
