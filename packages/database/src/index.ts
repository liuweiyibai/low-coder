import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas';

/**
 * 创建数据库客户端
 */
export function createDbClient(connectionString: string) {
    const client = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    const db = drizzle(client, { schema });

    return { db, client };
}

/**
 * 数据库客户端类型
 */
export type DbClient = ReturnType<typeof createDbClient>['db'];

// 导出所有 Schema
export * from './schemas';

// 导出租户相关
export * from './tenant';

// 导出权限相关
export * from './permission';
