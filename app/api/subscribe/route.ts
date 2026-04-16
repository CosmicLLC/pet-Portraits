import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { Resend } from "resend";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.json");

interface Subscriber {
  email: string;
  source: string;
  imageId?: string;
  createdAt: string;
}

async function readSubscribers(): Promise<Subscriber[]> {
  try {
    const content = await fs.readFile(SUBSCRIBERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeSubscribers(subscribers: Subscriber[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source = "unknown", imageId } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Add to Resend audience if configured
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (audienceId && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.contacts.create({ email: normalized, audienceId, unsubscribed: false });
      } catch (err) {
        console.error("Resend contacts error:", err);
      }
    }

    const subscribers = await readSubscribers();

    const exists = subscribers.some((s) => s.email === normalized);
    if (!exists) {
      const entry: Subscriber = {
        email: normalized,
        source,
        createdAt: new Date().toISOString(),
      };
      if (imageId) entry.imageId = imageId;
      subscribers.push(entry);
      await writeSubscribers(subscribers);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
