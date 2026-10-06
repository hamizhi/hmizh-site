"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Smartphone,
  Tag,
  Zap,
} from "lucide-react";

const PLANS = {
  go: {
    id: "go",
    title: "ChatGPT Go / 月",
    desc: "使用更多核心智能额度，写作、了解、创建和聊天都更多。",
    originalPrice: 49,
    discount: 0,
    price: 1,
    badge: "新用户首选",
    features: [
      "更多使用工具的消息额度",
      "更多图像创建额度",
      "更多记忆和存储空间",
      "更多语音聊天额度",
    ],
  },
  plus: {
    id: "plus",
    title: "ChatGPT Plus 一键升级 / 月",
    desc: "解锁高级智能，越用越懂你的偏好",
    originalPrice: 199,
    discount: 50,
    price: 149,
    badge: "最受欢迎",
    features: [
      "面向复杂工作的高级智能",
      "更高质量的图像生成",
      "工作智能体可跨应用和文件执行操作",
      "用 Codex 自动化编码",
      "个人理财和数据分析工具",
      "支持开具正规采购凭证/收据用于财务报销",
    ],
  },
  pro: {
    id: "pro",
    title: "ChatGPT Pro",
    desc: "面向在整个工作日都依赖我们最强智能的用户",
    badge: "算力升级",
    tiers: [
      {
        id: "5x",
        label: "5x Pro",
        officialPrice: "$100",
        originalPrice: 720,
        discount: 0,
        price: 720
      },
      {
        id: "10x",
        label: "10x Pro",
        officialPrice: "$200",
        originalPrice: 1350,
        discount: 0,
        price: 1350
      },
      {
        id: "25x",
        label: "25x Pro",
        officialPrice: "$500",
        originalPrice: 3500,
        discount: 0,
        price: 3500
      },
    ],
    features: [
      "我们最强大的前沿 Pro 模型",
      "Dots，你的全天候在线智能体",
      "更多工作模式和 Codex 使用额度",
      "抢先体验新工具和模型",
      "提供 3 档使用额度（5x/10x/25x）",
      "支持开具正规采购凭证/收据用于财务报销",
    ],
  },
} as const;

type PlanId = keyof typeof PLANS;
type PayType = "alipay" | "wxpay";

export default function PurchasePage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>("plus");
  const [proTier, setProTier] = useState("5x"); // Pro 套餐档位选择
  const [phone, setPhone] = useState("");
  const [payType, setPayType] = useState<PayType>("alipay");
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const planFromUrl = new URLSearchParams(window.location.search).get("plan");
    if (planFromUrl && planFromUrl in PLANS) {
      setSelectedPlanId(planFromUrl as PlanId);
    }
  }, []);

  const plan = PLANS[selectedPlanId];

  // 如果是 Pro 套餐，获取当前选中档位的价格
  const getCurrentPrice = () => {
    if (selectedPlanId === "pro" && plan.tiers) {
      const currentTier = plan.tiers.find(t => t.id === proTier);
      return currentTier ? currentTier.price : plan.tiers[0].price;
    }
    return plan.price;
  };

  const getCurrentOriginalPrice = () => {
    if (selectedPlanId === "pro" && plan.tiers) {
      const currentTier = plan.tiers.find(t => t.id === proTier);
      return currentTier ? currentTier.originalPrice : plan.tiers[0].originalPrice;
    }
    return plan.originalPrice;
  };

  const getCurrentDiscount = () => {
    if (selectedPlanId === "pro" && plan.tiers) {
      const currentTier = plan.tiers.find(t => t.id === proTier);
      return currentTier ? currentTier.discount : plan.tiers[0].discount;
    }
    return plan.discount;
  };

  const finalPrice = getCurrentPrice();
  const finalOriginalPrice = getCurrentOriginalPrice();
  const finalDiscount = getCurrentDiscount();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white antialiased relative overflow-hidden">
      {/* 动态背景粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl top-1/2 -right-48 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -bottom-48 left-1/3 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6 relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-indigo-500/50">
              G
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-white leading-tight">
                GPT <span className="text-indigo-400">Pro</span>
              </div>
              <div className="text-[11px] text-slate-400 font-normal leading-tight">
                ChatGPT 订阅服务
              </div>
            </div>
          </Link>
          <Link href="/plus-price" className="flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回方案列表
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 sm:pt-12 pb-20 relative z-10">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl sm:p-9">
          <div className="mb-6">
            <div className="mb-2 text-xs font-medium text-slate-400">选择充值方案</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(PLANS) as PlanId[]).map((key) => {
                const item = PLANS[key];
                const active = selectedPlanId === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedPlanId(key)}
                    className={`relative rounded-2xl p-3.5 text-left transition-all group ${
                      active
                        ? "border-2 border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                        : "border border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl transition-all" />
                    )}
                    <div className="relative mb-1 flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300">{item.badge}</div>
                      {active && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                    <div className="relative text-sm font-extrabold text-white">
                      {key === "go" ? "Go" : key === "plus" ? "Plus" : "Pro"}
                    </div>
                    <div className="relative mt-0.5 text-base font-black text-indigo-400">
                      ¥{item.price || (item.tiers ? item.tiers[0].price : 0)}
                      {key === "pro" && <span className="text-xs font-normal text-slate-400"> 起</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-6 border-y border-slate-700/50 py-5">
            {/* Pro 档位选择器 - 灵动岛风格 */}
            {selectedPlanId === "pro" && plan.tiers && (
              <div className="mb-6 flex justify-center">
                <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-full px-1 py-1 shadow-2xl shadow-black/40">
                  {/* 滑动背景指示器 */}
                  <div
                    className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-500/50"
                    style={{
                      left: `${4 + plan.tiers.findIndex(t => t.id === proTier) * 106}px`,
                      width: '102px'
                    }}
                  />

                  {/* 档位按钮 */}
                  <div className="relative flex gap-1">
                    {plan.tiers.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setProTier(tier.id)}
                        className={`relative px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 w-[102px] ${
                          proTier === tier.id
                            ? 'text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{tier.label}</span>
                          <span className="text-[10px] opacity-70">{tier.officialPrice}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black tracking-[-0.5px] text-white sm:text-2xl">{plan.title}</h1>
                <p className="mt-1 text-xs text-slate-400">{plan.desc}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>• 官方苹果礼品卡通道</span>
                  <span>• 100% 账号零风险</span>
                  <span>• 免提供账号密码</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div
                  key={finalPrice}
                  className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 sm:text-3xl transition-all duration-500"
                >
                  <span className="text-sm font-bold">¥</span>{finalPrice}
                </div>
                {finalOriginalPrice !== finalPrice && (
                  <div className="text-xs text-slate-500 line-through">
                    原价 ¥{finalOriginalPrice}
                  </div>
                )}
              </div>
            </div>
            {finalDiscount > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-xs text-orange-300">
                <div className="flex items-center gap-1.5 font-medium"><Tag className="h-3.5 w-3.5 text-orange-400" />限时直降活动进行中</div>
                <span className="font-bold">已减免 ¥{finalDiscount}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold text-slate-300">
              填写手机号 <span className="font-normal text-orange-400">(必填 · 仅用于订单绑定与提卡凭证)</span>
            </label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="请输入 11 位手机号码（查单与找回卡密凭据）"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3.5 pl-10 pr-4 font-mono text-sm font-medium text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">* 无需接收验证码。付款成功后系统会自动将充值卡密与该手机号绑定。</div>
          </div>

          <div className="mb-8">
            <div className="mb-2.5 text-xs font-bold text-slate-300">选择支付方式</div>
            <div className="grid grid-cols-2 gap-3">
              <PayOption
                icon="支"
                label="支付宝支付"
                color="bg-[#1677ff]"
                active={payType === "alipay"}
                onClick={() => setPayType("alipay")}
              />
              <PayOption
                icon="微"
                label="微信支付"
                color="bg-[#07c160]"
                active={payType === "wxpay"}
                onClick={() => setPayType("wxpay")}
              />
            </div>
          </div>

          <div className="mb-6 space-y-2 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 text-xs text-slate-400">
            <div className="flex justify-between"><span>商品原价</span><span className="font-mono">¥{finalOriginalPrice}.00</span></div>
            <div className="flex justify-between text-orange-400"><span>限时优惠减免</span><span className="font-mono">-¥{finalDiscount}.00</span></div>
            <div className="flex items-baseline justify-between border-t border-slate-700/50 pt-2 text-sm font-bold text-white"><span>实付金额</span><span className="font-mono text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">¥{finalPrice}.00</span></div>
          </div>

          <div className="mb-6 flex items-start gap-2 text-xs text-slate-400">
            <input type="checkbox" id="agree" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-500" />
            <label htmlFor="agree" className="cursor-pointer select-none">我已阅读并知悉《服务条款》与《充值未成功 100% 当天退款说明》</label>
          </div>

          <button type="submit" disabled={loading} className="relative group w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-75" />
            <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold py-4 rounded-2xl shadow-2xl shadow-indigo-500/50 transition-all group-hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <span>{loading ? "正在生成订单..." : "立即购买"}</span>
              <span>&gt;</span>
            </div>
          </button>

          <div className="mt-3 flex items-center justify-center gap-3 text-center text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />正品渠道保障</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-emerald-400" />付款秒出卡密</span>
          </div>
        </form>
      </main>
    </div>
  );
}

function Step({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return (
    <div className="z-10 flex flex-col items-center gap-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50" : "bg-slate-700 text-slate-400"}`}>{number}</div>
      <span className={`text-xs ${active ? "font-bold text-indigo-400" : "font-medium text-slate-500"}`}>{label}</span>
    </div>
  );
}

function PayOption({
  icon,
  label,
  color,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex items-center justify-between rounded-xl border p-3.5 text-left transition group ${
        active
          ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
      }`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl blur-lg transition-all" />
      )}
      <span className="flex items-center gap-2 relative">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white ${color}`}>
          {icon}
        </span>
        <span className={`text-xs font-bold ${active ? "text-indigo-300" : "text-slate-300"}`}>
          {label}
        </span>
      </span>
      {active && <Check className="h-4 w-4 text-indigo-400 relative" />}
    </button>
  );
}
