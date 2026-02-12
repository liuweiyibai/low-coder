/**
 * 草稿 API - 使用数据库持久化
 * 每个用户只有一个草稿，保存时会覆盖之前的草稿
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pages } from "@low-coder/database/schemas";
import { eq, and } from "drizzle-orm";

// 保存草稿
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { schema, deviceType, selectedNodeId } = body;
        const userId = (session.user as any).id;
        const db = getDb();

        const tenantId = '00000000-0000-0000-0000-000000000001';
        const appId = '00000000-0000-0000-0000-000000000003';

        // 检查是否已有草稿
        const existingDraft = await db.query.pages.findFirst({
            where: and(
                eq(pages.createdBy, userId),
                eq(pages.status, 'draft')
            ),
        });

        const draftData = {
            tenantId,
            appId,
            name: '草稿',
            path: '/draft',
            schema,
            status: 'draft' as const,
            createdBy: userId,
            publishedAt: new Date(),
        };

        if (existingDraft) {
            // 更新现有草稿
            await db
                .update(pages)
                .set({
                    schema,
                    publishedAt: new Date(),
                })
                .where(eq(pages.id, existingDraft.id));

            return NextResponse.json({
                success: true,
                data: {
                    id: existingDraft.id,
                    deviceType,
                    selectedNodeId,
                },
            });
        } else {
            // 创建新草稿
            const [newDraft] = await db
                .insert(pages)
                .values(draftData)
                .returning();

            return NextResponse.json({
                success: true,
                data: {
                    id: newDraft.id,
                    deviceType,
                    selectedNodeId,
                },
            });
        }
    } catch (error) {
        console.error("保存草稿失败:", error);
        return NextResponse.json(
            { success: false, error: "保存草稿失败" },
            { status: 500 }
        );
    }
}

// 获取草稿
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const db = getDb();

        const draft = await db.query.pages.findFirst({
            where: and(
                eq(pages.createdBy, userId),
                eq(pages.status, 'draft')
            ),
        });

        if (!draft) {
            return NextResponse.json({
                success: false,
                error: "没有找到草稿",
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                schema: draft.schema,
                timestamp: draft.publishedAt,
            },
        });
    } catch (error) {
        console.error("获取草稿失败:", error);
        return NextResponse.json(
            { success: false, error: "获取草稿失败" },
            { status: 500 }
        );
    }
}

// 删除草稿
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: "请先登录" },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id;
        const db = getDb();

        const draft = await db.query.pages.findFirst({
            where: and(
                eq(pages.createdBy, userId),
                eq(pages.status, 'draft')
            ),
        });

        if (!draft) {
            return NextResponse.json({
                success: true,
                message: "没有草稿需要删除",
            });
        }

        await db.delete(pages).where(eq(pages.id, draft.id));

        return NextResponse.json({
            success: true,
            message: "草稿已删除",
        });
    } catch (error) {
        console.error("删除草稿失败:", error);
        return NextResponse.json(
            { success: false, error: "删除草稿失败" },
            { status: 500 }
        );
    }
}
