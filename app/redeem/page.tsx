"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type ApiEnvelope = {
  code?: number;
  error_code?: string;
  msg?: string;
  data?: {
    redemption_token?: string;
    preflight_token?: string;
    plan?: string;
    plan_flow?: string;
    expires_at?: string;
    email?: string;
    currentPlan?: string;
    credentialMode?: string;
    order?: {
      status?: string;
      stage?: string;
      order_id?: string | number;
    };
  };
};

type ViewState =
  | "idle"
  | "previewing"
  | "codeVerified"
  | "preflighting"
  | "awaitingConfirmation"
  | "redeeming"
  | "polling"
  | "success"
  | "error";

const IN_PROGRESS = new Set([
  "queued",
  "awaiting_card",
  "funding_pending",
  "dispatching",
  "running",
  "requires_action",
  "pending",
  "plus_paid",
]);

async function requestApi(
  path: string,
  body: Record<string, string>,
): Promise<ApiEnvelope> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json()) as ApiEnvelope;
  if (!response.ok || data.code !== 0) {
    throw new Error(data.msg || "兑换服务暂时无法处理，请稍后重试");
  }
  return data;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [session, setSession] = useState("");
  const [state, setState] = useState<ViewState>("idle");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("");
  const [email, setEmail] = useState("");
  const [currentPlan, setCurrentPlan] = useState("");
  const [confirmedEmail, setConfirmedEmail] = useState(false);
  const [redemptionToken, setRedemptionToken] = useState("");
  const [preflightToken, setPreflightToken] = useState("");
  const [orderId, setOrderId] = useState("");
  const clientRequestId = useRef("");
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const resetFromCode = () => {
    setState("idle");
    setMessage("");
    setPlan("");
    setEmail("");
    setCurrentPlan("");
    setConfirmedEmail(false);
    setRedemptionToken("");
    setPreflightToken("");
    setOrderId("");
    setSession("");
    clientRequestId.current = "";
    // 清除自动刷新定时器
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setOrderId("");

    try {
      setState("previewing");
      const preview = await requestApi("/api/cdk/preview", { code: code.trim() });
      const token = preview.data?.redemption_token;
      if (!token) throw new Error("卡密验证没有返回有效凭证");
      setRedemptionToken(token);
      setPlan(preview.data?.plan || "");
      setState("codeVerified");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "卡密验证失败，请检查后重试");
    }
  };

  const verifySession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setEmail("");
    setConfirmedEmail(false);

    try {
      setState("preflighting");
      const preflight = await requestApi("/api/cdk/preflight", {
        redemptionToken,
        session: session.trim(),
      });
      const token = preflight.data?.preflight_token;
      if (!token) {
        if (preflight.data?.plan_flow === "subscription_recovery_required") {
          throw new Error("当前账号需要先处理原订阅宽限期，请完成处理后重新兑换");
        }
        throw new Error("Session 验证没有返回有效凭证");
      }
      if (!preflight.data?.email) {
        throw new Error("账号验证成功，但服务没有返回账号邮箱，暂不能继续兑换");
      }
      setPreflightToken(token);
      setEmail(preflight.data.email);
      setCurrentPlan(preflight.data?.currentPlan || "");
      setState("awaitingConfirmation");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Session 验证失败，请检查后重试");
    }
  };

  const confirmAndRedeem = async () => {
    if (!confirmedEmail || !redemptionToken || !preflightToken) return;
    setMessage("");

    try {
      clientRequestId.current ||= `redeem-${crypto.randomUUID()}`;
      setState("redeeming");
      const redeemed = await requestApi("/api/cdk/redeem", {
        redemptionToken,
        preflightToken,
        clientRequestId: clientRequestId.current,
      });
      const initialOrder = redeemed.data?.order;
      if (initialOrder?.order_id) setOrderId(String(initialOrder.order_id));

      setState("polling");

      // 启动自动刷新定时器
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      autoRefreshInterval.current = setInterval(async () => {
        try {
          const result = await requestApi("/api/cdk/result", { redemptionToken });
          const order = result.data?.order;
          const status = order?.status || "";

          if (status === "completed") {
            setOrderId(order?.order_id ? String(order.order_id) : "");
            setState("success");
            setSession("");
            if (autoRefreshInterval.current) {
              clearInterval(autoRefreshInterval.current);
              autoRefreshInterval.current = null;
            }
          } else if (status && !IN_PROGRESS.has(status)) {
            if (autoRefreshInterval.current) {
              clearInterval(autoRefreshInterval.current);
              autoRefreshInterval.current = null;
            }
            setState("error");
            setMessage(
              status === "review"
                ? "订单进入人工复核，请暂时不要重复兑换"
                : `兑换未完成，当前状态：${status}`,
            );
          }
        } catch (error) {
          if (autoRefreshInterval.current) {
            clearInterval(autoRefreshInterval.current);
            autoRefreshInterval.current = null;
          }
          setState("error");
          setMessage(error instanceof Error ? error.message : "兑换失败，请稍后重试");
        }
      }, 2000); // 每2秒刷新一次

      // 初始检查（保留原有逻辑作为兜底）
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await sleep(attempt === 0 ? 1000 : 3000);
        const result = await requestApi("/api/cdk/result", { redemptionToken });
        const order = result.data?.order;
        const status = order?.status || "";

        if (status === "completed") {
          setOrderId(order?.order_id ? String(order.order_id) : "");
          setState("success");
          setSession("");
          if (autoRefreshInterval.current) {
            clearInterval(autoRefreshInterval.current);
            autoRefreshInterval.current = null;
          }
          return;
        }

        if (status && !IN_PROGRESS.has(status)) {
          if (autoRefreshInterval.current) {
            clearInterval(autoRefreshInterval.current);
            autoRefreshInterval.current = null;
          }
          throw new Error(
            status === "review"
              ? "订单进入人工复核，请暂时不要重复兑换"
              : `兑换未完成，当前状态：${status}`,
          );
        }
      }

      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
      throw new Error("兑换仍在处理中，请稍后使用同一张卡密重新查询结果");
    } catch (error) {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
      setState("error");
      setMessage(error instanceof Error ? error.message : "兑换失败，请稍后重试");
    }
  };

  const busy = ["previewing", "preflighting", "redeeming", "polling"].includes(state);
  const stepText =
    state === "previewing"
      ? "正在验证卡密..."
      : state === "preflighting"
        ? "正在检查账号资格..."
        : state === "redeeming"
            ? "正在提交兑换..."
            : state === "polling"
              ? "兑换已受理，正在等待结果..."
              : "";

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">C</span>
            <span className="font-extrabold">ChatGPT <span className="text-indigo-600">Pro</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">返回首页</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* 左侧主内容区 */}
          <div>
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <KeyRound className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">卡密兑换</h1>
              <p className="mt-2 text-sm text-slate-500">输入卡密和账号凭据，完成 Plus / Pro 兑换</p>
            </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 text-sm font-bold">
            <StepBadge number="1" active={state !== "idle"} done={["codeVerified", "preflighting", "awaitingConfirmation", "redeeming", "polling", "success"].includes(state)} />
            <span>先验证卡密</span>
          </div>
          <form onSubmit={verifyCode}>
            <label className="block text-sm font-bold text-slate-800">
              卡密
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (state !== "idle" && !busy) resetFromCode();
                }}
                placeholder="请输入完整卡密"
                autoComplete="off"
                spellCheck={false}
                required
                disabled={busy || state === "success"}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={busy || !code.trim() || state === "success"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "previewing" && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {state === "previewing" ? "正在验证卡密..." : "验证卡密"}
            </button>
          </form>

          {state !== "idle" && state !== "previewing" && plan && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="font-bold">卡密正确，可以继续</div>
              <div className="mt-1 text-xs">套餐：{plan}</div>
            </div>
          )}

          {["codeVerified", "preflighting", "awaitingConfirmation"].includes(state) && (
            <>
              <div className="my-7 border-t border-slate-100" />

              {/* 步骤1：点击下方按钮获取充值信息 */}
              <div className="mb-6 flex items-center gap-3 text-sm font-bold">
                <StepBadge number="1" active done />
                <span>点击下方按钮获取充值信息</span>
              </div>
              <a
                href="https://chatgpt.com/api/auth/session"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white transition hover:from-indigo-600 hover:to-purple-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                点我去获取充值信息
              </a>

              <div className="my-6 border-t border-slate-100" />

              {/* 步骤2：确保已登录ChatGPT账户 */}
              <div className="mb-4 flex items-center gap-3 text-sm font-bold">
                <StepBadge number="2" active done={["awaitingConfirmation"].includes(state)} />
                <span>确保已登录ChatGPT账户</span>
              </div>

              {/* 登录状态检查提示 */}
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-900 mb-1">登录状态检查：</div>
                    <div className="text-xs text-amber-800 leading-relaxed">
                      如果页面显示短短的两三行说明未登录<br />
                      需要先去 <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-900">chatgpt.com</a> 登录
                    </div>
                  </div>
                </div>
              </div>

              <div className="my-6 border-t border-slate-100" />

              {/* 步骤3：复制页面中的全部内容到下方文本框 */}
              <div className="mb-4 flex items-center gap-3 text-sm font-bold">
                <StepBadge number="3" active />
                <span>复制页面中的全部内容到下方文本框（开启翻译的需要把翻译关掉再粘贴）</span>
              </div>

              <form onSubmit={verifySession}>
                <label className="block text-sm font-bold text-slate-800">
                  请填入 ChatGPT 充值信息
                  <div className="mt-1 text-xs font-normal text-slate-500">获取方法请参考上方步骤</div>
                  <textarea
                    value={session}
                    onChange={(event) => {
                      setSession(event.target.value);
                      if (state === "awaitingConfirmation") {
                        setState("codeVerified");
                        setEmail("");
                        setCurrentPlan("");
                        setPreflightToken("");
                        setConfirmedEmail(false);
                      }
                    }}
                    placeholder='{"user":{"id":"user-xxx"},"accessToken":"eyJhbGciOiJSUzI1NiIs..."}'
                    rows={6}
                    autoComplete="off"
                    spellCheck={false}
                    required
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
                  />
                </label>
                <div className="mt-2 text-xs text-slate-500">
                  请粘贴从 ChatGPT 官网获取的完整 JSON 数据
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                  Session 只用于验证账号和兑换，不保存到数据库，也不会放入 URL。
                </div>
                <button
                  type="submit"
                  disabled={busy || !session.trim() || state === "awaitingConfirmation"}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === "preflighting" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {state === "preflighting" ? "正在检查账号状态..." : "验证账号状态"}
                </button>
              </form>
            </>
          )}

          {state === "awaitingConfirmation" && (
            <>
              <div className="my-7 border-t border-slate-100" />
              <div className="mb-4 flex items-center gap-3 text-sm font-bold">
                <StepBadge number="4" active />
                <span>确认账号邮箱</span>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="text-xs text-blue-700">检测到的 ChatGPT 账号邮箱</div>
                <div className="mt-1 break-all font-mono text-base font-bold text-blue-950">
                  {email || "接口未返回邮箱"}
                </div>
                {currentPlan && <div className="mt-2 text-xs text-blue-800">当前套餐：{currentPlan}</div>}
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmedEmail}
                  onChange={(event) => setConfirmedEmail(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-indigo-600"
                />
                <span>我确认上面的邮箱是我要兑换的 ChatGPT 账号。</span>
              </label>
              <button
                type="button"
                onClick={confirmAndRedeem}
                disabled={!confirmedEmail}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                确认邮箱并开始兑换
              </button>
            </>
          )}

          {busy && state !== "preflighting" && state !== "previewing" && (
            <div className="mt-4 space-y-2">
              <div className="text-center text-xs text-slate-500">{stepText}</div>
              {state === "polling" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-900">
                    <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                    <span>本页面每 2 秒自动刷新，无需手动刷新</span>
                  </div>
                  <div className="mt-1 text-xs text-blue-700">正在等待兑换完成，请勿关闭页面...</div>
                </div>
              )}
            </div>
          )}
        </section>

        {state === "success" && (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
            <h2 className="mt-3 text-xl font-black text-emerald-950">兑换完成</h2>
            <p className="mt-2 text-sm text-emerald-800">请回到 ChatGPT 刷新页面，确认套餐权益已经生效。</p>
            {orderId && <p className="mt-3 font-mono text-xs text-emerald-700">订单号：{orderId}</p>}
          </section>
        )}

        {state === "error" && (
          <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3 text-rose-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <h2 className="font-bold">兑换未完成</h2>
                <p className="mt-1 text-sm leading-6">{message}</p>
                {orderId && <p className="mt-2 font-mono text-xs">订单号：{orderId}</p>}

                {/* Session 过期的特殊提示 */}
                {(message.includes("Session") || message.includes("session") || message.includes("过期") || message.includes("无权访问")) && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-sm font-bold text-amber-900 mb-2">🔄 解决方法：</div>
                    <ol className="space-y-2 text-sm text-amber-900">
                      <li className="flex items-start gap-2">
                        <span className="font-bold shrink-0">1.</span>
                        <span>前往 <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-950">chatgpt.com</a> 退出登录</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold shrink-0">2.</span>
                        <span>重新登录您的 ChatGPT 账号</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold shrink-0">3.</span>
                        <span>点击上方"<span className="font-bold">点我去获取充值信息</span>"按钮</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold shrink-0">4.</span>
                        <span>复制新的充值信息，重新兑换</span>
                      </li>
                    </ol>
                    <div className="mt-3 pt-3 border-t border-amber-300 text-xs text-amber-800">
                      💡 提示：Session 信息有时效性，请确保使用最新获取的信息
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
          <Info icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} title="服务端处理" text="密钥不进入浏览器" />
          <Info icon={<LockKeyhole className="h-4 w-4 text-indigo-600" />} title="凭据不落库" text="Session 不写入 Supabase" />
          <Info icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />} title="异步确认" text="以最终订单状态为准" />
        </div>
      </div>

      {/* 右侧边栏 - 只在成功时显示 */}
      {state === "success" && (
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900">🎁 续费专属优惠</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  添加客服微信领取专属优惠资格
                </p>
                <div className="mt-4 space-y-2">
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-sm">
                    <div className="font-bold text-indigo-600">ChatGPT Plus</div>
                    <div className="text-2xl font-black text-indigo-700">¥139</div>
                    <div className="text-xs text-slate-500">下次续费可享</div>
                  </div>
                  <div className="rounded-xl bg-white/80 px-4 py-3 text-sm">
                    <div className="font-bold text-purple-600">Pro 用户</div>
                    <div className="text-2xl font-black text-purple-700">立减 ¥20</div>
                    <div className="text-xs text-slate-500">专属折扣</div>
                  </div>
                </div>
                <a
                  href="https://work.weixin.qq.com/kfid/kfc5d2ac29f3003753a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                  添加企业微信客服
                </a>
                <p className="mt-3 text-xs text-slate-500">客服在线时间：9:00 - 22:00</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      </main>
    </div>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
      {icon}
      <span><strong className="block text-slate-700">{title}</strong>{text}</span>
    </div>
  );
}

function StepBadge({
  number,
  active = false,
  done = false,
}: {
  number: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done
          ? "bg-emerald-500 text-white"
          : active
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-400"
      }`}
    >
      {done ? "✓" : number}
    </span>
  );
}
