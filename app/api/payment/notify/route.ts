import { NextResponse } from "next/server";
import { getOrderForPayment, markOrderPaidAndAssignCard } from "@/lib/db";
import { verifyLuckywoodSignature } from "@/lib/payment/luckywood";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleNotification(request: Request) {
  const url = new URL(request.url);
  const params =
    request.method === "GET"
      ? Object.fromEntries(url.searchParams.entries())
      : Object.fromEntries(new URLSearchParams(await request.text()).entries());
  const orderId = params.out_trade_no;
  const tradeNo = params.trade_no;
  const sign = params.sign;

  if (!orderId || !tradeNo || !sign || !verifyLuckywoodSignature(params, sign)) {
    return new NextResponse("fail", { status: 400 });
  }
  if (params.trade_status !== "TRADE_SUCCESS") {
    return new NextResponse("success");
  }

  const order = await getOrderForPayment(orderId);
  if (!order) return new NextResponse("fail", { status: 404 });

  const providerMoney = Number(params.money);
  const providerCents = Math.round(providerMoney * 100);
  const orderCents = Math.round(Number(order.money) * 100);
  if (
    !Number.isFinite(providerMoney) ||
    !Number.isFinite(providerCents) ||
    providerCents !== orderCents
  ) {
    return new NextResponse("fail", { status: 400 });
  }

  await markOrderPaidAndAssignCard({
    orderId,
    tradeNo,
    money: providerMoney,
  });
  return new NextResponse("success");
}

export async function GET(request: Request) {
  try {
    return await handleNotification(request);
  } catch {
    return new NextResponse("fail", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await handleNotification(request);
  } catch {
    return new NextResponse("fail", { status: 500 });
  }
}
