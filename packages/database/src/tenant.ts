import { DbClient } from './index';
import { tenantMembers, users } from './schemas/core';
import { eq, and } from 'drizzle-orm';

/**
 * 租户上下文 - 用于租户隔离
 */
export interface TenantContext {
    tenantId: string;
    userId: string;
    role: string;
}

/**
 * 创建租户上下文
 */
export async function createTenantContext(
    db: DbClient,
    userId: string,
    tenantId: string
): Promise<TenantContext | null> {
    // 验证用户是否属于该租户
    const member = await db.query.tenantMembers.findFirst({
        where: and(
            eq(tenantMembers.userId, userId),
            eq(tenantMembers.tenantId, tenantId),
            eq(tenantMembers.status, 'active')
        ),
    });

    if (!member) {
        return null;
    }

    return {
        tenantId,
        userId,
        role: member.role,
    };
}

/**
 * 租户隔离查询助手
 * 自动添加 tenantId 过滤条件
 */
export class TenantQuery {
    constructor(
        private db: DbClient,
        private context: TenantContext
    ) { }

    /**
     * 获取租户 ID
     */
    getTenantId(): string {
        return this.context.tenantId;
    }

    /**
     * 获取用户 ID
     */
    getUserId(): string {
        return this.context.userId;
    }

    /**
     * 获取用户角色
     */
    getRole(): string {
        return this.context.role;
    }

    /**
     * 检查是否是管理员
     */
    isAdmin(): boolean {
        return ['owner', 'admin'].includes(this.context.role);
    }

    /**
     * 获取数据库客户端（用于自定义查询）
     */
    getDb(): DbClient {
        return this.db;
    }
}

/**
 * 创建租户查询助手
 */
export async function createTenantQuery(
    db: DbClient,
    userId: string,
    tenantId: string
): Promise<TenantQuery | null> {
    const context = await createTenantContext(db, userId, tenantId);

    if (!context) {
        return null;
    }

    return new TenantQuery(db, context);
}
