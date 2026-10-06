import { NextResponse } from "next/server";
import { attachDeviceCookie, callZovoCard } from "@/lib/cdk/zovocard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      redemptionToken?: string;
      session?: string;
    };
    const redemptionToken = body.redemptionToken?.trim();
    const session = body.session?.trim();

    if (!redemptionToken || !session) {
      return NextResponse.json(
        {
          code: 400,
          error_code: "missing_credential",
          msg: "请输入兑换码对应的 ChatGPT Session",
        },
        { status: 400 },
      );
    }

    const result = await callZovoCard(request, "/api/v1/cdk/preflight", {
      method: "POST",
      body: {
        redemption_token: redemptionToken,
        credential: { mode: "session", session },
      },
    });
    return attachDeviceCookie(result.response, result.device);
  } catch {
    return NextResponse.json(
      { code: 400, error_code: "invalid_request", msg: "请求格式不正确" },
      { status: 400 },
    );
  }
}
