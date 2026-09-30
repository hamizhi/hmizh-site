import { NextResponse } from "next/server";
import db from "@/lib/db";

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
      const stats = {
        totalRevenue: (
          db
            .prepare(
              "SELECT COALESCE(SUM(money), 0) as total FROM orders WHERE status = 'paid'",
            )
            .get() as { total: number }
        ).total,
        todayRevenue: (
          db
            .prepare(
              "SELECT COALESCE(SUM(money), 0) as total FROM orders WHERE status = 'paid' AND date(paid_at) = date('now')",
            )
            .get() as { total: number }
        ).total,
        totalOrders: (
          db.prepare("SELECT COUNT(*) as total FROM orders").get() as {
            total: number;
          }
        ).total,
        paidOrders: (
          db
            .prepare("SELECT COUNT(*) as total FROM orders WHERE status = 'paid'")
            .get() as { total: number }
        ).total,
        stockPlus: (
          db
            .prepare(
              "SELECT COUNT(*) as count FROM cards WHERE plan_id = 'plus' AND is_used = 0",
            )
            .get() as { count: number }
        ).count,
        stockPro: (
          db
            .prepare(
              "SELECT COUNT(*) as count FROM cards WHERE plan_id = 'pro' AND is_used = 0",
            )
            .get() as { count: number }
        ).count,
        stockAccount: (
          db
            .prepare(
              "SELECT COUNT(*) as count FROM cards WHERE plan_id = 'account' AND is_used = 0",
            )
            .get() as { count: number }
        ).count,
      };

      const orders = db
        .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100")
        .all();
      const cards = db
        .prepare("SELECT * FROM cards ORDER BY created_at DESC LIMIT 200")
        .all();

      return NextResponse.json({ success: true, stats, orders, cards });
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

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO cards (plan_id, card_code, is_used)
        VALUES (?, ?, 0)
      `);

      let count = 0;
      const insertMany = db.transaction((items: string[]) => {
        for (const cardCode of items) {
          const result = insertStmt.run(body.planId, cardCode);
          if (result.changes > 0) count += 1;
        }
      });

      insertMany(list);

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

      db.prepare("DELETE FROM cards WHERE id = ? AND is_used = 0").run(
        body.cardId,
      );

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
