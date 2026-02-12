import { createDbClient, DbClient } from '@low-coder/database';

let dbInstance: { db: DbClient; client: any } | null = null;

/**
 * 获取数据库实例（单例）
 */
export function getDb() {
    if (!dbInstance) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        dbInstance = createDbClient(connectionString);
    }

    return dbInstance.db;
}

/**
 * 关闭数据库连接
 */
export async function closeDb() {
    if (dbInstance) {
        await dbInstance.client.end();
        dbInstance = null;
    }
}
