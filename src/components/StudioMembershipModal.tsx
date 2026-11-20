import React, { useState } from 'react';
import { X, Crown, Check, Sparkles, ShieldCheck, CreditCard } from 'lucide-react';
import { PlateBezel, HardwareButton, LedStatusIndicator } from './HardwarePrimitives.js';
import { BillingCycle, TierKey, saveBillingRecord } from '../lib/firebase.js';

export type MembershipTierKey = TierKey;
export type BillingCycleKey = BillingCycle;

export interface StudioSubscriptionState {
  tier: TierKey;
  billingCycle: BillingCycle;
  provider?: 'stripe' | 'infinity_billing';
  addons: string[];
}

interface StudioMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  subscription: StudioSubscriptionState;
  onUpdateSubscription: (next: StudioSubscriptionState) => void;
}

const TIERS: {
  key: TierKey;
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
    perks: ['720p Studio Render', 'Infinity School Access', 'Unified Watermark'],
  },
  {
    key: 'beginner',
    title: 'Beginner',
    monthlyPrice: '$9 / mo',
    yearlyPrice: '$86 / yr',
    tone: 'cyan',
    perks: ['1080p 60fps Cinema', 'Blender Clearcoat Preview', 'Real-Time Voice Actions'],
  },
  {
    key: 'pro',
    title: 'Pro',
    monthlyPrice: '$24 / mo',
    yearlyPrice: '$230 / yr',
    tone: 'magenta',
    perks: ['4K HDR + Action Animator', 'Printify Storefront Sync', 'AirRadio Broadcast Mic'],
  },
  {
    key: 'ultra',
    title: 'Ultra',
    monthlyPrice: '$49 / mo',
    yearlyPrice: '$470 / yr',
    tone: 'red',
    perks: ['120fps Soul Opus 4.7', 'Valerius (V) Ten Galaxies', 'All 19 Render Engines'],
  },
  {
    key: 'business',
    title: 'Business',
    monthlyPrice: '$79 / mo',
    yearlyPrice: '$758 / yr',
    tone: 'magenta',
    perks: ['Team Employee Seats', 'Dedicated SQL & Cloud Sync', 'Priority Commercial POD'],
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    monthlyPrice: '$149 / mo',
    yearlyPrice: '$1,430 / yr',
    tone: 'red',
    perks: ['144fps Cryo-Boost Forge', 'Self-Hosted MCP Clusters', 'Custom Studio Licensing'],
  },
];

const ADDONS: { id: string; label: string; monthly: string; yearly: string }[] = [
  { id: 'soul_opus', label: 'Soul Cooling Forge Opus 4.7 Pack', monthly: '+$12/mo', yearly: '+$115/yr' },
  { id: 'blender_pro', label: 'Blender GLB & Shader Pro', monthly: '+$14/mo', yearly: '+$134/yr' },
  { id: 'printify_pod', label: 'Printify Commercial Fulfillment', monthly: '+$16/mo', yearly: '+$154/yr' },
];

export function StudioMembershipModal({
  isOpen,
  onClose,
  userId,
  subscription,
  onUpdateSubscription,
}: StudioMembershipModalProps) {
  const [provider, setProvider] = useState<'stripe' | 'infinity_billing'>(subscription.provider || 'stripe');
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const cycle: BillingCycle = subscription.billingCycle || 'monthly';

  const commitBilling = async (next: StudioSubscriptionState) => {
    onUpdateSubscription(next);
    setNotice('Processing billing sync…');
    try {
      await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: next.tier,
          billingCycle: next.billingCycle,
          provider: next.provider || provider,
        }),
      });
      if (userId) {
        await saveBillingRecord({
          userId,
          tier: next.tier,
          billingCycle: next.billingCycle,
          provider: next.provider || provider,
          status: 'active',
        });
        setNotice(`Committed to Cloud (${next.tier.toUpperCase()} · ${next.billingCycle})`);
      } else {
        setNotice(`Active Session Plan: ${next.tier.toUpperCase()} (${next.billingCycle})`);
      }
    } catch {
      setNotice(`Active Session Plan: ${next.tier.toUpperCase()}`);
    }
    setTimeout(() => setNotice(null), 2600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/92 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-6xl my-auto" onClick={(e) => e.stopPropagation()}>
        <PlateBezel accent="red" className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-[#FF0A3C] shrink-0" />
              <div>
                <h2
                  className="text-base sm:text-lg font-bold uppercase tracking-[0.16em] text-[#F5E9EA]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Studio Subscription Tiers · Soul Stripe &amp; Infinity Billing
                </h2>
                <p className="font-mono text-[11px] text-[#F5E9EA]/60">
                  Free · Beginner · Pro · Ultra · Business · Enterprise
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {notice && <LedStatusIndicator label={notice} tone="emerald" />}

              <HardwareButton
                size="sm"
                tone="red"
                active={provider === 'stripe'}
                onClick={() => setProvider('stripe')}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Soul · Stripe</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                tone="magenta"
                active={provider === 'infinity_billing'}
                onClick={() => setProvider('infinity_billing')}
              >
                <span>Infinity Billing</span>
              </HardwareButton>

              <HardwareButton
                size="sm"
                tone="cyan"
                active={cycle === 'monthly'}
                onClick={() => commitBilling({ ...subscription, billingCycle: 'monthly', provider })}
              >
                <span>Monthly</span>
              </HardwareButton>
              <HardwareButton
                size="sm"
                tone="magenta"
                active={cycle === 'yearly'}
                onClick={() => commitBilling({ ...subscription, billingCycle: 'yearly', provider })}
              >
                <span>Yearly (-20%)</span>
              </HardwareButton>

              <HardwareButton size="sm" tone="red" ledIndicator={false} onClick={onClose} aria-label="Close plans modal">
                <X className="w-4 h-4" />
              </HardwareButton>
            </div>
          </div>

          {/* All 6 Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {TIERS.map((tier) => {
              const active = subscription.tier === tier.key;
              const priceText = cycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
              return (
                <div
                  key={tier.key}
                  data-active={active}
                  className="candy-trace-tile p-4 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-wider text-[#F5E9EA]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {tier.title}
                      </h3>
                      <span className="font-mono text-sm font-bold text-[#FF5E7E] tabular-nums block">
                        {priceText}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-1.5 font-mono text-[11px] text-[#F5E9EA]/75">
                          <Check className="w-3.5 h-3.5 text-[#E06844] shrink-0 mt-0.5" />
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
                    onClick={() => commitBilling({ ...subscription, tier: tier.key, billingCycle: cycle, provider })}
                  >
                    <span>{active ? 'Active Plan' : `Select ${tier.title}`}</span>
                  </HardwareButton>
                </div>
              );
            })}
          </div>

          {/* Modules */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#F5E9EA] font-semibold">
              <Sparkles className="w-4 h-4 text-[#E06844]" />
              <span>Integrated Suite Extensions</span>
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
                    onClick={() => {
                      const nextAddons = enabled
                        ? subscription.addons.filter((a) => a !== addon.id)
                        : [...subscription.addons, addon.id];
                      commitBilling({ ...subscription, addons: nextAddons, provider });
                    }}
                  >
                    <span className="truncate">{addon.label}</span>
                    <span className="text-[11px] text-[#FF8C66] tabular-nums shrink-0">
                      {cycle === 'yearly' ? addon.yearly : addon.monthly}
                    </span>
                  </HardwareButton>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#F5E9EA]/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E06844]" />
              Billing via {provider === 'stripe' ? 'Soul · Stripe Checkout' : 'Infinity Billing'} ({cycle}).
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
