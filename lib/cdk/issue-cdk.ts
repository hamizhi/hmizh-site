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

    // 调试：打印实际返回数据
    console.log("ZovoCard API Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        success: false,
        error: data.msg || data.message || "发码失败",
        errorCode: data.error_code || data.code || "issue_failed",
      };
    }

    // ZovoCard 返回格式: { code: 0, data: { issued: [{ code: "CDK", ... }], requested: 1 }, msg: "ok" }
    const issued = data.data?.issued;

    if (!Array.isArray(issued) || issued.length === 0) {
      return {
        success: false,
        error: `发码失败。返回数据: ${JSON.stringify(data)}`,
        errorCode: "no_codes_returned",
      };
    }

    // 提取 code 字段
    const codes = issued.map((item: { code: string }) => item.code);

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
