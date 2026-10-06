import { NextRequest, NextResponse } from "next/server";
import { issueCdk } from "@/lib/cdk/issue-cdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, count, paymentCountry, paymentCurrency } = body;

    // 基础验证
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "缺少 plan 参数" },
        { status: 400 }
      );
    }

    if (!count || count < 1) {
      return NextResponse.json(
        { success: false, error: "count 必须大于 0" },
        { status: 400 }
      );
    }

    // 调用发码
    const result = await issueCdk({
      plan,
      count,
      paymentCountry,
      paymentCurrency,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Issue CDK error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "发码失败",
      },
      { status: 500 }
    );
  }
}
