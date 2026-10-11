"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function RechargePage() {
  const [card, setCard] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [copied, setCopied] = useState(false);
  const [cardStatus, setCardStatus] = useState<"verifying" | "valid">("verifying");
  const [confirmed, setConfirmed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("delivering");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = params.get("order_id");
    const raw = sessionStorage.getItem("current_order_draft");
    const draft = raw ? (JSON.parse(raw) as { email?: string }) : null;
    if (!currentOrderId || !draft?.email) {
      setError("缺少订单信息，请从支付页面进入。");
      return;
    }
    const orderEmail = draft.email;
    setOrderNo(currentOrderId);

    let stopped = false;
    const loadOrder = async () => {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(currentOrderId)}?email=${encodeURIComponent(orderEmail)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "订单查询失败");
        }
        if (data.order.status === "delivered" && data.order.cardCode) {
          setDeliveryStatus("delivered");
          setOrderNo(data.order.orderId);
          setCard(data.order.cardCode);
          setCardStatus("valid");

          // 触发 Google Ads 转化事件
          if (typeof window !== "undefined" && "gtag" in window) {
            (window as any).gtag("event", "conversion", {
              send_to: "AW-18500682075",
            });
          }
          return true;
        }
        if (["paid", "delivering"].includes(data.order.status)) {
          setDeliveryStatus(data.order.status);
          setError("");
          return false;
        }

        throw new Error(`订单当前状态：${data.order.status || "未知"}`);
      } catch (reason) {
        if (!stopped) {
          setError(reason instanceof Error ? reason.message : "订单查询失败");
        }
        return false;
      }
    };

    void loadOrder();
    const timer = window.setInterval(async () => {
      if (await loadOrder()) {
        window.clearInterval(timer);
      }
    }, 3000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-20 text-[#111827] antialiased">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">G</span>
            <span className="text-lg font-bold tracking-[-0.5px]">GPT <span className="text-indigo-600">PRO</span></span>
          </Link>
          <span className="flex items-center gap-2 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 text-emerald-500" />官方正规直充 · 不收集账号密码</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8 sm:pt-12">
        <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mx-auto flex max-w-sm items-center justify-between">
            <Step label="填写信息" done />
            <div className="mx-3 h-0.5 flex-1 bg-emerald-500" />
            <Step label="扫码支付" done />
            <div className="mx-3 h-0.5 flex-1 bg-indigo-600" />
            <Step label="手动激活" active number="3" />
          </div>
        </div>

        {error ? (
          <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm sm:p-8">
            <h1 className="text-xl font-black text-amber-900">暂时无法显示卡密</h1>
            <p className="mt-2 text-sm text-amber-800">{error}</p>
            <Link href="/plus-price" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">返回套餐页</Link>
          </section>
        ) : !card ? (
          <section className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-center shadow-sm sm:p-8">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <h1 className="mt-4 text-xl font-black text-indigo-950">支付成功，卡密分配中</h1>
            <p className="mt-2 text-sm text-indigo-800">
              当前状态：{deliveryStatus === "paid" ? "已支付" : "交付中"}，分配完成后本页面会自动显示卡密。
            </p>
            <p className="mt-3 text-xs text-indigo-700/70">订单号：{orderNo || "查询中..."}</p>
          </section>
        ) : (
        <section className="mb-6 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-black text-gray-900">卡密购买成功！</h1>
            <p className="mt-1 text-xs text-gray-500">请保存卡密，并按官方页面完成激活</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-700/50 bg-slate-900 p-4 font-mono text-sm">
            <div>
              <div className="font-sans text-[11px] text-slate-400">您的专属充值卡密</div>
              <div className="mt-0.5 text-lg font-extrabold tracking-wider text-white">{card}</div>
            </div>
            <button type="button" onClick={copyCard} className="flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 font-sans text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制卡密"}
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] text-gray-400">订单号：{orderNo}</div>
        </section>
        )}

        {!finished ? (
          <section className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">步骤 1</span>
                <span className="text-xs font-bold text-gray-700">卡密状态核验</span>
              </div>
              {cardStatus === "verifying" ? (
                <span className="flex items-center gap-1 text-xs text-amber-600"><RefreshCw className="h-3 w-3 animate-spin" />卡密验证中...</span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />卡密验证成功（有效）</span>
              )}
            </div>

            <div className="py-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">步骤 2</span>
                <span className="text-sm font-bold text-gray-900">前往自主兑换站</span>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-gray-500">
                请前往兑换站输入卡密完成激活。
              </p>
              <a href="https://hamizhi.cc.cd" target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 py-3.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100">
                前往自主兑换站 <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-gray-200/90 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Zap className="h-9 w-9" /></div>
            <h2 className="mb-2 text-2xl font-black text-gray-900">激活流程已完成</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">请回到 ChatGPT 官方页面刷新账号状态，查看 Plus 权益是否生效。</p>
            <a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700">前往 ChatGPT 查验权益 <ExternalLink className="h-4 w-4" /></a>
          </section>
        )}
        <a
          href="https://work.weixin.qq.com/ca/cawcde79046e43fa0b"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <MessageCircle className="h-4 w-4" />
          联系客服
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </main>
    </div>
  );
}

function Step({ label, done = false, active = false, number = "1" }: { label: string; done?: boolean; active?: boolean; number?: string }) {
  return (
    <div className="z-10 flex flex-col items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}>{done ? "✓" : number}</div>
      <span className={`text-xs ${active ? "font-bold text-indigo-600" : "font-medium text-gray-400"}`}>{label}</span>
    </div>
  );
}
