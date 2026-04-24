import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { listBlogPosts } from "@/lib/blog-posts";

const PAGE_TITLE = "Pet Portrait Blog — Tips, Stories, Gift Guides";
const PAGE_DESCRIPTION =
  "Pet portrait gift guides, photography tips, memorial advice, and the stories behind our most-loved customer commissions.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: "/blog",
  },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <LandingHeader />

      <section className="bg-cream border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-4">
            Paw Masterpiece Blog
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-green mb-5 leading-tight">
            Stories, gift guides, and pet portrait advice.
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            How to take a great phone photo of your pet, the best Mother's Day gift you can give a dog mom, and a gentle guide to memorial portraits.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[4/3] bg-cream">
                <Image
                  src={post.heroImage}
                  alt={post.heroAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="text-[11px] uppercase tracking-widest text-brand-gold mb-2">
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" · "}{post.readMinutes} min read
                </p>
                <h2 className="font-display text-xl text-brand-green mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {post.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <LandingFooterCTA />
    </main>
  );
}
