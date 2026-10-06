"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, ChevronDown, Code2, CreditCard, ExternalLink,
  MessageCircle, Search, Shield, Wrench, Zap,
} from "lucide-react";
import SiteHeader from "../components/site-header";
import groups from "../data/faq.json";

const icons = [BookOpen, Zap, CreditCard, Shield, MessageCircle, Code2];

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(groups[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const matching = useMemo(() => groups.map(group => ({
    ...group,
    questions: group.questions.filter(item =>
      `${item.question} ${item.answer.join(" ")}`.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter(group => group.questions.length), [query]);

  function navigateTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <SiteHeader />
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      <div className="mb-12 space-y-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">有什么可以帮到你？</h1>
        <p className="mx-auto max-w-xl text-lg text-gray-500">整理了充值过程中最常见的问题，找不到答案请直接联系客服。</p>
        <div className="relative mx-auto max-w-xl"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索问题，例如：退款、到账、支付方式…" className="w-full rounded-lg border border-gray-200 bg-white py-4 pl-12 pr-12 text-sm shadow-md outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
        </div>
      </div>
      <a href="/help" className="mx-auto mb-10 flex max-w-2xl items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3.5 text-amber-900 hover:bg-amber-100">
        <span className="flex items-center gap-3"><Wrench className="h-5 w-5" /><span><strong className="block text-sm">已购买？遇到充值失败、账号登录、使用限制等问题？</strong><small className="text-xs text-amber-700">点击前往自助排查中心，快速解决常见问题</small></span></span><ArrowRight className="h-4 w-4 shrink-0" />
      </a>
      <div className="flex items-start gap-8">
        <aside className="sticky top-24 hidden w-52 shrink-0 lg:block">
          <nav className="space-y-1" aria-label="问题分类">{groups.map((group, index) => {
            const Icon = icons[index];
            return <button type="button" key={group.id} onClick={() => navigateTo(group.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${active === group.id ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}><Icon className="h-4 w-4" /><span>{group.name}</span><span className="ml-auto text-xs">{group.questions.length}</span></button>;
          })}</nav>
          <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm"><strong>没找到答案？</strong><p className="mt-1 text-xs leading-relaxed text-gray-500">右下角查看客服联系方式与工作时间。</p></div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">{groups.map(group => <button type="button" key={group.id} onClick={() => navigateTo(group.id)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${active === group.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200 bg-white text-gray-600"}`}>{group.name}</button>)}</div>
          {matching.map(group => {
            const Icon = icons[groups.findIndex(item => item.id === group.id)];
            return <section id={group.id} key={group.id} className="mb-12 scroll-mt-28">
              <div className="mb-5 flex items-center gap-3"><span className="rounded-lg bg-indigo-600 p-2 text-white"><Icon className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-indigo-600">{group.name}</h2><p className="text-xs text-gray-400">{group.questions.length} 个问题</p></div></div>
              <div className="space-y-3">{group.questions.map(item => <div key={item.id} id={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <button type="button" aria-expanded={open === item.id} onClick={() => setOpen(open === item.id ? null : item.id)} className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"><span className="text-sm font-medium text-gray-900">{item.question}</span><ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open === item.id ? "rotate-180" : ""}`} /></button>
                {open === item.id && <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600">{item.answer.map((paragraph, index) => <p className="mb-3" key={index}>{paragraph}</p>)}{item.links.map(anchor => <a href={anchor.href} key={anchor.href} className="mr-4 inline-flex items-center gap-1 text-indigo-600 hover:underline">{anchor.label}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div>}
              </div>)}</div>
            </section>;
          })}
          {!matching.length && <p className="py-16 text-center text-sm text-gray-500">没有找到匹配的问题</p>}
        </div>
      </div>
    </div>
  </main>;
}
