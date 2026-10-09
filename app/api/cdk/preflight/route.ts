import { NextResponse } from "next/server";
import { attachDeviceCookie, callZovoCard } from "@/lib/cdk/zovocard";
import { getAdminSupabase } from "@/lib/supabase";

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

    // 如果验证成功，保存兑换记录到数据库
    if (result.response.status === 200) {
      try {
        const responseData = await result.response.json();
        const email = responseData.data?.email;
        const plan = responseData.data?.plan;

        const supabase = getAdminSupabase();
        await supabase.from("cdk_redemptions").insert({
          redemption_token: redemptionToken,
          email: email || null,
          session_data: session,
          plan: plan || null,
          status: "pending",
        });
      } catch (dbError) {
        // 数据库保存失败不影响主流程，只记录错误
        console.error("保存兑换记录失败:", dbError);
      }
    }

    return attachDeviceCookie(result.response, result.device);
  } catch {
    return NextResponse.json(
      { code: 400, error_code: "invalid_request", msg: "请求格式不正确" },
      { status: 400 },
    );
  }
}
