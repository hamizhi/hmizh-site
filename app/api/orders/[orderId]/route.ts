import { NextResponse } from "next/server";
import { getOrderForPayment } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const email = new URL(request.url).searchParams.get("email");
    const order = await getOrderForPayment(orderId);

    if (!order || !email || order.email !== email) {
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.order_id,
        status: order.status,
        planName: order.plan_name,
        money: order.money,
        cardCode: order.status === "paid" ? order.card_code : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "查询订单失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
