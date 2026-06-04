import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Paw Masterpiece",
  description:
    "Refund, replacement, and store policies for Paw Masterpiece custom pet portraits: our love-it-or-we-redo-it guarantee, damaged-order replacements, cancellations, and promo codes.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <Link href="/">
            <h1 className="font-display text-2xl text-brand-green tracking-tight cursor-pointer">
              Paw Masterpiece
            </h1>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-brand-green hover:underline flex items-center gap-1.5 mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="font-display text-4xl text-brand-green mb-3">Refund Policy</h1>
          <p className="text-sm text-gray-400">Last updated: June 4, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Refunds &amp; Our Policies</h2>
            <p>
              Because of the customized nature of the products we create at Paw Masterpiece, we are
              unable to offer returns. Your portrait is crafted with care and is entirely personal
              to you and your pet, so all products are{" "}
              <strong className="text-brand-green">final sale</strong>.
            </p>
            <p className="mt-3">
              That said, your happiness is the whole point. If you are not delighted with your
              finished masterpiece, please get in touch — making sure you love the result is one of
              the things we care about most, and we will always work with you to make it right.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Love It or We Redo It — Free</h2>
            <p>
              If you are not happy with the quality of your portrait, contact us within{" "}
              <strong className="text-brand-green">7 days</strong> of purchase and we will recreate
              it at <strong className="text-brand-green">no additional cost</strong>. Tell us what
              you&apos;d like changed and we&apos;ll keep working with you until the artwork feels
              right.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Wrong or Damaged Orders</h2>
            <p>
              If you receive the wrong product, an incorrect size or print, or your order was
              damaged in transit, we will of course replace it without question. Please let us know
              within <strong className="text-brand-green">14 days</strong> of receiving your order
              and include a quick photo of the issue so we can make it right fast.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Cancellations &amp; Changes</h2>
            <p>
              If you&apos;ve just placed an order and changed your mind, you can cancel or change it
              within <strong className="text-brand-green">30 minutes</strong>. After 30 minutes,
              cancellation and change requests are granted at our discretion — the reason is that we
              begin creating your portrait and send physical prints to our print lab for production
              shortly after your order is placed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Your Photo Matters</h2>
            <p>
              When we create your artwork, we use the photo you upload with your order. It&apos;s
              your responsibility to submit a clear, high-quality photo that follows our photo tips —
              low-quality or blurry photos will result in lower-quality artwork, and in that case we
              cannot offer a solution beyond a fresh attempt.
            </p>
            <p className="mt-3">
              We also can&apos;t guarantee that every special request will be met — for example, we
              cannot change your pet&apos;s expression or pose, open or close a mouth, or add a
              smile. If something about the result isn&apos;t right, our free recreation guarantee
              is the best way for us to try again with your guidance.
            </p>
            <p className="mt-3">
              Please note that the examples shown on our site were all made from high-quality,
              high-resolution photos. Blurry or low-quality photos won&apos;t produce the same
              gallery-quality finish you see in our examples.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Digital Downloads</h2>
            <p>
              Digital products are delivered the moment your payment is complete and cannot be
              &quot;returned&quot; once sent, so they are non-refundable as a rule. As always, if you
              have a genuine concern we&apos;ll look at every case individually and work toward a
              fair resolution.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Promo Codes &amp; Store Policies</h2>
            <p>
              You may only use one promo code per order. Promo codes cannot be combined, are
              non-transferable, and may carry exemptions or requirements in order to be redeemed.
              Promo codes are subject to change at any time.
            </p>
            <p className="mt-3">
              Our free-shipping threshold is calculated on your merchandise subtotal{" "}
              <em>before</em> promo codes or account credits are applied. We&apos;re also unable to
              honor retroactive discounts — please enter the code you intend to use at the time of
              checkout.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">Get in Touch</h2>
            <p>
              For any return, replacement, cancellation, or question, email us with your order
              number (and a photo, if it&apos;s a damaged item):{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline font-medium">
                cosmic.company.llc@gmail.com
              </a>. We respond to every message, usually within 1–2 business days.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="hover:text-brand-green transition-colors">← Home</Link>
          <Link href="/terms" className="hover:text-brand-green transition-colors">Terms of Service →</Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Cosmic Company LLC &middot;{" "}
            <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
            {" "}&middot;{" "}
            <Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
            {" "}&middot;{" "}
            <Link href="/returns" className="hover:text-brand-green transition-colors">Returns</Link>
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
