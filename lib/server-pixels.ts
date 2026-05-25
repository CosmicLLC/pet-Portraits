// Server-side conversion APIs for Meta + TikTok. Recovers attribution lost
// to iOS privacy + browser-pixel blockers — per Meta's own conversion-lift
// studies, advertisers adding CAPI on top of the pixel see a 13-19% lift in
// attributed conversions; pixel-only setups silently lose 20-40% of signal.
//
// Both providers gate on access tokens that aren't in NEXT_PUBLIC_* — that's
// intentional. These calls happen server-side from API routes only.
//
// Failure handling: every call is fire-and-forget with a console.warn on
// error. We never want a tracking failure to block a real customer's order
// completion or preview generation.

import crypto from "crypto";

// ── Identity hashing per Meta + TikTok spec ────────────────────────────────
// Both APIs require SHA-256 hashing of any PII (email, phone, name, IP).
// Normalize before hashing: lowercase, trim, no punctuation in phone numbers.
function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  return sha256(email.trim().toLowerCase());
}

function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  // Meta accepts unhashed IP; TikTok also accepts unhashed. We hash for Meta
  // consistency. Both APIs accept either format.
  return sha256(ip.trim());
}

// ── Shared user context — extract from a NextRequest ──────────────────────
// IP and User-Agent are the highest-leverage match keys after email. Pull
// them from the request headers when the event happens on a server route.
export interface UserContext {
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** Meta fbp cookie (set by client pixel). Use if available for best match. */
  fbp?: string | null;
  /** Meta fbc cookie (click ID). Use if available for ad-attribution match. */
  fbc?: string | null;
  /** TikTok ttp cookie (set by client pixel). */
  ttp?: string | null;
  /** TikTok ttclid (click ID from ad clicks). */
  ttclid?: string | null;
}

export function extractUserContext(req: {
  headers: { get(name: string): string | null };
}): UserContext {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  return {
    ip,
    userAgent: req.headers.get("user-agent"),
    fbp: cookies._fbp || null,
    fbc: cookies._fbc || null,
    ttp: cookies._ttp || null,
    ttclid: cookies.ttclid || null,
  };
}

// ── Meta Conversions API ──────────────────────────────────────────────────
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
// Endpoint: POST https://graph.facebook.com/v18.0/{PIXEL_ID}/events

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_TEST_CODE = process.env.META_CAPI_TEST_CODE;

export interface MetaEvent {
  /** Standard Meta event name. */
  eventName:
    | "Purchase"
    | "InitiateCheckout"
    | "AddToCart"
    | "ViewContent"
    | "Lead"
    | "CompleteRegistration"
    | "Subscribe";
  /** Unix seconds. Defaults to now. */
  eventTime?: number;
  /** Stable ID used by Meta to dedupe with client-side pixel events. */
  eventId?: string;
  /** Where the event happened — usually the success page URL or referrer. */
  eventSourceUrl?: string;
  /** USD value for value-based optimization. */
  value?: number;
  currency?: string;
  /** Product IDs / content IDs related to the event. */
  contentIds?: string[];
  contentName?: string;
  contentType?: "product" | "product_group";
  user: UserContext;
  /** Custom data parameters Meta passes through to the dashboard. */
  custom?: Record<string, unknown>;
}

export async function sendMetaEvent(event: MetaEvent): Promise<void> {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return;

  const userData: Record<string, unknown> = {};
  if (event.user.email) userData.em = [hashEmail(event.user.email)];
  if (event.user.ip) userData.client_ip_address = event.user.ip;
  if (event.user.userAgent) userData.client_user_agent = event.user.userAgent;
  if (event.user.fbp) userData.fbp = event.user.fbp;
  if (event.user.fbc) userData.fbc = event.user.fbc;

  const customData: Record<string, unknown> = { ...(event.custom || {}) };
  if (event.value !== undefined) customData.value = event.value;
  if (event.currency) customData.currency = event.currency;
  if (event.contentIds) customData.content_ids = event.contentIds;
  if (event.contentName) customData.content_name = event.contentName;
  if (event.contentType) customData.content_type = event.contentType;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime || Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(META_TEST_CODE ? { test_event_code: META_TEST_CODE } : {}),
  };

  try {
    const url = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[meta-capi] ${event.eventName} failed ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.warn("[meta-capi] network error:", err instanceof Error ? err.message : err);
  }
}

// ── TikTok Events API ─────────────────────────────────────────────────────
// Docs: https://business-api.tiktok.com/portal/docs?id=1771101303285761
// Endpoint: POST https://business-api.tiktok.com/open_api/v1.3/event/track/

const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const TIKTOK_EVENTS_TOKEN = process.env.TIKTOK_EVENTS_API_TOKEN;
const TIKTOK_TEST_ID = process.env.TIKTOK_EVENTS_TEST_ID;

export interface TikTokEvent {
  eventName:
    | "CompletePayment"
    | "InitiateCheckout"
    | "AddToCart"
    | "ViewContent"
    | "SubmitForm"
    | "Subscribe";
  eventTime?: number;
  eventId?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
  user: UserContext;
  custom?: Record<string, unknown>;
}

export async function sendTikTokEvent(event: TikTokEvent): Promise<void> {
  if (!TIKTOK_PIXEL_ID || !TIKTOK_EVENTS_TOKEN) return;

  const userData: Record<string, unknown> = {};
  if (event.user.email) userData.email = hashEmail(event.user.email);
  if (event.user.ip) userData.ip = hashIp(event.user.ip);
  if (event.user.userAgent) userData.user_agent = event.user.userAgent;
  if (event.user.ttp) userData.ttp = event.user.ttp;
  if (event.user.ttclid) userData.ttclid = event.user.ttclid;

  const properties: Record<string, unknown> = { ...(event.custom || {}) };
  if (event.value !== undefined) properties.value = event.value;
  if (event.currency) properties.currency = event.currency;
  if (event.contentId) {
    properties.contents = [
      { content_id: event.contentId, content_name: event.contentName || event.contentId },
    ];
  }

  const payload = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    ...(TIKTOK_TEST_ID ? { test_event_code: TIKTOK_TEST_ID } : {}),
    data: [
      {
        event: event.eventName,
        event_time: event.eventTime || Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        user: userData,
        properties,
        page: event.eventSourceUrl ? { url: event.eventSourceUrl } : undefined,
      },
    ],
  };

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": TIKTOK_EVENTS_TOKEN,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[tiktok-events] ${event.eventName} failed ${res.status}: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.warn("[tiktok-events] network error:", err instanceof Error ? err.message : err);
  }
}

// ── High-level helpers — one call sends to both providers ────────────────

export async function trackPurchaseServer(args: {
  email: string;
  value: number;
  currency?: string;
  orderId: string;
  productType?: string;
  user: UserContext;
  sourceUrl?: string;
}): Promise<void> {
  const user = { ...args.user, email: args.email };
  const baseEvent = {
    eventId: args.orderId,
    eventSourceUrl: args.sourceUrl,
    value: args.value,
    currency: args.currency || "USD",
    user,
  };
  await Promise.all([
    sendMetaEvent({
      ...baseEvent,
      eventName: "Purchase",
      contentIds: args.productType ? [args.productType] : undefined,
      contentType: "product",
      contentName: args.productType,
    }),
    sendTikTokEvent({
      ...baseEvent,
      eventName: "CompletePayment",
      contentId: args.productType,
      contentName: args.productType,
    }),
  ]);
}

export async function trackPreviewGeneratedServer(args: {
  imageId: string;
  style: string;
  user: UserContext;
  sourceUrl?: string;
}): Promise<void> {
  const baseEvent = {
    eventId: args.imageId,
    eventSourceUrl: args.sourceUrl,
    user: args.user,
  };
  await Promise.all([
    sendMetaEvent({
      ...baseEvent,
      // Meta treats "Lead" as the closest standard event for free preview
      // generation — it's a soft conversion signal Meta uses for lookalikes.
      eventName: "Lead",
      contentName: `${args.style}_portrait`,
      contentIds: [args.imageId],
      custom: { style: args.style },
    }),
    sendTikTokEvent({
      ...baseEvent,
      eventName: "ViewContent",
      contentId: args.imageId,
      contentName: `${args.style}_portrait`,
      custom: { style: args.style },
    }),
  ]);
}
