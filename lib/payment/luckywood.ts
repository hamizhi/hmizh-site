import { createHash } from "node:crypto";

export type LuckywoodPaymentRequest = {
  type: "alipay";
  outTradeNo: string;
  name: string;
  money: number;
  notifyUrl: string;
  returnUrl: string;
  clientIp?: string;
};

function getConfig() {
  const pid = process.env.LUCKYWOOD_PID;
  const key = process.env.LUCKYWOOD_KEY;
  const configuredBaseUrl =
    process.env.LUCKYWOOD_API_BASE_URL || "https://xrapi1.xymzf.cn/xpay/epay";
  const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
  const channelId = process.env.LUCKYWOOD_CHANNEL_ID;

  if (!pid || !key) {
    throw new Error(
      "缺少 LUCKYWOOD_PID 或 LUCKYWOOD_KEY 服务端环境变量。",
    );
  }

  return { pid, key, baseUrl, channelId };
}

function endpoint(baseUrl: string, filename: string): string {
  return baseUrl.endsWith("/xpay/epay")
    ? `${baseUrl}/${filename}`
    : `${baseUrl}/xpay/epay/${filename}`;
}

export function signLuckywoodParams(
  params: Record<string, string | number | undefined>,
  key: string,
): string {
  const content = Object.entries(params)
    .filter(
      ([name, value]) =>
        value !== undefined &&
        value !== null &&
        String(value) !== "" &&
        name !== "sign" &&
        name !== "sign_type",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join("&");

  return createHash("md5")
    .update(`${content}${key}`, "utf8")
    .digest("hex");
}

export function verifyLuckywoodSignature(
  params: Record<string, string | number | undefined>,
  sign: string,
): boolean {
  const { key } = getConfig();
  return signLuckywoodParams(params, key) === sign.toLowerCase();
}

export function buildLuckywoodSubmitUrl(
  request: LuckywoodPaymentRequest,
): string {
  const { pid, key, baseUrl, channelId } = getConfig();
  const params: Record<string, string> = {
    pid,
    type: request.type,
    out_trade_no: request.outTradeNo,
    notify_url: request.notifyUrl,
    return_url: request.returnUrl,
    name: request.name,
    money: request.money.toFixed(2),
    sitename: "GETGPT Pro",
    param: request.outTradeNo,
    device: "pc",
  };

  if (request.clientIp) params.clientip = request.clientIp;
  if (channelId) params.channel_id = channelId;

  const query = new URLSearchParams({
    ...params,
    sign: signLuckywoodParams(params, key),
    sign_type: "MD5",
  });

  return `${endpoint(baseUrl, "submit.php")}?${query.toString()}`;
}
