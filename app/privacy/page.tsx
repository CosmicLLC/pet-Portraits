import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Paw Masterpiece",
  description: "Privacy policy for Paw Masterpiece. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
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
          <h1 className="font-display text-4xl text-brand-green mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: April 16, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">1. Who We Are</h2>
            <p>
              Paw Masterpiece is operated by Cosmic Company LLC. We create AI-powered fine art portraits
              from photos of your pet. If you have any questions about this policy, contact us at{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline">
                cosmic.company.llc@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Email Address</h3>
            <p>
              We collect your email address when you subscribe to our newsletter, enter it during
              checkout, or voluntarily provide it to receive your portrait. We use this to deliver
              your purchased portrait and send relevant updates or offers with your permission.
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Photos You Upload</h3>
            <p>
              When you upload a photo of your pet, we process it solely to generate your portrait.
              Photos are used transiently for AI generation and are not permanently stored on our
              servers beyond what is necessary to fulfill your order. We do not share, sell, or use
              your pet photos for any other purpose.
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Payment Information</h3>
            <p>
              We do not collect or store your payment card details. All payment processing is handled
              by Stripe, Inc., a PCI-DSS certified payment processor. Stripe&apos;s privacy policy
              is available at stripe.com/privacy. We receive only a confirmation of successful payment
              and basic metadata (e.g., order amount, product type).
            </p>

            <h3 className="font-semibold text-gray-700 mt-4 mb-2">Usage Data &amp; Cookies</h3>
            <p>
              We may use standard cookies and session storage to remember your preferences and
              maintain your session during the portrait creation flow. We may also collect standard
              web analytics (page views, referrer, device type) through first-party analytics.
              We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To generate and deliver your portrait</li>
              <li>To process your payment via Stripe</li>
              <li>To send your purchased portrait by email</li>
              <li>To send newsletter updates if you subscribed (you may unsubscribe anytime)</li>
              <li>To improve our service and troubleshoot issues</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to any third party.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">4. Data Sharing</h2>
            <p>We share data only with the following service providers who help us operate:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Google (Gemini API)</strong> — AI portrait generation (your uploaded photo is sent to Google&apos;s API to generate the portrait image)</li>
              <li><strong>Vercel</strong> — hosting and deployment</li>
            </ul>
            <p className="mt-3">
              All providers are contractually bound to protect your data and use it only for the
              purposes we specify.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">5. Data Retention</h2>
            <p>
              We retain your email address for as long as you remain subscribed to our newsletter.
              You can unsubscribe at any time via the link in any email we send. Uploaded pet photos
              are processed and deleted shortly after your portrait is generated — we do not maintain
              a permanent archive of your photos. Purchase records may be retained for up to 7 years
              for accounting and legal compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">6. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, or delete your
              personal data. To exercise any of these rights, contact us at{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline">
                cosmic.company.llc@gmail.com
              </a>{" "}
              and we will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">7. Security</h2>
            <p>
              We use HTTPS encryption for all data in transit and follow industry-standard practices
              to protect your information. However, no system is 100% secure — if you have concerns
              about a specific data interaction, please contact us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us data, please contact
              us to have it removed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy occasionally. Significant changes will be communicated
              via email (if you are subscribed) or by posting a notice on our site. The &quot;Last
              updated&quot; date at the top reflects when changes were last made.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-green mb-3">10. Contact Us</h2>
            <p>
              Questions or concerns about this policy? Reach us at:{" "}
              <a href="mailto:cosmic.company.llc@gmail.com" className="text-brand-green hover:underline font-medium">
                cosmic.company.llc@gmail.com
              </a>
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
            <a href="mailto:cosmic.company.llc@gmail.com" className="hover:text-brand-green transition-colors">
              cosmic.company.llc@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
