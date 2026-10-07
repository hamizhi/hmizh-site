"use client";

import {
  BarChart3,
  Package,
  FileText,
  Upload,
  Send,
  Search,
  Trash2,
  RefreshCw,
  Home,
} from "lucide-react";
import { useState } from "react";

type Stats = {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  stockGo: number;
  stockPlus: number;
  stockPro5x: number;
  stockPro20x: number;
  stockPro50x: number;
};

type Order = {
  order_id: string;
  phone: string;
  plan_id: string;
  plan_name: string | null;
  money: number;
  status: string;
  card_code: string | null;
  created_at: string;
};

type Card = {
  id: number;
  plan_id: string;
  card_code: string;
  is_used: number;
  order_id: string | null;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "stock" | "import" | "orders" | "issue">("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [stockFilter, setStockFilter] = useState<"unused" | "used">("unused");

  // CDK 发码相关状态
  const [issuePlan, setIssuePlan] = useState("plus");
  const [issueCount, setIssueCount] = useState(1);
  const [issueCountry, setIssueCountry] = useState("US");
  const [issueCurrency, setIssueCurrency] = useState("USD");
  const [issuing, setIssuing] = useState(false);
  const [issuedCdks, setIssuedCdks] = useState<string[]>([]);
  const [selectedCdks, setSelectedCdks] = useState<string[]>([]);

  const [importPlan, setImportPlan] = useState("plus");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const loadData = async (pwd = password) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_data", password: pwd }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "登录密码错误");
        return;
      }

      setIsAuthed(true);
      setStats(data.stats);
      setOrders(data.orders);
      setCards(data.cards);
    } catch {
      alert("网络连接异常");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadData();
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      alert("请在下方输入卡密，一行一个");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_cards",
          password,
          planId: importPlan,
          cardCodes: importText,
        }),
      });
      const data = await response.json();
      alert(data.message);

      if (data.success) {
        setImportText("");
        await loadData();
      }
    } catch {
      alert("网络连接异常");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该卡密？")) return;

    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_card",
        password,
        cardId: id,
      }),
    });
    await loadData();
  };

  const handleIssueCdk = async () => {
    if (issueCount < 1 || issueCount > 100) {
      alert("发放数量必须在 1-100 之间");
      return;
    }

    if (!confirm(`确认发放 ${issueCount} 张 ${issuePlan} CDK？\n地区: ${issueCountry}/${issueCurrency}`)) {
      return;
    }

    setIssuing(true);
    setIssuedCdks([]);

    try {
      const response = await fetch("/api/admin/issue-cdk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: issuePlan,
          count: issueCount,
          paymentCountry: issueCountry,
          paymentCurrency: issueCurrency,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(`发码失败: ${data.error || "未知错误"}`);
        return;
      }

      setIssuedCdks(data.cdks || []);
      setSelectedCdks([]); // 重置选择
      alert(`成功发放 ${data.cdks?.length || 0} 张 CDK！`);

      await loadData();
    } catch (error) {
      alert(`网络错误: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIssuing(false);
    }
  };

  const handleImportIssuedCdks = async () => {
    if (selectedCdks.length === 0) {
      alert("请至少选择一个 CDK");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_cards",
          password,
          planId: issuePlan,
          cardCodes: selectedCdks.join("\n"),
        }),
      });
      const data = await response.json();
      alert(data.message);

      if (data.success) {
        // 从已发放列表中移除已导入的
        setIssuedCdks(prev => prev.filter(cdk => !selectedCdks.includes(cdk)));
        setSelectedCdks([]);
        await loadData();
      }
    } catch {
      alert("网络连接异常");
    } finally {
      setImporting(false);
    }
  };

  const toggleCdkSelection = (cdk: string) => {
    setSelectedCdks(prev =>
      prev.includes(cdk) ? prev.filter(c => c !== cdk) : [...prev, cdk]
    );
  };

  const toggleSelectAllCdks = () => {
    if (selectedCdks.length === issuedCdks.length) {
      setSelectedCdks([]);
    } else {
      setSelectedCdks([...issuedCdks]);
    }
  };

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Package className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-white">GETGPT 管理后台</h1>
            <p className="mt-2 text-sm text-slate-400">请输入管理密码登录</p>
          </div>

          <input
            type="password"
            placeholder="管理密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    );
  }

  const planNames: Record<string, string> = {
    go: "ChatGPT Go",
    plus: "ChatGPT Plus",
    pro_5x: "Pro 5x",
    pro_20x: "Pro 20x",
    pro_50x: "Pro 50x",
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = c.card_code.toLowerCase().includes(searchKey.toLowerCase());
    const matchesStatus = stockFilter === "unused" ? !c.is_used : c.is_used;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 左侧导航栏 */}
      <aside className="w-56 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Package className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">GETGPT</h2>
              <p className="text-xs text-slate-400">管理后台</p>
            </div>
          </div>
        </div>

        <nav className="px-3">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "dashboard"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Home className="h-4 w-4" />
            仪表盘
          </button>

          <button
            onClick={() => setCurrentView("stock")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "stock"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Package className="h-4 w-4" />
            卡密库存
          </button>

          <button
            onClick={() => setCurrentView("import")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "import"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Upload className="h-4 w-4" />
            卡密导入
          </button>

          <button
            onClick={() => setCurrentView("orders")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "orders"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            订单列表
          </button>

          <button
            onClick={() => setCurrentView("issue")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "issue"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Send className="h-4 w-4" />
            在线发放 CDK
          </button>
        </nav>
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* 顶部标题栏 */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {currentView === "dashboard" && "运营仪表盘"}
                {currentView === "stock" && "卡密库存"}
                {currentView === "import" && "卡密导入"}
                {currentView === "orders" && "订单列表"}
                {currentView === "issue" && "在线发放 CDK"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {currentView === "dashboard" && "查看核心运营指标"}
                {currentView === "stock" && "管理和查看卡密库存"}
                {currentView === "import" && "批量导入充值卡密"}
                {currentView === "orders" && "查看所有订单记录"}
                {currentView === "issue" && "直接从卡台发放 CDK"}
              </p>
            </div>

            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700/50"
            >
              <RefreshCw className="h-4 w-4" />
              刷新数据
            </button>
          </div>

          {/* 仪表盘 */}
          {currentView === "dashboard" && stats && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">今日销售额</p>
                      <p className="mt-2 text-3xl font-bold text-white">¥{stats.todayRevenue}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">累计销售额</p>
                      <p className="mt-2 text-3xl font-bold text-white">¥{stats.totalRevenue}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-500/10 p-2">
                      <BarChart3 className="h-5 w-5 text-indigo-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">已成交订单</p>
                      <p className="mt-2 text-3xl font-bold text-white">{stats.paidOrders} / {stats.totalOrders}</p>
                    </div>
                    <div className="rounded-lg bg-violet-500/10 p-2">
                      <Package className="h-5 w-5 text-violet-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                <h2 className="mb-4 text-lg font-bold text-white">套餐库存</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                    <span className="text-sm font-medium text-slate-300">ChatGPT Go</span>
                    <span className="text-lg font-bold text-white">{stats.stockGo} 张</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                    <span className="text-sm font-medium text-slate-300">ChatGPT Plus</span>
                    <span className="text-lg font-bold text-white">{stats.stockPlus} 张</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                    <span className="text-sm font-medium text-slate-300">Pro 5x</span>
                    <span className="text-lg font-bold text-white">{stats.stockPro5x} 张</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                    <span className="text-sm font-medium text-slate-300">Pro 20x</span>
                    <span className="text-lg font-bold text-white">{stats.stockPro20x} 张</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                    <span className="text-sm font-medium text-slate-300">Pro 50x</span>
                    <span className="text-lg font-bold text-white">{stats.stockPro50x} 张</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 卡密库存 */}
          {currentView === "stock" && (
            <div className="space-y-4">
              {/* 状态切换标签 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStockFilter("unused")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    stockFilter === "unused"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  未使用 ({cards.filter(c => !c.is_used).length})
                </button>
                <button
                  onClick={() => setStockFilter("used")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    stockFilter === "used"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  已使用 ({cards.filter(c => c.is_used).length})
                </button>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索卡密..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-700/50 bg-slate-800/30 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-6 py-3">卡密内容</th>
                        <th className="px-6 py-3">所属方案</th>
                        <th className="px-6 py-3">状态</th>
                        <th className="px-6 py-3">绑定订单</th>
                        <th className="px-6 py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredCards.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                            {searchKey ? "没有找到匹配的卡密" : "暂无数据"}
                          </td>
                        </tr>
                      ) : (
                        filteredCards.map((card) => (
                          <tr key={card.id} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-mono text-xs text-white">{card.card_code}</td>
                            <td className="px-6 py-4 text-slate-300">{planNames[card.plan_id]}</td>
                            <td className="px-6 py-4">
                              {card.is_used ? (
                                <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">
                                  已使用
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">
                                  待售出
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                              {card.order_id || "–"}
                            </td>
                            <td className="px-6 py-4">
                              {!card.is_used && (
                                <button
                                  onClick={() => handleDelete(card.id)}
                                  className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  删除
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 卡密导入 */}
          {currentView === "import" && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    选择方案
                  </label>
                  <select
                    value={importPlan}
                    onChange={(e) => setImportPlan(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="go">ChatGPT Go</option>
                    <option value="plus">ChatGPT Plus</option>
                    <option value="pro_5x">Pro 5x</option>
                    <option value="pro_20x">Pro 20x</option>
                    <option value="pro_50x">Pro 50x</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    卡密内容（一行一个）
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="EVER-8GRV-T77X-ZX5E&#x0A;EVER-AAAA-BBBB-CCCC"
                    rows={10}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importing ? "导入中..." : "确认批量导入"}
                </button>
              </div>
            </div>
          )}

          {/* 订单列表 */}
          {currentView === "orders" && (
            <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-700/50 bg-slate-800/30 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3">订单号 / 时间</th>
                      <th className="px-6 py-3">手机号</th>
                      <th className="px-6 py-3">购买方案</th>
                      <th className="px-6 py-3">支付金额</th>
                      <th className="px-6 py-3">支付状态</th>
                      <th className="px-6 py-3">分配卡密</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {orders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-slate-800/20">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-white">{order.order_id}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleString("zh-CN")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{order.phone}</td>
                        <td className="px-6 py-4 text-slate-300">{order.plan_name || order.plan_id}</td>
                        <td className="px-6 py-4 font-semibold text-white">¥{order.money}</td>
                        <td className="px-6 py-4">
                          {order.status === "paid" ? (
                            <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">
                              已支付
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">
                              待支付
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {order.card_code || "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 在线发放 CDK */}
          {currentView === "issue" && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6">
                <h2 className="mb-4 text-lg font-bold text-white">批量导入充值卡密</h2>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    套餐类型
                  </label>
                  <select
                    value={issuePlan}
                    onChange={(e) => setIssuePlan(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="go">ChatGPT Go</option>
                    <option value="plus">ChatGPT Plus</option>
                    <option value="pro_5x">Pro 5x</option>
                    <option value="pro_20x">Pro 20x</option>
                    <option value="pro_50x">Pro 50x</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    发放数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={issueCount}
                    onChange={(e) => setIssueCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    付款地区
                  </label>
                  <select
                    value={issueCountry}
                    onChange={(e) => {
                      setIssueCountry(e.target.value);
                      // 自动设置对应货币
                      const currencyMap: Record<string, string> = {
                        US: "USD",
                        JP: "JPY",
                        PH: "PHP",
                        CL: "CLP",
                        EG: "EGP",
                        NG: "NGN",
                        TR: "TRY",
                      };
                      setIssueCurrency(currencyMap[e.target.value] || "USD");
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="US">美国 (US)</option>
                    <option value="JP">日本 (JP)</option>
                    <option value="PH">菲律宾 (PH)</option>
                    <option value="CL">智利 (CL)</option>
                    <option value="EG">埃及 (EG)</option>
                    <option value="NG">尼日利亚 (NG)</option>
                    <option value="TR">土耳其 (TR)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    付款货币（自动）
                  </label>
                  <input
                    type="text"
                    value={issueCurrency}
                    readOnly
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2.5 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={handleIssueCdk}
                  disabled={issuing}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {issuing ? "发放中..." : "立即发放"}
                </button>
              </div>

              {issuedCdks.length > 0 && (
                <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-emerald-400">
                      发放成功！共 {issuedCdks.length} 张
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleSelectAllCdks}
                        className="rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700/50"
                      >
                        {selectedCdks.length === issuedCdks.length ? "取消全选" : "全选"}
                      </button>
                      <button
                        onClick={handleImportIssuedCdks}
                        disabled={selectedCdks.length === 0 || importing}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {importing ? "导入中..." : `导入选中 (${selectedCdks.length})`}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {issuedCdks.map((cdk, index) => (
                      <div
                        key={index}
                        onClick={() => toggleCdkSelection(cdk)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition ${
                          selectedCdks.includes(cdk)
                            ? "bg-indigo-600/20 ring-2 ring-indigo-500"
                            : "bg-slate-800/50 hover:bg-slate-700/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCdks.includes(cdk)}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="flex-1 font-mono text-sm text-white">{cdk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
