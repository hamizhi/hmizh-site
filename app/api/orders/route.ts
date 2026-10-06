import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLANS = {
  go: {
    title: "ChatGPT Go / 月",
    price: 1,
  },
  plus: {
    title: "ChatGPT Plus 一键升级 / 月",
    price: 149,
  },
  "pro-5x": {
    title: "ChatGPT Pro $100/$200/$500",
    price: 720,
  },
  pro: {
    title: "ChatGPT Pro 充值 (5x / 20x)",
    price: 879,
  },
  account: {
    title: "ChatGPT Plus 新号成品",
    price: 189,
  },
} as const;

type PlanId = keyof typeof PLANS;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      planId?: string;
    };

    const phone = body.phone?.trim() ?? "";
    const planId = body.planId as PlanId;
    const plan = PLANS[planId];

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "请输入正确的 11 位手机号码" },
        { status: 400 },
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "套餐不存在或已下架" },
        { status: 400 },
      );
    }

    const orderId = await createPendingOrder({
      phone,
      planId,
      planName: plan.title,
      money: plan.price,
    });

    return NextResponse.json({
      success: true,
      orderId,
      planId,
      price: plan.price,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建订单失败";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
