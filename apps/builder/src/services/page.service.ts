import { getDb } from '@/lib/db';
import { pages, apps } from '@low-coder/database/schemas';
import { eq, and } from 'drizzle-orm';
import type { PageSchema } from '@low-coder/schema-core';

/**
 * 页面服务 - 处理页面 CRUD
 */
export class PageService {
    /**
     * 获取租户的所有页面
     */
    static async getPages(tenantId: string, appId?: string) {
        const db = getDb();

        const conditions = appId
            ? and(eq(pages.tenantId, tenantId), eq(pages.appId, appId))
            : eq(pages.tenantId, tenantId);

        return db.query.pages.findMany({
            where: conditions,
            orderBy: (pages, { asc }) => [asc(pages.sortOrder)],
        });
    }

    /**
     * 根据 ID 获取页面
     */
    static async getPageById(pageId: string, tenantId: string) {
        const db = getDb();

        return db.query.pages.findFirst({
            where: and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)),
        });
    }

    /**
     * 创建页面
     */
    static async createPage(
        data: {
            tenantId: string;
            appId: string;
            name: string;
            path: string;
            title?: string;
            description?: string;
            schema: PageSchema;
            createdBy: string;
        }
    ) {
        const db = getDb();

        const [page] = await db
            .insert(pages)
            .values({
                ...data,
                status: 'draft',
                type: 'normal',
            })
            .returning();

        return page;
    }

    /**
     * 更新页面
     */
    static async updatePage(
        pageId: string,
        tenantId: string,
        updates: {
            name?: string;
            title?: string;
            description?: string;
            schema?: PageSchema;
            status?: string;
        }
    ) {
        const db = getDb();

        const [page] = await db
            .update(pages)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
            .returning();

        return page;
    }

    /**
     * 删除页面
     */
    static async deletePage(pageId: string, tenantId: string) {
        const db = getDb();

        await db
            .delete(pages)
            .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)));
    }

    /**
     * 发布页面
     */
    static async publishPage(pageId: string, tenantId: string) {
        const db = getDb();

        const [page] = await db
            .update(pages)
            .set({
                status: 'published',
                publishedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(pages.id, pageId), eq(pages.tenantId, tenantId)))
            .returning();

        return page;
    }
}
