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
import { stampUnifiedCanvasWatermark } from '../lib/watermarkEngine.js';
import {
  PrintifyItemDoc,
  deletePrintifyItem,
  fetchPrintifyItems,
  savePrintifyItem,
} from '../lib/firebase.js';

type MerchProductType = 'hoodie' | 'tee' | 'mug' | 'poster' | 'cap';

const MERCH_BASES: { key: MerchProductType; label: string; baseCost: number; defaultRetail: number }[] = [
  { key: 'hoodie', label: 'Heavyweight Hoodie', baseCost: 22, defaultRetail: 54 },
  { key: 'tee', label: 'Obsidian Tee', baseCost: 11, defaultRetail: 32 },
  { key: 'mug', label: 'Studio Ceramic Mug', baseCost: 7, defaultRetail: 20 },
  { key: 'poster', label: '4K Cinema Art Print', baseCost: 9, defaultRetail: 28 },
  { key: 'cap', label: 'Emblem Cap', baseCost: 10, defaultRetail: 29 },
];

export function MerchPrintPage({
  defaultArtworkUrl,
  userId,
}: {
  defaultArtworkUrl: string;
  userId?: string | null;
}) {
  const [productType, setProductType] = useState<MerchProductType>('hoodie');
  const [artworkUrl, setArtworkUrl] = useState(defaultArtworkUrl);
  const [itemTitle, setItemTitle] = useState('VORTEX · KAYA Signature Print');
  const [retailPrice, setRetailPrice] = useState(54);
  const [garmentHex, setGarmentHex] = useState('#14080A');
  const [printScale, setPrintScale] = useState(0.56);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [storeListings, setStoreListings] = useState<(PrintifyItemDoc & { previewUrl?: string })[]>([]);
  const [syncMsg, setSyncMsg] = useState('Printify Studio Ready');

  useEffect(() => {
    setArtworkUrl(defaultArtworkUrl);
  }, [defaultArtworkUrl]);

  useEffect(() => {
    if (!userId) return;
    fetchPrintifyItems(userId)
      .then((items) => setStoreListings(items))
      .catch(() => {});
  }, [userId]);

  const activeBase = MERCH_BASES.find((m) => m.key === productType) ?? MERCH_BASES[0];
  const creatorProfit = Math.max(0, retailPrice - activeBase.baseCost);

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
      ctx.fillStyle = '#060304';
      ctx.fillRect(0, 0, w, h);

      const bg = ctx.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h / 2, w * 0.58);
      bg.addColorStop(0, 'rgba(255, 10, 60, 0.14)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = garmentHex;
      ctx.strokeStyle = 'rgba(245, 233, 234, 0.22)';
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

      if (artImg.complete && artImg.naturalWidth > 0) {
        const zoneW = w * 0.28 * printScale * 1.4;
        const aspect = artImg.naturalWidth / artImg.naturalHeight;
        const drawW = zoneW;
        const drawH = zoneW / Math.max(0.4, aspect);
        ctx.drawImage(artImg, w / 2 - drawW / 2, h * 0.48 - drawH / 2, drawW, drawH);
      }

      stampUnifiedCanvasWatermark(ctx, w, h, { passToken: 1, opacity: 0.48 });
    };

    artImg.onload = drawMockup;
    artImg.src = artworkUrl;
    drawMockup();
  }, [productType, artworkUrl, garmentHex, printScale]);

  const publishToPrintify = async () => {
    const cleanTitle = itemTitle.trim() || 'Printify Studio Item';
    if (userId) {
      try {
        const id = await savePrintifyItem({
          userId,
          title: cleanTitle,
          productType,
          retailPrice,
          baseCost: activeBase.baseCost,
          colorHex: garmentHex,
        });
        setStoreListings((prev) => [
          { id, userId, title: cleanTitle, productType, retailPrice, baseCost: activeBase.baseCost, colorHex: garmentHex, previewUrl: artworkUrl },
          ...prev,
        ]);
        setSyncMsg('Published to Firebase Printify Catalog');
        return;
      } catch {
        // fallback session state if cloud write denied
      }
    }
    setStoreListings((prev) => [
      {
        id: `pod-${Date.now()}`,
        userId: userId || 'session',
        title: cleanTitle,
        productType,
        retailPrice,
        baseCost: activeBase.baseCost,
        colorHex: garmentHex,
        previewUrl: artworkUrl,
      },
      ...prev,
    ]);
    setSyncMsg('Added to Printify Catalog (Sign in to commit to Firebase)');
  };

  const removeListing = async (id: string) => {
    setStoreListings((prev) => prev.filter((s) => s.id !== id));
    if (userId) {
      deletePrintifyItem(id).catch(() => {});
    }
  };

  const exportMockupPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `vortex-printify-${productType}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <PlateBezel accent="red" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="w-4 h-4 text-[#FF0A3C]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5E9EA]" style={{ fontFamily: 'var(--font-display)' }}>
            Printify Studio · Custom Print &amp; Fulfillment
          </h2>
        </div>
        <LedStatusIndicator
          label={`${syncMsg} · +$${creatorProfit.toFixed(2)} Margin`}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <canvas ref={canvasRef} width={640} height={500} className="w-full max-w-[420px] aspect-[64/50] rounded-[14px]" />
        </div>

        <div className="space-y-4">
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
            <label className="space-y-1 font-mono text-xs text-[#F5E9EA]/80">
              <span>Product Title</span>
              <input
                type="text"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                className="w-full rounded-full bg-[#070304] px-3.5 py-2 text-xs text-[#F5E9EA] focus:outline-none"
              />
            </label>
            <label className="space-y-1 font-mono text-xs text-[#F5E9EA]/80">
              <span>Retail ($) · Base ${activeBase.baseCost}</span>
              <input
                type="number"
                min={activeBase.baseCost + 1}
                max={250}
                value={retailPrice}
                onChange={(e) => setRetailPrice(Math.max(activeBase.baseCost, Number(e.target.value)))}
                className="w-full rounded-full bg-[#070304] px-3.5 py-2 text-xs text-[#F5E9EA] tabular-nums focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#F5E9EA]/70">Base Color</span>
              {['#14080A', '#2B1510', '#5E0E1C', '#F5E9EA'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setGarmentHex(hex)}
                  aria-label={`Color ${hex}`}
                  className={`w-6 h-6 rounded-full cursor-pointer ${
                    garmentHex === hex ? 'ring-2 ring-[#FF0A3C]' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#F5E9EA]/70">Scale</span>
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-[#2B1F21] to-[#080405] font-mono text-xs text-[#F5E9EA]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Art</span>
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

            <HardwareButton size="sm" tone="red" active onClick={publishToPrintify}>
              <Plus className="w-3.5 h-3.5" />
              <span>Publish to Printify</span>
            </HardwareButton>

            <HardwareButton size="sm" tone="cyan" active onClick={exportMockupPng}>
              <Download className="w-3.5 h-3.5" />
              <span>Export Mockup</span>
            </HardwareButton>
          </div>
        </div>
      </div>

      {storeListings.length > 0 && (
        <div className="space-y-2.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#F5E9EA]/60 block">
            Printify Cloud Catalog ({storeListings.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {storeListings.map((item) => (
              <div key={item.id} className="candy-trace-tile p-3 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.previewUrl && (
                    <img src={item.previewUrl} alt={item.title} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-[#F5E9EA] truncate">{item.title}</div>
                    <div className="font-mono text-[11px] text-[#FF5E7E] tabular-nums">
                      ${item.retailPrice.toFixed(2)} · +${(item.retailPrice - item.baseCost).toFixed(2)}
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

const STREAM_DESTINATIONS = [
  'Vortex Live Portal',
  'Short-Form Feed',
  'Broadcast Channel',
  'Creator Social Mesh',
  'AirRadio Cast',
  'Chrome Relay',
];

export function LiveBroadcastStreamPage({ fallbackBackdropUrl }: { fallbackBackdropUrl: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [camActive, setCamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [bannerText, setBannerText] = useState('LIVE · VORTEX · KAYA STAGE');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([STREAM_DESTINATIONS[0]]);
  const [statusMsg, setStatusMsg] = useState('Camera Standby');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let pass = 0;
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = fallbackBackdropUrl;

    const renderFrame = (now: number) => {
      pass += 1;
      const canvas = compositeCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#050304';
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

          ctx.fillStyle = 'rgba(8, 3, 4, 0.78)';
          ctx.fillRect(24, h - 72, w - 48, 44);
          ctx.fillStyle = '#F5E9EA';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(bannerText || 'VORTEX LIVE', 42, h - 44);

          stampUnifiedCanvasWatermark(ctx, w, h, { passToken: pass, opacity: 0.5 });
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
      setStatusMsg('Camera Stopped');
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
      setStatusMsg('LIVE CAMERA ACTIVE');
    } catch {
      setStatusMsg('Virtual Stage active (camera permission unavailable).');
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
    streamRef.current?.getAudioTracks().forEach((t) => stream.addTrack(t));
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      setRecordedUrl(URL.createObjectURL(blob));
      setStatusMsg('Live Recording Ready');
    };
    rec.start(200);
    recorderRef.current = rec;
    setRecording(true);
    setStatusMsg('RECORDING LIVE SCENE…');
  };

  const triggerSocialShare = async () => {
    const summary = `${bannerText} · Targets: ${selectedTargets.join(', ')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VORTEX · KAYA Live', text: summary, url: window.location.href });
        setStatusMsg('Shared stream');
        return;
      } catch {
        // ignored
      }
    }
    navigator.clipboard?.writeText(summary).catch(() => {});
    setStatusMsg('Stream manifest copied.');
  };

  return (
    <PlateBezel accent="cyan" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Video className="w-4 h-4 text-[#FF0A3C]" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#F5E9EA]" style={{ fontFamily: 'var(--font-display)' }}>
            Live Scene Camera &amp; Multi-Channel Stream
          </h2>
        </div>
        <LedStatusIndicator label={statusMsg} tone={recording ? 'red' : camActive ? 'emerald' : 'cyan'} pulse={recording} />
      </div>

      <video ref={videoRef} muted playsInline className="hidden" />
      <canvas ref={compositeCanvasRef} width={960} height={540} className="w-full aspect-video max-h-[380px] rounded-[14px]" />

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1 font-mono text-xs text-[#F5E9EA]/80">
            <span>On-Air Lower-Third Overlay</span>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="w-full rounded-full bg-[#070304] px-4 py-2 text-xs text-[#F5E9EA] focus:outline-none"
            />
          </label>
          <div className="space-y-1">
            <span className="font-mono text-xs text-[#F5E9EA]/80 block">Simulcast Destinations</span>
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
            <span>{camActive ? 'Stop Webcam' : 'Enable Camera & Mic'}</span>
          </HardwareButton>
          <HardwareButton size="sm" tone="red" active={recording} onClick={toggleRecord}>
            <Radio className="w-3.5 h-3.5" />
            <span>{recording ? 'Stop Recording' : 'Record Live Scene'}</span>
          </HardwareButton>
          <HardwareButton size="sm" tone="magenta" active onClick={triggerSocialShare}>
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Stream</span>
          </HardwareButton>
          {recordedUrl && (
            <a
              href={recordedUrl}
              download="vortex-live-scene.webm"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-[#3A1118] to-[#0B0305] font-mono text-xs text-[#F5E9EA]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Scene</span>
            </a>
          )}
        </div>
      </div>
    </PlateBezel>
  );
}
