import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <Link href="/">
            <span className="font-display text-2xl text-brand-green tracking-tight cursor-pointer">
              Pet Portraits
            </span>
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up">
          {/* Paw print icon */}
          <div className="flex justify-center mb-8">
            <svg
              className="w-24 h-24 text-brand-green opacity-80"
              viewBox="0 0 100 100"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Toes */}
              <ellipse cx="28" cy="20" rx="9" ry="11" />
              <ellipse cx="48" cy="14" rx="9" ry="11" />
              <ellipse cx="68" cy="14" rx="9" ry="11" />
              <ellipse cx="84" cy="22" rx="8" ry="10" />
              {/* Main pad */}
              <ellipse cx="56" cy="58" rx="24" ry="28" />
              {/* Inner small pads */}
              <ellipse cx="38" cy="45" rx="8" ry="9" fill="#FAF7F2" />
              <ellipse cx="56" cy="39" rx="8" ry="9" fill="#FAF7F2" />
              <ellipse cx="74" cy="45" rx="8" ry="9" fill="#FAF7F2" />
            </svg>
          </div>

          <p className="text-brand-green/50 font-display text-8xl font-bold mb-4 leading-none">
            404
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-brand-green mb-4">
            This page doesn&apos;t exist
          </h1>
          <p className="text-gray-500 text-lg mb-10 max-w-sm mx-auto">
            Looks like this paw print led nowhere. Let&apos;s get you back on track.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-green text-white px-10 py-4 rounded-full font-display font-semibold hover:bg-brand-green/90 transition-all hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
            {" "}&middot;{" "}
            <Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
            {" "}&middot;{" "}
            <a href="mailto:cosmic.company.llc@gmail.com" className="hover:text-brand-green transition-colors">
              cosmic.company.llc@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
