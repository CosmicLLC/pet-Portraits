"use client"

import { useEffect } from "react"

// Drives two scroll-linked behaviors used across the landing page:
//
//   1. Fade-up reveal on `.reveal` (single block) and `.reveal-stagger`
//      (children animate sequentially). Both toggle `.visible` once when they
//      first enter the viewport via IntersectionObserver.
//
//   2. Subtle parallax on `[data-parallax="<speed>"]`. Speed is a float
//      multiplier (e.g. 0.15 = move 15% of scroll distance in the opposite
//      direction). Writes to the `--parallax-y` custom property so the CSS
//      transform reads cleanly.
//
// Respects prefers-reduced-motion via CSS; this hook still attaches but the
// visible effect is suppressed.
export default function ScrollRevealInit() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // --- Reveal observer ---
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => el.classList.add("visible"))
    }

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible")
                observer?.unobserve(entry.target)
              }
            }
          },
          { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        )
      : null

    const revealAll = () => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.visible), .reveal-stagger:not(.visible)")
        .forEach((el) => {
          const r = el.getBoundingClientRect()
          // If already in-view at mount, reveal immediately — no above-the-fold flash
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.classList.add("visible")
          } else {
            observer?.observe(el)
          }
        })
    }

    revealAll()

    const mo = new MutationObserver(() => revealAll())
    mo.observe(document.body, { childList: true, subtree: true })

    // --- Parallax loop (skipped for reduced-motion users) ---
    let rafId: number | null = null
    let ticking = false

    const updateParallax = () => {
      ticking = false
      const viewportH = window.innerHeight
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0.15")
        const rect = el.getBoundingClientRect()
        // Distance from the element's vertical center to the viewport's center
        const elCenter = rect.top + rect.height / 2
        const viewportCenter = viewportH / 2
        const delta = elCenter - viewportCenter
        const y = -(delta * speed)
        el.style.setProperty("--parallax-y", `${y.toFixed(2)}px`)
      })
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(updateParallax)
    }

    if (!reducedMotion) {
      updateParallax()
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onScroll, { passive: true })
    }

    return () => {
      observer?.disconnect()
      mo.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return null
}
