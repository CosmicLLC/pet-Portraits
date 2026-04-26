import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { STYLE_SEO, styleBySlug, STYLE_SLUGS, BREEDS } from "@/lib/seo-data"
import LandingHeader from "@/components/LandingHeader"
import LandingHero from "@/components/LandingHero"
import LandingFooterCTA from "@/components/LandingFooterCTA"

interface Props {
  params: { slug: string }
}

// Pre-render all 4 style landing pages at build time.
export function generateStaticParams() {
  return STYLE_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const style = styleBySlug(params.slug)
  if (!style) return {}
  const title = `${style.fullName} from Your Photo | Instant ${style.shortName} Pet Art`
  const description = `Turn any photo into a custom ${style.shortName.toLowerCase()} pet portrait in 30 seconds. ${style.description} Digital download or framed canvas.`
  return {
    title,
    description,
    alternates: { canonical: `/styles/${style.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/styles/${style.slug}`,
      images: [{ url: style.image, width: 900, height: 1200, alt: `${style.fullName} example` }],
    },
  }
}

export default function StyleLandingPage({ params }: Props) {
  const style = styleBySlug(params.slug)
  if (!style) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${style.fullName} from Photo`,
    description: style.description,
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${baseUrl}${style.image}`,
    offers: {
      "@type": "Offer",
      price: "19.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/styles/${style.slug}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "487",
    },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Styles", item: `${baseUrl}/styles/${style.slug}` },
      { "@type": "ListItem", position: 3, name: style.shortName, item: `${baseUrl}/styles/${style.slug}` },
    ],
  }

  const otherStyles = Object.values(STYLE_SEO).filter((s) => s.slug !== style.slug)

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <LandingHeader />

      <LandingHero
        eyebrow={`Custom ${style.shortName} Pet Portraits`}
        headline={`${style.fullName} from Your Photo`}
        subhead={`${style.description} Delivered instantly by email — printable at home or shipped as a framed canvas.`}
        previewImage={style.image}
        previewAlt={`${style.fullName} example — custom ${style.shortName.toLowerCase()} dog portrait from photo`}
      />

      {/* Deep content — why this style, what makes a good input, use cases */}
      <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              Why {style.shortName} for a pet portrait?
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {style.description}
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              The perfect gift for {style.gift}
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Pet lovers remember the first time someone treated their dog or cat like a person. A {style.shortName.toLowerCase()} portrait does exactly that — elevates a pet from the fridge photos to the gallery wall. Whether it's a birthday, a memorial, or just a Tuesday, this is a gift people actually hang.
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              How it works
            </h2>
            <ol className="space-y-4 text-gray-700 leading-relaxed text-lg list-decimal list-inside">
              <li>Upload any clear photo of your pet — no professional shots needed.</li>
              <li>Your {style.shortName.toLowerCase()} portrait is ready in about 30 seconds.</li>
              <li>Preview the result for free. Only pay if you love it.</li>
              <li>Download the full-resolution file instantly, or order a print or framed canvas — shipped within the United States in 3–5 business days.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Other styles — internal links */}
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-brand-green mb-8 text-center">
            Try a different style
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherStyles.map((s) => (
              <Link
                key={s.slug}
                href={`/styles/${s.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={s.image}
                    alt={`${s.fullName} example — custom ${s.shortName.toLowerCase()} pet portrait from photo`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-display font-bold text-xl drop-shadow">{s.shortName}</p>
                    <p className="text-xs opacity-90">{s.tagline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular breeds for this style — internal links to programmatic matrix */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl text-brand-green mb-3 text-center">
            {style.shortName} portraits by breed
          </h2>
          <p className="text-center text-gray-500 mb-8">Explore how this style looks on your pet's breed.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {BREEDS.map((b) => (
              <Link
                key={b.slug}
                href={`/pet-portrait/${b.slug}/${style.slug}`}
                className="text-sm text-gray-600 hover:text-brand-green hover:bg-brand-green/5 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
              >
                {b.displayName}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LandingFooterCTA headline={`Turn your pet into a ${style.shortName.toLowerCase()} masterpiece`} />
    </main>
  )
}
