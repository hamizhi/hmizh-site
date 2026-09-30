"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, QrCode, ShieldAlert } from "lucide-react";

type Draft = {
  planId?: string;
  planTitle?: string;
  price?: number;
  phone?: string;
  payType?: "alipay" | "wxpay";
};

const PRICE_MAP: Record<string, { title: string; price: number }> = {
  plus: { title: "ChatGPT Plus 一键升级 / 月", price: 169 },
  pro: { title: "ChatGPT Pro 充值 (5x / 20x)", price: 879 },
  account: { title: "ChatGPT Plus 新号成品", price: 189 },
};

export default function PayPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [orderNo, setOrderNo] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [paymentStarted, setPaymentStarted] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("current_order_draft");
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch {
      setDraft(null);
    }
    setOrderNo(`GETGPT${Date.now()}`);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const plan = PRICE_MAP[draft?.planId ?? "plus"] ?? PRICE_MAP.plus;
  const price = draft?.price ?? plan.price;
  const payType = draft?.payType === "wxpay" ? "微信扫码支付" : "支付宝扫码支付";
  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  const handleDemoPayment = () => {
    const card = `QWER-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    window.location.href = `/recharge?card=${card}&order_no=${orderNo}&phone=${encodeURIComponent(
      draft?.phone ?? "",
    )}&plan=${draft?.planId ?? "plus"}`;
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-20 text-[#111827] antialiased">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">G</span>
            <span className="text-lg font-bold tracking-[-0.5px]">GETGPT <span className="text-indigo-600">Pro</span></span>
          </Link>
          <Link href="/purchase" className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回修改订单
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 pt-8 sm:pt-12">
        <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mx-auto flex max-w-sm items-center justify-between">
            <Step label="填写信息" state="done" />
            <div className="mx-3 h-0.5 flex-1 bg-indigo-600" />
            <Step label="扫码支付" state="active" number="2" />
            <div className="mx-3 h-0.5 flex-1 bg-gray-200" />
            <Step label="升级 Plus" state="pending" number="3" />
          </div>
        </div>

        <section className="rounded-3xl border border-gray-200/90 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
            <Clock3 className="h-3.5 w-3.5" /> 请在 {formatTime(countdown)} 内完成支付
          </div>
          <h1 className="mb-1 text-xl font-black text-gray-900 sm:text-2xl">{payType}</h1>
          <p className="mb-6 text-xs text-gray-500">请使用对应 App 扫描二维码完成付款</p>

          <div className="relative mb-6 inline-block rounded-2xl border-2 border-indigo-100 bg-white p-4 shadow-md">
            <div className="relative flex h-56 w-56 flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
              <QrCode className="h-40 w-40 text-gray-800 opacity-90" />
              <span className="absolute bottom-2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white">¥{price}.00</span>
            </div>
          </div>

          <div className="mb-6 space-y-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-left text-xs text-gray-600">
            <Row label="商品名称" value={draft?.planTitle ?? plan.title} />
            <Row label="应付金额" value={`¥${price}.00`} emphasis />
            <Row label="关联手机号" value={draft?.phone || "未填写"} />
            <Row label="商户订单号" value={orderNo || "生成中..."} />
          </div>

          {paymentStarted && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-5 text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              当前是本地演示收银台，没有连接真实支付宝或微信支付。
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setPaymentStarted(true);
              handleDemoPayment();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-extrabold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-5 w-5" /> 我已完成支付，查看卡密
          </button>
          <p className="mt-4 text-[11px] text-gray-400">演示完成后将进入卡密页面；真实支付需另行接入支付服务商。</p>
        </section>
      </main>
    </div>
  );
}

function Step({ label, state, number = "1" }: { label: string; state: "done" | "active" | "pending"; number?: string }) {
  return (
    <div className="z-10 flex flex-col items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${state === "done" ? "bg-emerald-500 text-white" : state === "active" ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}>
        {state === "done" ? "✓" : number}
      </div>
      <span className={`text-xs ${state === "active" ? "font-bold text-indigo-600" : "font-medium text-gray-400"}`}>{label}</span>
    </div>
  );
}

function Row({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className={emphasis ? "font-mono text-sm font-bold text-indigo-600" : "font-medium text-gray-900"}>{value}</span>
    </div>
  );
}
