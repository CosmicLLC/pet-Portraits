import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  BREEDS,
  STYLE_SEO,
  styleBySlug,
  breedBySlug,
} from "@/lib/seo-data"
import LandingHeader from "@/components/LandingHeader"
import LandingHero from "@/components/LandingHero"
import LandingFooterCTA from "@/components/LandingFooterCTA"

interface Props {
  params: { breed: string; style: string }
}

// Generate all breed × style combinations at build time — 21 breeds × 4
// styles = 84 static pages, all crawlable and indexable on first deploy.
export function generateStaticParams() {
  const combos: { breed: string; style: string }[] = []
  for (const breed of BREEDS) {
    for (const style of Object.values(STYLE_SEO)) {
      combos.push({ breed: breed.slug, style: style.slug })
    }
  }
  return combos
}

export function generateMetadata({ params }: Props): Metadata {
  const breed = breedBySlug(params.breed)
  const style = styleBySlug(params.style)
  if (!breed || !style) return {}

  const title = `Custom ${breed.displayName} ${style.shortName} Portrait from Photo`
  const description = `Turn your ${breed.displayName} into a ${style.shortName.toLowerCase()} masterpiece in 30 seconds. ${breed.description.slice(0, 100).trim()}…`

  return {
    title,
    description,
    alternates: {
      canonical: `/pet-portrait/${breed.slug}/${style.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/pet-portrait/${breed.slug}/${style.slug}`,
      images: [{ url: style.image, width: 900, height: 1200, alt: `${style.fullName} example` }],
    },
  }
}

export default function BreedStylePage({ params }: Props) {
  const breed = breedBySlug(params.breed)
  const style = styleBySlug(params.style)
  if (!breed || !style) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

  // Related links: same breed in other styles, same style in other breeds
  const otherStyles = Object.values(STYLE_SEO).filter((s) => s.slug !== style.slug)
  const otherBreeds = BREEDS.filter((b) => b.pet === breed.pet && b.slug !== breed.slug).slice(0, 6)

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: breed.pet === "dog" ? "Dogs" : "Cats",
        item: `${baseUrl}/pet-portraits/${breed.pet === "dog" ? "dogs" : "cats"}`,
      },
      { "@type": "ListItem", position: 3, name: breed.displayName, item: `${baseUrl}/pet-portrait/${breed.slug}/${style.slug}` },
      { "@type": "ListItem", position: 4, name: style.shortName, item: `${baseUrl}/pet-portrait/${breed.slug}/${style.slug}` },
    ],
  }

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Custom ${breed.displayName} ${style.shortName} Portrait`,
    description: `Turn a photo of your ${breed.displayName} into a ${style.shortName.toLowerCase()} portrait. ${style.description}`,
    brand: { "@type": "Brand", name: "Paw Masterpiece" },
    image: `${baseUrl}${style.image}`,
    offers: {
      "@type": "Offer",
      price: "19.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/pet-portrait/${breed.slug}/${style.slug}`,
    },
  }

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LandingHeader />

      <LandingHero
        eyebrow={`${style.shortName} ${breed.displayName} Portraits`}
        headline={`Custom ${breed.displayName} ${style.shortName} Portrait from Your Photo`}
        subhead={`Upload any photo of your ${breed.displayName} and watch it transform into a gallery-quality ${style.shortName.toLowerCase()} portrait in about 30 seconds.`}
        previewImage={style.image}
        previewAlt={`${style.fullName} example — custom AI ${breed.displayName} ${style.shortName.toLowerCase()} portrait from photo`}
      />

      {/* Unique breed + style content */}
      <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              Why {breed.displayName}s make incredible {style.shortName.toLowerCase()} portraits
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {breed.description}
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mt-4">
              {breed.coatNote} {style.description}
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              What photo works best?
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              For a {breed.displayName}, aim for a head-and-shoulders shot in natural daylight. Their {breed.traits.slice(0, 2).join(" and ")} expression usually comes through best when they're relaxed at home, not posed. Phone snapshots work fine — our AI doesn't need a studio photo.
            </p>
          </div>

          <div>
            <h2 className="font-display text-3xl text-brand-green mb-4">
              A {breed.displayName} gift that actually gets hung on the wall
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              Most custom pet gifts end up in a drawer. A {style.shortName.toLowerCase()} portrait of someone's {breed.displayName} doesn't — it becomes the story they tell when friends visit. Perfect for {style.gift}.
            </p>
          </div>
        </div>
      </section>

      {/* Other styles for this breed */}
      <section className="py-16 bg-cream">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-brand-green mb-3 text-center">
            Other styles for your {breed.displayName}
          </h2>
          <p className="text-center text-gray-500 mb-8">Same breed, different vibe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherStyles.map((s) => (
              <Link
                key={s.slug}
                href={`/pet-portrait/${breed.slug}/${s.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={s.image}
                    alt={`${s.fullName} example — ${breed.displayName} ${s.shortName.toLowerCase()} portrait from photo`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-display font-bold text-xl drop-shadow">{breed.displayName} — {s.shortName}</p>
                    <p className="text-xs opacity-90">{s.tagline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related breeds in same style — internal link juice */}
      {otherBreeds.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-3xl text-brand-green mb-3 text-center">
              Other {breed.pet === "dog" ? "dogs" : "cats"} in {style.shortName.toLowerCase()}
            </h2>
            <p className="text-center text-gray-500 mb-8">Explore the same style on related breeds.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {otherBreeds.map((b) => (
                <Link
                  key={b.slug}
                  href={`/pet-portrait/${b.slug}/${style.slug}`}
                  className="text-sm text-gray-600 hover:text-brand-green hover:bg-brand-green/5 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                >
                  {b.displayName}
                </Link>
              ))}
            </div>
            <p className="text-center mt-6">
              <Link
                href={`/styles/${style.slug}`}
                className="text-sm text-brand-green font-display font-semibold hover:underline"
              >
                See all {style.shortName} portraits →
              </Link>
            </p>
          </div>
        </section>
      )}

      <LandingFooterCTA headline={`Create a ${style.shortName.toLowerCase()} portrait of your ${breed.displayName}`} />
    </main>
  )
}
