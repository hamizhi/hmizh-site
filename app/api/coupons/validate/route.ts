import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/db";
import { ORDER_PLANS, type OrderPlanId } from "@/lib/order-plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string; planId?: string };
    const plan = ORDER_PLANS[body.planId as OrderPlanId];
    if (!plan || !body.code) {
      return NextResponse.json({ success: false, message: "请输入优惠码并选择套餐" }, { status: 400 });
    }
    const result = await validateCoupon(body.code, body.planId!, plan.price);
    if (!result) {
      return NextResponse.json(
        { success: false, message: "优惠码无效、已过期或不适用于该套餐" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, message: "优惠码验证失败，请稍后再试" }, { status: 500 });
  }
}
