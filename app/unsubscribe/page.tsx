import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Unsubscribed — Paw Masterpiece",
  robots: { index: false, follow: false },
}

type Props = { searchParams: { status?: string; email?: string } }

export default function UnsubscribePage({ searchParams }: Props) {
  const status = searchParams.status
  const email = searchParams.email

  const isOk = status === "ok"

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-8 py-10 text-center">
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isOk ? "bg-brand-green/10" : "bg-red-50"}`}>
            {isOk ? (
              <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h1 className="font-display text-2xl text-brand-green mb-3">
            {isOk ? "You're unsubscribed" : "Invalid link"}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isOk ? (
              <>
                {email ? <strong className="text-gray-700">{email}</strong> : "This address"} will no longer receive marketing emails from Paw Masterpiece. You&apos;ll still get order receipts and transactional messages.
              </>
            ) : (
              <>This unsubscribe link is invalid or has expired. If you&apos;re still receiving unwanted emails, please reply to any of them and we&apos;ll remove you manually.</>
            )}
          </p>
          <Link href="/" className="text-sm text-brand-green hover:underline">
            Back to Paw Masterpiece
          </Link>
        </div>
      </div>
    </main>
  )
}
