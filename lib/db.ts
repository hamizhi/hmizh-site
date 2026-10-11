import { getAdminSupabase } from "./supabase";
import { randomUUID } from "node:crypto";

export type OrderRow = {
  id: number;
  order_id: string;
  email: string;
  plan_id: string;
  plan_name: string | null;
  money: number;
  base_money?: number | null;
  discount_amount?: number;
  coupon_code?: string | null;
  status: string;
  card_code: string | null;
  client_ip: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
};

export type CardRow = {
  id: number;
  plan_id: string;
  card_code: string;
  status: string;
  order_id: string | null;
  import_source?: string;
  is_redeemed?: number;
  used_at?: string | null;
  created_at: string;
};

export type CdkRedemptionRow = {
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

export type CouponRow = {
  code: string;
  amount: number;
  plan_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardPlan = {
  id: string;
  label: string;
  stockPlanId: string;
  costPlanId: string;
  stock: number;
  cost: number;
};

export type DashboardData = {
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

const DASHBOARD_PLANS = [
  { id: "go", label: "ChatGPT Go", stockPlanId: "go", costPlanId: "go" },
  { id: "plus", label: "直冲Plus", stockPlanId: "plus", costPlanId: "plus" },
  { id: "account", label: "Plus成品号", stockPlanId: "account", costPlanId: "account" },
  { id: "pro-5x", label: "Pro 5x", stockPlanId: "pro_5x", costPlanId: "pro_5x" },
  { id: "pro-10x", label: "Pro 10x", stockPlanId: "pro_20x", costPlanId: "pro_20x" },
  { id: "pro-25x", label: "Pro 25x", stockPlanId: "pro_50x", costPlanId: "pro_50x" },
] as const;

const PAID_ORDER_STATUSES = new Set(["paid", "delivering", "delivered"]);

function costPlanIdForOrder(planId: string) {
  return DASHBOARD_PLANS.find((plan) => plan.id === planId)?.costPlanId || planId.replaceAll("-", "_");
}

export type AdminStats = {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  stockGo: number;
  paidOrders: number;
  stockPlus: number;
  stockPro5x: number;
  stockPro10x: number;
  stockPro25x: number;
  stockPro20x: number;
  stockPro50x: number;
  stockAccount: number;
};

export type CreateOrderInput = {
  email: string;
  planId: "go" | "plus" | "pro-5x" | "pro-10x" | "pro-25x" | "pro" | "account";
  planName: string;
  money: number;
  clientIp?: string | null;
  couponCode?: string | null;
};

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("云数据库返回了空结果");
  return data;
}

export async function getAdminData(): Promise<{
  stats: AdminStats;
  orders: OrderRow[];
  cards: CardRow[];
  cdkRedemptions: CdkRedemptionRow[];
  coupons: CouponRow[];
}> {
  const supabase = getAdminSupabase();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    allOrdersResult,
    paidOrdersResult,
    todayOrdersResult,
    goStockResult,
    plusStockResult,
    pro5xStockResult,
    pro10xStockResult,
    pro25xStockResult,
    pro20xStockResult,
    pro50xStockResult,
    accountStockResult,
    ordersResult,
    cardsResult,
    cdkRedemptionsResult,
    couponsResult,
  ] = await Promise.all([
    supabase.from("orders").select("money"),
    supabase
      .from("orders")
      .select("order_id, money")
      .in("status", ["paid", "delivering", "delivered"]),
    supabase
      .from("orders")
      .select("money")
      .in("status", ["paid", "delivering", "delivered"])
      .gte("paid_at", todayStart.toISOString()),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "go")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "plus")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro_5x")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro_10x")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro_25x")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro_20x")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro_50x")
      .eq("is_used", 0),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "account")
      .eq("is_used", 0),
    supabase
      .from("orders")
      .select(
        "id, order_id, email, plan_id, plan_name, money, base_money, discount_amount, coupon_code, status, card_code, client_ip, created_at, paid_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("card_keys")
      .select("id, plan_id, card_code, is_used, order_id, import_source, is_redeemed, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("cdk_redemptions")
      .select("id, redemption_token, card_code_hint, email, session_data, plan, order_id, status, error_message, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("coupon_codes")
      .select("code, amount, plan_id, expires_at, is_active, created_at, updated_at")
      .order("created_at", { ascending: false }),
  ]);

  const results = [
    allOrdersResult,
    paidOrdersResult,
    todayOrdersResult,
    goStockResult,
    plusStockResult,
    pro5xStockResult,
    pro10xStockResult,
    pro25xStockResult,
    pro20xStockResult,
    pro50xStockResult,
    accountStockResult,
    ordersResult,
    cardsResult,
    cdkRedemptionsResult,
    couponsResult,
  ];
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
  }

  const allOrders = requireData(allOrdersResult.data, allOrdersResult.error);
  const paidOrders = requireData(paidOrdersResult.data, paidOrdersResult.error);
  const todayOrders = requireData(
    todayOrdersResult.data,
    todayOrdersResult.error,
  );
  const orders = requireData(ordersResult.data, ordersResult.error).map(
    (order) => ({
      ...order,
      money: Number(order.money),
    }),
  ) as OrderRow[];
  const cards = requireData(cardsResult.data, cardsResult.error).map((card) => ({
    ...card,
    status: Number(card.is_used) === 1 ? "used" : "unused",
    is_redeemed: Number(card.is_redeemed || 0),
  })) as CardRow[];
  const cdkRedemptions = requireData(cdkRedemptionsResult.data, cdkRedemptionsResult.error) as CdkRedemptionRow[];

  return {
    stats: {
      totalRevenue: paidOrders.reduce(
        (total, order) => total + Number(order.money),
        0,
      ),
      todayRevenue: todayOrders.reduce(
        (total, order) => total + Number(order.money),
        0,
      ),
      totalOrders: allOrders.length,
      paidOrders: paidOrders.length,
      stockGo: goStockResult.count ?? 0,
      stockPlus: plusStockResult.count ?? 0,
      stockPro5x: pro5xStockResult.count ?? 0,
      stockPro10x: pro10xStockResult.count ?? 0,
      stockPro25x: pro25xStockResult.count ?? 0,
      stockPro20x: pro20xStockResult.count ?? 0,
      stockPro50x: pro50xStockResult.count ?? 0,
      stockAccount: accountStockResult.count ?? 0,
    },
    orders,
    cards,
    cdkRedemptions,
    coupons: requireData(couponsResult.data, couponsResult.error).map((coupon) => ({
      ...coupon,
      amount: Number(coupon.amount),
    })) as CouponRow[],
  };
}

export async function getDashboardData(
  startAt?: string | null,
  endAt?: string | null,
): Promise<DashboardData> {
  const start = startAt ? new Date(startAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = endAt ? new Date(endAt) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new Error("仪表盘时间范围无效");
  }

  const [ordersResult, costsResult, ...stockResults] = await Promise.all([
    getAdminSupabase()
      .from("orders")
      .select("money, status, plan_id, created_at, paid_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    getAdminSupabase()
      .from("plan_costs")
      .select("plan_id, cost"),
    ...DASHBOARD_PLANS.map((plan) =>
      getAdminSupabase()
        .from("card_keys")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan.stockPlanId)
        .eq("is_used", 0),
    ),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (costsResult.error) throw new Error(costsResult.error.message);
  for (const result of stockResults) {
    if (result.error) throw new Error(result.error.message);
  }

  const costs = Object.fromEntries(
    (costsResult.data || []).map((row) => [row.plan_id, Number(row.cost || 0)]),
  );
  const orders = ordersResult.data || [];
  const paidOrders = orders.filter((order) => PAID_ORDER_STATUSES.has(order.status));
  const paymentAmount = paidOrders.reduce((sum, order) => sum + Number(order.money || 0), 0);
  const totalCost = paidOrders.reduce(
    (sum, order) => sum + (costs[costPlanIdForOrder(order.plan_id)] || 0),
    0,
  );
  const totalProfit = paymentAmount - totalCost;

  return {
    orderCount: orders.length,
    paidOrderCount: paidOrders.length,
    paymentAmount: Number(paymentAmount.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    profitRate: paymentAmount > 0 ? Number(((totalProfit / paymentAmount) * 100).toFixed(2)) : 0,
    pendingOrderCount: orders.filter((order) => order.status === "pending").length,
    plans: DASHBOARD_PLANS.map((plan, index) => ({
      ...plan,
      stock: stockResults[index].count ?? 0,
      cost: costs[plan.costPlanId] || 0,
    })),
    costs,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

export async function savePlanCosts(costs: Record<string, number>) {
  const allowedPlanIds = new Set<string>(
    DASHBOARD_PLANS.map((plan) => plan.costPlanId),
  );
  const rows = Object.entries(costs)
    .filter(([planId]) => allowedPlanIds.has(planId))
    .map(([planId, cost]) => ({
      plan_id: planId,
      cost: Number(Number(cost).toFixed(2)),
      updated_at: new Date().toISOString(),
    }));

  if (rows.some((row) => !Number.isFinite(row.cost) || row.cost < 0)) {
    throw new Error("套餐成本价无效");
  }
  if (rows.length === 0) return;

  const { error } = await getAdminSupabase()
    .from("plan_costs")
    .upsert(rows, { onConflict: "plan_id" });
  if (error) throw new Error(error.message);
}

function normalizeCardCodes(cardCodes: string[]) {
  return cardCodes.map((cardCode) => cardCode.trim()).filter(Boolean);
}

export async function findDuplicateCardCodes(cardCodes: string[]) {
  const normalizedCodes = normalizeCardCodes(cardCodes);
  const codeCounts = new Map<string, number>();
  for (const code of normalizedCodes) {
    codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
  }

  const duplicateCodes = new Set(
    [...codeCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([code]) => code),
  );
  const uniqueCodes = [...codeCounts.keys()];

  if (uniqueCodes.length === 0) {
    return [];
  }

  const { data, error } = await getAdminSupabase()
    .from("card_keys")
    .select("card_code")
    .in("card_code", uniqueCodes);

  if (error) throw new Error(error.message);
  for (const row of data || []) {
    duplicateCodes.add(row.card_code);
  }

  return [...duplicateCodes];
}

export async function importCards(
  planId: string,
  cardCodes: string[],
  importSource: 'manual' | 'auto' = 'manual',
  options: { allowDuplicates?: boolean } = {},
): Promise<{ imported: number; assigned: number }> {
  const supabase = getAdminSupabase();
  const normalizedCodes = normalizeCardCodes(cardCodes);
  let codesToInsert = options.allowDuplicates
    ? normalizedCodes
    : [...new Set(normalizedCodes)];

  if (!options.allowDuplicates && codesToInsert.length > 0) {
    const { data, error } = await supabase
      .from("card_keys")
      .select("card_code")
      .in("card_code", codesToInsert);

    if (error) throw new Error(error.message);
    const existingCodes = new Set((data || []).map((row) => row.card_code));
    codesToInsert = codesToInsert.filter((code) => !existingCodes.has(code));
  }

  let imported = 0;
  if (codesToInsert.length > 0) {
    const { data, error } = await supabase
      .from("card_keys")
      .insert(
        codesToInsert.map((cardCode) => ({
          plan_id: planId,
          card_code: cardCode,
          is_used: 0,
          import_source: importSource,
        })),
      )
      .select("id");

    if (error) throw new Error(error.message);
    imported = data?.length ?? 0;
  }

  const { data: assignedData, error: assignedError } = await supabase.rpc(
    "assign_waiting_orders",
    { p_plan_id: planId },
  );
  if (assignedError) throw new Error(assignedError.message);

  return {
    imported,
    assigned: Number(assignedData || 0),
  };
}

export async function createPendingOrder(input: CreateOrderInput): Promise<{
  orderId: string;
  price: number;
  discountAmount: number;
  couponCode: string | null;
}> {
  const supabase = getAdminSupabase();
  const orderId = `GETGPT${Date.now()}${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabase.rpc("create_order_with_coupon", {
    p_order_id: orderId,
    p_email: input.email,
    p_plan_id: input.planId,
    p_plan_name: input.planName,
    p_base_money: input.money,
    p_client_ip: input.clientIp ?? null,
    p_coupon_code: input.couponCode ?? null,
  });

  if (error) throw new Error(error.message);
  const result = data as { money: number; discount_amount: number; coupon_code: string | null };
  return {
    orderId,
    price: Number(result.money),
    discountAmount: Number(result.discount_amount),
    couponCode: result.coupon_code,
  };
}

export async function validateCoupon(code: string, planId: string, basePrice: number) {
  const supabase = getAdminSupabase();
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) return null;
  const { data, error } = await supabase
    .from("coupon_codes")
    .select("code, amount, plan_id, expires_at, is_active")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.is_active ||
      (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) ||
      (data.plan_id !== null && data.plan_id !== planId)) return null;
  const discount = Number(data.amount);
  if (!Number.isFinite(discount) || discount <= 0 || discount >= basePrice) return null;
  return {
    code: data.code,
    amount: Number(discount.toFixed(2)),
    price: Number((basePrice - discount).toFixed(2)),
  };
}

export async function saveCoupon(input: {
  code: string;
  amount: number;
  planId: string | null;
  expiresAt: string | null;
  isActive: boolean;
}) {
  const { error } = await getAdminSupabase()
    .from("coupon_codes")
    .upsert({
      code: input.code,
      amount: input.amount,
      plan_id: input.planId,
      expires_at: input.expiresAt,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: "code" });

  if (error) throw new Error(error.message);
}

export async function deleteCoupon(code: string) {
  const { error } = await getAdminSupabase()
    .from("coupon_codes")
    .delete()
    .eq("code", code);

  if (error) throw new Error(error.message);
}

export async function hasAvailableCard(planId: string): Promise<boolean> {
  const supabase = getAdminSupabase();
  const stockPlanId =
    {
      go: "go",
      plus: "plus",
      "pro-5x": "pro_5x",
      "pro-10x": "pro_20x",
      "pro-25x": "pro_50x",
      pro: "pro_5x",
      account: "account",
    }[planId] || planId.replaceAll("-", "_");
  const { count, error } = await supabase
    .from("card_keys")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", stockPlanId)
    .eq("is_used", 0);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function getOrderForPayment(orderId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_id, email, plan_id, plan_name, money, base_money, discount_amount, coupon_code, status, card_code, client_ip, created_at, paid_at, updated_at",
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as OrderRow | null;
}

export async function markOrderPaid(input: {
  orderId: string;
  tradeNo: string;
  money: number;
}): Promise<{ status: string; cardCode: string | null }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("mark_order_paid", {
    p_order_id: input.orderId,
    p_trade_no: input.tradeNo,
    p_money: input.money,
  });

  if (error) throw new Error(error.message);
  const result = data as {
    status?: string;
    card_code?: string | null;
  } | null;

  if (!result?.status) throw new Error("支付回调处理返回了空结果");
  return {
    status: result.status,
    cardCode: result.card_code ?? null,
  };
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: "pending" | "paid" | "delivering" | "delivered" | "canceled";
  cardCode?: string | null;
}): Promise<{ status: string; cardCode: string | null }> {
  const supabase = getAdminSupabase();

  if (input.status === "delivered") {
    if (input.cardCode !== undefined && input.cardCode !== null) {
      const cardCode = input.cardCode.trim();
      if (!cardCode) throw new Error("请输入要交付的卡密");
      if (cardCode.length > 500) throw new Error("卡密长度不能超过 500 个字符");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("status, card_code")
        .eq("order_id", input.orderId)
        .maybeSingle();

      if (orderError) throw new Error(orderError.message);
      if (!order) throw new Error("订单不存在");
      if (order.status === "delivered" && order.card_code) {
        throw new Error("订单已经完成交付，不能重复覆盖卡密");
      }
      if (!["paid", "delivering"].includes(order.status)) {
        throw new Error("只有已支付或交付中的订单可以自定义交付");
      }

      const { data, error } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          card_code: cardCode,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", input.orderId)
        .select("status, card_code")
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("订单不存在");
      return {
        status: data.status,
        cardCode: data.card_code ?? null,
      };
    }

    const { data, error } = await supabase.rpc("mark_order_delivered", {
      p_order_id: input.orderId,
    });
    if (error) throw new Error(error.message);

    const result = data as {
      status?: string;
      card_code?: string | null;
    } | null;
    if (!result?.status) throw new Error("订单交付处理返回了空结果");
    return {
      status: result.status,
      cardCode: result.card_code ?? null,
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: input.status })
    .eq("order_id", input.orderId)
    .select("status, card_code")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("订单不存在");
  return {
    status: data.status,
    cardCode: data.card_code ?? null,
  };
}

export async function deleteUnusedCard(cardId: number): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("card_keys")
    .delete()
    .eq("id", cardId)
    .eq("is_used", 0);

  if (error) throw new Error(error.message);
}
