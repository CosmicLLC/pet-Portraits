import Link from "next/link"
import Image from "next/image"

// Minimal header for SEO landing pages — just logo + link back to the
// portrait creator. Keeps the landing page focused and crawlable without
// loading the whole client-side home shell.
export default function LandingHeader() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="Paw Masterpiece — custom pet portraits from photo" width={36} height={36} className="rounded-lg" />
          <span className="font-display text-lg text-brand-green font-semibold">
            Paw Masterpiece
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="hidden sm:inline-block text-sm text-gray-600 hover:text-brand-green transition-colors font-medium"
          >
            Products
          </Link>
          <Link
            href="/"
            className="bg-brand-green text-cream px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
          >
            Create Portrait
          </Link>
        </div>
      </div>
    </header>
  )
}
