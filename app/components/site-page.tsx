"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Search } from "lucide-react";
import SiteHeader from "./site-header";

type Block = { type: string; text: string; id?: string };
type Link = { label: string; href: string };
export type PageData = {
  title: string;
  description?: string;
  blocks?: Block[];
  links?: Link[];
  tags?: Link[];
  cards?: { href: string; title: string; description: string }[];
};

const transactions: Record<string, string> = {
  purchase: "ChatGPT Plus 购买",
  "purchase-go": "ChatGPT Go 购买",
  "purchase-gptpro": "GPT Pro 代充服务",
  order: "查询订单",
};

function Editorial({ path, page }: { path: string; page: PageData }) {
  const [open, setOpen] = useState(0);
  const collapsible = path === "help" || path === "guide";
  const blocks = page.blocks ?? [];
  const sections: { heading: Block; content: Block[] }[] = [];
  for (const block of blocks) {
    if (block.type === "h2") sections.push({ heading: block, content: [] });
    else if (sections.length) sections[sections.length - 1].content.push(block);
  }
  return <>
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />返回首页</a>
        <h1 className="mt-6 max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">{page.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{blocks.find(block => block.type === "p" && block.text.length > 25)?.text}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {path === "gptpro" && <a href="/purchase-gptpro" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">立即开通 Pro</a>}
          {path === "guide" && <a href="/plus-price" className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">购买卡密</a>}
          <a href="/plus-price" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold">查看全部套餐</a>
        </div>
      </div>
    </section>
    {path === "gptpro" && <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2" id="pro-plans-title">
      {[["Pro 5 倍版", "¥ 879", "经常使用，控制预算"], ["Pro 20 倍版", "¥ 1,799", "更高强度开发与长任务"]].map(([name, price, detail]) => <article key={name} className="rounded-lg border border-slate-200 bg-white p-7">
        <h2 className="text-xl font-bold">{name}</h2><p className="mt-2 text-sm text-slate-500">{detail}</p>
        <p className="my-6 text-3xl font-bold text-indigo-600">{price}<span className="text-sm font-normal text-slate-500"> / 月</span></p>
        <a href="/purchase-gptpro" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">选择套餐<ArrowRight className="h-4 w-4" /></a>
      </article>)}
    </section>}
    {path === "guide" && <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6"><details className="rounded-lg border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold">视频教程</summary><video controls preload="none" className="mt-4 w-full" src="https://cdn.getgpt.pro/files/getgptpro.mp4" /></details></div>}
    <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
      {sections.map(({ heading, content }, index) => <section key={index} id={heading.id || undefined} className="scroll-mt-28 border-b border-slate-200 py-8">
        {collapsible ? <button type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center justify-between gap-3 text-left text-xl font-semibold"><span>{heading.text}</span><ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === index ? "rotate-180" : ""}`} /></button> : <h2 className="text-xl font-semibold sm:text-2xl">{heading.text}</h2>}
        {(!collapsible || open === index) && <div className="mt-5 max-w-4xl space-y-4 text-sm leading-8 text-slate-600">{content.map((block, i) => block.type === "h3" ? <h3 key={i} className="pt-3 text-base font-semibold text-slate-900">{block.text}</h3> : <p key={i}>{block.text}</p>)}</div>}
      </section>)}
      {!!page.links?.length && <nav className="flex flex-wrap gap-3 py-8" aria-label="相关链接">{page.links.filter(link => !link.href.startsWith("#")).map((link, i) => <a key={`${link.href}-${i}`} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:border-indigo-300">{link.label}<ArrowRight className="h-3.5 w-3.5" /></a>)}</nav>}
    </div>
  </>;
}

function Blog({ page, tag }: { page: PageData; tag?: string }) {
  const [query, setQuery] = useState("");
  const cards = useMemo(() => (page.cards ?? []).filter(card => `${card.title} ${card.description}`.toLowerCase().includes(query.toLowerCase()) && (!tag || `${card.title} ${card.description}`.toLowerCase().includes(tag.toLowerCase()))), [page.cards, query, tag]);
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <p className="text-xs font-semibold text-indigo-600">GETGPT · 博客</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{tag || page.title}</h1>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">{page.description}</p>
    <div className="relative mt-8 max-w-lg"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500" placeholder="搜索文章" /></div>
    <nav className="my-8 flex flex-wrap gap-2 border-b border-slate-200 pb-6"><a href="/blog" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">全部文章</a>{page.tags?.map(item => <a key={item.href} href={item.href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-indigo-500">{item.label}</a>)}</nav>
    <div className="grid gap-4 md:grid-cols-2">{cards.map(card => <a href={card.href} key={card.href} className="rounded-lg border border-slate-200 bg-white p-6 hover:border-indigo-400"><h2 className="text-lg font-semibold">{card.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{card.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">阅读全文<ArrowRight className="h-4 w-4" /></span></a>)}</div>
    {!cards.length && <p className="py-14 text-slate-500">未找到相关文章</p>}
  </div>;
}

function Article({ page }: { page: PageData }) {
  const blocks = page.blocks ?? [];
  return <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_240px]">
    <article className="min-w-0"><a href="/blog" className="text-sm text-indigo-600">← 返回博客列表</a><h1 className="my-8 text-3xl font-bold leading-tight sm:text-4xl">{page.title}</h1>
      <div className="space-y-5 leading-8 text-slate-700">{blocks.filter(block => block.type !== "h1").map((block, i) => {
        if (block.type === "h2") return <h2 id={block.id || undefined} key={i} className="scroll-mt-28 border-b border-slate-200 pb-3 pt-8 text-2xl font-semibold text-slate-950">{block.text}</h2>;
        if (block.type === "h3") return <h3 id={block.id || undefined} key={i} className="scroll-mt-28 pt-4 text-lg font-semibold text-slate-900">{block.text}</h3>;
        if (block.type === "li") return <p key={i} className="pl-4 before:mr-2 before:text-indigo-500 before:content-['•']">{block.text}</p>;
        return <p key={i}>{block.text}</p>;
      })}</div>
      <div className="mt-12 flex flex-wrap gap-2 border-t border-slate-200 pt-6">{page.links?.filter(link => link.href.startsWith("/blog/tag/")).map(link => <a key={link.href} href={link.href} className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{link.label}</a>)}</div>
    </article>
    <aside className="hidden lg:block"><nav className="sticky top-28 border-l border-slate-200 pl-4 text-sm"><p className="mb-4 font-semibold">目录</p>{blocks.filter(block => block.type === "h2" && block.id).map((heading, i) => <a href={`#${heading.id}`} key={i} className="mb-3 block leading-5 text-slate-500 hover:text-indigo-600">{heading.text}</a>)}</nav></aside>
  </div>;
}

function Transaction({ path }: { path: string }) {
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState(false);
  const order = path === "order";
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <a href={order ? "/" : "/plus-price"} className="inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />返回{order ? "首页" : "套餐"}</a>
    <h1 className="mt-8 text-3xl font-bold">{transactions[path]}</h1><p className="mt-3 text-slate-600">{order ? "使用下单时的手机号查询订单进度。" : "选择套餐并确认账号信息。"}</p>
    <div className="mt-9 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label htmlFor="transaction-input" className="block text-sm font-medium">{order ? "下单手机号" : "ChatGPT 账号邮箱"}</label>
      <input id="transaction-input" value={input} onChange={e => setInput(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500" placeholder={order ? "输入下单手机号" : "输入目标账号邮箱"} />
      <button type="button" onClick={() => setNotice(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">{order ? "查询订单" : "继续"}<ArrowRight className="h-4 w-4" /></button>
      {notice && <p role="status" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">这是本地复刻页面，没有接入原站订单或支付服务，无法查询真实订单或完成付款。请勿在此提交密码或支付信息。</p>}
    </div>
  </div>;
}

export default function SitePage({ path, page, blog }: { path: string; page?: PageData; blog?: PageData }) {
  const tag = path.startsWith("blog/tag/") ? decodeURIComponent(path.slice(9)) : undefined;
  return <main className="min-h-screen bg-slate-50 text-slate-900"><SiteHeader />
    {transactions[path] ? <Transaction path={path} /> : path === "blog" || tag ? <Blog page={tag ? blog! : page!} tag={tag} /> : path.startsWith("blog/") ? <Article page={page!} /> : <Editorial path={path} page={page!} />}
    <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500"><a href="/" className="hover:text-indigo-600">GETGPT Pro</a><span className="mx-3">·</span><a href="/about" className="hover:text-indigo-600">关于我们</a><span className="mx-3">·</span><a href="/faq" className="hover:text-indigo-600">常见问题</a></footer>
  </main>;
}
