import type { MetadataRoute } from "next"
import { allProgrammaticUrls } from "@/lib/seo-data"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

const now = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

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

  return [...staticEntries, ...programmatic]
}
