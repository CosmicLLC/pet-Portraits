import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Paw Masterpiece",
  description: "Terms of service for Paw Masterpiece. Read our policies on payments, refunds, and intellectual property.",
};

export default function TermsPage() {
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
          <h1 className="font-display text-4xl text-brand-green mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-400">Last updated: April 17, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">1. Agreement</h2>
            <p>
              By using Paw Masterpiece (operated by Cosmic Company LLC), you agree to these Terms of
              Service. If you do not agree, please do not use our service. Questions? Contact us at{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline">
                cosmic.company.llc@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">2. Service Description</h2>
            <p>
              Paw Masterpiece is an AI-powered service that transforms your pet&apos;s photo into a
              fine art portrait using various artistic styles (watercolor, oil painting, Renaissance,
              pencil/line art, and others). You may preview a watermarked version of your portrait
              for free. To receive the full-resolution, unwatermarked portrait file, a purchase is
              required.
            </p>
            <p className="mt-3">
              Portrait previews are available for up to 24 hours. We reserve the right to modify,
              discontinue, or update the service at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">3. Payment Terms</h2>
            <p>
              All prices are displayed in USD and are charged at the time of purchase. Payments are
              processed securely by Stripe, Inc. By completing a purchase, you authorize us to charge
              the displayed amount to your chosen payment method.
            </p>
            <p className="mt-3">
              Current products and pricing:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Digital Download</strong> — high-resolution portrait file delivered by email</li>
              <li><strong>Phone Wallpaper Pack</strong> — portrait optimized for mobile screens</li>
              <li><strong>Display Print (11×14)</strong> — fine art print on backing board, bagged ready to frame, shipped within the United States</li>
              <li><strong>Mounted Print (11×14)</strong> — fine art print with window mount and backing board, shipped within the United States</li>
              <li><strong>Framed Canvas Print (8×12)</strong> — gallery-quality framed canvas shipped within the United States</li>
              <li><strong>Canvas + Digital Bundle</strong> — framed canvas plus the digital download file</li>
            </ul>
            <p className="mt-3">
              Prices are subject to change without notice. The price shown at the time of purchase
              is the price you will be charged.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">4. Refund Policy &amp; Free Regeneration Guarantee</h2>
            <p>
              We want you to love your portrait. If you are not satisfied with the quality of your
              generated portrait, we offer a{" "}
              <strong className="text-brand-green">free regeneration guarantee</strong>: contact us
              within 7 days of purchase at{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline">
                cosmic.company.llc@gmail.com
              </a>{" "}
              and we will regenerate your portrait at no additional cost.
            </p>
            <p className="mt-3">
              Because digital products are delivered immediately upon payment and cannot be
              &quot;returned,&quot; we generally do not offer cash refunds. However, we handle
              each case individually — if you have a legitimate concern, please reach out and we
              will work with you to find a fair resolution.
            </p>
            <p className="mt-3">
              For canvas prints, if your print arrives damaged or defective, contact us within 14
              days with a photo of the damage and we will arrange a replacement or refund at our
              discretion.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">5. Intellectual Property</h2>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Your Photos</h3>
            <p>
              You retain full ownership of any photos you upload. By uploading a photo, you grant
              us a limited, non-exclusive license to process that photo solely to generate your
              portrait. We do not use your photos for any other purpose, including advertising or
              model training, without your explicit consent.
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Your Portrait</h3>
            <p>
              Upon purchase and delivery of your portrait, you receive a personal license to use the
              portrait for non-commercial purposes (printing, sharing, display, personal gifts, etc.).
              You may not resell, sublicense, or use the portrait for commercial purposes (merchandise,
              stock licensing, commercial advertising) without written permission from Cosmic Company LLC.
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Our Service</h3>
            <p>
              All software, design, branding, and non-user content of Paw Masterpiece remains the
              exclusive property of Cosmic Company LLC.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Upload photos that contain people without their consent</li>
              <li>Upload illegal, obscene, or harmful content</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the service</li>
              <li>Use the service for any unlawful purpose</li>
            </ul>
            <p className="mt-3">
              We reserve the right to refuse service or cancel orders that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of any kind, express or
              implied. AI-generated portraits are unique and may vary in quality depending on the
              input photo. We do not guarantee any specific artistic result, though we stand behind
              our free regeneration guarantee.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Cosmic Company LLC shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from your
              use of the service. Our total liability to you for any claim arising from these terms
              or your use of the service shall not exceed the amount you paid for the specific
              transaction giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United States. Any disputes will be
              resolved through good-faith negotiation before any formal proceedings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the service after
              changes constitutes acceptance of the new terms. The &quot;Last updated&quot; date
              reflects when changes were made.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">11. Contact</h2>
            <p>
              Questions about these Terms?{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline font-medium">
                cosmic.company.llc@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="hover:text-brand-green transition-colors">← Home</Link>
          <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy →</Link>
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
            <a href="mailto:cosmic.company.llc@gmail.com" className="hover:text-brand-green transition-colors">
              cosmic.company.llc@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
