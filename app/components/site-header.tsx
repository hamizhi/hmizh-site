"use client";

import { useState } from "react";
import {
  ArrowUpRight, BookOpen, ChevronDown, CircleHelp, ListChecks, Menu, Wrench, X,
} from "lucide-react";

const links = [
  ["ChatGPT 充值", "/plus-price"],
  ["Pro 专区", "/gptpro"],
  ["博客指南", "/blog"],
  ["Claude 订阅", "https://upclaude.com/"],
  ["Gemini", "/gemini-pro"],
  ["Grok", "/grok"],
];
const guides = [
  { label: "充值教程", detail: "图文与视频，跟着步骤开通", href: "/guide", icon: BookOpen },
  { label: "常见问题", detail: "套餐、支付与售后解答", href: "/faq", icon: CircleHelp },
  { label: "自助排查", detail: "快速查找充值问题", href: "/help", icon: Wrench },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
      <a href="/" aria-label="GETGPT Pro 首页" className="flex shrink-0 items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] font-bold text-white shadow-md">G</span>
        <span className="flex flex-col"><strong className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] bg-clip-text text-lg leading-none text-transparent">GETGPT Pro</strong><small className="mt-1 text-[10px] text-gray-400">ChatGPT 订阅服务</small></span>
      </a>
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label="主导航">
        {links.slice(0, 2).map(([label, href]) => <a key={href} className="nav-link" href={href}>{label}</a>)}
        <div className="relative">
          <button className="nav-link" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>充值教程<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} /></button>
          {open && <div className="absolute right-0 top-full mt-3 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
            <p className="px-3 pb-2 pt-1 text-xs text-slate-400">充值步骤与问题解答</p>
            {guides.map(({ label, detail, href, icon: Icon }) => <a href={href} key={href} className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"><span className="rounded-lg bg-slate-100 p-2.5 text-slate-600"><Icon className="h-5 w-5" /></span><span><strong className="block text-sm">{label}</strong><small className="text-xs text-slate-500">{detail}</small></span></a>)}
          </div>}
        </div>
        {links.slice(2).map(([label, href]) => <a key={href} className="nav-link" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{label}{href.startsWith("http") && <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />}</a>)}
      </nav>
      <div className="flex items-center gap-2"><a href="/order" className="nav-link"><ListChecks className="h-4 w-4" />查询订单</a><button type="button" aria-label="打开导航菜单" aria-expanded={mobile} className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={() => setMobile(!mobile)}>{mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {mobile && <nav className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden" aria-label="移动导航">{[...links, ...guides.map(({ label, href }) => [label, href]), ["查询订单", "/order"]].map(([label, href]) => <a key={href} href={href} className="block rounded-lg px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">{label}</a>)}</nav>}
  </header>;
}
