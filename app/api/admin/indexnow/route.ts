import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pingIndexNow } from "@/lib/indexnow"
import { logEvent } from "@/lib/events"
import { STYLE_SLUGS, allProgrammaticUrls } from "@/lib/seo-data"
import { GIFT_OCCASIONS } from "@/lib/gift-occasions"
import { BLOG_POSTS } from "@/lib/blog-posts"
import { COMPARISONS } from "@/lib/comparisons"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user?.role !== "admin") return null
  return session
}

// Admin-only endpoint: ping IndexNow with the FULL site URL set. Useful
// after a major deploy or first launch to nudge Bing/Yandex/ChatGPT-search
// to crawl everything fresh. For incremental updates the better pattern
// is to call pingIndexNow() from individual write paths (e.g. when a new
// blog post is created), but for a manual full sweep this is the button.
//
// GET — preview the URL set without submitting
// POST — actually submit to IndexNow
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const urls = buildAllSitemapUrls()
  return NextResponse.json({ count: urls.length, preview: urls.slice(0, 20) })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Optional body { urls: string[] } for targeted submission. Defaults
  // to the full sitemap when no body is provided.
  let urls: string[] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.urls)) urls = body.urls
  } catch {
    // No body — fall through to full sitemap
  }
  if (urls.length === 0) {
    urls = buildAllSitemapUrls()
  }
  const result = await pingIndexNow(urls)
  await logEvent(result.ok ? "info" : "warning", "admin", "IndexNow submission", {
    submitted: result.submitted,
    status: result.status,
    message: result.message,
  })
  return NextResponse.json(result)
}

// Re-derive the full URL set from the same data sources sitemap.ts uses.
// Keeping this in sync with sitemap.ts is important — we want IndexNow
// to know about everything Google can find.
function buildAllSitemapUrls(): string[] {
  const urls = new Set<string>([
    `${BASE_URL}/`,
    `${BASE_URL}/memorial`,
    `${BASE_URL}/reviews`,
    `${BASE_URL}/blog`,
    `${BASE_URL}/products`,
    `${BASE_URL}/how-it-works`,
    `${BASE_URL}/start`,
    `${BASE_URL}/wallpaper`,
    `${BASE_URL}/tools/breed-identifier`,
    `${BASE_URL}/free-photo-guide`,
    `${BASE_URL}/free-wallpaper`,
  ])
  for (const c of COMPARISONS) urls.add(`${BASE_URL}/vs/${c.slug}`)
  for (const o of GIFT_OCCASIONS) urls.add(`${BASE_URL}/gifts/${o.slug}`)
  for (const slug of STYLE_SLUGS) urls.add(`${BASE_URL}/styles/${slug}`)
  for (const p of BLOG_POSTS) urls.add(`${BASE_URL}/blog/${p.slug}`)
  for (const u of allProgrammaticUrls(BASE_URL)) urls.add(u)
  return Array.from(urls)
}
