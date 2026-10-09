import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "未配置",
    LUCKYWOOD_PID: process.env.LUCKYWOOD_PID || "未配置",
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_PASSWORD_CONFIGURED: Boolean(process.env.ADMIN_PASSWORD?.trim()),
  });
}
