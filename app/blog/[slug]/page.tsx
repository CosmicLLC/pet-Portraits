import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import LandingHeader from "@/components/LandingHeader";
import LandingFooterCTA from "@/components/LandingFooterCTA";
import { BLOG_POSTS, getBlogPost, listBlogPosts } from "@/lib/blog-posts";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      images: [
        { url: post.heroImage, width: 1200, height: 900, alt: post.heroAlt },
      ],
    },
  };
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com";

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    image: `${BASE_URL}${post.heroImage}`,
    author: { "@type": "Organization", name: "Paw Masterpiece" },
    publisher: {
      "@type": "Organization",
      name: "Paw Masterpiece",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.jpg` },
    },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${BASE_URL}/blog/${post.slug}`,
      },
    ],
  };

  const otherPosts = listBlogPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LandingHeader />

      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/blog" className="text-sm text-gray-500 hover:text-brand-green transition-colors inline-flex items-center gap-1.5 mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All posts
        </Link>

        <p className="text-[11px] uppercase tracking-widest text-brand-gold mb-3">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" · "}{post.readMinutes} min read
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-brand-green leading-tight mb-6">
          {post.title}
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">{post.description}</p>

        <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-cream mb-12">
          <Image
            src={post.heroImage}
            alt={post.heroAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>

        <div
          className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-brand-green prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-brand-green prose-a:underline prose-a:underline-offset-2 prose-strong:text-brand-green"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* CTA panel at end of article */}
        <div className="mt-14 p-6 rounded-3xl bg-brand-green/5 border border-brand-green/15 text-center">
          <p className="text-xs font-display font-semibold uppercase tracking-[0.18em] text-brand-gold mb-3">
            Ready to make one?
          </p>
          <h3 className="font-display text-2xl text-brand-green mb-4 leading-snug">
            Preview your pet's portrait free in 30 seconds.
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {post.ctaLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-brand-green text-cream px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </article>

      {/* Related posts */}
      {otherPosts.length > 0 && (
        <section className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-2xl text-brand-green mb-8">More from the blog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {otherPosts.map((other) => (
                <Link
                  key={other.slug}
                  href={`/blog/${other.slug}`}
                  className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3] bg-cream">
                    <Image
                      src={other.heroImage}
                      alt={other.heroAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base text-brand-green leading-snug">
                      {other.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <LandingFooterCTA />
    </main>
  );
}
