import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { PET_CATEGORIES, petCategoryBySlug, STYLE_SEO, BREEDS } from "@/lib/seo-data"
import LandingHeader from "@/components/LandingHeader"
import LandingHero from "@/components/LandingHero"
import LandingFooterCTA from "@/components/LandingFooterCTA"

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return Object.keys(PET_CATEGORIES).map((slug) => ({ slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const cat = petCategoryBySlug(params.slug)
  if (!cat) return {}
  const title = `Custom ${cat.singular.charAt(0).toUpperCase() + cat.singular.slice(1)} Portraits from Photo | Hand-Finished ${cat.singular.charAt(0).toUpperCase() + cat.singular.slice(1)} Paintings`
  const description = cat.description
  return {
    title,
    description,
    alternates: { canonical: `/pet-portraits/${cat.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/pet-portraits/${cat.slug}`,
    },
  }
}

export default function PetCategoryPage({ params }: Props) {
  const cat = petCategoryBySlug(params.slug)
  if (!cat) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"
  const breedsInCategory = BREEDS.filter((b) => b.pet === cat.singular)

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Pet Portraits", item: `${baseUrl}/pet-portraits/${cat.slug}` },
      { "@type": "ListItem", position: 3, name: cat.plural.charAt(0).toUpperCase() + cat.plural.slice(1), item: `${baseUrl}/pet-portraits/${cat.slug}` },
    ],
  }

  return (
    <main className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <LandingHeader />

      <LandingHero
        eyebrow={`Custom ${cat.plural} portraits`}
        headline={cat.headline}
        subhead={cat.description}
        previewImage={cat.singular === "cat" ? "/examples/watercolor.png" : "/examples/oil.png"}
        previewAlt={`Custom ${cat.singular} portrait from photo — ${cat.singular} painting example`}
      />

      {/* Style showcase for this pet type */}
      <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-brand-green mb-3 text-center">
            Four styles to choose from
          </h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Every style works beautifully for {cat.plural}. Pick the one that matches your home — or your gift recipient's personality.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.values(STYLE_SEO).map((s) => (
              <Link
                key={s.slug}
                href={`/styles/${s.slug}`}
                className="group block relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm ring-1 ring-gray-100"
              >
                <Image
                  src={s.image}
                  alt={`${s.fullName} example — custom ${s.shortName.toLowerCase()} ${cat.singular} portrait from photo`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-display font-bold text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">{s.shortName}</p>
                  <p className="text-sm opacity-95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{s.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Breed directory — internal links to programmatic matrix */}
      {breedsInCategory.length > 0 && (
        <section className="py-16 bg-cream">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-3xl text-brand-green mb-3 text-center">
              {cat.plural.charAt(0).toUpperCase() + cat.plural.slice(1)} by breed
            </h2>
            <p className="text-center text-gray-500 mb-8">Find portraits tuned to your breed.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {breedsInCategory.map((b) => (
                <Link
                  key={b.slug}
                  href={`/pet-portrait/${b.slug}/watercolor-pet-portrait`}
                  className="block bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md hover:border-brand-green/30 transition-all"
                >
                  <p className="font-display font-semibold text-brand-green text-sm">
                    {b.displayName}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <LandingFooterCTA headline={`Create your ${cat.singular}'s portrait`} />
    </main>
  )
}
