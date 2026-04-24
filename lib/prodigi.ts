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
  // SKU-specific attributes (frame color, wrap, etc). Required for some
  // product families like ECO-FRA-CAN (framed canvas).
  attributes?: Record<string, string>;
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
  return Boolean(process.env.PRODIGI_API_KEY);
}

function getBaseUrl(): string {
  return process.env.PRODIGI_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

// Map our internal product type to the Prodigi SKU env var.
// Bundle ships the framed canvas — its physical component == canvas.
const PRODUCT_SKU_ENV: Record<string, string> = {
  display: "PRODIGI_DISPLAY_SKU",
  mounted: "PRODIGI_MOUNTED_SKU",
  canvas: "PRODIGI_CANVAS_SKU",
  bundle: "PRODIGI_CANVAS_SKU",
  // 2026-04-24 expansion. Look up actual SKUs in the Prodigi catalog
  // (https://www.prodigi.com/products/) and paste into your env vars.
  canvas_16x20: "PRODIGI_CANVAS_16X20_SKU",
  gallery_set: "PRODIGI_GALLERY_SET_SKU",
  acrylic: "PRODIGI_ACRYLIC_SKU",
  metal: "PRODIGI_METAL_SKU",
  cards: "PRODIGI_CARDS_SKU",
  phone_case: "PRODIGI_PHONE_CASE_SKU",
  prism: "PRODIGI_PRISM_SKU",
  mug: "PRODIGI_MUG_SKU",
  pillow: "PRODIGI_PILLOW_SKU",
};

export function getProdigiSkuForProduct(productType: string): string {
  const envVar = PRODUCT_SKU_ENV[productType];
  if (!envVar) throw new Error(`No Prodigi SKU mapping for productType "${productType}"`);
  const sku = process.env[envVar];
  if (!sku) throw new Error(`${envVar} not set`);
  return sku;
}

export function isProdigiSkuConfigured(productType: string): boolean {
  const envVar = PRODUCT_SKU_ENV[productType];
  if (!envVar) return false;
  return Boolean(process.env[envVar]);
}

// Required SKU attributes for each product type. Display + mounted prints
// don't need attributes. Framed canvas (ECO-FRA-CAN) requires color + wrap —
// Prodigi rejects the order without them. New additions default to no
// attributes; when you pick a specific Prodigi SKU that requires them
// (e.g. a framed acrylic with color options), add the row here.
const PRODUCT_ATTRIBUTES: Record<string, Record<string, string>> = {
  display: {},
  mounted: {},
  canvas: { color: "black", wrap: "ImageWrap" },
  bundle: { color: "black", wrap: "ImageWrap" },
  canvas_16x20: { color: "black", wrap: "ImageWrap" },
  gallery_set: {},
  acrylic: {},
  metal: {},
  cards: {},
  phone_case: {},
  prism: {},
  mug: {},
  pillow: {},
};

export function getProdigiAttributesForProduct(productType: string): Record<string, string> {
  return PRODUCT_ATTRIBUTES[productType] ?? {};
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
        attributes: input.attributes ?? {},
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
