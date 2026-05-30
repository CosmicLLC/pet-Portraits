import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { verifyPrintToken } from "@/lib/print-token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// PUBLIC, unauthenticated proxy that streams a PRIVATE print asset to anonymous
// fetchers — specifically Prodigi's print lab and Replicate's upscaler, which
// fetch image URLs with no auth header and therefore 403 on a raw private blob
// URL. Access is gated by an HMAC token bound to the blob's pathname prefix
// (see lib/print-token), so it cannot be used as an open proxy: a caller needs
// a signature only our server can mint, and the prefix is allowlisted to the
// print-ready/ and portraits/ namespaces.
export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get("p") || ""
  const token = req.nextUrl.searchParams.get("token") || ""

  if (!verifyPrintToken(prefix, token)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Resolve the random-suffixed object under this prefix.
  const { blobs } = await list({ prefix })
  if (!blobs.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Stream the private blob through our server using the read-write token.
  const upstream = await fetch(blobs[0].url, {
    headers: process.env.BLOB_READ_WRITE_TOKEN
      ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      : {},
  })
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      // Cacheable by Prodigi/CDN; the token-bound URL is stable per asset.
      "Cache-Control": "public, max-age=3600",
    },
  })
}
