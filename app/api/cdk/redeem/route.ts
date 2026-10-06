import { NextResponse } from "next/server";
import { attachDeviceCookie, callZovoCard } from "@/lib/cdk/zovocard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      redemptionToken?: string;
      preflightToken?: string;
      clientRequestId?: string;
    };
    const redemptionToken = body.redemptionToken?.trim();
    const preflightToken = body.preflightToken?.trim();
    const clientRequestId = body.clientRequestId?.trim();

    if (!redemptionToken || !preflightToken || !clientRequestId) {
      return NextResponse.json(
        {
          code: 400,
          error_code: "missing_redeem_parameters",
          msg: "兑换参数不完整，请重新开始",
        },
        { status: 400 },
      );
    }

    const result = await callZovoCard(request, "/api/v1/cdk/redeem", {
      method: "POST",
      body: {
        redemption_token: redemptionToken,
        preflight_token: preflightToken,
        client_request_id: clientRequestId,
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
