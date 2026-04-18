import { prisma } from "@/lib/prisma"

type Result = { ok: true } | { ok: false; retryAfterSeconds: number }

// DB-backed sliding-window rate limit. Not free — each call costs one DB round-trip
// — so only use on expensive endpoints (e.g. /api/generate which hits Gemini).
// For higher volumes, swap for Upstash Ratelimit.
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<Result> {
  const now = new Date()
  const existing = await prisma.rateLimit.findUnique({ where: { key } }).catch(() => null)

  if (existing && existing.resetAt > now) {
    if (existing.count >= max) {
      const retryAfterSeconds = Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
      return { ok: false, retryAfterSeconds }
    }
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
    return { ok: true }
  }

  const resetAt = new Date(now.getTime() + windowSeconds * 1000)
  await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, resetAt },
    update: { count: 1, resetAt },
  })
  return { ok: true }
}

export function clientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim()
  return headers.get("x-real-ip") || "unknown"
}
