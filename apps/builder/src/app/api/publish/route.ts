/**
 * 页面发布 API - 使用数据库持久化
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pages } from "@low-coder/database/schemas";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, name, schema } = body;
        const userId = (session.user as any).id;
        const db = getDb();

        // 使用固定的租户ID和应用ID
        const tenantId = '00000000-0000-0000-0000-000000000001';
        const appId = '00000000-0000-0000-0000-000000000003';

        if (id) {
            // 更新现有页面
            const existingPage = await db.query.pages.findFirst({
                where: eq(pages.id, id),
            });

            if (!existingPage) {
                return NextResponse.json(
                    { success: false, error: "页面不存在" },
                    { status: 404 }
                );
            }

            // 检查页面所有权
            if (existingPage.createdBy !== userId) {
                return NextResponse.json(
                    { success: false, error: "无权限修改此页面" },
                    { status: 403 }
                );
            }

            // 更新页面
            const [updatedPage] = await db
                .update(pages)
                .set({
                    name: name || existingPage.name,
                    schema,
                    status: 'published',
                    updatedAt: new Date(),
                    publishedAt: new Date(),
                })
                .where(eq(pages.id, id))
                .returning();

            return NextResponse.json({
                success: true,
                data: {
                    id: updatedPage.id,
                    name: updatedPage.name,
                    schema: updatedPage.schema,
                    status: updatedPage.status,
                    publishedAt: updatedPage.publishedAt,
                    url: `/p/${updatedPage.id}`,
                },
                message: "页面已更新",
            });
        } else {
            // 创建新页面
            const [newPage] = await db
                .insert(pages)
                .values({
                    tenantId,
                    appId,
                    name: name || "未命名页面",
                    path: `/page-${Date.now()}`,
                    title: name || "未命名页面",
                    schema,
                    status: 'published',
                    type: 'normal',
                    requireAuth: false,
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    publishedAt: new Date(),
                })
                .returning();

            return NextResponse.json({
                success: true,
                data: {
                    id: newPage.id,
                    name: newPage.name,
                    schema: newPage.schema,
                    status: newPage.status,
                    publishedAt: newPage.publishedAt,
                    url: `/p/${newPage.id}`,
                },
                message: "页面已发布",
            });
        }
    } catch (error) {
        console.error("发布页面失败:", error);
        return NextResponse.json(
            {
                success: false,
                error: "发布页面失败",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 验证用户登录状态
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const userId = (session.user as any).id;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "缺少页面 ID",
                },
                { status: 400 }
            );
        }

        const db = getDb();

        // 查找页面
        const page = await db.query.pages.findFirst({
            where: eq(pages.id, id),
        });

        if (!page) {
            return NextResponse.json(
                {
                    success: false,
                    error: "页面不存在",
                },
                { status: 404 }
            );
        }

        // 检查页面所有权
        if (page.createdBy !== userId) {
            return NextResponse.json(
                { success: false, error: "无权限删除此页面" },
                { status: 403 }
            );
        }

        // 删除页面
        await db.delete(pages).where(eq(pages.id, id));

        return NextResponse.json({
            success: true,
            message: "页面已删除",
        });
    } catch (error) {
        console.error("删除页面失败:", error);
        return NextResponse.json(
            {
                success: false,
                error: "删除页面失败",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "缺少页面 ID",
                },
                { status: 400 }
            );
        }

        const db = getDb();
        const page = await db.query.pages.findFirst({
            where: eq(pages.id, id),
        });

        if (!page) {
            return NextResponse.json(
                {
                    success: false,
                    error: "页面不存在",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: page.id,
                name: page.name,
                schema: page.schema,
                status: page.status,
                publishedAt: page.publishedAt,
                url: `/p/${page.id}`,
            },
        });
    } catch (error) {
        console.error("获取页面失败:", error);
        return NextResponse.json(
            {
                success: false,
                error: "获取页面失败",
            },
            { status: 500 }
        );
    }
}
