import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import AdStudio from "./AdStudio";

export const metadata: Metadata = {
  title: "Ad Studio — Paw Masterpiece",
  robots: { index: false, follow: false },
};

export default async function AdStudioPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-brand-green">Ad Studio</h1>
            <p className="text-gray-500 text-sm mt-1">
              Generate Meta-ready creative with on-brand fonts, palette, and voice.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-brand-green transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to admin
          </Link>
        </div>

        <AdStudio />
      </div>
    </main>
  );
}
