"use client";

import { useCallback, useEffect, useState } from "react";

// Post-purchase claim form for the Mother's Day free-display-print offer,
// shown only on digital-only orders. Polls /api/orders/bonus-status on
// mount to wait for the Stripe webhook to materialize the Order row,
// then either renders the address form or a "claimed" state. Physical
// orders hit this poll too but come back ineligible (they already got
// the bonus auto-fulfilled), so this component just renders nothing.

interface BonusStatus {
  order: { id: string; productType: string; claimed: boolean } | null;
  eligible?: boolean;
  bonusProductType?: string | null;
}

interface Props {
  sessionId: string;
}

type View =
  | { kind: "loading" }
  | { kind: "ineligible" }
  | { kind: "form" }
  | { kind: "submitting" }
  | { kind: "claimed" }
  | { kind: "error"; message: string };

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export default function ClaimFreePrint({ sessionId }: Props) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [postalCode, setPostalCode] = useState("");

  // Poll bonus-status until the webhook has materialized the order.
  // Cap at ~20s of polling; after that the claim form still works if the
  // order eventually lands, but we stop showing the loading spinner.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/bonus-status?session_id=${encodeURIComponent(sessionId)}`);
        if (!res.ok) {
          if (!cancelled) setView({ kind: "ineligible" });
          return;
        }
        const data: BonusStatus = await res.json();
        if (cancelled) return;

        if (data.order?.claimed) {
          setView({ kind: "claimed" });
          return;
        }
        if (data.order && data.eligible) {
          setView({ kind: "form" });
          return;
        }
        if (data.order && !data.eligible) {
          // Order exists but it's a physical order (auto-fulfilled) or
          // outside the campaign window — nothing to show.
          setView({ kind: "ineligible" });
          return;
        }
        // Order not yet created — webhook pending. Retry.
        if (attempts < 10) {
          setTimeout(poll, 2000);
        } else {
          setView({ kind: "ineligible" });
        }
      } catch {
        if (!cancelled) setView({ kind: "ineligible" });
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setView({ kind: "submitting" });
    try {
      const res = await fetch("/api/orders/claim-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name,
          address: { line1, line2, city, state, postalCode, country: "US" },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setView({ kind: "error", message: data.error || "Claim failed" });
        return;
      }
      setView({ kind: "claimed" });
    } catch (err) {
      setView({ kind: "error", message: err instanceof Error ? err.message : "Claim failed" });
    }
  }, [sessionId, name, line1, line2, city, state, postalCode]);

  if (view.kind === "ineligible") return null;

  if (view.kind === "loading") {
    return (
      <div className="bg-white rounded-3xl border-2 border-brand-gold/30 shadow-sm p-6 mb-8 animate-fade-in-up">
        <p className="text-sm text-gray-500 text-center">Checking your free Mother&apos;s Day gift…</p>
      </div>
    );
  }

  if (view.kind === "claimed") {
    return (
      <div className="bg-brand-green/5 border-2 border-brand-green/20 rounded-3xl p-6 mb-8 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center flex-shrink-0 text-2xl">
            🎁
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-0.5">
              Your gift is confirmed
            </p>
            <h2 className="font-display text-lg text-brand-green font-semibold leading-snug mb-1">
              Free 11×14 display print on its way.
            </h2>
            <p className="text-sm text-gray-500">
              We&apos;re printing your portrait on fine art paper and shipping it to the address you entered. Ships in 3–5 business days. Happy Mother&apos;s Day!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // form or submitting or error
  const submitting = view.kind === "submitting";
  return (
    <div className="bg-white rounded-3xl border-2 border-brand-gold/40 shadow-lg p-6 mb-8 animate-fade-in-up">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0 text-2xl">
          🎁
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-0.5">
            Mother&apos;s Day gift — on us
          </p>
          <h2 className="font-display text-lg text-brand-green font-semibold leading-snug mb-1">
            Claim your FREE 11×14 display print.
          </h2>
          <p className="text-sm text-gray-500">
            We&apos;ll print your portrait on fine art paper and ship it to your door — no extra cost. Enter where to send it.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Input label="Full name" value={name} onChange={setName} required placeholder="Jane Doe" />
        <Input label="Street address" value={line1} onChange={setLine1} required placeholder="123 Main St" />
        <Input label="Apt / unit (optional)" value={line2} onChange={setLine2} placeholder="Apt 4B" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value={city} onChange={setCity} required placeholder="San Francisco" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <Input label="ZIP" value={postalCode} onChange={setPostalCode} required placeholder="94107" />

        {view.kind === "error" && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {view.message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-green text-white py-3 rounded-xl font-display font-semibold text-sm hover:bg-brand-green/90 transition-all disabled:opacity-60"
        >
          {submitting ? "Claiming…" : "Ship My FREE Print"}
        </button>
        <p className="text-[11px] text-gray-400 text-center">
          One free print per order. Ships within the United States only.
        </p>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
      />
    </div>
  );
}
