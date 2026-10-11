import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/db";
import { ORDER_PLANS, type OrderPlanId } from "@/lib/order-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      planId?: string;
      couponCode?: string;
    };

    const email = body.email?.trim() ?? "";
    const planId = body.planId as OrderPlanId;
    const plan = ORDER_PLANS[planId];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "请输入正确的邮箱地址" },
        { status: 400 },
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "套餐不存在或已下架" },
        { status: 400 },
      );
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      null;

    let order;
    try {
      order = await createPendingOrder({
        email, planId, planName: plan.title, money: plan.price, clientIp,
        couponCode: body.couponCode?.trim() || null,
      });
    } catch (error) {
      if (error instanceof Error && /invalid_coupon|coupon_exceeds_price/.test(error.message)) {
        return NextResponse.json(
          { success: false, message: "优惠码无效、已过期或不适用于该套餐" },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      planId,
      price: order.price,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建订单失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
