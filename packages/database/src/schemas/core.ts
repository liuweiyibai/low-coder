import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    text,
    boolean,
    jsonb,
    integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * 租户表 - 多租户架构的核心
 * 每个租户代表一个独立的组织/公司
 */
export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户唯一标识（用于子域名等）
    slug: varchar('slug', { length: 50 }).notNull().unique(),
    // 租户名称
    name: varchar('name', { length: 100 }).notNull(),
    // 租户类型: free, pro, enterprise
    plan: varchar('plan', { length: 20 }).notNull().default('free'),
    // 租户状态: active, suspended, deleted
    status: varchar('status', { length: 20 }).notNull().default('active'),
    // 租户配置（JSON）
    settings: jsonb('settings').default({}),
    // 资源配额
    quota: jsonb('quota').default({
        maxUsers: 5,
        maxApps: 10,
        maxPages: 100,
        maxStorage: 1024 * 1024 * 100, // 100MB
    }),
    // 当前使用量
    usage: jsonb('usage').default({
        users: 0,
        apps: 0,
        pages: 0,
        storage: 0,
    }),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // 订阅到期时间
    subscriptionExpiresAt: timestamp('subscription_expires_at'),
});

/**
 * 用户表 - 支持跨租户的用户
 */
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 用户邮箱（全局唯一）
    email: varchar('email', { length: 255 }).notNull().unique(),
    // 用户名
    username: varchar('username', { length: 50 }),
    // 密码哈希
    passwordHash: text('password_hash'),
    // 显示名称
    displayName: varchar('display_name', { length: 100 }),
    // 头像URL
    avatar: text('avatar'),
    // 用户状态: active, inactive, banned
    status: varchar('status', { length: 20 }).notNull().default('active'),
    // 邮箱验证状态
    emailVerified: boolean('email_verified').notNull().default(false),
    // OAuth 提供商信息
    oauthProvider: varchar('oauth_provider', { length: 50 }),
    oauthId: varchar('oauth_id', { length: 255 }),
    // 最后登录时间
    lastLoginAt: timestamp('last_login_at'),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 租户成员表 - 用户与租户的多对多关系
 */
export const tenantMembers = pgTable('tenant_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 用户ID
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    // 成员角色: owner, admin, member, viewer
    role: varchar('role', { length: 20 }).notNull().default('member'),
    // 成员状态: active, invited, inactive
    status: varchar('status', { length: 20 }).notNull().default('active'),
    // 邀请令牌
    inviteToken: varchar('invite_token', { length: 255 }),
    // 邀请过期时间
    inviteExpiresAt: timestamp('invite_expires_at'),
    // 加入时间
    joinedAt: timestamp('joined_at').defaultNow(),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 角色表 - 自定义角色
 */
export const roles = pgTable('roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID（租户级别的角色）
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 角色名称
    name: varchar('name', { length: 50 }).notNull(),
    // 角色描述
    description: text('description'),
    // 是否系统内置角色
    isSystem: boolean('is_system').notNull().default(false),
    // 角色权限（权限ID数组）
    permissions: jsonb('permissions').default([]),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 权限表 - 系统权限定义
 */
export const permissions = pgTable('permissions', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 权限代码（如 app:read, page:write）
    code: varchar('code', { length: 100 }).notNull().unique(),
    // 权限名称
    name: varchar('name', { length: 100 }).notNull(),
    // 权限描述
    description: text('description'),
    // 资源类型: app, page, component, workflow, etc.
    resource: varchar('resource', { length: 50 }).notNull(),
    // 操作: read, write, delete, execute, etc.
    action: varchar('action', { length: 50 }).notNull(),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 用户角色关联表
 */
export const userRoles = pgTable('user_roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户成员ID
    tenantMemberId: uuid('tenant_member_id')
        .notNull()
        .references(() => tenantMembers.id, { onDelete: 'cascade' }),
    // 角色ID
    roleId: uuid('role_id')
        .notNull()
        .references(() => roles.id, { onDelete: 'cascade' }),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 组织部门表
 */
export const departments: any = pgTable('departments', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 父部门ID（支持部门树结构）
    parentId: uuid('parent_id').$type<string | null>(),
    description: text('description'),
    // 部门负责人
    managerId: uuid('manager_id').references(() => users.id),
    // 排序
    sortOrder: integer('sort_order').notNull().default(0),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 部门成员关联表
 */
export const departmentMembers = pgTable('department_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 部门ID
    departmentId: uuid('department_id')
        .notNull()
        .references(() => departments.id, { onDelete: 'cascade' }),
    // 租户成员ID
    tenantMemberId: uuid('tenant_member_id')
        .notNull()
        .references(() => tenantMembers.id, { onDelete: 'cascade' }),
    // 是否主部门
    isPrimary: boolean('is_primary').notNull().default(false),
    // 加入时间
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

// 导出类型
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TenantMember = typeof tenantMembers.$inferSelect;
export type NewTenantMember = typeof tenantMembers.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
