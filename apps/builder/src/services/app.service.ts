import { getDb } from '@/lib/db';
import { apps } from '@low-coder/database/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * 应用服务 - 处理应用 CRUD
 */
export class AppService {
    /**
     * 获取租户的所有应用
     */
    static async getApps(tenantId: string) {
        const db = getDb();

        return db.query.apps.findMany({
            where: eq(apps.tenantId, tenantId),
            orderBy: (apps, { desc }) => [desc(apps.createdAt)],
        });
    }

    /**
     * 根据 ID 获取应用
     */
    static async getAppById(appId: string, tenantId: string) {
        const db = getDb();

        return db.query.apps.findFirst({
            where: and(eq(apps.id, appId), eq(apps.tenantId, tenantId)),
        });
    }

    /**
     * 根据 slug 获取应用
     */
    static async getAppBySlug(slug: string, tenantId: string) {
        const db = getDb();

        return db.query.apps.findFirst({
            where: and(eq(apps.slug, slug), eq(apps.tenantId, tenantId)),
        });
    }

    /**
     * 创建应用
     */
    static async createApp(data: {
        tenantId: string;
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        type?: string;
        createdBy: string;
    }) {
        const db = getDb();

        const [app] = await db
            .insert(apps)
            .values({
                ...data,
                status: 'draft',
                type: data.type || 'web',
            })
            .returning();

        return app;
    }

    /**
     * 更新应用
     */
    static async updateApp(
        appId: string,
        tenantId: string,
        updates: {
            name?: string;
            description?: string;
            icon?: string;
            status?: string;
            settings?: any;
            theme?: any;
        }
    ) {
        const db = getDb();

        const [app] = await db
            .update(apps)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(and(eq(apps.id, appId), eq(apps.tenantId, tenantId)))
            .returning();

        return app;
    }

    /**
     * 删除应用
     */
    static async deleteApp(appId: string, tenantId: string) {
        const db = getDb();

        await db
            .delete(apps)
            .where(and(eq(apps.id, appId), eq(apps.tenantId, tenantId)));
    }

    /**
     * 发布应用
     */
    static async publishApp(appId: string, tenantId: string) {
        const db = getDb();

        const [app] = await db
            .update(apps)
            .set({
                status: 'published',
                publishedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(apps.id, appId), eq(apps.tenantId, tenantId)))
            .returning();

        return app;
    }
}
