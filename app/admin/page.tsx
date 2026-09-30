"use client";

import {
  CreditCard,
  DollarSign,
  Layers,
  Lock,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

type Stats = {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  stockPlus: number;
  stockPro: number;
  stockAccount: number;
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchKey, setSearchKey] = useState("");
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

  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-center text-xl font-bold text-gray-900">
            GETGPT 运营管理后台
          </h1>
          <p className="mt-1 text-center text-xs text-gray-400">
            仅限管理员登录
          </p>

          <div className="my-6">
            <input
              type="password"
              placeholder="请输入管理密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "验证中..." : "进入后台"}
          </button>
        </form>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) =>
    searchKey
      ? order.phone.includes(searchKey) || order.order_id.includes(searchKey)
      : true,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              G
            </span>
            <span className="font-extrabold text-gray-900">
              GETGPT 独角数卡控制台
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 刷新数据
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 pt-8">
        <section className="grid gap-4 sm:grid-cols-4">
          <CardStat
            title="今日销售额"
            value={`¥${stats?.todayRevenue ?? 0}`}
            icon={<TrendingUp className="text-emerald-500" />}
          />
          <CardStat
            title="累计总销售额"
            value={`¥${stats?.totalRevenue ?? 0}`}
            icon={<DollarSign className="text-indigo-600" />}
          />
          <CardStat
            title="已成交订单 / 总订单"
            value={`${stats?.paidOrders ?? 0} / ${stats?.totalOrders ?? 0}`}
            icon={<PackageCheck className="text-blue-500" />}
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-xs font-bold text-gray-500">
              实时剩余库存
            </div>
            <div className="space-y-1 text-xs">
              <StockRow label="Plus 升级" value={stats?.stockPlus ?? 0} />
              <StockRow label="Pro 充值" value={stats?.stockPro ?? 0} />
              <StockRow label="Plus 成品号" value={stats?.stockAccount ?? 0} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-gray-900">
            <PlusCircle className="h-5 w-5 text-indigo-600" />
            <span>批量导入充值卡密</span>
            <span className="text-xs font-normal text-gray-400">
              （一行一个卡密，自动去重）
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-3 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700">
                导入至商品方案
              </label>
              <select
                value={importPlan}
                onChange={(event) => setImportPlan(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-sm"
              >
                <option value="plus">ChatGPT Plus 升级 (plus)</option>
                <option value="pro">ChatGPT Pro 充值 (pro)</option>
                <option value="account">ChatGPT Plus 成品号 (account)</option>
              </select>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50"
              >
                {importing ? "正在导入..." : "确认批量导入"}
              </button>
            </div>

            <div className="sm:col-span-3">
              <textarea
                rows={4}
                placeholder={"请粘贴卡密，一行一个，例如：\nEVER-8GRV-T77X-ZX5E\nEVER-AAAA-BBBB-CCCC"}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 font-mono text-xs outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <span>订单流水</span>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索手机号 / 订单号..."
                value={searchKey}
                onChange={(event) => setSearchKey(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">订单号 / 时间</th>
                  <th className="p-3">手机号</th>
                  <th className="p-3">购买方案</th>
                  <th className="p-3">实付金额</th>
                  <th className="p-3">支付状态</th>
                  <th className="p-3">分配的卡密</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      暂无订单记录
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono">
                        <div className="font-bold text-gray-900">
                          {order.order_id}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {order.created_at}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-medium">
                        {order.phone}
                      </td>
                      <td className="p-3 font-medium">
                        {order.plan_name || order.plan_id}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        ¥{order.money}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            order.status === "paid"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {order.status === "paid" ? "已支付" : "待支付"}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-800">
                        {order.card_code || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span>卡密库存明细</span>
          </div>

          <div className="max-h-96 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3">卡密内容</th>
                  <th className="p-3">所属方案</th>
                  <th className="p-3">状态</th>
                  <th className="p-3">绑定订单</th>
                  <th className="p-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">
                      {card.card_code}
                    </td>
                    <td className="p-3 font-sans capitalize">{card.plan_id}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          card.is_used
                            ? "bg-gray-100 text-gray-400"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {card.is_used ? "已售出" : "未售出"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">
                      {card.order_id || "-"}
                    </td>
                    <td className="p-3 text-right">
                      {!card.is_used && (
                        <button
                          type="button"
                          onClick={() => handleDelete(card.id)}
                          className="text-gray-400 hover:text-rose-600"
                          aria-label="删除卡密"
                        >
                          <Trash2 className="inline h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function CardStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-xs font-bold text-gray-400">{title}</div>
        <div className="mt-1 text-2xl font-black text-gray-900">{value}</div>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
        {icon}
      </div>
    </div>
  );
}

function StockRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-mono font-bold text-indigo-600">{value} 张</span>
    </div>
  );
}
