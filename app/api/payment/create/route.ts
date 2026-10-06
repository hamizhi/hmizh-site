import { NextResponse } from "next/server";
import { getOrderForPayment } from "@/lib/db";
import { buildLuckywoodSubmitUrl } from "@/lib/payment/luckywood";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      payType?: "alipay" | "wxpay";
    };
    const orderId = body.orderId?.trim();
    const payType = body.payType;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

    if (
      !orderId ||
      (payType !== "alipay" && payType !== "wxpay") ||
      !siteUrl
    ) {
      return NextResponse.json(
        { success: false, message: "请选择支付方式，或检查网站公网地址配置" },
        { status: 400 },
      );
    }

    const order = await getOrderForPayment(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 },
      );
    }
    if (order.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "订单当前不可支付" },
        { status: 409 },
      );
    }

    const notifyUrl = `${siteUrl}/api/payment/notify`;
    const returnUrl = `${siteUrl}/api/payment/return?order_id=${encodeURIComponent(
      order.order_id,
    )}`;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();
    const redirectUrl = buildLuckywoodSubmitUrl({
      type: "alipay",
      outTradeNo: order.order_id,
      name: order.plan_name || order.plan_id,
      money: Number(order.money),
      notifyUrl,
      returnUrl,
      clientIp,
    });

    return NextResponse.json({
      success: true,
      mode: "redirect",
      orderId: order.order_id,
      redirectUrl,
      money: Number(order.money).toFixed(2),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建支付订单失败";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
