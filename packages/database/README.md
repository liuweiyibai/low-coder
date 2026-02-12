# @low-coder/database

数据库层包，基于 Drizzle ORM，提供多租户 SaaS 架构的数据模型和工具。

## 功能特性

### 1. 多租户架构
- **租户隔离**：每个租户的数据完全隔离
- **资源配额**：支持不同租户套餐的资源限制
- **使用量统计**：实时跟踪租户资源使用情况

### 2. 权限系统
- **RBAC（基于角色的访问控制）**：灵活的角色和权限管理
- **ABAC（基于属性的访问控制）**：支持基于资源所有权的权限判断
- **多级权限**：租户级别 + 自定义角色 + 资源所有权

### 3. 组织管理
- **部门树结构**：支持多级部门组织
- **成员管理**：用户可属于多个部门
- **跨租户用户**：同一用户可加入多个租户

### 4. 业务实体
- **应用管理**：低代码应用的完整生命周期
- **页面版本**：页面 Schema 的版本控制
- **组件库**：租户级和全局组件库
- **数据源**：多种数据源类型支持
- **工作流**：工作流定义和执行记录

## 数据模型

### 核心表（Core Schema）

#### tenants - 租户表
- 租户基本信息、套餐、配额、使用量
- 支持多租户隔离

#### users - 用户表
- 全局用户表，支持跨租户
- OAuth 认证支持

#### tenant_members - 租户成员表
- 用户与租户的多对多关系
- 成员角色：owner, admin, member, viewer

#### roles - 角色表
- 自定义角色定义
- 权限列表

#### permissions - 权限表
- 系统权限定义
- 格式：`resource:action`

#### departments - 部门表
- 树形组织结构
- 支持部门负责人

### 业务表（Business Schema）

#### apps - 应用表
- 低代码应用
- 支持草稿、发布、归档状态

#### pages - 页面表
- 应用的页面
- 存储页面 Schema
- 权限控制

#### page_versions - 页面版本表
- 页面历史版本
- 变更记录

#### components - 组件库表
- 自定义组件
- 租户级和全局组件

#### data_sources - 数据源表
- 外部数据源配置
- 支持 MySQL, PostgreSQL, REST API, GraphQL 等

#### queries - API查询表
- 数据源查询配置
- 参数定义和结果转换

#### workflows - 工作流表
- 工作流定义
- 触发器配置

#### workflow_executions - 工作流执行表
- 执行记录
- 日志和错误信息

#### files - 文件存储表
- 文件元数据
- 租户级文件隔离

## 使用示例

### 1. 创建数据库客户端

```typescript
import { createDbClient } from '@low-coder/database';

const { db, client } = createDbClient(process.env.DATABASE_URL!);
```

### 2. 租户上下文

```typescript
import { createTenantContext, createTenantQuery } from '@low-coder/database';

// 创建租户上下文
const context = await createTenantContext(db, userId, tenantId);

// 创建租户查询助手
const tenantQuery = await createTenantQuery(db, userId, tenantId);

if (tenantQuery) {
  console.log('Tenant ID:', tenantQuery.getTenantId());
  console.log('User ID:', tenantQuery.getUserId());
  console.log('Role:', tenantQuery.getRole());
  console.log('Is Admin:', tenantQuery.isAdmin());
}
```

### 3. 权限检查

```typescript
import { createPermissionChecker } from '@low-coder/database';

const checker = createPermissionChecker(db, context);

// 检查单个权限
const canWrite = await checker.hasPermission('page', 'write');

// 检查多个权限（任意一个）
const canAccess = await checker.hasAnyPermission([
  { resource: 'page', action: 'read' },
  { resource: 'page', action: 'write' },
]);

// 检查所有权限
const canManage = await checker.hasAllPermissions([
  { resource: 'page', action: 'read' },
  { resource: 'page', action: 'write' },
  { resource: 'page', action: 'delete' },
]);

// 获取用户所有权限
const permissions = await checker.getUserPermissions();
```

### 4. 使用装饰器进行权限控制

```typescript
import { requirePermission } from '@low-coder/database';

class PageService {
  private permissionChecker: PermissionChecker;

  constructor(checker: PermissionChecker) {
    this.permissionChecker = checker;
  }

  @requirePermission('page', 'write')
  async updatePage(pageId: string, updates: any) {
    // 更新页面逻辑
  }

  @requirePermission('page', 'delete')
  async deletePage(pageId: string) {
    // 删除页面逻辑
  }
}
```

### 5. 查询数据（带租户隔离）

```typescript
import { eq, and } from 'drizzle-orm';
import { apps } from '@low-coder/database/schemas';

const tenantQuery = await createTenantQuery(db, userId, tenantId);

if (tenantQuery) {
  const db = tenantQuery.getDb();
  
  // 查询当前租户的所有应用
  const myApps = await db.query.apps.findMany({
    where: eq(apps.tenantId, tenantQuery.getTenantId()),
  });
}
```

## 权限模型

### 权限格式
权限采用 `resource:action` 格式：
- `app:read` - 读取应用
- `app:write` - 创建/编辑应用
- `app:delete` - 删除应用
- `page:read` - 读取页面
- `page:write` - 创建/编辑页面
- `workflow:execute` - 执行工作流
- `settings:admin` - 管理设置

### 角色层级
1. **Owner（所有者）**：拥有所有权限
2. **Admin（管理员）**：拥有大部分权限，除了某些敏感操作
3. **Member（成员）**：默认只读权限 + 自定义角色权限
4. **Viewer（访客）**：只读权限

### 权限检查流程
1. 检查是否是 Owner（拥有所有权限）
2. 检查是否是 Admin（拥有大部分权限）
3. 检查自定义角色权限（RBAC）
4. 检查资源所有权（ABAC）
5. 应用默认权限策略

## 数据库迁移

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 推送到数据库（开发环境）
pnpm db:push

# 打开 Drizzle Studio（可视化管理）
pnpm db:studio
```

## 环境变量

```env
DATABASE_URL=postgresql://user:password@localhost:5432/lowcoder
```

## 技术栈

- **Drizzle ORM**: 类型安全的 ORM
- **PostgreSQL**: 关系型数据库
- **postgres**: PostgreSQL 客户端

## 设计原则

1. **租户隔离优先**：所有业务表都包含 tenantId
2. **类型安全**：完整的 TypeScript 类型支持
3. **性能优化**：合理的索引和查询优化
4. **安全第一**：加密存储敏感信息
5. **可扩展性**：支持水平扩展和分库分表

## 未来规划

- [ ] Row Level Security（RLS）支持
- [ ] 数据加密（字段级加密）
- [ ] 读写分离
- [ ] 数据归档
- [ ] 审计日志
- [ ] 数据备份和恢复
