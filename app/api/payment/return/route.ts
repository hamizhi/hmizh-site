import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return new NextResponse("Payment return URL is not configured", { status: 503 });
  }

  let target: URL;
  try {
    target = new URL("/pay", siteUrl);
    if (target.protocol !== "https:" && target.hostname !== "localhost") {
      throw new Error("Invalid payment return URL");
    }
  } catch {
    return new NextResponse("Invalid payment return URL", { status: 503 });
  }

  const orderId =
    url.searchParams.get("order_id") ||
    url.searchParams.get("out_trade_no");
  if (orderId) target.searchParams.set("order_id", orderId);
  target.searchParams.set("returned", "1");
  return NextResponse.redirect(target);
}
