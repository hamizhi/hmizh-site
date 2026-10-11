"use client";

import {
  Package,
  FileText,
  Upload,
  Send,
  Search,
  Trash2,
  RefreshCw,
  Home,
  Copy,
  Tag,
  CalendarDays,
  Clock3,
  DollarSign,
  PackageCheck,
  Percent,
  Save,
  Settings2,
  TrendingUp,
  X,
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
  stockPro10x: number;
  stockPro25x: number;
  stockPro20x: number;
  stockPro50x: number;
  stockAccount: number;
};

type DashboardPlan = {
  id: string;
  label: string;
  stockPlanId: string;
  costPlanId: string;
  stock: number;
  cost: number;
};

type DashboardData = {
  orderCount: number;
  paidOrderCount: number;
  paymentAmount: number;
  totalCost: number;
  totalProfit: number;
  profitRate: number;
  pendingOrderCount: number;
  plans: DashboardPlan[];
  costs: Record<string, number>;
  periodStart: string;
  periodEnd: string;
};

type Order = {
  id: number;
  order_id: string;
  email: string;
  plan_id: string;
  plan_name: string | null;
  money: number;
  coupon_code?: string | null;
  discount_amount?: number;
  status: string;
  card_code: string | null;
  client_ip: string | null;
  created_at: string;
  updated_at: string;
};

type Coupon = {
  code: string;
  amount: number;
  plan_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Card = {
  id: number;
  plan_id: string;
  card_code: string;
  status: string;
  order_id: string | null;
  import_source?: 'manual' | 'auto';
  is_redeemed?: number;
  used_at?: string | null;
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
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<"today" | "7d" | "30d" | "custom">("today");
  const [dashboardStartDate, setDashboardStartDate] = useState("");
  const [dashboardEndDate, setDashboardEndDate] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costDraft, setCostDraft] = useState<Record<string, string>>({});
  const [savingCosts, setSavingCosts] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "stock" | "import" | "orders" | "coupons" | "issue" | "redemptions">("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [customDeliveryOrder, setCustomDeliveryOrder] = useState<Order | null>(null);
  const [customDeliveryCode, setCustomDeliveryCode] = useState("");
  const [orderUserIdSearch, setOrderUserIdSearch] = useState("");
  const [orderAccountSearch, setOrderAccountSearch] = useState("");
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [orderIpSearch, setOrderIpSearch] = useState("");
  const [orderProductSearch, setOrderProductSearch] = useState("");
  const [orderStartDate, setOrderStartDate] = useState("");
  const [orderEndDate, setOrderEndDate] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSort, setOrderSort] = useState("default");
  const [cards, setCards] = useState<Card[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponAmount, setCouponAmount] = useState("");
  const [couponPlanId, setCouponPlanId] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [couponIsActive, setCouponIsActive] = useState(true);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [cdkRedemptions, setCdkRedemptions] = useState<CdkRedemption[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [stockFilter, setStockFilter] = useState<"unsold" | "sold">("unsold");
  const [unsoldSubFilter, setUnsoldSubFilter] = useState<"all" | "manual" | "auto">("all");
  const [soldSubFilter, setSoldSubFilter] = useState<"all" | "unredeemed" | "redeemed">("all");

  // CDK 发码相关状态
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["plus"]); // 改为数组支持多选
  const [planCounts, setPlanCounts] = useState<Record<string, number | "">>({
    go: 1,
    plus: 1,
    "pro-5x": 1,
    pro_20x: 1,
    pro_50x: 1,
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
  const [duplicateImportPrompt, setDuplicateImportPrompt] = useState<{
    duplicateCount: number;
    planId: string;
    cardCodes: string;
  } | null>(null);

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
        if (response.status === 401) {
          alert(data.message || "管理密码不正确");
        } else {
          alert(data.message || "后台数据加载失败，请稍后重试");
        }
        return;
      }

      setIsAuthed(true);
      setStats(data.stats);
      setOrders(data.orders);
      setCards(data.cards);
      setCoupons(data.coupons || []);
      setCdkRedemptions(data.cdkRedemptions || []);
      void loadDashboard(pwd);
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

  const getDashboardRange = (range = dashboardRange) => {
    const now = new Date();
    if (range === "custom") {
      if (!dashboardStartDate || !dashboardEndDate) return null;
      const start = new Date(`${dashboardStartDate}T00:00:00`);
      const end = new Date(`${dashboardEndDate}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return { startAt: start.toISOString(), endAt: end.toISOString() };
    }

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (range === "7d") start.setDate(start.getDate() - 6);
    if (range === "30d") start.setDate(start.getDate() - 29);
    return { startAt: start.toISOString(), endAt: now.toISOString() };
  };

  const loadDashboard = async (pwd = password, range = dashboardRange) => {
    const period = getDashboardRange(range);
    if (!period) return;
    setDashboardLoading(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_dashboard",
          password: pwd,
          ...period,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "仪表盘数据加载失败");
        return;
      }
      setDashboard(data.dashboard);
      setCostDraft(
        Object.fromEntries(
          data.dashboard.plans.map((plan: DashboardPlan) => [plan.costPlanId, String(plan.cost || 0)]),
        ),
      );
    } catch {
      alert("仪表盘数据加载失败，请检查数据库连接");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDashboardRangeChange = (range: "today" | "7d" | "30d" | "custom") => {
    setDashboardRange(range);
    if (range !== "custom") {
      void loadDashboard(password, range);
    }
  };

  const handleCustomDashboardDateChange = (
    nextStartDate: string,
    nextEndDate: string,
  ) => {
    setDashboardStartDate(nextStartDate);
    setDashboardEndDate(nextEndDate);
    if (nextStartDate && nextEndDate && nextStartDate <= nextEndDate) {
      window.setTimeout(() => void loadDashboard(password, "custom"), 0);
    }
  };

  const openCostSettings = () => {
    if (!dashboard) return;
    setCostDraft(
      Object.fromEntries(
        dashboard.plans.map((plan) => [plan.costPlanId, String(plan.cost || 0)]),
      ),
    );
    setCostModalOpen(true);
  };

  const handleSaveCosts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const costs = Object.fromEntries(
      Object.entries(costDraft).map(([planId, value]) => [planId, Number(value)]),
    );
    if (Object.values(costs).some((cost) => !Number.isFinite(cost) || cost < 0)) {
      alert("成本价必须是大于或等于 0 的数字");
      return;
    }

    setSavingCosts(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_plan_costs", password, costs }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "成本价保存失败");
        return;
      }
      setCostModalOpen(false);
      await loadDashboard();
    } catch {
      alert("成本价保存失败，请稍后重试");
    } finally {
      setSavingCosts(false);
    }
  };

  const money = (value: number) => `¥${Number(value || 0).toFixed(2)}`;

  const importCards = (force = false, planId = importPlan, cardCodes = importText) =>
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "import_cards",
        password,
        planId,
        cardCodes,
        force,
      }),
    });

  const handleImport = async () => {
    if (!importText.trim()) {
      alert("请在下方输入卡密，一行一个");
      return;
    }

    setImporting(true);

    try {
      let response = await importCards();
      let data = await response.json();

      if (response.status === 409 && data.requiresForce) {
        const duplicateCount = Number(data.duplicateCount || 0);
        setDuplicateImportPrompt({
          duplicateCount,
          planId: importPlan,
          cardCodes: importText,
        });
        return;
      }

      alert(data.message);

      if (response.ok && data.success) {
        setImportText("");
        await loadData();
      }
    } catch {
      alert("网络连接异常");
    } finally {
      setImporting(false);
    }
  };

  const handleForceImport = async () => {
    if (!duplicateImportPrompt) return;

    const pendingImport = duplicateImportPrompt;
    setDuplicateImportPrompt(null);
    setImporting(true);

    try {
      const response = await importCards(true, pendingImport.planId, pendingImport.cardCodes);
      const data = await response.json();

      alert(data.message);

      if (response.ok && data.success) {
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

  const orderStatuses = [
    { value: "pending", label: "待支付" },
    { value: "paid", label: "已支付" },
    { value: "delivering", label: "交付中" },
    { value: "delivered", label: "已交付" },
    { value: "custom_delivery", label: "自定义交付" },
    { value: "canceled", label: "已取消" },
  ] as const;

  const orderStatusLabel = (status: string) =>
    orderStatuses.find((item) => item.value === status)?.label || status;

  const handleOrderStatusChange = async (orderId: string, status: Order["status"]) => {
    if (status === "custom_delivery") {
      const order = orders.find((item) => item.order_id === orderId);
      if (order) {
        setCustomDeliveryOrder(order);
        setCustomDeliveryCode("");
      }
      return;
    }

    if (status === "delivered" && !confirm("确认将订单标记为已交付并分配一张卡密？")) {
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_order_status",
          password,
          orderId,
          status,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "订单状态更新失败");
        return;
      }
      alert(data.message || "订单状态已更新");
      await loadData();
    } catch {
      alert("网络连接异常");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCustomDelivery = async () => {
    if (!customDeliveryOrder) return;
    const cardCode = customDeliveryCode.trim();
    if (!cardCode) {
      alert("请输入卡密");
      return;
    }
    if (!confirm(`确认使用这张卡密完成订单 ${customDeliveryOrder.order_id} 的交付？`)) {
      return;
    }

    setUpdatingOrderId(customDeliveryOrder.order_id);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_order_status",
          password,
          orderId: customDeliveryOrder.order_id,
          status: "delivered",
          cardCode,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "自定义交付失败");
        return;
      }
      setCustomDeliveryOrder(null);
      setCustomDeliveryCode("");
      alert(data.message || "订单已自定义交付");
      await loadData();
    } catch {
      alert("网络连接异常");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const copyOrderValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      alert("复制失败，请手动复制");
    }
  };

  const resetCouponForm = () => {
    setEditingCouponCode(null);
    setCouponCode("");
    setCouponAmount("");
    setCouponPlanId("");
    setCouponExpiry("");
    setCouponIsActive(true);
  };

  const toLocalDateTime = (value: string | null) =>
    value
      ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";

  const openCouponEditor = (coupon?: Coupon) => {
    if (!coupon) {
      resetCouponForm();
      setCouponModalOpen(true);
      return;
    }
    setEditingCouponCode(coupon.code);
    setCouponCode(coupon.code);
    setCouponAmount(String(coupon.amount));
    setCouponPlanId(coupon.plan_id || "");
    setCouponExpiry(toLocalDateTime(coupon.expires_at));
    setCouponIsActive(coupon.is_active);
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = couponCode.trim().toUpperCase();
    const amount = Number(couponAmount);
    if (
      !/^[A-Z0-9_-]{3,32}$/.test(code) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6
    ) {
      alert("请检查优惠码和优惠金额");
      return;
    }

    setSavingCoupon(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_coupon",
          password,
          code,
          amount,
          planId: couponPlanId || null,
          expiresAt: couponExpiry ? new Date(couponExpiry).toISOString() : null,
          isActive: couponIsActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "优惠码保存失败");
        return;
      }
      setCouponModalOpen(false);
      resetCouponForm();
      alert(data.message || "优惠码已保存");
      await loadData();
    } catch {
      alert("网络连接异常");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`确定删除优惠码 ${code} 吗？`)) return;
    setSavingCoupon(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_coupon", password, code }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "优惠码删除失败");
        return;
      }
      alert(data.message || "优惠码已删除");
      await loadData();
    } catch {
      alert("网络连接异常");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    setSavingCoupon(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_coupon",
          password,
          code: coupon.code,
          amount: coupon.amount,
          planId: coupon.plan_id,
          expiresAt: coupon.expires_at,
          isActive: !coupon.is_active,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "优惠码状态更新失败");
        return;
      }
      await loadData();
    } catch {
      alert("网络连接异常");
    } finally {
      setSavingCoupon(false);
    }
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
        const count = getPlanCount(plan);
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
    const totalCount = selectedPlans.reduce((sum, plan) => sum + getPlanCount(plan), 0);

    if (totalCount > 100) {
      alert("总发放数量不能超过 100 张");
      return;
    }

    const planList = selectedPlans.map(plan => `${planNames[plan] || plan}: ${getPlanCount(plan)}张`).join("\n");
    if (!confirm(`确认发放以下 CDK？\n\n${planList}\n\n总计: ${totalCount} 张\n地区: ${issueCountry}/${issueCurrency}`)) {
      return;
    }

    setIssuing(true);
    setIssuedCdks([]);

    try {
      // 批量发放多个套餐
      const allCdks: string[] = [];

      for (const plan of selectedPlans) {
        const count = getPlanCount(plan);

        const response = await fetch("/api/admin/issue-cdk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: plan,
            count: count,
            paymentCountry: issueCountry,
            paymentCurrency: issueCurrency,
            password,
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

  const getPlanCount = (plan: string) => {
    const count = planCounts[plan];
    return typeof count === "number" && count >= 1 ? count : 1;
  };

  const updatePlanCount = (plan: string, count: number | "") => {
    setPlanCounts(prev => ({
      ...prev,
      [plan]: count === "" ? "" : Math.max(1, Math.min(100, count))
    }));
  };

  if (!isAuthed) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
    pro_10x: "Pro 10x",
    pro_25x: "Pro 25x",
    pro_20x: "Pro 20x",
    pro_50x: "Pro 50x",
    account: "Plus成品号",
  };

  const filteredCards = cards.filter((c) => {
    const matchesSearch = c.card_code.toLowerCase().includes(searchKey.toLowerCase());

    // 主筛选：未售出 vs 已售出
    let matchesStatus = false;
    if (stockFilter === "unsold") {
      matchesStatus = c.status === 'unused';
      // 未售出子筛选
      if (matchesStatus && unsoldSubFilter !== "all") {
        const source = c.import_source || 'manual';
        matchesStatus = source === unsoldSubFilter;
      }
    } else {
      matchesStatus = c.status === 'used';
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

  const filteredOrders = [...orders].filter((order) => {
    const userId = orderUserIdSearch.trim().toLowerCase();
    const account = orderAccountSearch.trim().toLowerCase();
    const orderId = orderIdSearch.trim().toLowerCase();
    const ip = orderIpSearch.trim().toLowerCase();
    const product = orderProductSearch.trim().toLowerCase();
    const createdAt = new Date(order.created_at).getTime();
    const startDate = orderStartDate ? new Date(orderStartDate).getTime() : null;
    const endDate = orderEndDate ? new Date(orderEndDate).getTime() : null;

    const matchesUserId = !userId || String(order.id).toLowerCase().includes(userId);
    const matchesAccount = !account || order.email.toLowerCase().includes(account);
    const matchesOrderId = !orderId || order.order_id.toLowerCase().includes(orderId);
    const matchesIp = !ip || (order.client_ip || "").toLowerCase().includes(ip);
    const matchesProduct = !product || `${order.plan_name || ""} ${order.plan_id}`.toLowerCase().includes(product);
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesStartDate = startDate === null || createdAt >= startDate;
    const matchesEndDate = endDate === null || createdAt <= endDate;
    return matchesUserId && matchesAccount && matchesOrderId && matchesIp &&
      matchesProduct && matchesStatus && matchesStartDate && matchesEndDate;
  }).sort((first, second) => {
    if (orderSort === "oldest") {
      return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    }
    if (orderSort === "amount-desc") {
      return Number(second.money) - Number(first.money);
    }
    if (orderSort === "amount-asc") {
      return Number(first.money) - Number(second.money);
    }
    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
  });

  return (
    <div className="admin-shell flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 左侧导航栏 */}
      <aside className="w-56 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Package className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">米智AI</h2>
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
            onClick={() => setCurrentView("coupons")}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              currentView === "coupons"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Tag className="h-4 w-4" />
            优惠码
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
                {currentView === "coupons" && "优惠码"}
                {currentView === "issue" && "在线发放 CDK"}
                {currentView === "redemptions" && "CDK 兑换记录"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {currentView === "dashboard" && "查看核心运营指标"}
                {currentView === "stock" && "管理和查看卡密库存"}
                {currentView === "import" && "批量导入充值卡密"}
                {currentView === "orders" && "查看所有订单记录"}
                {currentView === "coupons" && "管理付款减免"}
                {currentView === "issue" && "直接从卡台发放 CDK"}
                {currentView === "redemptions" && "查看用户 CDK 兑换详情"}
              </p>
            </div>

            {currentView === "dashboard" ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                  {[
                    { value: "today", label: "今天" },
                    { value: "7d", label: "最近 7 天" },
                    { value: "30d", label: "最近 30 天" },
                    { value: "custom", label: "自定义" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        handleDashboardRangeChange(
                          item.value as "today" | "7d" | "30d" | "custom",
                        )
                      }
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        dashboardRange === item.value
                          ? "bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {dashboardRange === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dashboardStartDate}
                      onChange={(event) =>
                        handleCustomDashboardDateChange(
                          event.target.value,
                          dashboardEndDate,
                        )
                      }
                      aria-label="仪表盘开始日期"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                    />
                    <span className="text-xs text-zinc-400">至</span>
                    <input
                      type="date"
                      value={dashboardEndDate}
                      onChange={(event) =>
                        handleCustomDashboardDateChange(
                          dashboardStartDate,
                          event.target.value,
                        )
                      }
                      aria-label="仪表盘结束日期"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  disabled={dashboardLoading}
                  aria-label="刷新仪表盘"
                  title="刷新仪表盘"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${dashboardLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                aria-busy={loading}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "刷新中..." : "刷新数据"}
              </button>
            )}
          </div>

          {/* 仪表盘 */}
          {currentView === "dashboard" && (
            <div className="space-y-6">
              {!dashboard ? (
                <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
                  {dashboardLoading ? "正在加载仪表盘..." : "暂无仪表盘数据"}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">经营概览</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(dashboard.periodStart).toLocaleDateString("zh-CN")} 至{" "}
                        {new Date(
                          new Date(dashboard.periodEnd).getTime() - 1,
                        ).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCostSettings}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
                    >
                      <Settings2 className="h-4 w-4" />
                      成本价设置
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      {
                        label: "订单总数",
                        value: dashboard.orderCount.toLocaleString(),
                        hint: `已支付 ${dashboard.paidOrderCount} 单`,
                        icon: FileText,
                      },
                      {
                        label: "支付金额",
                        value: money(dashboard.paymentAmount),
                        hint: "已支付、交付中和已交付订单",
                        icon: DollarSign,
                      },
                      {
                        label: "总成本",
                        value: money(dashboard.totalCost),
                        hint: "按套餐成本价自动计算",
                        icon: Package,
                      },
                      {
                        label: "总利润",
                        value: money(dashboard.totalProfit),
                        hint: dashboard.totalProfit >= 0 ? "当前周期为正利润" : "当前周期为负利润",
                        icon: TrendingUp,
                      },
                      {
                        label: "利润率",
                        value: `${dashboard.profitRate.toFixed(2)}%`,
                        hint: "总利润 ÷ 支付金额",
                        icon: Percent,
                      },
                      {
                        label: "待支付订单",
                        value: dashboard.pendingOrderCount.toLocaleString(),
                        hint: "当前时间范围内未完成支付",
                        icon: Clock3,
                      },
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.label}
                          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm text-zinc-500">{metric.label}</p>
                              <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-zinc-950">
                                {metric.value}
                              </p>
                              <p className="mt-2 text-xs text-zinc-400">{metric.hint}</p>
                            </div>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                        <div>
                          <h2 className="text-base font-semibold text-zinc-950">自动交付可用卡密</h2>
                          <p className="mt-1 text-xs text-zinc-500">按后台卡台套餐统计未分配库存</p>
                        </div>
                        <PackageCheck className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {dashboard.plans.map((plan) => (
                          <div
                            key={plan.id}
                            className="flex items-center justify-between gap-4 px-5 py-3.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-800">{plan.label}</p>
                              <p className="mt-1 text-xs text-zinc-400">
                                卡台方案：{plan.stockPlanId}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                plan.stock > 0
                                  ? "bg-zinc-100 text-zinc-800"
                                  : "bg-zinc-50 text-zinc-400"
                              }`}
                            >
                              {plan.stock} 张
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-zinc-950">成本价设置</h2>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            设置每个套餐的实际成本，仪表盘会自动重新计算利润。
                          </p>
                        </div>
                        <DollarSign className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="mt-5 space-y-3">
                        {dashboard.plans.map((plan) => (
                          <div key={plan.id} className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm text-zinc-600">{plan.label}</span>
                            <span className="shrink-0 font-mono text-sm text-zinc-900">
                              {money(plan.cost)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={openCostSettings}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200"
                      >
                        <Settings2 className="h-4 w-4" />
                        编辑成本价
                      </button>
                    </section>
                  </div>
                </>
              )}
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
                  未售出 ({cards.filter(c => c.status === 'unused').length})
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
                  已售出 ({cards.filter(c => c.status === 'used').length})
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
                              {card.status === 'used' ? (
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
                              {card.status === 'unused' && (
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
                    <option value="account">Plus成品号</option>
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

          {/* 优惠码 */}
          {currentView === "coupons" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">优惠码</h2>
                  <p className="mt-1 text-sm text-slate-400">设置付款时的固定金额减免</p>
                </div>
                <button
                  type="button"
                  onClick={() => openCouponEditor()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <span className="text-lg leading-none">+</span>
                  新增优惠码
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-slate-700/50 bg-slate-800/30 text-xs text-slate-400">
                      <tr>
                        <th className="px-5 py-3">优惠码</th>
                        <th className="px-5 py-3">减免金额</th>
                        <th className="px-5 py-3">适用套餐</th>
                        <th className="px-5 py-3">过期时间</th>
                        <th className="px-5 py-3">状态</th>
                        <th className="px-5 py-3">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {coupons.map((coupon) => (
                        <tr key={coupon.code} className="hover:bg-slate-800/20">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-white">{coupon.code}</span>
                              <button
                                type="button"
                                title="复制优惠码"
                                onClick={() => void copyOrderValue(coupon.code)}
                                className="text-slate-500 transition hover:text-white"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            ¥{coupon.amount.toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {coupon.plan_id ? planNames[coupon.plan_id] || coupon.plan_id : "全部套餐"}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-400">
                            {coupon.expires_at
                              ? new Date(coupon.expires_at).toLocaleString("zh-CN")
                              : "长期有效"}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              coupon.is_active
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-700/50 text-slate-400"
                            }`}>
                              {coupon.is_active ? "启用" : "停用"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={savingCoupon}
                                onClick={() => openCouponEditor(coupon)}
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-indigo-500 hover:text-white disabled:opacity-50"
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                disabled={savingCoupon}
                                onClick={() => void handleToggleCoupon(coupon)}
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white disabled:opacity-50"
                              >
                                {coupon.is_active ? "停用" : "启用"}
                              </button>
                              <button
                                type="button"
                                disabled={savingCoupon}
                                onClick={() => void handleDeleteCoupon(coupon.code)}
                                className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                            暂无优惠码
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 订单列表 */}
          {currentView === "orders" && (
            <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50">
              <div className="border-b border-slate-700/50 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <input
                    type="search"
                    value={orderUserIdSearch}
                    onChange={(event) => setOrderUserIdSearch(event.target.value)}
                    placeholder="用户ID"
                    aria-label="用户ID"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <input
                    type="search"
                    value={orderAccountSearch}
                    onChange={(event) => setOrderAccountSearch(event.target.value)}
                    placeholder="用户邮箱 / 昵称 / 第三方账号"
                    aria-label="用户邮箱、昵称或第三方账号"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <input
                    type="search"
                    value={orderIdSearch}
                    onChange={(event) => setOrderIdSearch(event.target.value)}
                    placeholder="订单号"
                    aria-label="订单号"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <input
                    type="search"
                    value={orderIpSearch}
                    onChange={(event) => setOrderIpSearch(event.target.value)}
                    placeholder="IP地址"
                    aria-label="客户端IP"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />
                  <input
                    type="search"
                    value={orderProductSearch}
                    onChange={(event) => setOrderProductSearch(event.target.value)}
                    placeholder="商品名称"
                    aria-label="商品名称"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-400">创建时间</span>
                  <input
                    type="datetime-local"
                    value={orderStartDate}
                    onChange={(event) => setOrderStartDate(event.target.value)}
                    aria-label="创建时间开始"
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="datetime-local"
                    value={orderEndDate}
                    onChange={(event) => setOrderEndDate(event.target.value)}
                    aria-label="创建时间结束"
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(event) => setOrderStatusFilter(event.target.value)}
                    aria-label="按订单状态筛选"
                    className="min-w-[140px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="all">全部状态</option>
                    {orderStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <select
                    value={orderSort}
                    onChange={(event) => setOrderSort(event.target.value)}
                    aria-label="订单排序"
                    className="min-w-[140px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="default">默认排序</option>
                    <option value="oldest">最早创建</option>
                    <option value="amount-desc">金额从高到低</option>
                    <option value="amount-asc">金额从低到高</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadData()}
                    disabled={loading}
                    aria-busy={loading}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "刷新中..." : "刷新"}
                  </button>
                  {(orderUserIdSearch || orderAccountSearch || orderIdSearch || orderIpSearch ||
                    orderProductSearch || orderStartDate || orderEndDate || orderStatusFilter !== "all" || orderSort !== "default") && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderUserIdSearch("");
                        setOrderAccountSearch("");
                        setOrderIdSearch("");
                        setOrderIpSearch("");
                        setOrderProductSearch("");
                        setOrderStartDate("");
                        setOrderEndDate("");
                        setOrderStatusFilter("all");
                        setOrderSort("default");
                      }}
                      className="rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      重置
                    </button>
                  )}
                  <span className="text-xs text-slate-500">显示 {filteredOrders.length} / {orders.length} 条</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1560px] w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[64px]" />
                    <col className="w-[205px]" />
                    <col className="w-[155px]" />
                    <col className="w-[260px]" />
                    <col className="w-[125px]" />
                    <col className="w-[110px]" />
                    <col className="w-[275px]" />
                    <col className="w-[140px]" />
                    <col className="w-[140px]" />
                    <col className="w-[190px]" />
                  </colgroup>
                  <thead className="border-b border-slate-700/50 bg-slate-800/30 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">ID</th>
                      <th className="whitespace-nowrap px-4 py-3">订单号 / 时间</th>
                      <th className="whitespace-nowrap px-4 py-3">商品信息</th>
                      <th className="whitespace-nowrap px-4 py-3">用户</th>
                      <th className="whitespace-nowrap px-4 py-3">客户端IP</th>
                      <th className="whitespace-nowrap px-4 py-3">支付金额</th>
                      <th className="whitespace-nowrap px-4 py-3">状态</th>
                      <th className="whitespace-nowrap px-4 py-3">创建时间</th>
                      <th className="whitespace-nowrap px-4 py-3">更新时间</th>
                      <th className="whitespace-nowrap px-4 py-3">分配卡密</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredOrders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-4 font-mono text-xs text-slate-300">
                          #{order.id}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="min-w-0 truncate font-mono text-xs text-white" title={order.order_id}>{order.order_id}</span>
                            <button
                              type="button"
                              title="复制订单号"
                              onClick={() => copyOrderValue(order.order_id)}
                              className="shrink-0 text-slate-500 transition hover:text-white"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          <div className="truncate" title={order.plan_name || order.plan_id}>{order.plan_name || order.plan_id}</div>
                          <div className="mt-1 truncate text-xs text-slate-500" title={`SKU: ${order.plan_id} ×1`}>SKU: {order.plan_id} ×1</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          <span className="block break-all" title={`游客: ${order.email}`}>游客: {order.email}</span>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-400">
                          <span className="block truncate" title={order.client_ip || "-"}>{order.client_ip || "-"}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-white">
                          ¥{Number(order.money).toFixed(2)}
                          {order.coupon_code && <div className="mt-1 truncate text-xs font-normal text-emerald-400" title={`${order.coupon_code} -¥${Number(order.discount_amount || 0).toFixed(2)}`}>{order.coupon_code} -¥{Number(order.discount_amount || 0).toFixed(2)}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                              order.status === "delivered"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : order.status === "canceled"
                                  ? "bg-rose-500/10 text-rose-400"
                                  : order.status === "pending"
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-sky-500/10 text-sky-400"
                            }`}>
                              {orderStatusLabel(order.status)}
                            </span>
                            <select
                              aria-label={`修改订单 ${order.order_id} 状态`}
                              value={order.status}
                              disabled={updatingOrderId === order.order_id}
                              onChange={(event) =>
                                void handleOrderStatusChange(order.order_id, event.target.value)
                              }
                              className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 disabled:opacity-50"
                            >
                              {orderStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">
                          {new Date(order.updated_at).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-4">
                          {order.card_code ? (
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="min-w-0 truncate font-mono text-xs text-emerald-300" title={order.card_code}>{order.card_code}</span>
                              <button
                                type="button"
                                title="复制分配的卡密"
                                onClick={() => copyOrderValue(order.card_code as string)}
                                className="shrink-0 text-slate-500 transition hover:text-white"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">未分配</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                          没有找到匹配的订单
                        </td>
                      </tr>
                    )}
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
                      { id: "pro_20x", name: "Pro 20x", color: "rose" },
                      { id: "pro_50x", name: "Pro 50x", color: "orange" },
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
                        pro_20x: { name: "Pro 20x", color: "rose" },
                        pro_50x: { name: "Pro 50x", color: "orange" },
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
                            value={planCounts[planId] ?? ""}
                            onChange={(e) => updatePlanCount(planId, e.target.value === "" ? "" : Number(e.target.value))}
                            onBlur={() => {
                              if (planCounts[planId] === "") updatePlanCount(planId, 1);
                            }}
                            className="w-32 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-center text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <span className="text-sm text-slate-400">张</span>
                        </div>
                      );
                    })}
                    <div className="rounded-lg bg-indigo-500/10 px-3 py-2 text-sm text-indigo-400">
                      总计：{selectedPlans.reduce((sum, plan) => sum + getPlanCount(plan), 0)} 张
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
                  placeholder="搜索邮箱、套餐、订单号、Session、Token..."
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
                      <th className="px-4 py-3 font-medium">Session</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">订单号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cdkRedemptions
                      .filter(
                        (r) =>
                          !searchKey ||
                          r.email?.toLowerCase().includes(searchKey.toLowerCase()) ||
                          r.plan?.toLowerCase().includes(searchKey.toLowerCase()) ||
                          r.session_data?.toLowerCase().includes(searchKey.toLowerCase()) ||
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
                          <td className="max-w-[360px] px-4 py-3">
                            {redemption.session_data ? (
                              <details className="group">
                                <summary className="cursor-pointer select-none text-xs font-medium text-zinc-700 hover:text-zinc-950">
                                  查看 Session
                                </summary>
                                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-5 text-zinc-700">
                                  {redemption.session_data}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-xs text-zinc-400">暂无 Session</span>
                            )}
                          </td>
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
                              {redemption.order_id || "无订单号"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {cdkRedemptions.filter(
                  (r) =>
                    !searchKey ||
                    r.email?.toLowerCase().includes(searchKey.toLowerCase()) ||
                    r.plan?.toLowerCase().includes(searchKey.toLowerCase()) ||
                    r.session_data?.toLowerCase().includes(searchKey.toLowerCase()) ||
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
      {couponModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setCouponModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCoupon}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              {editingCouponCode ? "编辑优惠码" : "新增优惠码"}
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-zinc-700">
                优惠码
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  disabled={Boolean(editingCouponCode)}
                  placeholder="例如 SAVE10"
                  maxLength={32}
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-zinc-900 outline-none focus:border-zinc-900 disabled:bg-zinc-100"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                减免金额
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-zinc-500">¥</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={couponAmount}
                    onChange={(event) => setCouponAmount(event.target.value)}
                    placeholder="10"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                    required
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                适用套餐
                <select
                  value={couponPlanId}
                  onChange={(event) => setCouponPlanId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                >
                  <option value="">全部套餐</option>
                  <option value="go">ChatGPT Go</option>
                  <option value="plus">ChatGPT Plus</option>
                  <option value="account">Plus成品号</option>
                  <option value="pro-5x">Pro 5x</option>
                  <option value="pro-10x">Pro 10x</option>
                  <option value="pro-25x">Pro 25x</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                过期时间
                <input
                  type="datetime-local"
                  value={couponExpiry}
                  onChange={(event) => setCouponExpiry(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={couponIsActive}
                  onChange={(event) => setCouponIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                立即启用
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCouponModalOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={savingCoupon}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {savingCoupon ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}
      {costModalOpen && dashboard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="presentation"
          onClick={() => setCostModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCosts}
            className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">设置套餐成本价</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  成本价只影响仪表盘利润计算，不会修改客户购买价格。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCostModalOpen(false)}
                aria-label="关闭成本价设置"
                title="关闭"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard.plans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-800">
                      {plan.label}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      卡台方案：{plan.stockPlanId}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-zinc-400">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costDraft[plan.costPlanId] ?? "0"}
                      onChange={(event) =>
                        setCostDraft((current) => ({
                          ...current,
                          [plan.costPlanId]: event.target.value,
                        }))
                      }
                      aria-label={`${plan.label}成本价`}
                      className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-right font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900"
                    />
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CalendarDays className="h-3.5 w-3.5" />
                保存后会立即刷新当前仪表盘
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCostModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingCosts}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingCosts ? "保存中..." : "保存成本价"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {duplicateImportPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setDuplicateImportPrompt(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-import-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="duplicate-import-title" className="text-lg font-semibold text-zinc-900">
              检测到重复卡密
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              检测到 {duplicateImportPrompt.duplicateCount} 张重复卡密。强制导入后，重复卡密会作为新的库存记录，可再次分配给付款订单。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDuplicateImportPrompt(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleForceImport()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                确认强制导入
              </button>
            </div>
          </div>
        </div>
      )}
      {customDeliveryOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setCustomDeliveryOrder(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-delivery-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="custom-delivery-title" className="text-lg font-semibold text-zinc-900">
              自定义交付
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              为订单 <span className="font-mono text-zinc-900">{customDeliveryOrder.order_id}</span> 手动输入卡密，提交后订单会变为“已交付”。
            </p>
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              卡密
              <textarea
                value={customDeliveryCode}
                onChange={(event) => setCustomDeliveryCode(event.target.value)}
                placeholder="请输入完整卡密"
                rows={3}
                autoFocus
                className="mt-2 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomDeliveryOrder(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!customDeliveryCode.trim() || updatingOrderId === customDeliveryOrder.order_id}
                onClick={() => void handleCustomDelivery()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingOrderId === customDeliveryOrder.order_id ? "交付中..." : "确认交付"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
