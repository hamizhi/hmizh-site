"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Tag,
  Zap,
} from "lucide-react";
import WechatModal from "../components/wechat-modal";

const PLANS = {
  plus: {
    id: "plus",
    title: "ChatGPT Plus 一键升级 / 月",
    desc: "升级失败全额退款 · 官方正规通道",
    originalPrice: 199,
    discount: 30,
    price: 169,
    badge: "最受欢迎",
    features: ["包含 GPT-4o / o1 / Canvas 全功能", "支持 Codex 编程模型与高清作图", "充值失败 100% 极速退款"],
  },
  pro: {
    id: "pro",
    title: "ChatGPT Pro 充值 (5x / 20x)",
    desc: "算力拉满 · 重度研发与科研首选",
    originalPrice: 939,
    discount: 60,
    price: 879,
    badge: "深度算力",
    features: ["Plus 全部功能 + 专属 GPT-6 Pro 深度推理", "多倍 Codex 高并发额度", "专属一对一客服跟进交付"],
  },
  account: {
    id: "account",
    title: "ChatGPT Plus 新号成品",
    desc: "全新一手干净账号 · 到手即用",
    originalPrice: 209,
    discount: 20,
    price: 189,
    badge: "现货秒发",
    features: ["全新独享账号，含 30 天 Plus 会员", "提供账号密码与邮箱，支持自行改密", "免自备海外网络环境与海外邮箱"],
  },
} as const;

type PlanId = keyof typeof PLANS;
type PayType = "alipay" | "wxpay";

export default function PurchasePage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("plus");
  const [phone, setPhone] = useState("");
  const [payType, setPayType] = useState<PayType>("alipay");
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isWechatModalOpen, setIsWechatModalOpen] = useState(false);

  useEffect(() => {
    const planFromUrl = new URLSearchParams(window.location.search).get("plan");
    if (planFromUrl && planFromUrl in PLANS) {
      setSelectedPlanId(planFromUrl as PlanId);
    }
  }, []);

  const plan = PLANS[selectedPlanId];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      alert("请填写正确的 11 位大陆手机号码，以便接收卡密与订单售后！");
      return;
    }

    if (!agree) {
      alert("请勾选服务协议与免责声明");
      return;
    }

    if (payType === "wxpay") {
      setIsWechatModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, phone }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "创建订单失败");
        return;
      }

      const orderDraft = {
        orderId: data.orderId,
        planId: plan.id,
        planTitle: plan.title,
        price: plan.price,
        phone,
        payType,
        createdAt: Date.now(),
      };
      sessionStorage.setItem("current_order_draft", JSON.stringify(orderDraft));
      router.push(`/pay?order_id=${encodeURIComponent(data.orderId)}`);
    } catch {
      alert("网络连接异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#fafbfc] pb-20 text-[#111827] antialiased selection:bg-indigo-600 selection:text-white"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-sm">
              G
            </div>
            <span className="text-lg font-bold tracking-[-0.5px]">
              GETGPT <span className="text-indigo-600">Pro</span>
            </span>
          </Link>
          <Link href="/plus-price" className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回方案列表
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 sm:pt-12">
        <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative mx-auto flex max-w-lg items-center justify-between">
            <Step number="1" label="填写信息" active />
            <div className="mx-3 h-0.5 flex-1 bg-gray-200" />
            <Step number="2" label="扫码支付" />
            <div className="mx-3 h-0.5 flex-1 bg-gray-200" />
            <Step number="3" label="升级 Plus" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-6">
            <div className="mb-2 text-xs font-medium text-gray-500">选择充值方案</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(PLANS) as PlanId[]).map((key) => {
                const item = PLANS[key];
                const active = selectedPlanId === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedPlanId(key)}
                    className={`rounded-2xl p-3.5 text-left transition-all ${
                      active
                        ? "border-2 border-indigo-600 bg-indigo-50/30 shadow-sm"
                        : "border border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-xs font-bold text-[#111827]">{item.badge}</div>
                      {active && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <div className="text-sm font-extrabold text-[#111827]">
                      {key === "plus" ? "Plus" : key === "pro" ? "Pro" : "新号"}
                    </div>
                    <div className="mt-0.5 text-base font-black text-indigo-600">¥{item.price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-6 border-y border-gray-100 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black tracking-[-0.5px] text-[#111827] sm:text-2xl">{plan.title}</h1>
                <p className="mt-1 text-xs text-gray-500">{plan.desc}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                  <span>• 官方苹果礼品卡通道</span>
                  <span>• 100% 账号零风险</span>
                  <span>• 免提供账号密码</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-black text-indigo-600 sm:text-3xl"><span className="text-sm font-bold">¥</span>{plan.price}</div>
                <div className="text-xs text-gray-400 line-through">原价 ¥{plan.originalPrice}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2.5 text-xs text-rose-700">
              <div className="flex items-center gap-1.5 font-medium"><Tag className="h-3.5 w-3.5 text-rose-600" />限时直降活动进行中</div>
              <span className="font-bold">已减免 ¥{plan.discount}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold text-gray-700">
              填写手机号 <span className="font-normal text-rose-500">(必填 · 仅用于订单绑定与提卡凭证)</span>
            </label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="请输入 11 位手机号码（查单与找回卡密凭据）"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-3.5 pl-10 pr-4 font-mono text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
            <div className="mt-1.5 text-[11px] text-gray-400">* 无需接收验证码。付款成功后系统会自动将充值卡密与该手机号绑定。</div>
          </div>

          <div className="mb-8">
            <div className="mb-2.5 text-xs font-bold text-gray-700">选择支付方式</div>
            <div className="grid grid-cols-2 gap-3">
              <PayOption active={payType === "alipay"} onClick={() => setPayType("alipay")} icon="支" label="支付宝支付" color="bg-[#1677FF]" />
              <PayOption active={payType === "wxpay"} onClick={() => setPayType("wxpay")} icon="微" label="微信支付" color="bg-[#07C160]" />
            </div>
          </div>

          <div className="mb-6 space-y-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-xs text-gray-500">
            <div className="flex justify-between"><span>商品原价</span><span className="font-mono">¥{plan.originalPrice}.00</span></div>
            <div className="flex justify-between text-rose-600"><span>限时优惠减免</span><span className="font-mono">-¥{plan.discount}.00</span></div>
            <div className="flex items-baseline justify-between border-t border-gray-200/80 pt-2 text-sm font-bold text-[#111827]"><span>实付金额</span><span className="font-mono text-xl font-black text-indigo-600">¥{plan.price}.00</span></div>
          </div>

          <div className="mb-6 flex items-start gap-2 text-xs text-gray-500">
            <input type="checkbox" id="agree" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600" />
            <label htmlFor="agree" className="cursor-pointer select-none">我已阅读并知悉《服务条款》与《充值未成功 100% 当天退款说明》</label>
          </div>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50">
            <span>{loading ? "正在生成订单..." : "立即购买"}</span><span>&gt;</span>
          </button>

          <div className="mt-3 flex items-center justify-center gap-3 text-center text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />正品渠道保障</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-emerald-500" />付款秒出卡密</span>
          </div>
        </form>
      </main>
      <WechatModal
        isOpen={isWechatModalOpen}
        onClose={() => setIsWechatModalOpen(false)}
        wechatId={process.env.NEXT_PUBLIC_WECHAT_ID || "客服微信（待配置）"}
        qrCodeUrl={process.env.NEXT_PUBLIC_WECHAT_QR_CODE_URL}
      />
    </div>
  );
}

function Step({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return (
    <div className="z-10 flex flex-col items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-400"}`}>{number}</div>
      <span className={`text-xs ${active ? "font-bold text-indigo-600" : "font-medium text-gray-400"}`}>{label}</span>
    </div>
  );
}

function PayOption({ active, onClick, icon, label, color }: { active: boolean; onClick: () => void; icon: string; label: string; color: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center justify-between rounded-xl p-3.5 text-left transition-all ${active ? "border-2 border-indigo-600 bg-indigo-50/20" : "border border-gray-200 hover:border-gray-300"}`}>
      <span className="flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white ${color}`}>{icon}</span><span className="text-xs font-bold text-gray-900">{label}</span></span>
      {active && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
    </button>
  );
}
