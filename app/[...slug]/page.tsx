import { notFound } from "next/navigation";
import SitePage, { type PageData } from "../components/site-page";
import data from "../data/site.json";

export function generateStaticParams() {
  const pages = data as Record<string, PageData>;
  const reservedRoutes = new Set(["faq", "plus-price", "purchase"]);
  const paths = new Set([
    ...Object.keys(pages).filter((path) => !reservedRoutes.has(path)),
    "business-recharge",
    "purchase-go",
    "purchase-gptpro",
    "order",
    ...((pages.blog?.tags ?? []).map(tag => tag.href.slice(1))),
  ]);
  return [...paths].map(path => ({ slug: path.split("/") }));
}

export default async function LocalRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");
  if (path === "faq" || path === "plus-price" || path === "purchase") notFound();
  const pages = data as Record<string, PageData>;
  const page = pages[path] ?? (path === "business-recharge" ? {
    title: "ChatGPT 企业批量充值",
    description: "面向企业与团队的 ChatGPT Plus / Pro 批量开通服务。",
    blocks: [
      { type: "h2", text: "企业与团队服务" },
      { type: "p", text: "支持批量充值、统一订单跟进与专属客服协助，适合团队采购和长期使用。" },
      { type: "h2", text: "如何办理" },
      { type: "p", text: "请先说明账号数量、目标套餐和预计开通时间，客服会根据需求确认可办理方案。" },
    ],
    links: [{ label: "联系客服", href: "/faq" }, { label: "查看套餐", href: "/plus-price" }],
  } : undefined);
  if (!page && !path.startsWith("blog/tag/") && !["purchase", "purchase-go", "purchase-gptpro", "order"].includes(path)) notFound();
  return <SitePage path={path} page={page} blog={pages.blog} />;
}
