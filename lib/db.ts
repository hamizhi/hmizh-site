import { getAdminSupabase } from "./supabase";
import { randomUUID } from "node:crypto";

export type OrderRow = {
  order_id: string;
  email: string;
  plan_id: string;
  plan_name: string | null;
  money: number;
  status: string;
  card_code: string | null;
  created_at: string;
  paid_at: string | null;
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

export type AdminStats = {
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  stockGo: number;
  paidOrders: number;
  stockPlus: number;
  stockPro5x: number;
  stockPro: number;
  stockAccount: number;
};

export type CreateOrderInput = {
  email: string;
  planId: "go" | "plus" | "pro-5x" | "pro-10x" | "pro-25x" | "pro" | "account";
  planName: string;
  money: number;
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
    proStockResult,
    accountStockResult,
    ordersResult,
    cardsResult,
    cdkRedemptionsResult,
  ] = await Promise.all([
    supabase.from("orders").select("money"),
    supabase.from("orders").select("order_id, money").eq("status", "paid"),
    supabase
      .from("orders")
      .select("money")
      .eq("status", "paid")
      .gte("paid_at", todayStart.toISOString()),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro-5x")
      .eq("status", "unused"),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "go")
      .eq("status", "unused"),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "plus")
      .eq("status", "unused"),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "pro")
      .eq("status", "unused"),
    supabase
      .from("card_keys")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", "account")
      .eq("status", "unused"),
    supabase
      .from("orders")
      .select(
        "order_id, email, plan_id, plan_name, money, status, card_code, created_at, paid_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("card_keys")
      .select("id, plan_id, card_code, status, order_id, import_source, is_redeemed, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("cdk_redemptions")
      .select("id, redemption_token, card_code_hint, email, session_data, plan, order_id, status, error_message, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const results = [
    allOrdersResult,
    paidOrdersResult,
    todayOrdersResult,
    goStockResult,
    plusStockResult,
    pro5xStockResult,
    proStockResult,
    accountStockResult,
    ordersResult,
    cardsResult,
    cdkRedemptionsResult,
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
    is_redeemed: card.is_redeemed || 0,
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
      stockPro: proStockResult.count ?? 0,
      stockAccount: accountStockResult.count ?? 0,
    },
    orders,
    cards,
    cdkRedemptions,
  };
}

export async function importCards(
  planId: string,
  cardCodes: string[],
  importSource: 'manual' | 'auto' = 'manual',
): Promise<number> {
  const supabase = getAdminSupabase();
  const uniqueCodes = [...new Set(cardCodes)];
  const { data, error } = await supabase
    .from("card_keys")
    .upsert(
      uniqueCodes.map((cardCode) => ({
        plan_id: planId,
        card_code: cardCode,
        status: 'unused',
        import_source: importSource,
      })),
      { onConflict: "card_code", ignoreDuplicates: true },
    )
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function createPendingOrder(input: CreateOrderInput): Promise<string> {
  const supabase = getAdminSupabase();
  const orderId = `GETGPT${Date.now()}${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
  const { error } = await supabase.from("orders").insert({
    order_id: orderId,
    email: input.email,
    plan_id: input.planId,
    plan_name: input.planName,
    money: input.money,
    status: "pending",
  });

  if (error) throw new Error(error.message);
  return orderId;
}

export async function getOrderForPayment(orderId: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_id, email, plan_id, plan_name, money, status, card_code, created_at, paid_at",
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as OrderRow | null;
}

export async function markOrderPaidAndAssignCard(input: {
  orderId: string;
  tradeNo: string;
  money: number;
}): Promise<{ status: string; cardCode: string | null }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("mark_order_paid_and_assign_card", {
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

export async function deleteUnusedCard(cardId: number): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("card_keys")
    .delete()
    .eq("id", cardId)
    .eq("status", "unused");

  if (error) throw new Error(error.message);
}
