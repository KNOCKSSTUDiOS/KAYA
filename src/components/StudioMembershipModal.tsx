import React, { useState } from 'react';
import { X, Crown, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';

export type MembershipTierKey =
  | 'free'
  | 'beginner'
  | 'ultra'
  | 'pro'
  | 'enterprise_business';

export type BillingCycleKey = 'monthly' | 'yearly';

export interface StudioSubscriptionState {
  tier: MembershipTierKey;
  billingCycle: BillingCycleKey;
  addons: string[];
}

interface StudioMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: StudioSubscriptionState;
  onUpdateSubscription: (next: StudioSubscriptionState) => void;
}

const TIERS: {
  key: MembershipTierKey;
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  tone: 'neutral' | 'cyan' | 'magenta' | 'red';
  perks: string[];
}[] = [
  {
    key: 'free',
    title: 'Free Tier',
    monthlyPrice: '$0 / mo',
    yearlyPrice: '$0 / yr',
    tone: 'neutral',
    perks: ['720p HD Video Export', '2D Flat & Regular 3D', 'KAYA AirRadio + School'],
  },
  {
    key: 'beginner',
    title: 'Beginner',
    monthlyPrice: '$9 / mo',
    yearlyPrice: '$86 / yr',
    tone: 'cyan',
    perks: ['1080p 60fps Cinema', 'Real HD & Real Cartoon 3D', 'Smart Voice Commands'],
  },
  {
    key: 'ultra',
    title: 'Ultra',
    monthlyPrice: '$19 / mo',
    yearlyPrice: '$182 / yr',
    tone: 'magenta',
    perks: ['4K UHD HDR 60fps', 'Mesh 3D + Motion Trails', 'Creator Merch Storefront'],
  },
  {
    key: 'pro',
    title: 'Pro',
    monthlyPrice: '$39 / mo',
    yearlyPrice: '$374 / yr',
    tone: 'red',
    perks: ['Action Fight Animator', 'Raytrace PBR + Rust 3D', 'Live Camera Broadcast'],
  },
  {
    key: 'enterprise_business',
    title: 'Enterprise Business',
    monthlyPrice: '$99 / mo',
    yearlyPrice: '$950 / yr',
    tone: 'red',
    perks: ['All 19 Render Engines', 'Cinemax 4K + Alpha PNGs', 'Desktop .GLB & Commercial POD'],
  },
];

const ADDONS: { id: string; label: string; monthly: string; yearly: string }[] = [
  { id: 'mesh_pack', label: 'Mesh 3D, Rust & Telemetry Pack', monthly: '+$9/mo', yearly: '+$86/yr' },
  { id: 'fight_rig', label: 'Action Clash & Combat FX Pack', monthly: '+$12/mo', yearly: '+$115/yr' },
  { id: 'merch_hub', label: 'Creator Print Store & AirRadio Pro', monthly: '+$14/mo', yearly: '+$134/yr' },
];

export function StudioMembershipModal({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
}: StudioMembershipModalProps) {
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const cycle: BillingCycleKey = subscription.billingCycle || 'monthly';

  const triggerSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const selectTier = (tier: MembershipTierKey) => {
    onUpdateSubscription({ ...subscription, billingCycle: cycle, tier });
    triggerSaved();
  };

  const selectBilling = (nextCycle: BillingCycleKey) => {
    onUpdateSubscription({ ...subscription, billingCycle: nextCycle });
    triggerSaved();
  };

  const toggleAddon = (id: string) => {
    const exists = subscription.addons.includes(id);
    const nextAddons = exists
      ? subscription.addons.filter((a) => a !== id)
      : [...subscription.addons, id];
    onUpdateSubscription({ ...subscription, billingCycle: cycle, addons: nextAddons });
    triggerSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-6xl my-auto" onClick={(e) => e.stopPropagation()}>
        <PlateBezel accent="red" className="p-4 sm:p-6 space-y-5 bg-[#020203]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-[#FF3B5C] shrink-0" />
              <div>
                <h2
                  className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  KAYA Studio Membership &amp; Pro Modules
                </h2>
                <p className="font-mono text-[11px] text-[#E6ECF5]/60">
                  Free · Beginner · Ultra · Pro · Enterprise Business (Month &amp; Year)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {savedNotice && <LedStatusIndicator label="Plan Saved" tone="emerald" />}

              <HardwareButton
                size="sm"
                tone="cyan"
                active={cycle === 'monthly'}
                onClick={() => selectBilling('monthly')}
              >
                <span>Monthly</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                tone="magenta"
                active={cycle === 'yearly'}
                onClick={() => selectBilling('yearly')}
              >
                <span>Yearly (-20%)</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="red"
                ledIndicator={false}
                onClick={onClose}
                aria-label="Close plans modal"
              >
                <X className="w-4 h-4" />
              </HardwareButton>
            </div>
          </div>

          {/* 5 Membership Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TIERS.map((tier) => {
              const active = subscription.tier === tier.key;
              const priceText = cycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
              return (
                <div
                  key={tier.key}
                  className={`cnc-recess rounded-[10px] p-4 flex flex-col justify-between gap-4 border ${
                    active ? 'border-[#00E5FF]' : 'border-white/15'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3
                        className="text-sm font-bold uppercase tracking-wider text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {tier.title}
                      </h3>
                      <span className="font-mono text-sm font-bold text-[#00E5FF] tabular-nums block">
                        {priceText}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {tier.perks.map((perk) => (
                        <li
                          key={perk}
                          className="flex items-start gap-1.5 font-mono text-[11px] text-[#E6ECF5]/80"
                        >
                          <Check className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <HardwareButton
                    size="sm"
                    fullWidth
                    tone={tier.tone}
                    active={active}
                    onClick={() => selectTier(tier.key)}
                  >
                    <span>{active ? 'Active Plan' : `Select ${tier.title}`}</span>
                  </HardwareButton>
                </div>
              );
            })}
          </div>

          {/* Paid Engine Add-Ons */}
          <div className="cnc-recess rounded-[8px] p-4 space-y-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white font-semibold">
              <Sparkles className="w-4 h-4 text-[#FF64B8]" />
              <span>Optional Paid Studio Modules &amp; Expansion Packs</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {ADDONS.map((addon) => {
                const enabled = subscription.addons.includes(addon.id);
                return (
                  <HardwareButton
                    key={addon.id}
                    size="sm"
                    fullWidth
                    tone="magenta"
                    active={enabled}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <span className="truncate">{addon.label}</span>
                    <span className="text-[11px] text-[#FF64B8] tabular-nums shrink-0">
                      {cycle === 'yearly' ? addon.yearly : addon.monthly}
                    </span>
                  </HardwareButton>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#E6ECF5]/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              100% local workstation subscription profile ({cycle === 'yearly' ? 'Annual' : 'Monthly'} billing).
            </span>
            <HardwareButton size="sm" tone="cyan" active onClick={onClose}>
              <span>Done</span>
            </HardwareButton>
          </div>
        </PlateBezel>
      </div>
    </div>
  );
}
