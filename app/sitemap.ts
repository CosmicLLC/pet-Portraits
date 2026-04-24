import type { MetadataRoute } from "next"
import { allProgrammaticUrls } from "@/lib/seo-data"
import { GIFT_OCCASIONS } from "@/lib/gift-occasions"
import { BLOG_POSTS } from "@/lib/blog-posts"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

const now = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/memorial`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  // Gift-occasion landing pages — campaign anchors + evergreen gift-search SEO
  const giftEntries: MetadataRoute.Sitemap = GIFT_OCCASIONS.map((o) => ({
    url: `${BASE_URL}/gifts/${o.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }))

  // Programmatic entries: /styles/[slug], /pet-portraits/[slug], and the
  // full breed × style matrix. Generated off a single data file so this
  // list stays in sync when new breeds or styles are added.
  const programmatic: MetadataRoute.Sitemap = allProgrammaticUrls(BASE_URL).map((url) => {
    const priority = url.includes("/styles/") || url.includes("/pet-portraits/") ? 0.8 : 0.6
    return {
      url,
      lastModified: now,
      changeFrequency: "monthly",
      priority,
    }
  })

  // Blog posts — each becomes its own indexable URL with the post's
  // publishedAt as lastModified for proper crawl scheduling.
  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticEntries, ...giftEntries, ...blogEntries, ...programmatic]
}
