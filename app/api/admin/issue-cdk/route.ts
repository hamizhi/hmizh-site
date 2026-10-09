import { NextRequest, NextResponse } from "next/server";
import { issueCdk } from "@/lib/cdk/issue-cdk";
import { getAdminPassword, isValidAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, count, paymentCountry, paymentCurrency, password } = body;

    if (!getAdminPassword()) {
      return NextResponse.json(
        { success: false, error: "后台尚未配置 ADMIN_PASSWORD" },
        { status: 503 },
      );
    }

    if (!isValidAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "管理密码不正确" },
        { status: 401 },
      );
    }

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
