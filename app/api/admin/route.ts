export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  deleteUnusedCard,
  getAdminData,
  importCards,
} from "@/lib/db";

export const runtime = "nodejs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

type AdminRequest = {
  action?: "get_data" | "import_cards" | "delete_card";
  password?: string;
  planId?: string;
  cardCodes?: string;
  cardId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AdminRequest;

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "后台尚未配置 ADMIN_PASSWORD" },
        { status: 503 },
      );
    }

    if (body.password !== ADMIN_PASSWORD) {
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

      const count = await importCards(body.planId, list);

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
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
