import { NextRequest, NextResponse } from "next/server";

/**
 * Review reminder cron job — designed to be called 7 days after purchase.
 *
 * To activate on Vercel, add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/review-reminder", "schedule": "0 10 * * *" }]
 * }
 *
 * Set CRON_SECRET in Vercel environment variables to secure this endpoint.
 *
 * TODO: When you have a database, implement:
 *   1. Query orders placed exactly 7 days ago (where reviewEmailSentAt is null)
 *   2. For each order, send a review request email via Resend
 *   3. Mark the order as reviewed (set reviewEmailSentAt = now)
 *
 * The review email should:
 *   - Show the customer their portrait
 *   - Ask them to share on Instagram with #PawMasterpieceAI
 *   - Include a "Leave a review" link (Trustpilot, Google, etc.)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Replace with real database query
  // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // const orders = await db.orders.findMany({
  //   where: { createdAt: { lte: sevenDaysAgo }, reviewEmailSentAt: null }
  // });
  // for (const order of orders) {
  //   await sendReviewRequestEmail(order.email, order.portraitUrl);
  //   await db.orders.update({ where: { id: order.id }, data: { reviewEmailSentAt: new Date() } });
  // }

  return NextResponse.json({
    message: "Review reminder cron placeholder — connect a database to activate",
  });
}
