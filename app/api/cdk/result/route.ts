import { NextResponse } from "next/server";
import { attachDeviceCookie, callZovoCard } from "@/lib/cdk/zovocard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { redemptionToken?: string };
    const token = body.redemptionToken?.trim();

    if (!token) {
      return NextResponse.json(
        { code: 400, error_code: "missing_token", msg: "缺少兑换查询凭证" },
        { status: 400 },
      );
    }

    const result = await callZovoCard(
      request,
      `/api/v1/cdk/result?token=${encodeURIComponent(token)}`,
    );
    return attachDeviceCookie(result.response, result.device);
  } catch {
    return NextResponse.json(
      { code: 400, error_code: "invalid_request", msg: "请求格式不正确" },
      { status: 400 },
    );
  }
}
