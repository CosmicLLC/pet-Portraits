import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Returns a one-time URL to Stripe's hosted billing portal. If the signed-in
// user doesn't have a Stripe customer record yet (first-time visitor who
// hasn't bought anything), we create one with their email so the portal has
// something to show. Cards added there will be linked to this customer.
export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email.toLowerCase()
  const name = session.user.name ?? undefined
  const stripe = getStripe()

  try {
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer = existing.data[0] ?? (await stripe.customers.create({ email, name }))

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://pawmasterpiece.com"

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/account/payment`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error("Billing portal error:", err)
    // Most common cause: the billing portal isn't configured in the Stripe
    // dashboard yet. Give a helpful message instead of a raw 500.
    const message = err instanceof Error ? err.message : "Billing portal unavailable"
    return NextResponse.json(
      {
        error:
          /configuration/i.test(message)
            ? "The billing portal isn't fully set up in Stripe yet. Activate it at dashboard.stripe.com/settings/billing/portal."
            : message,
      },
      { status: 500 }
    )
  }
}
