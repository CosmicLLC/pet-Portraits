// Prodigi print-on-demand client.
// Docs: https://www.prodigi.com/print-api/docs/reference/

const SANDBOX_BASE = "https://api.sandbox.prodigi.com/v4.0";
const LIVE_BASE = "https://api.prodigi.com/v4.0";

export type ProdigiAddress = {
  line1: string;
  line2?: string;
  postalOrZipCode: string;
  countryCode: string; // ISO-2, e.g. "US"
  townOrCity: string;
  stateOrCounty?: string; // 2-letter state for US
};

export type ProdigiRecipient = {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: ProdigiAddress;
};

export type CreateProdigiOrderInput = {
  merchantReference: string;
  sku: string;
  imageUrl: string;
  copies?: number;
  recipient: ProdigiRecipient;
  shippingMethod?: "Budget" | "Standard" | "Express" | "Overnight";
};

export type ProdigiOrderResponse = {
  outcome: string; // "Created" | "CreatedWithIssues" | ...
  order: {
    id: string;
    created: string;
    status: {
      stage: string; // "InProgress" | "Complete" | "Cancelled"
      issues?: unknown[];
      details?: Record<string, unknown>;
    };
    shipments?: Array<{
      id: string;
      carrier?: { name?: string; service?: string };
      tracking?: { number?: string; url?: string };
      status?: string;
    }>;
  };
};

export function isProdigiConfigured(): boolean {
  return Boolean(process.env.PRODIGI_API_KEY && process.env.PRODIGI_CANVAS_SKU);
}

function getBaseUrl(): string {
  return process.env.PRODIGI_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function getCanvasSku(): string {
  const sku = process.env.PRODIGI_CANVAS_SKU;
  if (!sku) throw new Error("PRODIGI_CANVAS_SKU not set");
  return sku;
}

export async function createProdigiOrder(
  input: CreateProdigiOrderInput
): Promise<ProdigiOrderResponse> {
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) throw new Error("PRODIGI_API_KEY not set");

  const payload = {
    merchantReference: input.merchantReference,
    shippingMethod: input.shippingMethod ?? "Standard",
    recipient: input.recipient,
    items: [
      {
        merchantReference: input.merchantReference,
        sku: input.sku,
        copies: input.copies ?? 1,
        sizing: "fillPrintArea",
        assets: [{ printArea: "default", url: input.imageUrl }],
      },
    ],
  };

  const res = await fetch(`${getBaseUrl()}/Orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as ProdigiOrderResponse | { message?: string } | null;

  if (!res.ok) {
    const msg =
      (data as { message?: string } | null)?.message ??
      `Prodigi request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ProdigiOrderResponse;
}

export async function getProdigiOrder(orderId: string): Promise<ProdigiOrderResponse> {
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) throw new Error("PRODIGI_API_KEY not set");

  const res = await fetch(`${getBaseUrl()}/Orders/${orderId}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!res.ok) throw new Error(`Prodigi fetch failed (${res.status})`);
  return (await res.json()) as ProdigiOrderResponse;
}

// Extract tracking info from a Prodigi order response (first shipment with tracking wins).
export function extractTracking(order: ProdigiOrderResponse["order"]) {
  const shipments = order.shipments ?? [];
  for (const s of shipments) {
    if (s.tracking?.number) {
      return {
        carrier: s.carrier?.name ?? null,
        trackingNumber: s.tracking.number,
        trackingUrl: s.tracking.url ?? null,
      };
    }
  }
  return { carrier: null, trackingNumber: null, trackingUrl: null };
}
