import type { MetadataRoute } from "next"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private + transactional surfaces out of the index. Crawlers
        // never need to see an order dashboard or the internal admin tools.
        disallow: ["/admin", "/admin/", "/account", "/account/", "/api/", "/unsubscribe", "/auth/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
