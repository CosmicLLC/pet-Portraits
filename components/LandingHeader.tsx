"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useSession, signOut } from "next-auth/react"

// Sitewide landing header. Modeled on Crown & Paw's nav structure but
// keeps Paw Masterpiece's brand language (cream / brand-green / brand-gold,
// Cormorant display font). Two mega-menu dropdowns — "Custom Pet Portraits"
// and "Gifts" — show image thumbnails instead of emoji and each item
// links to a dedicated content page (no /start?style=X shortcuts in the
// menu). Tools migrated to the footer. A Father's Day promo bar sits
// above the header to drive seasonal traffic to /gifts/fathers-day.

type NavItem = {
  label: string
  href: string
  image: string
  alt: string
  blurb: string
}

// Custom Pet Portraits → the 4 SEO style pages. Slugs verified against
// lib/seo-data.ts STYLE_SEO. Each /styles/<slug> page is pre-rendered
// at build time with 1,200+ words of style-specific content.
const PORTRAIT_LINKS: NavItem[] = [
  {
    label: "Watercolor",
    href: "/styles/watercolor-pet-portrait",
    image: "/examples/watercolor.png",
    alt: "Watercolor pet portrait example",
    blurb: "Soft, dreamy, gift-friendly",
  },
  {
    label: "Oil Painting",
    href: "/styles/oil-painting-pet-portrait",
    image: "/examples/oil.png",
    alt: "Oil painting pet portrait example",
    blurb: "Rich, classical, museum-style",
  },
  {
    label: "Renaissance",
    href: "/styles/renaissance-pet-portrait",
    image: "/examples/renaissance.png",
    alt: "Renaissance pet portrait example",
    blurb: "Royal robes, regal humor",
  },
  {
    label: "Line Art",
    href: "/styles/line-art-pet-portrait",
    image: "/examples/lineart.png",
    alt: "Line art pet portrait example",
    blurb: "Clean, modern, minimalist",
  },
]

// Gifts → dedicated occasion pages (lib/gift-occasions.ts). heroImage
// values mirrored here so the dropdown thumbnail matches the destination
// page's hero. Memorial uses /memorial (its own standalone page).
const GIFT_LINKS: NavItem[] = [
  {
    label: "For Dog Moms",
    href: "/gifts/dog-mom-gift",
    image: "/examples/watercolor.png",
    alt: "Dog mom gift — watercolor portrait",
    blurb: "Watercolor is the top-gifted style",
  },
  {
    label: "Mother's Day",
    href: "/gifts/mothers-day",
    image: "/ads/mothers-day-renaissance-reveal-v1.png",
    alt: "Mother's Day pet portrait gift reveal",
    blurb: "Quick + framed + lands on time",
  },
  {
    label: "Father's Day",
    href: "/gifts/fathers-day",
    image: "/examples/oil.png",
    alt: "Father's Day pet portrait gift — oil painting",
    blurb: "Oil painting belongs in a man cave",
  },
  {
    label: "Christmas",
    href: "/gifts/christmas",
    image: "/examples/renaissance.png",
    alt: "Christmas pet portrait gift — renaissance painting",
    blurb: "Renaissance — the conversation piece",
  },
  {
    label: "Birthday",
    href: "/gifts/birthday",
    image: "/examples/lineart.png",
    alt: "Birthday pet portrait gift — line art",
    blurb: "Minimalist line art, fast turnaround",
  },
  {
    label: "Memorial Portrait",
    href: "/memorial",
    image: "/examples/watercolor.png",
    alt: "Memorial pet portrait — gentle watercolor",
    blurb: "Gentle, painterly, no rush",
  },
]

export default function LandingHeader() {
  return (
    <>
      <FathersDayPromoBar />
      <HeaderNav />
    </>
  )
}

// ── Promo bar ───────────────────────────────────────────────────────
// Brand-green strip above the nav. Dismissible (localStorage), and
// auto-hides client-side past the Father's Day order-by cutoff so the
// bar doesn't go stale if we forget to remove it. The dismiss key is
// scoped to "fathers_day_2026" so future promo bars don't inherit it.

const PROMO_DISMISS_KEY = "promo_dismissed_fathers_day_2026"
const PROMO_CUTOFF = new Date("2026-06-17T00:00:00Z") // hide after Jun 16

function FathersDayPromoBar() {
  // Default to visible so the SSR + first paint matches the marketing
  // intent. Client effect hides it if dismissed OR past the cutoff.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (Date.now() >= PROMO_CUTOFF.getTime()) {
      setVisible(false)
      return
    }
    try {
      if (localStorage.getItem(PROMO_DISMISS_KEY) === "1") {
        setVisible(false)
      }
    } catch {
      // localStorage can throw in private mode — fail open (show).
    }
  }, [])

  if (!visible) return null

  return (
    <div className="bg-brand-green text-cream text-xs sm:text-sm relative z-40">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-3 text-center">
        <span aria-hidden="true">🐾</span>
        <span>
          Order by{" "}
          <span className="font-semibold text-brand-gold">June 16</span> for
          Father&apos;s Day delivery —{" "}
          <Link
            href="/gifts/fathers-day"
            className="underline underline-offset-2 hover:text-brand-gold font-semibold"
          >
            Shop dog dad gifts →
          </Link>
        </span>
        <button
          onClick={() => {
            try {
              localStorage.setItem(PROMO_DISMISS_KEY, "1")
            } catch {
              // localStorage blocked — still hide for this session.
            }
            setVisible(false)
          }}
          aria-label="Dismiss promotion"
          className="ml-2 flex-shrink-0 text-cream/70 hover:text-cream transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Header nav ──────────────────────────────────────────────────────

function HeaderNav() {
  const [open, setOpen] = useState<"portraits" | "gifts" | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)

  // Close any open dropdown on outside click or Esc
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  return (
    <header ref={navRef} className="bg-white border-b border-gray-100 relative z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <Image src="/logo.jpg" alt="Paw Masterpiece" width={36} height={36} className="rounded-lg" />
          <span className="font-display text-lg text-brand-green font-semibold">
            Paw Masterpiece
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <DropdownTrigger
            label="Custom Pet Portraits"
            isOpen={open === "portraits"}
            onToggle={() => setOpen(open === "portraits" ? null : "portraits")}
          />
          <DropdownTrigger
            label="Gifts"
            isOpen={open === "gifts"}
            onToggle={() => setOpen(open === "gifts" ? null : "gifts")}
          />
          <Link
            href="/wallpaper"
            className="ml-1 flex items-center gap-1.5 text-sm text-brand-gold font-display font-semibold hover:bg-brand-gold/10 px-3 py-2 rounded-full border border-brand-gold/30 transition-colors"
          >
            📱 Wallpapers · $0.99
          </Link>
          <Link
            href="/reviews"
            className="text-sm text-gray-600 hover:text-brand-green hover:bg-gray-50 px-3 py-2 rounded-full transition-colors font-medium"
          >
            Reviews
          </Link>
          <Link
            href="/start"
            className="ml-2 bg-brand-green text-cream px-5 py-2.5 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
          >
            Start Now
          </Link>
          <AuthMenu />
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="md:hidden p-2 rounded-lg text-brand-green hover:bg-gray-50 transition-colors"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Desktop mega-menu — full-width strip below the header bar */}
      {open && (
        <div className="hidden md:block absolute top-full inset-x-0 bg-white border-b border-gray-100 shadow-lg animate-fade-in-up">
          <div className="max-w-6xl mx-auto px-4 py-7">
            {open === "portraits" && (
              <MegaMenu
                items={PORTRAIT_LINKS}
                gridCols="grid-cols-2 md:grid-cols-4"
                aspect="aspect-[4/5]"
                onClick={() => setOpen(null)}
              />
            )}
            {open === "gifts" && (
              <MegaMenu
                items={GIFT_LINKS}
                gridCols="grid-cols-2 md:grid-cols-3"
                aspect="aspect-[4/3]"
                onClick={() => setOpen(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile menu — vertical accordion */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 space-y-1">
            <MobileSection
              label="Custom Pet Portraits"
              items={PORTRAIT_LINKS}
              onClick={() => setMobileOpen(false)}
            />
            <MobileSection
              label="Gifts"
              items={GIFT_LINKS}
              onClick={() => setMobileOpen(false)}
            />
            <Link
              href="/wallpaper"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-brand-gold/10 text-brand-gold font-display font-semibold"
            >
              <span>📱 Phone Wallpapers</span>
              <span className="text-xs opacity-70">$0.99</span>
            </Link>
            <Link
              href="/reviews"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
            >
              Reviews
            </Link>
            <Link
              href="/start"
              onClick={() => setMobileOpen(false)}
              className="block text-center mt-3 bg-brand-green text-cream py-3 rounded-full text-sm font-display font-semibold"
            >
              Start Now — Free Preview
            </Link>
            <MobileAuthSection onClose={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  )
}

function DropdownTrigger({
  label,
  isOpen,
  onToggle,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={isOpen}
      className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full transition-colors ${
        isOpen
          ? "text-brand-green bg-brand-green/10"
          : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
      }`}
    >
      {label}
      <svg
        className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

// ── Mega-menu panel ─────────────────────────────────────────────────
// Image-on-top card grid. Image aspect varies per dropdown (4:5 for
// portraits feels gallery-poster-like, 4:3 for gifts reads more like
// a product card). next/image keeps the thumbnails lazy + responsive.

function MegaMenu({
  items,
  gridCols,
  aspect,
  onClick,
}: {
  items: NavItem[]
  gridCols: string
  aspect: string
  onClick: () => void
}) {
  return (
    <div className={`grid ${gridCols} gap-4 sm:gap-5`}>
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          onClick={onClick}
          className="group block"
        >
          <div
            className={`${aspect} rounded-xl overflow-hidden bg-cream mb-2 border border-gray-100 group-hover:border-brand-green/40 transition-colors`}
          >
            <Image
              src={item.image}
              alt={item.alt}
              width={240}
              height={300}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          </div>
          <p className="font-display text-sm font-semibold text-brand-green leading-tight">
            {item.label}
          </p>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">{item.blurb}</p>
        </Link>
      ))}
    </div>
  )
}

// ── Mobile accordion section ───────────────────────────────────────
// Thumbnail next to each label instead of emoji — matches the desktop
// mega-menu visual treatment.

// ── Auth menu (desktop) ─────────────────────────────────────────────
// Avatar dropdown when signed in (My Account / Admin Dashboard / Sign
// Out); plain Sign In link when not. Lives inside the desktop nav so
// every public page has the same auth affordance, not just the home
// page. Self-contained — uses its own outside-click handler scoped via
// data-auth-menu so it doesn't fight the parent nav's outside-click
// logic (which targets the nav ref, not arbitrary buttons).

function AuthMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-auth-menu]")) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="ml-1 text-sm text-gray-600 hover:text-brand-green hover:bg-gray-50 px-3 py-2 rounded-full transition-colors font-medium"
      >
        Sign In
      </Link>
    )
  }

  const user = session.user
  const isAdmin = (user as { role?: string })?.role === "admin"
  const initial = (user?.name ?? user?.email ?? "U")[0]?.toUpperCase() ?? "U"

  return (
    <div className="relative ml-1" data-auth-menu>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-brand-green/40 transition-all"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Avatar"}
            width={30}
            height={30}
            className="rounded-full"
          />
        ) : (
          <span className="w-[30px] h-[30px] rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs font-bold">
            {initial}
          </span>
        )}
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.name ?? "My Account"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            My Account
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-green hover:bg-brand-green/5 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              setOpen(false)
              signOut({ callbackUrl: "/" })
            }}
            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Auth section (mobile) ──────────────────────────────────────────
// Rendered inside the mobile accordion. Same affordances as the
// desktop avatar dropdown but vertical-list shaped to match the
// surrounding accordion sections.

function MobileAuthSection({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin"

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {session ? (
        <>
          <div className="px-3 py-1 text-xs text-gray-400 truncate">
            {session.user?.email}
          </div>
          <Link
            href="/account/orders"
            onClick={onClose}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            My Account
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-brand-green hover:bg-brand-green/5 font-medium"
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => {
              onClose()
              signOut({ callbackUrl: "/" })
            }}
            className="w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </>
      ) : (
        <Link
          href="/auth/signin"
          onClick={onClose}
          className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
        >
          Sign In
        </Link>
      )}
    </div>
  )
}

function MobileSection({
  label,
  items,
  onClick,
}: {
  label: string
  items: NavItem[]
  onClick: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
      >
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="pl-3 space-y-0.5 mt-1">
          {items.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onClick}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cream text-gray-700 text-sm"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-gray-100">
                <Image
                  src={item.image}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold text-brand-green leading-tight">
                  {item.label}
                </p>
                <p className="text-[11px] text-gray-500 leading-snug truncate">{item.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
