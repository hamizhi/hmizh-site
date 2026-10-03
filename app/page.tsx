"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
  Star,
  MessageCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Menu,
  Play,
} from "lucide-react";

// 1. 标题下 6 个卖点轮换词
const ROTATING_WORDS = [
  "专业 ChatGPT 代充服务",
  "2分钟极速完成充值",
  "官方正规充值通道",
  "无需海外信用卡",
  "安全可靠保障",
  "充值不成功100%退款",
];

// 2. 状态通知（8.9万+ / 12位定制）
const SOCIAL_NOTICES = [
  "支持 ChatGPT, Claude, Cursor, Gemini 等主流工具",
  "正规渠道充值，不成功 100% 退款",
  "刚刚，一位用户成功充值了 ChatGPT Plus",
  "目前有 12 位用户正在充值",
];

// 原站评价数据（上下双排轮播）
const REVIEWS_ROW_1 = [
  {
    name: "MuxiChen",
    avatar: "M",
    title: "上海 AI 创业公司产品总监",
    tag: "长期续费用户",
    date: "2026-05",
    text: "支付宝折腾礼品卡半天没成功，换成这里的代充之后 2 分钟就充好了，用了几个月了很稳！",
  },
  {
    name: "温小鹿",
    avatar: "温",
    title: "AI 学习者 · 论文写作",
    tag: "客服好评",
    date: "2026-03",
    text: "信用卡尝试了几十次都被拒，最后靠这里的代充一次成功。客服一步步跟进，终于不用再跟苹果拉扯。",
  },
  {
    name: "Ming Jia",
    avatar: "M",
    title: "数据分析师",
    tag: "ChatGPT Pro 用户",
    date: "2026-04",
    text: "GPT 充值服务稳定用了 4 个月，ChatGPT Plus 稳稳续费，各种 AI 吹得天花乱坠，最终还是觉得 GPT 好使！",
  },
  {
    name: "Kris Luo",
    avatar: "K",
    title: "独立开发者",
    tag: "技术用户",
    date: "2026-06",
    text: "半夜写代码想测试 Codex 新模型，直接手机下单充值。客服一点半还在线帮忙解决，贴心。",
  },
];

const REVIEWS_ROW_2 = [
  {
    name: "阿哲",
    avatar: "阿",
    title: "互联网产品经理",
    tag: "失败秒退",
    date: "2026-02",
    text: "第一次没充上，本来都做好扯皮准备了，结果直接秒退款，第二次重新下单 1 分钟到账，售后完全不用操心。",
  },
  {
    name: "Leon Wu",
    avatar: "L",
    title: "后端架构师",
    tag: "一年老用户",
    date: "2026-05",
    text: "从虚拟卡跑路那会儿用到现在一年多了，每次 GPT 代充都是下单即充，中间一次没出过错，已推荐给全组。",
  },
  {
    name: "LaoPeng",
    avatar: "L",
    title: "海外留学生",
    tag: "礼品卡充值",
    date: "2026-03",
    text: "美区卡被封后只能靠朋友帮忙太麻烦。这里可以直接提供礼品卡充值，附赠流程图片，新手也能一次成功。",
  },
  {
    name: "Rimika",
    avatar: "R",
    title: "AI 内容创作者",
    tag: "多账号充",
    date: "2026-06",
    text: "搞内容创业要维护多个 Plus 账号，之前经常忘记续费。现在直接交给这里，自动充值省心多了。",
  },
];

// 套餐定价数据（已精细调整比例，绝不过大）
const PLANS = [
  {
    id: "go",
    name: "ChatGPT Go",
    tag: "新用户首选",
    badge: "新用户首选",
    price: "49",
    period: "/ 月",
    originalPrice: "49",
    dailyPrice: "新用户首选",
    description: "使用更多核心智能额度，写作、了解、创建和聊天都更多。",
    features: [
      "更多使用工具的消息额度",
      "更多图像创建额度",
      "更多记忆和存储空间",
      "更多语音聊天额度",
    ],
    popular: false,
  },
  {
    id: "plus",
    name: "ChatGPT Plus",
    tag: "最受欢迎 · 推荐",
    badge: "热销推荐",
    price: "149",
    period: "/ 月",
    originalPrice: "199",
    dailyPrice: "限时优惠价 ¥149",
    description: "解锁高级智能，越用越懂你的偏好",
    features: [
      "面向复杂工作的高级智能",
      "更高质量的图像生成",
      "工作智能体可跨应用和文件执行操作",
      "用 Codex 自动化编码",
      "个人理财和数据分析工具",
      "支持开具正规采购凭证/收据用于财务报销",
    ],
    popular: true,
  },
  {
    id: "pro-5x",
    name: "ChatGPT Pro $100/$200/$500",
    tag: "企业与开发者高频首选",
    badge: "算力升级",
    price: "720",
    period: "起 / 月",
    originalPrice: "720",
    dailyPrice: "ChatGPT Pro $100 / $200 / $500",
    description: "面向在整个工作日都依赖我们最强智能的用户",
    features: [
      "我们最强大的前沿 Pro 模型",
      "Dots，你的全天候在线智能体",
      "更多工作模式和 Codex 使用额度",
      "抢先体验新工具和模型",
      "提供 3 档使用额度",
      "支持开具正规采购凭证/收据用于财务报销",
    ],
    popular: false,
  },
];

// FAQ
const FAQ_CATEGORIES = [
  "售前咨询",
  "充值流程",
  "账号使用",
  "售后支持",
  "Codex",
];

const FAQS = [
  {
    category: "售前咨询",
    q: "ChatGPT 代充会封号吗？安全吗？",
    a: "我们使用苹果官方正规礼品卡渠道完成充值，全程无需提供账号密码，不触碰你的私人对话与数据。官方合规账单，绝非低价黑卡或来路不明的虚拟卡，100% 账号安全零风险。",
  },
  {
    category: "售前咨询",
    q: "支持哪些支付方式？需要开通海外信用卡吗？",
    a: "完全不需要海外卡！直接支持国内最常用的微信支付与支付宝扫码。付款后系统秒级自动生成充值卡密，省去高达几十美元的境外虚拟卡开卡费与汇率损耗。",
  },
  {
    category: "充值流程",
    q: "购买后的整体充值流程是怎样的？",
    a: "极简三步：1. 选择套餐，微信或支付宝付款；2. 获得专属充值卡密与官方激活教程链接；3. 按照 1 分钟新手教程直接激活，权益即刻生效。",
  },
  {
    category: "充值流程",
    q: "代充支持哪些类型的账号？",
    a: "只要能正常登录 chatgpt.com 的任何账号（包括 Google 登录、微软登录、苹果登录、QQ/163 邮箱注册的账号）均完美支持。",
  },
  {
    category: "账号使用",
    q: "到期后会自动扣费吗？次月怎么续费？",
    a: "绝不会自动扣款！我们是一次性买断制订阅，不绑定任何扣款协议。次月如果需要继续使用，在会员到期日前重新在平台下单即可稳定续费。",
  },
  {
    category: "售后支持",
    q: "如果充值不成功怎么处理？退款方便吗？",
    a: "我们提供 100% 售后退款保障。如因卡密无效或账号环境问题未成功开通，请联系在线客服，我们承诺立即为你原路退还全额款项，绝不拖延。",
  },
];

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordFade, setWordFade] = useState(true);
  const [noticeIdx, setNoticeIdx] = useState(0);
  const [noticeFade, setNoticeFade] = useState(true);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState("售前咨询");

  const handleCopy = () => {
    navigator.clipboard.writeText("CR-9F2A-88KL-7K2Q");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setWordFade(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
        setWordFade(true);
      }, 250);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNoticeFade(false);
      setTimeout(() => {
        setNoticeIdx((prev) => (prev + 1) % SOCIAL_NOTICES.length);
        setNoticeFade(true);
      }, 250);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1)),
      );
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredFaqs = FAQS.filter((f) => f.category === selectedCategory);

  return (
    <div
      className="min-h-screen bg-white text-[#111827] antialiased selection:bg-indigo-600 selection:text-white"
      style={{
        fontFamily:
          'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. 导航栏 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
              G
            </div>
            <div>
              <div className="font-bold text-lg tracking-[-0.5px] text-[#111827] leading-tight">
                GPT <span className="text-indigo-600">Pro</span>
              </div>
              <div className="text-[11px] text-gray-400 font-normal leading-tight">
                ChatGPT 订阅服务
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <Link
              href="/plus-price"
              className="hover:text-indigo-600 transition-colors"
            >
              ChatGPT 充值
            </Link>
            <Link
              href="/plus-price"
              className="hover:text-indigo-600 transition-colors"
            >
              Pro 专区
            </Link>
            <a
              href="#process"
              className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
            >
              <span>充值教程</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <a
              href="#testimonials"
              className="hover:text-indigo-600 transition-colors"
            >
              用户评价
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
            >
              <span>Claude 订阅</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Gemini
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Grok
            </a>
          </nav>

          <button
            onClick={() => alert("请联系右下角在线客服核对订单状态")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-400" />
            <span>查询订单</span>
          </button>
        </div>
      </header>

      {/* 2. Hero 首屏（黄金比例：72px 大标题，紧凑舒适，一屏完全收纳所有元素） */}
      <section className="pt-16 pb-14 text-center relative bg-white">
        <div className="max-w-5xl mx-auto px-6">
          {/* 平衡版大标题：72px（绝不过大压迫，绝不偏小空荡） */}
          <h1
            className="font-bold text-[#111827] mb-2 text-center"
            style={{
              fontSize: "clamp(42px, 5.5vw, 70px)",
              lineHeight: "1.08",
              letterSpacing: "-1.5px",
            }}
          >
            <div>ChatGPT Plus/Pro</div>
            <div className="mt-0.5">充值服务</div>
          </h1>

          {/* 卖点轮换词：32px 精致居中 */}
          <div className="h-12 flex items-center justify-center mb-4">
            <span
              className="font-bold text-indigo-600 transition-all duration-300"
              style={{
                fontSize: "clamp(24px, 3vw, 34px)",
                lineHeight: "38px",
                letterSpacing: "-0.6px",
              }}
            >
              {ROTATING_WORDS[wordIdx]}
            </span>
          </div>

          {/* 描述段落（限制 540px，两行规整） */}
          <p className="max-w-[540px] mx-auto mb-7 text-center font-normal text-gray-600 text-base sm:text-[17px] leading-relaxed">
            GETGPT 通过正规渠道 2 分钟内即可完成 ChatGPT
            充值，让每个人都能轻松订阅 ChatGPT Plus/Pro。
          </p>

          {/* 主大按钮（立即充值 > 点击平滑滚到 #pricing） */}
          <div className="flex flex-col items-center justify-center gap-3 mb-7">
            <Link
              href="/plus-price"
              className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base px-9 h-[50px] rounded-full shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <span>立即充值</span>
              <span className="font-bold text-lg leading-none ml-1">&gt;</span>
            </Link>

            <Link
              href="/plus-price"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
            >
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                Pro
              </span>
              <span>也支持 ChatGPT Pro 订阅</span>
              <span className="text-gray-400 font-bold">&gt;</span>
            </Link>
          </div>

          {/* 用户数背书 + 动态轮播通知 */}
          <div className="flex flex-col items-center justify-center gap-1.5 mb-10 select-none">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
              <div className="flex -space-x-1.5 items-center">
                <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px]">
                  👨🏻
                </div>
                <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[10px]">
                  👩🏻
                </div>
                <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-[10px]">
                  👨🏼
                </div>
              </div>
              <span>
                已帮助{" "}
                <strong className="text-[#111827] font-bold text-sm sm:text-base">
                  8.9万+
                </strong>{" "}
                位用户完成订阅
              </span>
            </div>

            <div className="h-5 flex items-center justify-center overflow-hidden">
              <div
                className={`flex items-center gap-1.5 text-xs text-gray-500 font-medium transition-all duration-300 transform ${
                  noticeFade
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span>{SOCIAL_NOTICES[noticeIdx]}</span>
              </div>
            </div>
          </div>

          {/* 3 大保障（鼠标悬停平滑抬起 + 阴影立体感） */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-3xl mx-auto mb-8 text-left">
            <div className="group flex items-center gap-3.5 bg-white sm:bg-white/80 border border-gray-200/80 hover:border-indigo-200 p-3 px-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#111827] font-bold text-sm leading-snug">
                  售后无忧
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap leading-snug">
                  充值失败 100% 立即退款
                </div>
              </div>
            </div>

            <div className="group flex items-center gap-3.5 bg-white sm:bg-white/80 border border-gray-200/80 hover:border-indigo-200 p-3 px-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#111827] font-bold text-sm leading-snug">
                  极速到账
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap leading-snug">
                  平均 2 分钟内自动完成
                </div>
              </div>
            </div>

            <div className="group flex items-center gap-3.5 bg-white sm:bg-white/80 border border-gray-200/80 hover:border-indigo-200 p-3 px-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#111827] font-bold text-sm leading-snug">
                  支付便捷
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap leading-snug">
                  支持支付宝 / 微信支付
                </div>
              </div>
            </div>
          </div>

          <a
            href="#pricing"
            className="inline-flex flex-col items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors group"
          >
            <span className="font-medium">下滑查看充值流程</span>
            <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-400 transition-all">
              <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform text-gray-500" />
            </div>
          </a>
        </div>
      </section>

      {/* 5. 套餐价格矩阵（精细收敛比例：卡片高度控制在单屏内，价格 38px 优雅清晰） */}
      <section
        id="pricing"
        className="scroll-mt-16 py-20 bg-[#fafbfc] border-t border-gray-100"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2 tracking-[-0.8px]">
              选择适合你的 AI 套餐
            </h2>
            <p className="text-gray-500 text-sm">
              所有套餐均享有 100% 充值失败退款保障，支持微信 / 支付宝扫码支付
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "bg-white border-2 border-indigo-600 shadow-[0_8px_30px_-5px_rgba(99,102,241,0.15)] ring-4 ring-indigo-50 hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.25)]"
                    : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {plan.tag}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-lg font-bold text-[#111827] tracking-[-0.3px]">
                      {plan.name}
                    </h3>
                    {!plan.popular && (
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-semibold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mb-3">
                    {plan.dailyPrice}
                  </div>

                  <p className="text-gray-500 text-xs sm:text-sm mb-3 leading-relaxed font-normal">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-sm font-medium text-gray-400">¥</span>
                    <span className="text-4xl font-black text-[#111827] tracking-[-1px]">
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {plan.period}
                    </span>
                    {plan.originalPrice !== plan.price && (
                      <span className="ml-2 text-xs text-gray-400 line-through">
                        ¥{plan.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-5 border-t border-gray-100 mb-6">
                    {plan.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-[13px] text-gray-600 leading-normal"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/purchase?plan=${plan.id}`}
                  className={`flex w-full items-center justify-center rounded-xl py-3 text-center font-bold text-sm transition-all duration-200 ${
                    plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-98"
                      : "bg-gray-100 hover:bg-gray-200 text-[#111827] active:scale-98"
                  }`}
                >
                  立即购买
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 充值流程（带选项卡点击与右侧 macOS 拟真窗口） */}
      <section
        id="process"
        className="scroll-mt-16 py-20 bg-white border-t border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2.5 tracking-[-0.8px]">
              ChatGPT 代充 & 充值流程
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              简单三步走，全程无需密码，系统自动化交付
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* 左侧可交互三步卡片 */}
            <div className="lg:col-span-6 space-y-3.5">
              <div
                onClick={() => setActiveStep(1)}
                className={`flex gap-4 p-5 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeStep === 1
                    ? "bg-white border-2 border-indigo-600 shadow-lg shadow-indigo-500/10 ring-4 ring-indigo-50"
                    : "bg-[#fafbfc] border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm transition-colors ${
                    activeStep === 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-base mb-1 tracking-[-0.3px]">
                    购买充值卡密
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    下单并支付完成，系统自动生成专属充值卡密。
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveStep(2)}
                className={`flex gap-4 p-5 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeStep === 2
                    ? "bg-white border-2 border-indigo-600 shadow-lg shadow-indigo-500/10 ring-4 ring-indigo-50"
                    : "bg-[#fafbfc] border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm transition-colors ${
                    activeStep === 2
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  2
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-base mb-1 tracking-[-0.3px]">
                    输入 GPT 账户信息
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    输入 GPT 账户信息或按指引激活，系统将自动升级会员。
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveStep(3)}
                className={`flex gap-4 p-5 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeStep === 3
                    ? "bg-white border-2 border-indigo-600 shadow-lg shadow-indigo-500/10 ring-4 ring-indigo-50"
                    : "bg-[#fafbfc] border border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm transition-colors ${
                    activeStep === 3
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  3
                </div>
                <div>
                  <h4 className="font-bold text-[#111827] text-base mb-1 tracking-[-0.3px]">
                    完成账户充值
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    系统自动为您的 ChatGPT 账户充值，1
                    分钟内即可完成充值并生效。
                  </p>
                </div>
              </div>
            </div>

            {/* 右侧 macOS 拟真窗口 */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 font-medium">
                    {activeStep === 1 && "getgpt.pro/order"}
                    {activeStep === 2 && "getgpt.pro/activate"}
                    {activeStep === 3 && "chatgpt.com/settings"}
                  </div>
                  <div className="w-10" />
                </div>

                {activeStep === 1 && (
                  <div className="animate-in fade-in duration-300">
                    <div className="text-center my-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div className="font-bold text-[#111827] text-lg">
                        支付完成，卡密已生成
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        复制卡密后即可进入充值验证
                      </div>
                    </div>

                    <div className="my-5">
                      <div className="text-xs text-gray-500 mb-1.5 font-semibold">
                        充值卡密
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono text-sm text-gray-800">
                        <span className="font-bold tracking-wider">
                          CR-9F2A-••••-7K2Q
                        </span>
                        <button
                          onClick={handleCopy}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 font-sans transition-all active:scale-95"
                        >
                          {copied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copied ? "已复制" : "复制"}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveStep(2)}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-98"
                    >
                      前往激活 →
                    </button>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="animate-in fade-in duration-300">
                    <div className="text-center my-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        STEP 2
                      </span>
                      <div className="font-bold text-[#111827] text-lg mt-1">
                        核验充值卡密
                      </div>
                    </div>

                    <div className="space-y-3 my-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1 font-medium">
                          卡密已自动载入
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono text-xs text-gray-600 font-bold">
                          CR-9F2A-••••-7K2Q
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1 font-medium">
                          需升级的 ChatGPT 账户
                        </div>
                        <input
                          type="text"
                          readOnly
                          value="user@example.com (官方免密直连)"
                          className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveStep(3)}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-98"
                    >
                      验证卡密并开通
                    </button>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="animate-in fade-in duration-300">
                    <div className="text-center my-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                        <Zap className="w-7 h-7" />
                      </div>
                      <div className="font-bold text-[#111827] text-lg">
                        ChatGPT Plus 会员已生效
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        GPT-4o、o1 推理模型全量解锁
                      </div>
                    </div>

                    <div className="my-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>订阅状态：Plus 会员已激活 (30天)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>模型权限：GPT-4o / o1 思考模式正常可用</span>
                      </div>
                    </div>

                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      前往 ChatGPT 体验 →
                    </a>
                  </div>
                )}

                <div className="text-center text-[11px] text-gray-400 pt-2.5 border-t border-gray-50">
                  官方正规渠道 · 免账号密码 · 充值失败 100% 立即退款
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 为什么选择 GETGPT Pro */}
      <section
        id="why-us"
        className="scroll-mt-16 py-20 bg-[#fafbfc] border-t border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2.5 tracking-[-0.8px]">
              为什么选择 GETGPT Pro
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              上线一年多的专业 ChatGPT 代充平台，为数万用户提供稳定可靠的 Plus /
              Pro 充值服务
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-1.5 tracking-[-0.3px]">
                充值失败全额退款
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                充值失败 100% 立即全额退款，售后零推脱，请放心使用我们的服务。
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-1.5 tracking-[-0.3px]">
                无需海外信用卡
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                没有海外信用卡也不用愁，支付宝与微信即可完成 ChatGPT Plus 代充。
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-1.5 tracking-[-0.3px]">
                安全可靠保障
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                正规官方代充渠道，全程无需提供账号密码，全方位保护您的隐私安全。
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-1.5 tracking-[-0.3px]">
                极速到账
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                通常 1–5 分钟内完成充值到账，全自动发卡处理，无需漫长等待。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 用户评价（全宽无限平滑走马灯） */}
      <section
        id="testimonials"
        className="py-20 bg-white border-t border-gray-100 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2 tracking-[-0.8px]">
            已服务 <span className="text-indigo-600">8.9万+</span>{" "}
            位用户稳定充值
          </h2>

          <div className="flex items-center justify-center gap-1 mb-6 text-sm">
            <span className="font-bold text-[#111827] mr-2">
              4.9 / 5 综合好评
            </span>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <button
            onClick={() => alert("查看真实微信反馈截图")}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            查看真实微信反馈
          </button>
        </div>

        {/* 动态走马灯 */}
        <div className="space-y-4 relative w-full overflow-hidden">
          <div className="flex gap-4 animate-marquee whitespace-nowrap">
            {[...REVIEWS_ROW_1, ...REVIEWS_ROW_1].map((t, idx) => (
              <div
                key={idx}
                className="w-[340px] p-5 rounded-2xl bg-[#fafbfc] border border-gray-200/80 shadow-xs flex-shrink-0 text-left whitespace-normal"
              >
                <div className="text-gray-300 font-serif text-2xl leading-none mb-1.5">
                  “
                </div>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 font-normal line-clamp-3">
                  {t.text}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-gray-400">{t.title}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 animate-marquee-reverse whitespace-nowrap">
            {[...REVIEWS_ROW_2, ...REVIEWS_ROW_2].map((t, idx) => (
              <div
                key={idx}
                className="w-[340px] p-5 rounded-2xl bg-[#fafbfc] border border-gray-200/80 shadow-xs flex-shrink-0 text-left whitespace-normal"
              >
                <div className="text-gray-300 font-serif text-2xl leading-none mb-1.5">
                  “
                </div>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4 font-normal line-clamp-3">
                  {t.text}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#111827]">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-gray-400">{t.title}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 常见问题 QA */}
      <section id="faq" className="py-20 bg-[#fafbfc] border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2 tracking-[-0.8px]">
              ChatGPT 充值常见问题 QA
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              整理了用户最关心的 ChatGPT 充值问题，找不到答案可直接联系客服。
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveFaq(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-[#111827] hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${activeFaq === idx ? "rotate-180 text-indigo-600" : ""}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8 text-xs text-gray-400">
            没有找到你的问题？
            <a href="#" className="text-indigo-600 underline font-medium">
              点击右下角联系客服
            </a>
          </div>
        </div>
      </section>

      {/* 8. 页脚（纯黑收拢底座） */}
      <footer className="py-16 bg-[#0D0E15] text-[#9CA3AF] text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  G
                </div>
                <span className="font-bold text-lg text-white">GETGPT Pro</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm max-w-sm mb-4 leading-relaxed">
                专业的 ChatGPT Plus / Pro 充值服务平台，支持支付宝、微信支付，2
                分钟快速到账，充值失败 100% 立即退款。
              </p>
              <div className="text-gray-500 text-xs">
                客服工作时间：每天 9:00 – 23:00（紧急问题 15 分钟内响应）
              </div>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">
                ChatGPT 充值
              </div>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    ChatGPT Plus 代充
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    ChatGPT Pro 升级
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Codex 额度充值
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    API 额度充值
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">
                AI 矩阵订阅
              </div>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Claude 3.5 订阅
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Grok / SuperGrok
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Gemini Pro 充值
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cursor Pro 激活
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">
                帮助与支持
              </div>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    常见问题 FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#process"
                    className="hover:text-white transition-colors"
                  >
                    充值教程与排查
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    查询订单
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    收款凭证示例
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>
              本站为独立第三方技术服务平台，非 OpenAI 官方网站，与 OpenAI
              无隶属关系。© 2025–2026 GETGPT Pro. All rights reserved.
            </p>
            <div className="flex gap-6 font-medium text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                关于我们
              </a>
              <a href="#" className="hover:text-white transition-colors">
                隐私政策
              </a>
              <a href="#" className="hover:text-white transition-colors">
                服务条款
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* 9. 右下角常驻在线客服按钮 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => alert("正在呼叫在线客服，请稍候...")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">在线客服</span>
        </button>
      </div>
    </div>
  );
}
