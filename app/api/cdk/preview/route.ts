import { NextResponse } from "next/server";
import { attachDeviceCookie, callZovoCard } from "@/lib/cdk/zovocard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();

    if (!code || code.length > 512) {
      return NextResponse.json(
        { code: 400, error_code: "invalid_cdk", msg: "请输入完整卡密" },
        { status: 400 },
      );
    }

    const result = await callZovoCard(request, "/api/v1/cdk/preview", {
      method: "POST",
      body: { code },
    });
    return attachDeviceCookie(result.response, result.device);
  } catch {
    return NextResponse.json(
      { code: 400, error_code: "invalid_request", msg: "请求格式不正确" },
      { status: 400 },
    );
  }
}
