import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import PaymentPortalButton from "./PaymentPortalButton"

// Brand-name + last-4 for each saved card. Not sensitive enough to hide,
// but we don't store them — pulled live from Stripe at render time.
type SavedCard = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

async function loadCards(email: string): Promise<{ customerId: string | null; cards: SavedCard[] }> {
  const stripe = getStripe()
  // Find a Stripe customer with this email. We don't proactively create one
  // — that happens on first portal visit if they don't have one yet.
  const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })
  const customer = customers.data[0]
  if (!customer) return { customerId: null, cards: [] }

  const defaultPm =
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id ?? null

  const pms = await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 20 })
  const cards: SavedCard[] = pms.data
    .filter((pm) => pm.card)
    .map((pm) => ({
      id: pm.id,
      brand: pm.card!.brand,
      last4: pm.card!.last4,
      expMonth: pm.card!.exp_month,
      expYear: pm.card!.exp_year,
      isDefault: pm.id === defaultPm,
    }))

  return { customerId: customer.id, cards }
}

export default async function AccountPaymentPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/payment")

  let customerId: string | null = null
  let cards: SavedCard[] = []
  let stripeError: string | null = null
  try {
    const result = await loadCards(session.user.email)
    customerId = result.customerId
    cards = result.cards
  } catch (err) {
    console.error("Failed to load Stripe cards:", err)
    stripeError = "Could not load payment methods right now — please try again in a minute."
  }

  // Also give them a quick charge summary by counting paid orders — a simple
  // "you've spent $X with us" line feels friendly and cements the relationship.
  const orderAgg = await prisma.order.aggregate({
    where: { email: session.user.email.toLowerCase() },
    _sum: { priceCents: true },
    _count: true,
  })
  const totalSpent = (orderAgg._sum.priceCents ?? 0) / 100
  const orderCount = orderAgg._count

  return (
    <div className="space-y-6">
      {stripeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {stripeError}
        </div>
      )}

      {/* Lifetime summary */}
      {orderCount > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Lifetime with Paw Masterpiece
            </p>
            <p className="font-display text-xl text-brand-green mt-0.5">
              {orderCount} order{orderCount === 1 ? "" : "s"} · ${totalSpent.toFixed(2)}
            </p>
          </div>
          <svg className="w-10 h-10 text-brand-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )}

      {/* Saved cards list */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display text-lg font-semibold text-brand-green mb-4">
          Saved payment methods
        </h2>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">
            No cards saved yet. Your payment info at checkout is held securely by
            Stripe — nothing is stored on our servers.
          </p>
        ) : (
          <ul className="space-y-3 mb-5">
            {cards.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 rounded bg-white border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500 uppercase">
                    {c.brand}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      •••• {c.last4}
                      {c.isDefault && (
                        <span className="ml-2 text-[10px] font-semibold text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Expires {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <PaymentPortalButton hasCustomer={Boolean(customerId)} />
        <p className="text-xs text-gray-400 mt-3">
          Manage your cards securely on Stripe's hosted billing portal. We never see or store your card details.
        </p>
      </section>
    </div>
  )
}
