import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

// Shape of the shipping_address JSON we persist per order.
type StoredAddress = {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

function addressKey(name: string | null, a: StoredAddress): string {
  return [
    (name ?? "").toLowerCase().trim(),
    (a.line1 ?? "").toLowerCase().trim(),
    (a.line2 ?? "").toLowerCase().trim(),
    (a.city ?? "").toLowerCase().trim(),
    (a.state ?? "").toLowerCase().trim(),
    (a.postal_code ?? "").toLowerCase().trim(),
    (a.country ?? "").toLowerCase().trim(),
  ].join("|")
}

export default async function AccountAddressesPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/account/addresses")

  const orders = await prisma.order.findMany({
    where: {
      email: session.user.email.toLowerCase(),
      shippingAddress: { not: null as unknown as undefined },
    },
    select: {
      shippingName: true,
      shippingAddress: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  // Dedupe by full address + name. Keep the most recently used date.
  const byKey = new Map<
    string,
    { name: string | null; address: StoredAddress; lastUsed: Date }
  >()
  for (const o of orders) {
    const addr = (o.shippingAddress ?? null) as StoredAddress | null
    if (!addr || !addr.line1) continue
    const k = addressKey(o.shippingName ?? null, addr)
    const existing = byKey.get(k)
    if (!existing || o.createdAt > existing.lastUsed) {
      byKey.set(k, {
        name: o.shippingName ?? null,
        address: addr,
        lastUsed: o.createdAt,
      })
    }
  }
  const addresses = Array.from(byKey.values())

  if (addresses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">📍</div>
        <h2 className="font-display text-xl text-brand-green mb-2">No saved addresses</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          When you order a physical print, the shipping address you enter at
          checkout shows up here for easy reference.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-green text-white px-6 py-3 rounded-full text-sm font-display font-semibold hover:bg-brand-green/90 transition-colors"
        >
          Browse Prints
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Addresses you've shipped prints to. To update one, enter the new address
        at checkout on your next order — it'll save automatically.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((entry, i) => (
          <article
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            {entry.name && (
              <p className="font-display font-semibold text-brand-green mb-1">
                {entry.name}
              </p>
            )}
            <p className="text-sm text-gray-700">{entry.address.line1}</p>
            {entry.address.line2 && (
              <p className="text-sm text-gray-700">{entry.address.line2}</p>
            )}
            <p className="text-sm text-gray-700">
              {[entry.address.city, entry.address.state, entry.address.postal_code]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-sm text-gray-500 uppercase tracking-wide text-xs mt-1">
              {entry.address.country ?? "US"}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Last used {entry.lastUsed.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
