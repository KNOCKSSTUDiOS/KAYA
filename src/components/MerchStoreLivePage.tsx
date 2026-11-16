import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Upload,
  Download,
  Plus,
  Video,
  Camera,
  Share2,
  Radio,
  Globe,
  Trash2,
} from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';

// ============================================================================
// CREATOR MERCH & PRINT-ON-DEMAND STOREFRONT
// ============================================================================

type MerchProductType = 'hoodie' | 'tee' | 'mug' | 'poster' | 'cap';

interface StoreListing {
  id: string;
  title: string;
  productType: MerchProductType;
  retailPrice: number;
  baseCost: number;
  artworkUrl: string;
  colorHex: string;
}

const MERCH_BASES: { key: MerchProductType; label: string; baseCost: number; defaultRetail: number }[] = [
  { key: 'hoodie', label: 'Heavyweight Hoodie', baseCost: 22, defaultRetail: 54 },
  { key: 'tee', label: 'Obsidian Tee', baseCost: 11, defaultRetail: 32 },
  { key: 'mug', label: 'Studio Ceramic Mug', baseCost: 7, defaultRetail: 20 },
  { key: 'poster', label: '4K Cinema Art Print', baseCost: 9, defaultRetail: 28 },
  { key: 'cap', label: 'Titanium Emblem Cap', baseCost: 10, defaultRetail: 29 },
];

export function MerchPrintPage({ defaultArtworkUrl }: { defaultArtworkUrl: string }) {
  const [productType, setProductType] = useState<MerchProductType>('hoodie');
  const [artworkUrl, setArtworkUrl] = useState(defaultArtworkUrl);
  const [itemTitle, setItemTitle] = useState('KAYA Studio Signature Edition');
  const [retailPrice, setRetailPrice] = useState(54);
  const [garmentHex, setGarmentHex] = useState('#090B10');
  const [printScale, setPrintScale] = useState(0.56);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [storeListings, setStoreListings] = useState<StoreListing[]>(() => {
    try {
      const saved = localStorage.getItem('kaya_merch_storefront');
      return saved ? (JSON.parse(saved) as StoreListing[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setArtworkUrl(defaultArtworkUrl);
  }, [defaultArtworkUrl]);

  const activeBase = MERCH_BASES.find((m) => m.key === productType) ?? MERCH_BASES[0];
  const creatorProfit = Math.max(0, retailPrice - activeBase.baseCost);

  // Render Live Print-Ready Product Mockup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const artImg = new Image();
    artImg.crossOrigin = 'anonymous';
    const drawMockup = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#040508';
      ctx.fillRect(0, 0, w, h);

      // Subtle studio spotlight backdrop
      const bg = ctx.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h / 2, w * 0.58);
      bg.addColorStop(0, 'rgba(0, 229, 255, 0.14)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Draw Product Silhouette
      ctx.save();
      ctx.fillStyle = garmentHex;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 3;

      if (productType === 'hoodie' || productType === 'tee') {
        ctx.beginPath();
        ctx.moveTo(w * 0.34, h * 0.16);
        ctx.lineTo(w * 0.66, h * 0.16);
        ctx.lineTo(w * 0.84, h * 0.34);
        ctx.lineTo(w * 0.74, h * 0.48);
        ctx.lineTo(w * 0.68, h * 0.42);
        ctx.lineTo(w * 0.68, h * 0.88);
        ctx.lineTo(w * 0.32, h * 0.88);
        ctx.lineTo(w * 0.32, h * 0.42);
        ctx.lineTo(w * 0.26, h * 0.48);
        ctx.lineTo(w * 0.16, h * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (productType === 'mug') {
        ctx.fillRect(w * 0.32, h * 0.24, w * 0.34, h * 0.56);
        ctx.strokeRect(w * 0.32, h * 0.24, w * 0.34, h * 0.56);
        ctx.beginPath();
        ctx.arc(w * 0.68, h * 0.52, h * 0.14, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else if (productType === 'poster') {
        ctx.fillRect(w * 0.24, h * 0.12, w * 0.52, h * 0.76);
        ctx.strokeRect(w * 0.24, h * 0.12, w * 0.52, h * 0.76);
      } else {
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.54, w * 0.24, Math.PI, 0);
        ctx.lineTo(w * 0.84, h * 0.66);
        ctx.lineTo(w * 0.26, h * 0.66);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Overlay Creator Print Artwork cleanly inside safe print zone
      if (artImg.complete && artImg.naturalWidth > 0) {
        const zoneW = w * 0.28 * printScale * 1.4;
        const aspect = artImg.naturalWidth / artImg.naturalHeight;
        const drawW = zoneW;
        const drawH = zoneW / Math.max(0.4, aspect);
        ctx.save();
        ctx.drawImage(artImg, w / 2 - drawW / 2, h * 0.48 - drawH / 2, drawW, drawH);
        ctx.restore();
      }
    };

    artImg.onload = drawMockup;
    artImg.src = artworkUrl;
    drawMockup();
  }, [productType, artworkUrl, garmentHex, printScale]);

  const publishToStore = () => {
    const entry: StoreListing = {
      id: `pod-${Date.now()}`,
      title: itemTitle.trim() || 'Untitled Merch Item',
      productType,
      retailPrice,
      baseCost: activeBase.baseCost,
      artworkUrl,
      colorHex: garmentHex,
    };
    const next = [entry, ...storeListings];
    setStoreListings(next);
    try {
      localStorage.setItem('kaya_merch_storefront', JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const removeListing = (id: string) => {
    const next = storeListings.filter((s) => s.id !== id);
    setStoreListings(next);
    try {
      localStorage.setItem('kaya_merch_storefront', JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  };

  const exportMockupPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaya-merch-${productType}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-4 h-4 text-[#FF3B5C]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            KAYA Creator Merch &amp; Print Storefront
          </h2>
        </div>
        <LedStatusIndicator
          label={`Creator Profit +$${creatorProfit.toFixed(2)} · ${storeListings.length} Published`}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="cnc-recess rounded-[10px] p-3 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={520}
            className="w-full max-w-[440px] aspect-[64/52] rounded-[8px] bg-black border border-white/10"
          />
        </div>

        <div className="cnc-recess rounded-[10px] p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {MERCH_BASES.map((m) => (
              <HardwareButton
                key={m.key}
                size="sm"
                fullWidth
                tone="cyan"
                active={productType === m.key}
                onClick={() => {
                  setProductType(m.key);
                  setRetailPrice(m.defaultRetail);
                }}
              >
                <span className="truncate">{m.key.toUpperCase()}</span>
              </HardwareButton>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 font-mono text-xs text-[#E6ECF5]/80">
              <span>Product Title</span>
              <input
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                className="w-full rounded-[6px] bg-[#020203] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </label>
            <label className="space-y-1 font-mono text-xs text-[#E6ECF5]/80">
              <span>Retail Price ($) · Cost ${activeBase.baseCost}</span>
              <input
                type="number"
                min={activeBase.baseCost + 1}
                max={250}
                value={retailPrice}
                onChange={(e) => setRetailPrice(Math.max(activeBase.baseCost, Number(e.target.value)))}
                className="w-full rounded-[6px] bg-[#020203] border border-white/15 px-3 py-2 text-xs text-[#00E5FF] tabular-nums focus:outline-none focus:border-[#00E5FF]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#E6ECF5]/70">Base Color</span>
              {['#090B10', '#1E2430', '#5E0E1C', '#E6ECF5'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setGarmentHex(hex)}
                  aria-label={`Color ${hex}`}
                  className={`w-6 h-6 rounded-full border cursor-pointer ${
                    garmentHex === hex ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40' : 'border-white/25'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#E6ECF5]/70">Print Size</span>
              <input
                type="range"
                min={0.25}
                max={0.95}
                step={0.05}
                value={printScale}
                onChange={(e) => setPrintScale(parseFloat(e.target.value))}
                className="hw-capsule-slider w-24"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[7px] bg-[#020203] border border-white/20 hover:border-[#00E5FF] font-mono text-xs text-[#00E5FF]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Print Art</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setArtworkUrl(URL.createObjectURL(f));
                }}
              />
            </label>

            <HardwareButton size="sm" tone="red" active onClick={publishToStore}>
              <Plus className="w-3.5 h-3.5" />
              <span>Publish to KAYA Store</span>
            </HardwareButton>

            <HardwareButton size="sm" tone="cyan" active onClick={exportMockupPng}>
              <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Export Mockup PNG</span>
            </HardwareButton>
          </div>
        </div>
      </div>

      {/* Published Storefront Catalog */}
      {storeListings.length > 0 && (
        <div className="cnc-recess rounded-[8px] p-3.5 space-y-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#E6ECF5]/60 block">
            Published Creator Merch Catalog ({storeListings.length} Products Ready for Checkout)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {storeListings.map((item) => (
              <div
                key={item.id}
                className="cnc-module rounded-[8px] p-2.5 flex items-center justify-between gap-2.5 border border-white/15"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={item.artworkUrl} alt={item.title} className="w-10 h-10 rounded-[5px] object-cover border border-white/15 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-white truncate">{item.title}</div>
                    <div className="font-mono text-[11px] text-[#00E5FF] tabular-nums">
                      ${item.retailPrice.toFixed(2)} · Net +${(item.retailPrice - item.baseCost).toFixed(2)}
                    </div>
                  </div>
                </div>
                <HardwareButton size="sm" tone="red" ledIndicator={false} onClick={() => removeListing(item.id)} aria-label="Remove item">
                  <Trash2 className="w-3.5 h-3.5" />
                </HardwareButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </PlateBezel>
  );
}

// ============================================================================
// LIVE SCENE CAMERA RECORDER & MULTI-SOCIAL STREAM HUB
// ============================================================================

const STREAM_DESTINATIONS = [
  'Video Portal Live',
  'Short-Form Feed',
  'Live Stream Channel',
  'Creator Social Wall',
  'Podcast & Radio Cast',
  'Local Hub Broadcast Mesh',
];

export function LiveBroadcastStreamPage({ fallbackBackdropUrl }: { fallbackBackdropUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [camActive, setCamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [bannerText, setBannerText] = useState('LIVE · KAYA CREATOR STAGE');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([STREAM_DESTINATIONS[0]]);
  const [statusMsg, setStatusMsg] = useState('Camera Standby · Virtual Stage Ready');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Compositor Loop merging Real Webcam (or Virtual Stage) + Live On-Air Overlay
  useEffect(() => {
    let raf = 0;
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = fallbackBackdropUrl;

    const renderFrame = (now: number) => {
      const canvas = compositeCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#020203';
          ctx.fillRect(0, 0, w, h);

          const v = videoRef.current;
          if (camActive && v && v.readyState >= 2) {
            ctx.drawImage(v, 0, 0, w, h);
          } else if (bgImg.complete && bgImg.naturalWidth > 0) {
            const z = 1.05 + Math.sin(now / 1400) * 0.04;
            const dw = w * z;
            const dh = h * z;
            ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
          }

          // Clean Lower-Third Broadcast Graphic
          ctx.fillStyle = 'rgba(2, 2, 3, 0.82)';
          ctx.fillRect(24, h - 72, w - 48, 48);
          ctx.strokeStyle = recording ? '#FF1E42' : '#00E5FF';
          ctx.lineWidth = 2;
          ctx.strokeRect(24, h - 72, w - 48, 48);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(bannerText || 'KAYA LIVE SCENE', 42, h - 42);
        }
      }
      raf = requestAnimationFrame(renderFrame);
    };
    raf = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(raf);
  }, [camActive, bannerText, recording, fallbackBackdropUrl]);

  const toggleCamera = async () => {
    if (camActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamActive(false);
      setStatusMsg('Camera Stopped · Virtual Stage Active');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCamActive(true);
      setStatusMsg('LIVE CAMERA ACTIVE · 60fps Compositor');
    } catch {
      setStatusMsg('Camera hardware unavailable/denied; streaming Virtual Stage feed.');
    }
  };

  const toggleRecord = () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setStatusMsg('Live Scene Recording Ready for Download & Share');
    };
    rec.start(200);
    recorderRef.current = rec;
    setRecording(true);
    setStatusMsg('RECORDING LIVE SCENE STREAM…');
  };

  const triggerSocialShare = async () => {
    const summary = `${bannerText} · Multi-Channel Stream Targets: ${selectedTargets.join(', ')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'KAYA Live Studio Stream', text: summary, url: window.location.href });
        setStatusMsg('Dispatched to device Social Share sheet.');
        return;
      } catch {
        // user dismissed share
      }
    }
    navigator.clipboard?.writeText(summary).catch(() => {});
    setStatusMsg('Stream link & channel manifest copied to clipboard.');
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Video className="w-4 h-4 text-[#00E5FF]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Live Scene Camera, Recorder &amp; Multi-Social Stream Hub
          </h2>
        </div>
        <LedStatusIndicator label={statusMsg} tone={recording ? 'red' : camActive ? 'emerald' : 'cyan'} pulse={recording} />
      </div>

      <video ref={videoRef} muted playsInline className="hidden" />

      <div className="cnc-recess rounded-[10px] p-2">
        <canvas ref={compositeCanvasRef} width={960} height={540} className="w-full aspect-video max-h-[400px] rounded-[7px] bg-black border border-white/10" />
      </div>

      <div className="cnc-recess rounded-[8px] p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 font-mono text-xs text-[#E6ECF5]/80">
            <span>On-Air Lower-Third Overlay</span>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="w-full rounded-[6px] bg-[#020203] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00E5FF]"
            />
          </label>
          <div className="space-y-1">
            <span className="font-mono text-xs text-[#E6ECF5]/80 block">Social &amp; Hub Simulcast Targets</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {STREAM_DESTINATIONS.map((dest) => {
                const on = selectedTargets.includes(dest);
                return (
                  <HardwareButton
                    key={dest}
                    size="sm"
                    fullWidth
                    tone="cyan"
                    active={on}
                    onClick={() =>
                      setSelectedTargets((prev) =>
                        prev.includes(dest) ? prev.filter((d) => d !== dest) : [...prev, dest]
                      )
                    }
                  >
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{dest}</span>
                  </HardwareButton>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <HardwareButton size="sm" tone={camActive ? 'red' : 'cyan'} active onClick={toggleCamera}>
            <Camera className="w-3.5 h-3.5" />
            <span>{camActive ? 'Stop Webcam' : 'Enable Live Camera & Mic'}</span>
          </HardwareButton>

          <HardwareButton size="sm" tone="red" active={recording} onClick={toggleRecord}>
            <Radio className="w-3.5 h-3.5 text-[#FF3B5C]" />
            <span>{recording ? 'Stop Recording' : 'Record Live Scene (.WebM)'}</span>
          </HardwareButton>

          <HardwareButton size="sm" tone="magenta" active onClick={triggerSocialShare}>
            <Share2 className="w-3.5 h-3.5 text-[#FF64B8]" />
            <span>Broadcast / Social Share</span>
          </HardwareButton>

          {recordedUrl && (
            <a
              href={recordedUrl}
              download="kaya-live-scene.webm"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[7px] bg-[#020203] border border-[#00E5FF]/50 font-mono text-xs text-[#00E5FF] hover:text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Recorded Scene</span>
            </a>
          )}
        </div>
      </div>
    </PlateBezel>
  );
}
