/**
 * 获取所有已发布页面列表的 API - 使用数据库
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pages } from "@low-coder/database/schemas";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        // 只返回当前用户的页面
        const userId = (session.user as any).id;
        const db = getDb();

        const userPages = await db.query.pages.findMany({
            where: eq(pages.createdBy, userId),
            orderBy: [desc(pages.publishedAt)],
        });

        // 格式化返回数据
        const formattedPages = userPages.map(page => ({
            id: page.id,
            name: page.name,
            url: `/p/${page.id}`,
            publishedAt: page.publishedAt,
            status: page.status,
        }));

        return NextResponse.json({
            success: true,
            data: formattedPages,
        });
    } catch (error) {
        console.error("获取页面列表失败:", error);
        return NextResponse.json(
            {
                success: false,
                error: "获取页面列表失败",
            },
            { status: 500 }
        );
    }
}
