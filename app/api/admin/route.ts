export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  deleteUnusedCard,
  getAdminData,
  importCards,
} from "@/lib/db";
import { getAdminPassword, isValidAdminPassword } from "@/lib/admin-auth";

export const runtime = "nodejs";

type AdminRequest = {
  action?: "get_data" | "import_cards" | "delete_card";
  password?: string;
  planId?: string;
  cardCodes?: string;
  cardId?: number;
  importSource?: "manual" | "auto";
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

    if (body.action === "import_cards") {
      if (!body.planId || !body.cardCodes) {
        return NextResponse.json(
          { success: false, message: "请选择套餐并粘贴卡密" },
          { status: 400 },
        );
      }

      const list = String(body.cardCodes)
        .split(/\r?\n/)
        .map((cardCode) => cardCode.trim())
        .filter(Boolean);

      // 从请求中获取导入来源，默认为 manual
      const importSource = body.importSource === 'auto' ? 'auto' : 'manual';
      const count = await importCards(body.planId, list, importSource);

      return NextResponse.json({
        success: true,
        message: `成功入库 ${count} 张卡密！（重复的卡密已自动过滤）`,
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
