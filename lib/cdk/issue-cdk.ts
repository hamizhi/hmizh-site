// CDK 发码 - 使用 ZovoCard OpenAPI
import { randomUUID } from "node:crypto";

function getOpenApiBase() {
  return (
    process.env.ZOVOCARD_API_BASE || "https://sandbox.zovocard.com/openapi/v1"
  ).replace(/\/+$/, "");
}

function getApiKey() {
  const key = process.env.ZOVOCARD_API_KEY;
  if (!key) {
    throw new Error("ZOVOCARD_API_KEY 环境变量未配置");
  }
  return key;
}

export type IssueCdkParams = {
  plan: "go" | "plus" | "pro_5x" | "pro_10x" | "pro_25x" | "pro_50x";
  count: number;
  paymentCountry?: "US" | "JP" | "PH" | "CL" | "EG" | "NG" | "TR";
  paymentCurrency?: "USD" | "JPY" | "PHP" | "CLP" | "EGP" | "NGN" | "TRY";
};

export type IssueCdkResult = {
  success: boolean;
  cdks?: string[];
  error?: string;
  errorCode?: string;
};

/**
 * 发放 CDK 卡密
 *
 * @example
 * const result = await issueCdk({
 *   plan: "plus",
 *   count: 1,
 *   paymentCountry: "US",
 *   paymentCurrency: "USD"
 * });
 */
export async function issueCdk(
  params: IssueCdkParams
): Promise<IssueCdkResult> {
  const {
    plan,
    count,
    paymentCountry = "PH",
    paymentCurrency = "PHP",
  } = params;

  if (count < 1 || count > 100) {
    return {
      success: false,
      error: "count 必须在 1-100 之间",
      errorCode: "invalid_count",
    };
  }

  try {
    const response = await fetch(`${getOpenApiBase()}/gpt-direct/cdks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": getApiKey(),
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        plan,
        count,
        funding_confirmed: true,
        payment_country: paymentCountry,
        payment_currency: paymentCurrency,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.msg || data.message || "发码失败",
        errorCode: data.error_code || data.code || "issue_failed",
      };
    }

    // 成功响应格式: { code: 200, data: { codes: ["CDK1", "CDK2"] } }
    const codes = data.data?.codes || data.codes;

    if (!Array.isArray(codes) || codes.length === 0) {
      return {
        success: false,
        error: "发码成功但未返回卡密",
        errorCode: "no_codes_returned",
      };
    }

    return {
      success: true,
      cdks: codes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
      errorCode: "network_error",
    };
  }
}
