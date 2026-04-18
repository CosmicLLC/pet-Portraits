"use client"

import { useEffect } from "react"

// Finds every element with the `.reveal` class and toggles `.visible` on it
// the first time it enters the viewport. Pairs with the CSS in globals.css,
// which handles the actual fade/slide transition. Staggering is done by
// existing `.reveal-delay-1/2/3` utility classes.
export default function ScrollRevealInit() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    )

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.visible)").forEach((el) => {
        const r = el.getBoundingClientRect()
        // If already in-view at mount, reveal immediately (no "flash of hidden" above the fold)
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("visible")
        } else {
          observer.observe(el)
        }
      })
    }

    revealAll()

    // Re-scan when Next.js router swaps out content or when components mount late
    const mo = new MutationObserver(() => revealAll())
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
