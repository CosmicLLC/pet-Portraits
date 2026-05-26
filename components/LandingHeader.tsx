"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

// Sitewide landing header. Every clickable destination routes to a page
// where the user can immediately start creating — no marketing scroll
// between landing and generation. Styles + Gifts are dropdowns that
// deep-link into /start?style={key} so the upload widget renders with
// the matching style pre-selected. Wallpaper is a prominent standalone
// button because it's the highest-velocity tripwire ($0.99).

const STYLE_LINKS = [
  { label: "Watercolor", href: "/start?style=watercolor", emoji: "🎨", blurb: "Soft, dreamy, gift-friendly" },
  { label: "Oil Painting", href: "/start?style=oil", emoji: "🖼️", blurb: "Rich, classical, museum-style" },
  { label: "Renaissance", href: "/start?style=renaissance", emoji: "👑", blurb: "Royal robes, regal humor" },
  { label: "Line Art", href: "/start?style=lineart", emoji: "✒️", blurb: "Clean, modern, minimalist" },
]

const GIFT_LINKS = [
  { label: "For Dog Moms", href: "/start?style=watercolor", emoji: "🌸", blurb: "Soft watercolor is the top-gifted style" },
  { label: "Mother's Day", href: "/start?style=watercolor", emoji: "💐", blurb: "Quick + framed + lands on time" },
  { label: "Father's Day", href: "/start?style=oil", emoji: "🍺", blurb: "Oil painting belongs in a man cave" },
  { label: "Christmas", href: "/start?style=renaissance", emoji: "🎄", blurb: "Renaissance — the conversation piece" },
  { label: "Birthday", href: "/start?style=lineart", emoji: "🎂", blurb: "Minimalist line art, fast turnaround" },
  { label: "Memorial Portrait", href: "/memorial", emoji: "🤍", blurb: "Gentle, painterly, no rush" },
]

const TOOL_LINKS = [
  { label: "Phone Wallpaper", href: "/wallpaper", emoji: "📱", blurb: "$0.99 — your pet on your home screen" },
  { label: "Free Breed Identifier", href: "/tools/breed-identifier", emoji: "🔍", blurb: "Upload a photo, AI tells you the breed" },
  { label: "Free Phone Wallpaper", href: "/free-wallpaper", emoji: "✨", blurb: "Watermarked wallpaper, free with email" },
  { label: "Free Photo Guide", href: "/free-photo-guide", emoji: "📸", blurb: "How to take the perfect pet photo" },
]

export default function LandingHeader() {
  const [open, setOpen] = useState<"styles" | "gifts" | "tools" | null>(null)
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
            label="Styles"
            isOpen={open === "styles"}
            onToggle={() => setOpen(open === "styles" ? null : "styles")}
          />
          <DropdownTrigger
            label="Gifts"
            isOpen={open === "gifts"}
            onToggle={() => setOpen(open === "gifts" ? null : "gifts")}
          />
          <DropdownTrigger
            label="Tools"
            isOpen={open === "tools"}
            onToggle={() => setOpen(open === "tools" ? null : "tools")}
          />
          <Link
            href="/wallpaper"
            className="ml-1 flex items-center gap-1.5 text-sm text-brand-gold font-display font-semibold hover:bg-brand-gold/10 px-3 py-2 rounded-full border border-brand-gold/30 transition-colors"
          >
            📱 Wallpaper · $0.99
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

      {/* Desktop dropdown panels — full-width strip below the header bar */}
      {open && (
        <div className="hidden md:block absolute top-full inset-x-0 bg-white border-b border-gray-100 shadow-lg animate-fade-in-up">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {open === "styles" && <DropdownPanel items={STYLE_LINKS} onClick={() => setOpen(null)} />}
            {open === "gifts" && <DropdownPanel items={GIFT_LINKS} onClick={() => setOpen(null)} />}
            {open === "tools" && <DropdownPanel items={TOOL_LINKS} onClick={() => setOpen(null)} />}
          </div>
        </div>
      )}

      {/* Mobile menu — vertical accordion takes over the viewport */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-4 space-y-1">
            <MobileSection label="Styles" items={STYLE_LINKS} onClick={() => setMobileOpen(false)} />
            <MobileSection label="Gifts" items={GIFT_LINKS} onClick={() => setMobileOpen(false)} />
            <MobileSection label="Tools" items={TOOL_LINKS} onClick={() => setMobileOpen(false)} />
            <Link
              href="/wallpaper"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-brand-gold/10 text-brand-gold font-display font-semibold"
            >
              <span>📱 Phone Wallpaper</span>
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

function DropdownPanel({
  items,
  onClick,
}: {
  items: Array<{ label: string; href: string; emoji: string; blurb: string }>
  onClick: () => void
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          onClick={onClick}
          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-cream transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-cream group-hover:bg-white flex items-center justify-center text-xl flex-shrink-0 transition-colors">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-semibold text-brand-green leading-tight mb-0.5">
              {item.label}
            </p>
            <p className="text-xs text-gray-500 leading-snug">{item.blurb}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function MobileSection({
  label,
  items,
  onClick,
}: {
  label: string
  items: Array<{ label: string; href: string; emoji: string; blurb: string }>
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cream text-gray-600 text-sm"
            >
              <span className="text-base">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
