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
import { tenants, users } from './core';

/**
 * 应用表 - 低代码应用
 */
export const apps = pgTable('apps', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 应用名称
    name: varchar('name', { length: 100 }).notNull(),
    // 应用描述
    description: text('description'),
    // 应用图标
    icon: text('icon'),
    // 应用唯一标识（用于访问路径）
    slug: varchar('slug', { length: 50 }).notNull(),
    // 应用状态: draft, published, archived
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    // 应用类型: web, mobile, desktop
    type: varchar('type', { length: 20 }).notNull().default('web'),
    // 应用配置
    settings: jsonb('settings').default({}),
    // 主题配置
    theme: jsonb('theme').default({}),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // 发布时间
    publishedAt: timestamp('published_at'),
});

/**
 * 页面表 - 应用的页面
 */
export const pages = pgTable('pages', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 应用ID
    appId: uuid('app_id')
        .notNull()
        .references(() => apps.id, { onDelete: 'cascade' }),
    // 页面名称
    name: varchar('name', { length: 100 }).notNull(),
    // 页面路径
    path: varchar('path', { length: 255 }).notNull(),
    // 页面标题
    title: varchar('title', { length: 200 }),
    // 页面描述
    description: text('description'),
    // 页面 Schema（JSON）
    schema: jsonb('schema').notNull(),
    // 页面状态: draft, published, archived
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    // 页面类型: normal, home, 404, etc.
    type: varchar('type', { length: 20 }).notNull().default('normal'),
    // 是否需要认证
    requireAuth: boolean('require_auth').notNull().default(true),
    // 所需权限
    permissions: jsonb('permissions').default([]),
    // 排序
    sortOrder: integer('sort_order').notNull().default(0),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // 发布时间
    publishedAt: timestamp('published_at'),
});

/**
 * 页面版本表 - 页面的历史版本
 */
export const pageVersions = pgTable('page_versions', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 页面ID
    pageId: uuid('page_id')
        .notNull()
        .references(() => pages.id, { onDelete: 'cascade' }),
    // 版本号
    version: integer('version').notNull(),
    // 页面 Schema
    schema: jsonb('schema').notNull(),
    // 变更说明
    changelog: text('changelog'),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 组件库表 - 自定义组件
 */
export const components = pgTable('components', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID（null表示全局组件）
    tenantId: uuid('tenant_id').references(() => tenants.id, {
        onDelete: 'cascade',
    }),
    // 组件名称
    name: varchar('name', { length: 100 }).notNull(),
    // 组件类型
    type: varchar('type', { length: 50 }).notNull(),
    // 组件描述
    description: text('description'),
    // 组件图标
    icon: text('icon'),
    // 组件分类
    category: varchar('category', { length: 50 }),
    // 组件 Schema
    schema: jsonb('schema').notNull(),
    // 组件属性定义
    props: jsonb('props').notNull(),
    // 组件代码（可选）
    code: text('code'),
    // 组件样式
    styles: text('styles'),
    // 组件缩略图
    thumbnail: text('thumbnail'),
    // 是否公开
    isPublic: boolean('is_public').notNull().default(false),
    // 版本号
    version: varchar('version', { length: 20 }).notNull().default('1.0.0'),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 数据源表 - 外部数据源配置
 */
export const dataSources = pgTable('data_sources', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 数据源名称
    name: varchar('name', { length: 100 }).notNull(),
    // 数据源类型: mysql, postgresql, mongodb, rest, graphql, etc.
    type: varchar('type', { length: 50 }).notNull(),
    // 数据源描述
    description: text('description'),
    // 连接配置（加密存储）
    config: jsonb('config').notNull(),
    // 数据源状态: active, inactive
    status: varchar('status', { length: 20 }).notNull().default('active'),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * API 查询表 - 数据源查询配置
 */
export const queries = pgTable('queries', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 数据源ID
    dataSourceId: uuid('data_source_id')
        .notNull()
        .references(() => dataSources.id, { onDelete: 'cascade' }),
    // 查询名称
    name: varchar('name', { length: 100 }).notNull(),
    // 查询描述
    description: text('description'),
    // 查询语句/配置
    query: text('query').notNull(),
    // 查询类型: sql, http, graphql, etc.
    type: varchar('type', { length: 50 }).notNull(),
    // 查询参数定义
    params: jsonb('params').default([]),
    // 查询结果转换
    transformer: text('transformer'),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 工作流表
 */
export const workflows = pgTable('workflows', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 工作流名称
    name: varchar('name', { length: 100 }).notNull(),
    // 工作流描述
    description: text('description'),
    // 工作流定义（节点+边）
    definition: jsonb('definition').notNull(),
    // 工作流状态: draft, active, inactive
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    // 触发器配置
    trigger: jsonb('trigger'),
    // 创建者
    createdBy: uuid('created_by')
        .notNull()
        .references(() => users.id),
    // 创建时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 工作流执行记录表
 */
export const workflowExecutions = pgTable('workflow_executions', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 工作流ID
    workflowId: uuid('workflow_id')
        .notNull()
        .references(() => workflows.id, { onDelete: 'cascade' }),
    // 执行状态: running, success, failed, cancelled
    status: varchar('status', { length: 20 }).notNull().default('running'),
    // 输入数据
    input: jsonb('input'),
    // 输出数据
    output: jsonb('output'),
    // 错误信息
    error: text('error'),
    // 执行日志
    logs: jsonb('logs').default([]),
    // 开始时间
    startedAt: timestamp('started_at').notNull().defaultNow(),
    // 结束时间
    finishedAt: timestamp('finished_at'),
    // 执行时长（毫秒）
    duration: integer('duration'),
});

/**
 * 文件存储表
 */
export const files = pgTable('files', {
    id: uuid('id').defaultRandom().primaryKey(),
    // 租户ID
    tenantId: uuid('tenant_id')
        .notNull()
        .references(() => tenants.id, { onDelete: 'cascade' }),
    // 文件名
    name: varchar('name', { length: 255 }).notNull(),
    // 文件路径
    path: text('path').notNull(),
    // 文件URL
    url: text('url').notNull(),
    // 文件类型
    mimeType: varchar('mime_type', { length: 100 }),
    // 文件大小（字节）
    size: integer('size').notNull(),
    // 文件元数据
    metadata: jsonb('metadata').default({}),
    // 上传者
    uploadedBy: uuid('uploaded_by')
        .notNull()
        .references(() => users.id),
    // 上传时间
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 导出类型
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageVersion = typeof pageVersions.$inferSelect;
export type NewPageVersion = typeof pageVersions.$inferInsert;
export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type Query = typeof queries.$inferSelect;
export type NewQuery = typeof queries.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
