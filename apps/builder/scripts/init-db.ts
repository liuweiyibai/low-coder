/**
 * 数据库初始化脚本
 * 创建默认租户和应用
 */

import { getDb } from '../src/lib/db';
import { tenants, apps } from '@low-coder/database/schemas';

async function initDatabase() {
    console.log('开始初始化数据库...');

    try {
        const db = getDb();

        // 检查默认租户是否存在
        const existingTenant = await db.query.tenants.findFirst({
            where: (tenants, { eq }) => eq(tenants.id, 'default-tenant'),
        });

        if (!existingTenant) {
            // 创建默认租户
            await db.insert(tenants).values({
                id: 'default-tenant',
                name: 'Default Tenant',
                slug: 'default',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log('✅ 默认租户已创建');
        } else {
            console.log('ℹ️  默认租户已存在');
        }

        // 检查默认应用是否存在
        const existingApp = await db.query.apps.findFirst({
            where: (apps, { eq }) => eq(apps.id, 'default-app'),
        });

        if (!existingApp) {
            // 创建默认应用
            await db.insert(apps).values({
                id: 'default-app',
                tenantId: 'default-tenant',
                name: 'Default App',
                slug: 'default',
                status: 'published',
                type: 'web',
                createdBy: 'admin', // 使用admin用户ID
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log('✅ 默认应用已创建');
        } else {
            console.log('ℹ️  默认应用已存在');
        }

        console.log('✅ 数据库初始化完成！');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
}

initDatabase();
