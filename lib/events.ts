import { prisma } from "@/lib/prisma"

type EventType = "error" | "warning" | "info"
type EventSource = "generate" | "webhook" | "auth" | "email" | "checkout" | "subscribe" | "admin"

export async function logEvent(
  type: EventType,
  source: EventSource,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        type,
        source,
        message: message.slice(0, 2000),
        context: context ? (context as object) : undefined,
      },
    })
  } catch (err) {
    // Never let logging failures break the caller.
    console.error("logEvent failed:", err)
  }
}
