import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const DEVICE_COOKIE = "zovocard_redemption_device";

type UpstreamResult = {
  status: number;
  body: unknown;
};

function getOrigin() {
  return (
    process.env.ZOVOCARD_ORIGIN || "https://sandbox.zovocard.com"
  ).replace(/\/+$/, "");
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  const prefix = `${name}=`;
  const value = cookies
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return value && /^[a-zA-Z0-9-]{20,80}$/.test(value) ? value : null;
}

export function getRedemptionDevice(request: Request) {
  return readCookie(request, DEVICE_COOKIE) || `web-${randomUUID()}`;
}

export function attachDeviceCookie(
  response: NextResponse,
  device: string,
) {
  if (response.cookies.get(DEVICE_COOKIE)?.value) return response;

  response.cookies.set({
    name: DEVICE_COOKIE,
    value: device,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function callZovoCard(
  request: Request,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  } = {},
): Promise<{ response: NextResponse; device: string }> {
  const device = getRedemptionDevice(request);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Redemption-Device": device,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getOrigin()}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    const response = NextResponse.json(
      {
        code: 503,
        error_code: "zovocard_unreachable",
        msg: "兑换服务暂时无法连接，请稍后重试",
      },
      { status: 503 },
    );
    return { response: attachDeviceCookie(response, device), device };
  }

  const text = await upstream.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : { code: upstream.status };
  } catch {
    body = {
      code: upstream.status,
      msg: "兑换服务返回了无法识别的响应",
    };
  }

  const response = NextResponse.json(body, { status: upstream.status });
  return { response: attachDeviceCookie(response, device), device };
}

export function upstreamErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "msg" in body &&
    typeof body.msg === "string"
  ) {
    return body.msg;
  }
  return fallback;
}

export type CdkPreviewData = {
  redemption_token?: string;
  expires_at?: string;
  plan?: string;
  plan_flow?: string;
  funding_cap_minor?: number;
};
