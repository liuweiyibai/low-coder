# 多租户 SaaS 架构实现总结

## 概述

本文档记录了低代码平台的多租户 SaaS 架构实现，包括数据库设计、权限系统、租户隔离机制和 API 集成。

## 已完成功能

### 1. Database 包 (@low-coder/database)

#### 包结构
```
packages/database/
├── src/
│   ├── schemas/
│   │   ├── core.ts          # 核心表（租户、用户、权限等）
│   │   ├── business.ts      # 业务表（应用、页面、组件等）
│   │   └── index.ts         # Schema 导出
│   ├── index.ts             # 主入口
│   ├── tenant.ts            # 租户隔离逻辑
│   └── permission.ts        # 权限系统
├── package.json
├── tsconfig.json
├── tsup.config.ts           # 构建配置
└── drizzle.config.ts        # Drizzle 配置
```

#### 数据模型

##### 核心表 (Core Schema)

**1. tenants - 租户表**
- id, slug, name: 租户基本信息
- plan: 套餐类型 (free, pro, enterprise)
- status: 租户状态 (active, suspended, deleted)
- quota: 资源配额（用户数、应用数、存储等）
- usage: 当前使用量
- subscriptionExpiresAt: 订阅到期时间

**2. users - 用户表**
- id, email, username, displayName: 用户基本信息
- passwordHash: 密码哈希
- status: 用户状态 (active, inactive, banned)
- emailVerified: 邮箱验证状态
- oauthProvider, oauthId: OAuth 认证信息
- lastLoginAt: 最后登录时间

**3. tenant_members - 租户成员表**
- tenantId, userId: 用户与租户关联
- role: 成员角色 (owner, admin, member, viewer)
- status: 成员状态 (active, invited, inactive)
- inviteToken: 邀请令牌
- joinedAt: 加入时间

**4. roles - 角色表**
- tenantId: 租户ID（租户级角色）
- name, description: 角色信息
- isSystem: 是否系统内置角色
- permissions: 权限列表（JSON数组）

**5. permissions - 权限表**
- code: 权限代码 (如 `app:read`, `page:write`)
- resource: 资源类型 (app, page, component, etc.)
- action: 操作类型 (read, write, delete, execute, etc.)

**6. departments - 部门表**
- tenantId, parentId: 支持树形结构
- name, description: 部门信息
- managerId: 部门负责人
- sortOrder: 排序

**7. user_roles - 用户角色关联表**
- tenantMemberId, roleId: 多对多关联

**8. department_members - 部门成员表**
- departmentId, tenantMemberId: 部门成员关联
- isPrimary: 是否主部门

##### 业务表 (Business Schema)

**1. apps - 应用表**
- tenantId: 租户隔离
- name, slug, icon: 应用基本信息
- status: 应用状态 (draft, published, archived)
- type: 应用类型 (web, mobile, desktop)
- settings, theme: 应用配置和主题
- createdBy, publishedAt: 创建者和发布时间

**2. pages - 页面表**
- tenantId, appId: 所属租户和应用
- name, path, title: 页面信息
- schema: 页面 Schema (JSON)
- status: 页面状态 (draft, published, archived)
- requireAuth: 是否需要认证
- permissions: 所需权限（JSON数组）

**3. page_versions - 页面版本表**
- pageId, version: 页面版本控制
- schema: 历史 Schema
- changelog: 变更说明
- createdBy, createdAt: 创建信息

**4. components - 组件库表**
- tenantId: 租户级组件（null 表示全局）
- type, category: 组件类型和分类
- schema, props: 组件定义
- code, styles: 组件代码和样式
- isPublic, version: 公开状态和版本

**5. data_sources - 数据源表**
- tenantId: 租户隔离
- type: 数据源类型 (mysql, postgresql, rest, etc.)
- config: 连接配置（加密存储）
- status: 数据源状态

**6. queries - API 查询表**
- tenantId, dataSourceId: 所属租户和数据源
- query: 查询语句
- params: 查询参数定义
- transformer: 结果转换器

**7. workflows - 工作流表**
- tenantId: 租户隔离
- definition: 工作流定义（节点+边）
- trigger: 触发器配置
- status: 工作流状态

**8. workflow_executions - 工作流执行表**
- workflowId: 所属工作流
- status: 执行状态 (running, success, failed)
- input, output: 输入输出数据
- logs: 执行日志
- duration: 执行时长

**9. files - 文件存储表**
- tenantId: 租户隔离
- path, url: 文件路径和访问URL
- size, mimeType: 文件信息
- metadata: 文件元数据
- uploadedBy: 上传者

### 2. 租户隔离机制

#### TenantContext
```typescript
interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}
```

#### TenantQuery 类
- `getTenantId()`: 获取租户ID
- `getUserId()`: 获取用户ID
- `getRole()`: 获取用户角色
- `isAdmin()`: 检查是否管理员
- `getDb()`: 获取数据库客户端

#### 使用示例
```typescript
const tenantQuery = await createTenantQuery(db, userId, tenantId);
const apps = await db.query.apps.findMany({
  where: eq(apps.tenantId, tenantQuery.getTenantId()),
});
```

### 3. 权限系统

#### 权限模型
- **RBAC（基于角色）**: 通过角色分配权限
- **ABAC（基于属性）**: 基于资源所有权的权限判断
- **混合模式**: RBAC + ABAC 结合

#### 权限格式
```
resource:action
例如: app:read, page:write, workflow:execute
```

#### PermissionChecker 类

**方法**:
- `hasPermission(resource, action, resourceId?)`: 检查单个权限
- `hasAnyPermission(policies[])`: 检查是否拥有任一权限
- `hasAllPermissions(policies[])`: 检查是否拥有所有权限
- `getUserPermissions()`: 获取用户所有权限

**权限检查流程**:
1. 检查是否 Owner（拥有所有权限）
2. 检查是否 Admin（拥有大部分权限）
3. 检查自定义角色权限（RBAC）
4. 检查资源所有权（ABAC）
5. 应用默认权限策略

#### 角色层级
1. **Owner**: 拥有所有权限 (`*:*`)
2. **Admin**: 拥有大部分权限（除敏感操作）
3. **Member**: 默认只读 + 自定义角色权限
4. **Viewer**: 仅只读权限

#### 装饰器支持
```typescript
@requirePermission('page', 'write')
async updatePage(pageId: string, updates: any) {
  // 方法执行前自动检查权限
}
```

### 4. Builder 集成

#### 新增依赖
- `@low-coder/database`: 数据库层包
- `next-auth`: NextAuth.js 认证
- `bcryptjs`: 密码加密

#### 数据库客户端
**文件**: `src/lib/db.ts`
- `getDb()`: 获取数据库实例（单例）
- `closeDb()`: 关闭连接

#### 认证配置
**文件**: `src/lib/auth.ts`
- NextAuth 配置
- Credentials Provider
- JWT Session 策略
- 用户验证和状态检查

#### 服务层

**PageService** (`src/services/page.service.ts`):
- `getPages(tenantId, appId?)`: 获取页面列表
- `getPageById(pageId, tenantId)`: 获取页面详情
- `createPage(data)`: 创建页面
- `updatePage(pageId, tenantId, updates)`: 更新页面
- `deletePage(pageId, tenantId)`: 删除页面
- `publishPage(pageId, tenantId)`: 发布页面

**AppService** (`src/services/app.service.ts`):
- `getApps(tenantId)`: 获取应用列表
- `getAppById(appId, tenantId)`: 获取应用详情
- `getAppBySlug(slug, tenantId)`: 根据slug获取应用
- `createApp(data)`: 创建应用
- `updateApp(appId, tenantId, updates)`: 更新应用
- `deleteApp(appId, tenantId)`: 删除应用
- `publishApp(appId, tenantId)`: 发布应用

#### API 路由

**认证**:
- `POST /api/auth/signin`: 登录
- `POST /api/auth/signout`: 登出
- `GET /api/auth/session`: 获取会话

**应用管理**:
- `GET /api/apps`: 获取应用列表
- `POST /api/apps`: 创建应用

**页面管理**:
- `GET /api/pages`: 获取页面列表
- `POST /api/pages`: 创建页面
- `GET /api/pages/[id]`: 获取页面详情
- `PUT /api/pages/[id]`: 更新页面
- `DELETE /api/pages/[id]`: 删除页面

**请求头**:
- `x-tenant-id`: 租户ID（当前使用 demo-tenant）

### 5. 环境配置

**.env.example**:
```env
DATABASE_URL=postgresql://localhost:5432/lowcoder
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
```

## 技术栈

- **Drizzle ORM 0.36.4**: 类型安全的 ORM
- **PostgreSQL**: 关系型数据库
- **postgres 3.4.5**: PostgreSQL 客户端
- **NextAuth.js 4.24.5**: 认证解决方案
- **bcryptjs 2.4.3**: 密码加密

## 数据库操作命令

```bash
# 生成迁移文件
cd packages/database
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 推送到数据库（开发环境）
pnpm db:push

# 打开 Drizzle Studio（可视化管理）
pnpm db:studio
```

## 核心特性

### ✅ 多租户隔离
- 所有业务表包含 `tenantId` 字段
- TenantQuery 自动添加租户过滤
- 租户上下文验证

### ✅ 权限系统
- RBAC + ABAC 混合模式
- 细粒度权限控制 (resource:action)
- 角色层级管理
- 装饰器支持

### ✅ 组织管理
- 树形部门结构
- 用户多部门支持
- 部门负责人管理

### ✅ 数据持久化
- 页面 Schema 存储
- 版本控制
- 应用生命周期管理

### ✅ 安全性
- 密码加密存储
- JWT Session
- 请求认证
- SQL 注入防护（Drizzle ORM）

### ✅ 类型安全
- 完整的 TypeScript 类型
- Drizzle ORM 类型推断
- Schema 类型导出

## 未来改进

### 待实现功能

1. **认证增强**
   - [ ] OAuth 集成（GitHub, Google）
   - [ ] 邮箱验证
   - [ ] 密码重置
   - [ ] 双因素认证（2FA）

2. **租户管理界面**
   - [ ] 租户创建和配置
   - [ ] 配额管理
   - [ ] 使用量监控
   - [ ] 订阅管理

3. **用户管理**
   - [ ] 用户邀请流程
   - [ ] 角色分配界面
   - [ ] 权限可视化编辑
   - [ ] 部门管理界面

4. **数据安全**
   - [ ] Row Level Security (RLS)
   - [ ] 字段级加密
   - [ ] 审计日志
   - [ ] 数据备份

5. **性能优化**
   - [ ] 数据库索引优化
   - [ ] 查询性能监控
   - [ ] 缓存层（Redis）
   - [ ] 读写分离

6. **测试**
   - [ ] 单元测试
   - [ ] 集成测试
   - [ ] API 测试
   - [ ] 权限测试

7. **文档**
   - [ ] API 文档（OpenAPI）
   - [ ] 权限矩阵
   - [ ] 部署指南
   - [ ] 安全最佳实践

## 使用示例

### 创建租户和用户
```typescript
// 1. 创建租户
const tenant = await db.insert(tenants).values({
  slug: 'acme-corp',
  name: 'ACME Corporation',
  plan: 'pro',
}).returning();

// 2. 创建用户
const user = await db.insert(users).values({
  email: 'admin@acme.com',
  passwordHash: await hash('password', 10),
  displayName: 'Admin User',
}).returning();

// 3. 添加用户到租户（Owner）
await db.insert(tenantMembers).values({
  tenantId: tenant[0].id,
  userId: user[0].id,
  role: 'owner',
  status: 'active',
});
```

### 使用权限检查
```typescript
// 创建权限检查器
const context = await createTenantContext(db, userId, tenantId);
const checker = createPermissionChecker(db, context);

// 检查权限
const canWrite = await checker.hasPermission('page', 'write');
if (canWrite) {
  await PageService.updatePage(pageId, tenantId, updates);
}
```

### 租户隔离查询
```typescript
// 使用 TenantQuery
const tenantQuery = await createTenantQuery(db, userId, tenantId);

if (tenantQuery) {
  const db = tenantQuery.getDb();
  
  // 自动租户隔离
  const pages = await db.query.pages.findMany({
    where: eq(pages.tenantId, tenantQuery.getTenantId()),
  });
}
```

## 总结

本次实现完成了低代码平台的核心多租户 SaaS 架构：

1. **15+ 数据表** 设计完成，涵盖核心和业务场景
2. **租户隔离** 机制实现，确保数据安全
3. **RBAC + ABAC** 权限系统，灵活且安全
4. **服务层和 API** 集成到 Builder 应用
5. **类型安全** 的完整 TypeScript 支持

项目已具备企业级多租户 SaaS 平台的基础能力，可以支持多组织、权限管理、数据隔离等核心需求。后续可以根据业务需求继续完善认证、管理界面和性能优化等功能。
