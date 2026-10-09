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
  import_source?: 'manual' | 'auto';
  is_redeemed?: number;
};

type CdkRedemption = {
  id: number;
  redemption_token: string;
  card_code_hint: string | null;
  email: string | null;
  session_data: string | null;
  plan: string | null;
  order_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "stock" | "import" | "orders" | "issue" | "redemptions">("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cdkRedemptions, setCdkRedemptions] = useState<CdkRedemption[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [stockFilter, setStockFilter] = useState<"unsold" | "sold">("unsold");
  const [unsoldSubFilter, setUnsoldSubFilter] = useState<"all" | "manual" | "auto">("all");
  const [soldSubFilter, setSoldSubFilter] = useState<"all" | "unredeemed" | "redeemed">("all");

  // CDK 发码相关状态
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["plus"]); // 改为数组支持多选
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({
    go: 1,
    plus: 1,
    "pro-5x": 1,
    pro: 1,
  }); // 每个套餐的数量
  const [issueCountry, setIssueCountry] = useState("US");
  const [issueCurrency, setIssueCurrency] = useState("USD");
  const [issuing, setIssuing] = useState(false);
  const [issuedCdks, setIssuedCdks] = useState<string[]>([]);
  const [selectedCdks, setSelectedCdks] = useState<string[]>([]);
  const [devMode, setDevMode] = useState(false); // 开发模式

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
      setCdkRedemptions(data.cdkRedemptions || []);
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
    if (selectedPlans.length === 0) {
      alert("请至少选择一个套餐");
      return;
    }

    // 开发模式：直接生成模拟 CDK
    if (devMode) {
      const mockCdks: string[] = [];
      for (const plan of selectedPlans) {
        const count = planCounts[plan] || 1;
        for (let i = 0; i < count; i++) {
          mockCdks.push(`DEV-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        }
      }
      setIssuedCdks(mockCdks);
      setSelectedCdks([]);
      alert(`开发模式：成功生成 ${mockCdks.length} 张模拟 CDK！`);
      return;
    }

    // 计算总数量
    const totalCount = selectedPlans.reduce((sum, plan) => sum + (planCounts[plan] || 1), 0);

    if (totalCount > 100) {
      alert("总发放数量不能超过 100 张");
      return;
    }

    const planList = selectedPlans.map(plan => `${planNames[plan] || plan}: ${planCounts[plan] || 1}张`).join("\n");
    if (!confirm(`确认发放以下 CDK？\n\n${planList}\n\n总计: ${totalCount} 张\n地区: ${issueCountry}/${issueCurrency}`)) {
      return;
    }

    setIssuing(true);
    setIssuedCdks([]);

    try {
      // 批量发放多个套餐
      const allCdks: string[] = [];

      for (const plan of selectedPlans) {
        const count = planCounts[plan] || 1;

        const response = await fetch("/api/admin/issue-cdk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: plan,
            count: count,
            paymentCountry: issueCountry,
            paymentCurrency: issueCurrency,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          alert(`发码失败 (${plan}): ${data.error || "未知错误"}`);
          continue;
        }

        allCdks.push(...(data.cdks || []));
      }

      setIssuedCdks(allCdks);
      setSelectedCdks([]); // 重置选择
      alert(`成功发放 ${allCdks.length} 张 CDK！`);

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
          planId: selectedPlans[0] || "plus", // 使用第一个选中的套餐
          cardCodes: selectedCdks.join("\n"),
          importSource: "auto", // 标记为自动导入
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

  const togglePlanSelection = (plan: string) => {
    setSelectedPlans(prev =>
      prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
    );
  };

  const updatePlanCount = (plan: string, count: number) => {
    setPlanCounts(prev => ({
      ...prev,
      [plan]: Math.max(1, Math.min(100, count))
    }));
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
    "pro-5x": "Pro 5x",
    pro: "Pro",
    pro_5x: "Pro 5x",
    pro_20x: "Pro 20x",
    pro_50x: "Pro 50x",
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = c.card_code.toLowerCase().includes(searchKey.toLowerCase());

    // 主筛选：未售出 vs 已售出
    let matchesStatus = false;
    if (stockFilter === "unsold") {
      matchesStatus = !c.is_used;
      // 未售出子筛选
      if (matchesStatus && unsoldSubFilter !== "all") {
        const source = c.import_source || 'manual';
        matchesStatus = source === unsoldSubFilter;
      }
    } else {
      matchesStatus = c.is_used === 1;
      // 已售出子筛选
      if (matchesStatus && soldSubFilter !== "all") {
        if (soldSubFilter === "unredeemed") {
          matchesStatus = (c.is_redeemed || 0) === 0;
        } else {
          matchesStatus = (c.is_redeemed || 0) === 1;
        }
      }
    }

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

          <button
            onClick={() => setCurrentView("redemptions")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "redemptions"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <FileText className="h-4 w-4" />
            CDK 兑换记录
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
                {currentView === "redemptions" && "CDK 兑换记录"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {currentView === "dashboard" && "查看核心运营指标"}
                {currentView === "stock" && "管理和查看卡密库存"}
                {currentView === "import" && "批量导入充值卡密"}
                {currentView === "orders" && "查看所有订单记录"}
                {currentView === "issue" && "直接从卡台发放 CDK"}
                {currentView === "redemptions" && "查看用户 CDK 兑换详情"}
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
                  onClick={() => {
                    setStockFilter("unsold");
                    setUnsoldSubFilter("all");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    stockFilter === "unsold"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  未售出 ({cards.filter(c => !c.is_used).length})
                </button>
                <button
                  onClick={() => {
                    setStockFilter("sold");
                    setSoldSubFilter("all");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    stockFilter === "sold"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  已售出 ({cards.filter(c => c.is_used).length})
                </button>
              </div>

              {/* 子筛选 */}
              {stockFilter === "unsold" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setUnsoldSubFilter("all")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      unsoldSubFilter === "all"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setUnsoldSubFilter("manual")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      unsoldSubFilter === "manual"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    手动导入
                  </button>
                  <button
                    onClick={() => setUnsoldSubFilter("auto")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      unsoldSubFilter === "auto"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    自动导入
                  </button>
                </div>
              )}

              {stockFilter === "sold" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSoldSubFilter("all")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      soldSubFilter === "all"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setSoldSubFilter("unredeemed")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      soldSubFilter === "unredeemed"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    未兑换
                  </button>
                  <button
                    onClick={() => setSoldSubFilter("redeemed")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      soldSubFilter === "redeemed"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-700/30 hover:text-white"
                    }`}
                  >
                    已兑换
                  </button>
                </div>
              )}

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
                                // 已售出
                                (card.is_redeemed || 0) === 1 ? (
                                  <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">
                                    已售出已兑换
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400">
                                    已售出未兑换
                                  </span>
                                )
                              ) : (
                                // 未售出
                                <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400">
                                  未售出
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
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">批量发放 CDK</h2>
                  <button
                    onClick={() => setDevMode(!devMode)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      devMode
                        ? "bg-amber-500 text-white"
                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {devMode ? "🔧 开发模式" : "开发模式"}
                  </button>
                </div>

                {devMode && (
                  <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-400">
                    ⚠️ 开发模式：将生成模拟 CDK，不会调用真实接口
                  </div>
                )}

                {/* 第一行：套餐类型（圆形多选） */}
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    套餐类型（可多选）
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: "go", name: "Go", color: "emerald" },
                      { id: "plus", name: "Plus", color: "blue" },
                      { id: "pro-5x", name: "Pro 5x", color: "purple" },
                      { id: "pro", name: "Pro", color: "rose" },
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => togglePlanSelection(plan.id)}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                          selectedPlans.includes(plan.id)
                            ? `bg-${plan.color}-500/20 text-${plan.color}-400 ring-2 ring-${plan.color}-500`
                            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border-2 transition ${
                            selectedPlans.includes(plan.id)
                              ? `border-${plan.color}-500 bg-${plan.color}-500`
                              : "border-slate-600"
                          }`}
                        >
                          {selectedPlans.includes(plan.id) && (
                            <div className="flex h-full items-center justify-center text-white text-xs">✓</div>
                          )}
                        </div>
                        {plan.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 第二行：每个已选套餐的数量输入 */}
                {selectedPlans.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      发放数量
                    </label>
                    {selectedPlans.map((planId) => {
                      const planInfo = {
                        go: { name: "ChatGPT Go", color: "emerald" },
                        plus: { name: "ChatGPT Plus", color: "blue" },
                        "pro-5x": { name: "Pro 5x", color: "purple" },
                        pro: { name: "Pro", color: "rose" },
                      }[planId];

                      return (
                        <div key={planId} className="flex items-center gap-3">
                          <div className={`w-24 rounded-lg bg-${planInfo?.color}-500/10 px-3 py-2 text-center text-sm font-medium text-${planInfo?.color}-400`}>
                            {planInfo?.name}
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={planCounts[planId] || 1}
                            onChange={(e) => updatePlanCount(planId, Number(e.target.value))}
                            className="w-32 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-center text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="text-sm text-slate-400">张</span>
                        </div>
                      );
                    })}
                    <div className="rounded-lg bg-indigo-500/10 px-3 py-2 text-sm text-indigo-400">
                      总计：{selectedPlans.reduce((sum, plan) => sum + (planCounts[plan] || 1), 0)} 张
                    </div>
                  </div>
                )}

                {/* 付款地区 */}
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
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                          selectedCdks.includes(cdk)
                            ? "bg-indigo-600/20 ring-2 ring-indigo-500"
                            : "bg-slate-800/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCdks.includes(cdk)}
                          onChange={() => toggleCdkSelection(cdk)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="flex-1 font-mono text-sm text-white">{cdk}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(cdk);
                            // 可以添加一个临时提示
                            const btn = e.currentTarget;
                            const originalText = btn.textContent;
                            btn.textContent = "已复制";
                            setTimeout(() => {
                              btn.textContent = originalText;
                            }, 1000);
                          }}
                          className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-600/50 active:scale-95"
                        >
                          复制
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CDK 兑换记录 */}
          {currentView === "redemptions" && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50">
              <div className="border-b border-slate-700/50 p-4">
                <input
                  type="text"
                  placeholder="搜索邮箱、订单号、Token..."
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-slate-400">
                      <th className="px-4 py-3 font-medium">兑换时间</th>
                      <th className="px-4 py-3 font-medium">邮箱</th>
                      <th className="px-4 py-3 font-medium">套餐</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">订单号</th>
                      <th className="px-4 py-3 font-medium">Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cdkRedemptions
                      .filter(
                        (r) =>
                          !searchKey ||
                          r.email?.toLowerCase().includes(searchKey.toLowerCase()) ||
                          r.order_id?.toLowerCase().includes(searchKey.toLowerCase()) ||
                          r.redemption_token?.toLowerCase().includes(searchKey.toLowerCase())
                      )
                      .map((redemption) => (
                        <tr key={redemption.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-300">
                            {new Date(redemption.created_at).toLocaleString("zh-CN")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-white">{redemption.email || "-"}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{redemption.plan || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                                redemption.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : redemption.status === "failed"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {redemption.status === "completed"
                                ? "已完成"
                                : redemption.status === "failed"
                                  ? "失败"
                                  : "进行中"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-400">
                              {redemption.order_id || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {redemption.session_data ? (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(redemption.session_data || "");
                                  alert("Session 已复制到剪贴板");
                                }}
                                className="rounded bg-indigo-600/20 px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-600/30"
                              >
                                复制 Session
                              </button>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {cdkRedemptions.filter(
                  (r) =>
                    !searchKey ||
                    r.email?.toLowerCase().includes(searchKey.toLowerCase()) ||
                    r.order_id?.toLowerCase().includes(searchKey.toLowerCase()) ||
                    r.redemption_token?.toLowerCase().includes(searchKey.toLowerCase())
                ).length === 0 && (
                  <div className="py-12 text-center text-slate-500">
                    {searchKey ? "没有找到匹配的兑换记录" : "暂无兑换记录"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
