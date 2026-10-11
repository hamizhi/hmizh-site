export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  deleteUnusedCard,
  deleteCoupon,
  findDuplicateCardCodes,
  getDashboardData,
  getAdminData,
  importCards,
  saveCoupon,
  savePlanCosts,
  updateOrderStatus,
} from "@/lib/db";
import { ORDER_PLANS } from "@/lib/order-plans";
import { getAdminPassword, isValidAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

type AdminRequest = {
  action?: "get_data" | "get_dashboard" | "save_plan_costs" | "import_cards" | "delete_card" | "update_order_status" | "save_coupon" | "delete_coupon";
  password?: string;
  planId?: string;
  cardCodes?: string;
  force?: boolean;
  cardId?: number;
  importSource?: "manual" | "auto";
  orderId?: string;
  status?: "pending" | "paid" | "delivering" | "delivered" | "canceled";
  cardCode?: string | null;
  code?: string;
  amount?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  costs?: Record<string, number>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AdminRequest;

    if (!getAdminPassword()) {
      return NextResponse.json(
        { success: false, message: "后台尚未配置 ADMIN_PASSWORD" },
        { status: 503 },
      );
    }

    if (!isValidAdminPassword(body.password)) {
      return NextResponse.json(
        { success: false, message: "管理密码不正确" },
        { status: 401 },
      );
    }

    if (body.action === "get_data") {
      const data = await getAdminData();
      return NextResponse.json({ success: true, ...data });
    }

    if (body.action === "get_dashboard") {
      const dashboard = await getDashboardData(body.startAt, body.endAt);
      return NextResponse.json({ success: true, dashboard });
    }

    if (body.action === "save_plan_costs") {
      await savePlanCosts(body.costs || {});
      return NextResponse.json({ success: true, message: "成本价已保存" });
    }

    if (body.action === "save_coupon") {
      const code = body.code?.trim().toUpperCase() || "";
      const amount = Number(body.amount);
      const planId = body.planId || null;
      const expiresAt = body.expiresAt || null;

      if (
        !/^[A-Z0-9_-]{3,32}$/.test(code) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6 ||
        (planId !== null && !(planId in ORDER_PLANS)) ||
        (expiresAt !== null && Number.isNaN(Date.parse(expiresAt)))
      ) {
        return NextResponse.json(
          { success: false, message: "优惠码、优惠金额、套餐或过期时间格式不正确" },
          { status: 400 },
        );
      }

      const minimumPrice = planId
        ? ORDER_PLANS[planId as keyof typeof ORDER_PLANS].price
        : Math.min(...Object.values(ORDER_PLANS).map((plan) => plan.price));
      if (amount >= minimumPrice) {
        return NextResponse.json(
          { success: false, message: "优惠金额必须低于适用套餐价格" },
          { status: 400 },
        );
      }

      await saveCoupon({
        code,
        amount: Number(amount.toFixed(2)),
        planId,
        expiresAt,
        isActive: body.isActive !== false,
      });
      return NextResponse.json({ success: true, message: "优惠码已保存" });
    }

    if (body.action === "delete_coupon") {
      const code = body.code?.trim().toUpperCase() || "";
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
        return NextResponse.json(
          { success: false, message: "优惠码格式不正确" },
          { status: 400 },
        );
      }
      await deleteCoupon(code);
      return NextResponse.json({ success: true, message: "优惠码已删除" });
    }

    if (body.action === "import_cards") {
      if (!body.planId || !body.cardCodes) {
        return NextResponse.json(
          { success: false, message: "请选择套餐并粘贴卡密" },
          { status: 400 },
        );
      }
      const allowedCardPlans = new Set([
        "go",
        "plus",
        "pro_5x",
        "pro_20x",
        "pro_50x",
        "account",
      ]);
      if (!allowedCardPlans.has(body.planId)) {
        return NextResponse.json(
          { success: false, message: "卡台套餐类型无效" },
          { status: 400 },
        );
      }

      const list = String(body.cardCodes)
        .split(/\r?\n/)
        .map((cardCode) => cardCode.trim())
        .filter(Boolean);

      // 从请求中获取导入来源，默认为 manual
      const importSource = body.importSource === 'auto' ? 'auto' : 'manual';
      const duplicateCodes = await findDuplicateCardCodes(list);
      if (importSource === "manual" && duplicateCodes.length > 0 && !body.force) {
        return NextResponse.json(
          {
            success: false,
            requiresForce: true,
            duplicateCount: duplicateCodes.length,
            message: `检测到 ${duplicateCodes.length} 张重复卡密，请确认是否强制导入`,
          },
          { status: 409 },
        );
      }

      const result = await importCards(body.planId, list, importSource, {
        allowDuplicates: importSource === "manual" && body.force === true,
      });

      return NextResponse.json({
        success: true,
        message:
          importSource === "manual" && body.force
            ? `成功强制导入 ${result.imported} 张卡密，重复卡密已加入可用库存${result.assigned ? `，并自动交付 ${result.assigned} 个等待中的订单` : ""}`
            : `成功入库 ${result.imported} 张卡密${result.assigned ? `，并自动交付 ${result.assigned} 个等待中的订单` : ""}`,
      });
    }

    if (body.action === "delete_card") {
      if (!body.cardId) {
        return NextResponse.json(
          { success: false, message: "缺少卡密 ID" },
          { status: 400 },
        );
      }

      await deleteUnusedCard(body.cardId);

      return NextResponse.json({ success: true, message: "删除成功" });
    }

    if (body.action === "update_order_status") {
      const allowedStatuses = new Set([
        "pending",
        "paid",
        "delivering",
        "delivered",
        "canceled",
      ]);
      if (!body.orderId || !body.status || !allowedStatuses.has(body.status)) {
        return NextResponse.json(
          { success: false, message: "订单号或订单状态无效" },
          { status: 400 },
        );
      }

      const result = await updateOrderStatus({
        orderId: body.orderId,
        status: body.status,
        cardCode: body.cardCode,
      });

      return NextResponse.json({
        success: true,
        status: result.status,
        cardCode: result.cardCode,
        message:
          body.status === "delivered" && body.cardCode
            ? "订单已自定义交付，卡密已保存"
            : body.status === "delivered"
            ? "订单已交付，卡密已分配"
            : "订单状态已更新",
      });
    }

    return NextResponse.json(
      { success: false, message: "未知操作" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Admin API error:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "后台数据加载失败，请检查数据库结构和服务端日志";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
