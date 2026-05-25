import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import PinGeneratorTool from "./PinGeneratorTool";

export const metadata: Metadata = {
  title: "Pinterest Pin Generator — Paw Masterpiece Admin",
  robots: { index: false, follow: false },
};

export default async function PinterestPinsPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Pinterest Pin Generator</h1>
            <p className="text-gray-500 text-sm mt-1">
              Title + style + layout → 1000×1500 PNG ready for Pinterest. Reads from the 30-pin draft at
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-1">docs/marketing/pinterest/30-starter-pins.md</code>.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors"
          >
            ← Admin
          </Link>
        </div>

        <PinGeneratorTool />
      </div>
    </main>
  );
}
