"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How long does it take?",
    a: "Almost instantly. Once you upload your photo and choose a style, your portrait is generated in 20–30 seconds.",
  },
  {
    q: "What photo works best?",
    a: "A clear, well-lit photo of your pet from the front works best. Make sure their face is fully visible and they're the primary subject. Natural lighting and a simple background give the best results.",
  },
  {
    q: "Can I get a refund if I'm not happy?",
    a: "Absolutely. We offer a 100% satisfaction guarantee. If you're not happy with your portrait, we'll redo it for free — or give you a full refund, no questions asked.",
  },
  {
    q: "What sizes are available?",
    a: "Digital downloads are full-resolution (300 DPI), suitable for printing at any size. Canvas prints are available in 8×10 inches — the perfect size for home display or gifting.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes! Canvas prints ship worldwide. Digital downloads are delivered instantly by email, anywhere in the world, within seconds of purchase.",
  },
  {
    q: "Can I request a custom style?",
    a: "We currently offer four styles: Watercolor, Oil Painting, Renaissance, and Line Art. Custom style requests are coming soon — email us at cosmic.company.llc@gmail.com if you have something specific in mind.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white border-t border-gray-100">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-green mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500">Everything you need to know before you order.</p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-xl overflow-hidden transition-colors ${
                open === i ? "border-brand-green/30 bg-brand-green/[0.02]" : "border-gray-200 bg-white"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              >
                <span className="font-display text-sm font-semibold text-gray-800 leading-snug">
                  {faq.q}
                </span>
                <svg
                  className={`w-4 h-4 text-brand-green flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
