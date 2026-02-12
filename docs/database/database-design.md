# 数据库设计文档

## 文档版本

| 版本 | 日期       | 作者       | 说明     |
| ---- | ---------- | ---------- | -------- |
| v1.0 | 2026-02-11 | 首席架构师 | 初始版本 |

---

## 一、数据库选型

**数据库**: PostgreSQL 15+

**选型理由**:
- 企业级关系型数据库，稳定可靠
- 支持 JSONB 类型，适合存储 Schema
- 支持 Row Level Security (RLS)，适合多租户隔离
- 支持全文搜索
- 丰富的索引类型（B-Tree、GiST、GIN等）
- 优秀的性能和扩展性

---

## 二、核心表设计

### 2.1 租户与组织

#### tenants (租户表)

| 字段          | 类型         | 说明                | 索引   |
| ------------- | ------------ | ------------------- | ------ |
| id            | UUID         | 主键                | PK     |
| name          | VARCHAR(255) | 租户名称            |        |
| slug          | VARCHAR(100) | 租户标识（用于URL） | UNIQUE |
| plan          | VARCHAR(50)  | 订阅计划            | INDEX  |
| status        | VARCHAR(50)  | 状态                | INDEX  |
| custom_domain | VARCHAR(255) | 自定义域名          | INDEX  |
| quota         | JSONB        | 资源配额            |        |
| settings      | JSONB        | 租户配置            |        |
| created_at    | TIMESTAMP    | 创建时间            |        |
| updated_at    | TIMESTAMP    | 更新时间            |        |

#### organizations (组织表)

| 字段        | 类型         | 说明     | 索引      |
| ----------- | ------------ | -------- | --------- |
| id          | UUID         | 主键     | PK        |
| tenant_id   | UUID         | 所属租户 | FK, INDEX |
| name        | VARCHAR(255) | 组织名称 |           |
| description | TEXT         | 描述     |           |
| settings    | JSONB        | 组织配置 |           |
| created_at  | TIMESTAMP    | 创建时间 |           |
| updated_at  | TIMESTAMP    | 更新时间 |           |

#### departments (部门/团队表)

| 字段            | 类型         | 说明                    | 索引      |
| --------------- | ------------ | ----------------------- | --------- |
| id              | UUID         | 主键                    | PK        |
| organization_id | UUID         | 所属组织                | FK, INDEX |
| parent_id       | UUID         | 父部门                  | FK, INDEX |
| name            | VARCHAR(255) | 部门名称                |           |
| type            | VARCHAR(50)  | 类型（department/team） |           |
| created_at      | TIMESTAMP    | 创建时间                |           |

### 2.2 用户与权限

#### users (用户表)

| 字段          | 类型         | 说明         | 索引      |
| ------------- | ------------ | ------------ | --------- |
| id            | UUID         | 主键         | PK        |
| tenant_id     | UUID         | 所属租户     | FK, INDEX |
| email         | VARCHAR(255) | 邮箱         | UNIQUE    |
| name          | VARCHAR(255) | 姓名         |           |
| avatar        | VARCHAR(500) | 头像URL      |           |
| password_hash | VARCHAR(255) | 密码哈希     |           |
| status        | VARCHAR(50)  | 状态         | INDEX     |
| last_login_at | TIMESTAMP    | 最后登录时间 |           |
| created_at    | TIMESTAMP    | 创建时间     |           |
| updated_at    | TIMESTAMP    | 更新时间     |           |

#### roles (角色表)

| 字段         | 类型         | 说明         | 索引      |
| ------------ | ------------ | ------------ | --------- |
| id           | UUID         | 主键         | PK        |
| tenant_id    | UUID         | 所属租户     | FK, INDEX |
| name         | VARCHAR(100) | 角色名称     |           |
| display_name | VARCHAR(255) | 显示名称     |           |
| description  | TEXT         | 描述         |           |
| permissions  | JSONB        | 权限列表     |           |
| policies     | JSONB        | ABAC 策略    |           |
| is_system    | BOOLEAN      | 是否系统角色 |           |
| created_at   | TIMESTAMP    | 创建时间     |           |

#### user_roles (用户角色关联表)

| 字段       | 类型        | 说明       | 索引      |
| ---------- | ----------- | ---------- | --------- |
| id         | UUID        | 主键       | PK        |
| user_id    | UUID        | 用户ID     | FK, INDEX |
| role_id    | UUID        | 角色ID     | FK, INDEX |
| scope_type | VARCHAR(50) | 作用域类型 |           |
| scope_id   | UUID        | 作用域ID   |           |
| expires_at | TIMESTAMP   | 过期时间   |           |
| created_at | TIMESTAMP   | 创建时间   |           |

### 2.3 应用与页面

#### applications (应用表)

| 字段            | 类型         | 说明     | 索引      |
| --------------- | ------------ | -------- | --------- |
| id              | UUID         | 主键     | PK        |
| tenant_id       | UUID         | 所属租户 | FK, INDEX |
| organization_id | UUID         | 所属组织 | FK, INDEX |
| name            | VARCHAR(255) | 应用名称 |           |
| slug            | VARCHAR(100) | 应用标识 | INDEX     |
| description     | TEXT         | 描述     |           |
| icon            | VARCHAR(500) | 图标URL  |           |
| status          | VARCHAR(50)  | 状态     | INDEX     |
| settings        | JSONB        | 应用配置 |           |
| created_by      | UUID         | 创建者   | FK        |
| created_at      | TIMESTAMP    | 创建时间 |           |
| updated_at      | TIMESTAMP    | 更新时间 |           |

#### pages (页面表)

| 字段                 | 类型         | 说明                    | 索引      |
| -------------------- | ------------ | ----------------------- | --------- |
| id                   | UUID         | 主键                    | PK        |
| tenant_id            | UUID         | 所属租户                | FK, INDEX |
| application_id       | UUID         | 所属应用                | FK, INDEX |
| name                 | VARCHAR(255) | 页面名称                |           |
| slug                 | VARCHAR(100) | 页面标识                | INDEX     |
| title                | VARCHAR(255) | 页面标题                |           |
| description          | TEXT         | 描述                    |           |
| schema               | JSONB        | 页面Schema              | GIN       |
| status               | VARCHAR(50)  | 状态（draft/published） | INDEX     |
| published_version_id | UUID         | 已发布版本ID            | FK        |
| created_by           | UUID         | 创建者                  | FK        |
| updated_by           | UUID         | 更新者                  | FK        |
| created_at           | TIMESTAMP    | 创建时间                |           |
| updated_at           | TIMESTAMP    | 更新时间                |           |

#### page_versions (页面版本表)

| 字段         | 类型      | 说明           | 索引      |
| ------------ | --------- | -------------- | --------- |
| id           | UUID      | 主键           | PK        |
| page_id      | UUID      | 页面ID         | FK, INDEX |
| version      | INTEGER   | 版本号         |           |
| schema       | JSONB     | 页面Schema快照 |           |
| change_log   | TEXT      | 变更日志       |           |
| published_at | TIMESTAMP | 发布时间       |           |
| created_by   | UUID      | 创建者         | FK        |
| created_at   | TIMESTAMP | 创建时间       |           |

### 2.4 组件库

#### components_registry (组件注册表)

| 字段         | 类型         | 说明                     | 索引      |
| ------------ | ------------ | ------------------------ | --------- |
| id           | UUID         | 主键                     | PK        |
| tenant_id    | UUID         | 所属租户（NULL表示全局） | FK, INDEX |
| component_id | VARCHAR(100) | 组件ID                   | INDEX     |
| name         | VARCHAR(255) | 组件名称                 |           |
| version      | VARCHAR(50)  | 版本                     |           |
| category     | VARCHAR(50)  | 分类                     | INDEX     |
| meta         | JSONB        | 组件元数据               |           |
| is_builtin   | BOOLEAN      | 是否内置组件             |           |
| plugin_id    | UUID         | 所属插件                 | FK, INDEX |
| created_at   | TIMESTAMP    | 创建时间                 |           |
| updated_at   | TIMESTAMP    | 更新时间                 |           |

### 2.5 数据源

#### data_sources (数据源表)

| 字段           | 类型         | 说明                     | 索引      |
| -------------- | ------------ | ------------------------ | --------- |
| id             | UUID         | 主键                     | PK        |
| tenant_id      | UUID         | 所属租户                 | FK, INDEX |
| application_id | UUID         | 所属应用                 | FK, INDEX |
| name           | VARCHAR(255) | 数据源名称               |           |
| type           | VARCHAR(50)  | 类型（rest/graphql/sql） | INDEX     |
| config         | JSONB        | 配置信息（加密）         |           |
| status         | VARCHAR(50)  | 状态                     | INDEX     |
| created_by     | UUID         | 创建者                   | FK        |
| created_at     | TIMESTAMP    | 创建时间                 |           |
| updated_at     | TIMESTAMP    | 更新时间                 |           |

### 2.6 工作流

#### workflows (工作流表)

| 字段           | 类型         | 说明       | 索引      |
| -------------- | ------------ | ---------- | --------- |
| id             | UUID         | 主键       | PK        |
| tenant_id      | UUID         | 所属租户   | FK, INDEX |
| application_id | UUID         | 所属应用   | FK, INDEX |
| name           | VARCHAR(255) | 工作流名称 |           |
| description    | TEXT         | 描述       |           |
| definition     | JSONB        | 工作流定义 |           |
| version        | VARCHAR(50)  | 版本       |           |
| status         | VARCHAR(50)  | 状态       | INDEX     |
| created_by     | UUID         | 创建者     | FK        |
| created_at     | TIMESTAMP    | 创建时间   |           |
| updated_at     | TIMESTAMP    | 更新时间   |           |

#### workflow_executions (工作流执行记录)

| 字段         | 类型        | 说明     | 索引      |
| ------------ | ----------- | -------- | --------- |
| id           | UUID        | 主键     | PK        |
| workflow_id  | UUID        | 工作流ID | FK, INDEX |
| status       | VARCHAR(50) | 执行状态 | INDEX     |
| input        | JSONB       | 输入参数 |           |
| output       | JSONB       | 输出结果 |           |
| error        | TEXT        | 错误信息 |           |
| started_at   | TIMESTAMP   | 开始时间 | INDEX     |
| completed_at | TIMESTAMP   | 完成时间 |           |
| created_by   | UUID        | 触发者   | FK        |

### 2.7 插件系统

#### plugins (插件表)

| 字段         | 类型         | 说明       | 索引   |
| ------------ | ------------ | ---------- | ------ |
| id           | UUID         | 主键       | PK     |
| plugin_id    | VARCHAR(100) | 插件ID     | UNIQUE |
| name         | VARCHAR(255) | 插件名称   |        |
| version      | VARCHAR(50)  | 版本       |        |
| type         | VARCHAR(50)  | 插件类型   | INDEX  |
| meta         | JSONB        | 插件元数据 |        |
| status       | VARCHAR(50)  | 状态       | INDEX  |
| installed_at | TIMESTAMP    | 安装时间   |        |

#### tenant_plugins (租户插件关联)

| 字段         | 类型        | 说明                     | 索引      |
| ------------ | ----------- | ------------------------ | --------- |
| id           | UUID        | 主键                     | PK        |
| tenant_id    | UUID        | 租户ID                   | FK, INDEX |
| plugin_id    | UUID        | 插件ID                   | FK, INDEX |
| status       | VARCHAR(50) | 状态（enabled/disabled） |           |
| config       | JSONB       | 插件配置                 |           |
| installed_at | TIMESTAMP   | 安装时间                 |           |

### 2.8 审计日志

#### audit_logs (审计日志表)

| 字段          | 类型         | 说明       | 索引      |
| ------------- | ------------ | ---------- | --------- |
| id            | UUID         | 主键       | PK        |
| tenant_id     | UUID         | 所属租户   | FK, INDEX |
| user_id       | UUID         | 操作用户   | FK, INDEX |
| action        | VARCHAR(100) | 操作类型   | INDEX     |
| resource_type | VARCHAR(100) | 资源类型   | INDEX     |
| resource_id   | UUID         | 资源ID     | INDEX     |
| details       | JSONB        | 详细信息   |           |
| ip_address    | INET         | IP地址     |           |
| user_agent    | TEXT         | User Agent |           |
| created_at    | TIMESTAMP    | 创建时间   | INDEX     |

### 2.9 使用量统计

#### usage_events (使用量事件表)

| 字段          | 类型         | 说明     | 索引      |
| ------------- | ------------ | -------- | --------- |
| id            | UUID         | 主键     | PK        |
| tenant_id     | UUID         | 租户ID   | FK, INDEX |
| resource_type | VARCHAR(100) | 资源类型 | INDEX     |
| action        | VARCHAR(100) | 操作     | INDEX     |
| amount        | INTEGER      | 数量     |           |
| metadata      | JSONB        | 元数据   |           |
| timestamp     | TIMESTAMP    | 时间戳   | INDEX     |

---

## 三、索引设计

### 3.1 关键索引

```sql
-- 租户相关
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);

-- 用户相关
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 页面相关
CREATE INDEX idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX idx_pages_application_id ON pages(application_id);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_schema ON pages USING GIN (schema);

-- 组件相关
CREATE INDEX idx_components_tenant_id ON components_registry(tenant_id);
CREATE INDEX idx_components_category ON components_registry(category);

-- 审计日志
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 使用量统计
CREATE INDEX idx_usage_events_tenant_id ON usage_events(tenant_id);
CREATE INDEX idx_usage_events_timestamp ON usage_events(timestamp);
```

### 3.2 复合索引

```sql
-- 用户角色查询优化
CREATE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);

-- 页面版本查询优化
CREATE INDEX idx_page_versions_page_version ON page_versions(page_id, version DESC);

-- 工作流执行查询优化
CREATE INDEX idx_workflow_executions_workflow_started ON workflow_executions(workflow_id, started_at DESC);
```

---

## 四、Row Level Security (RLS) 策略

### 4.1 启用 RLS

```sql
-- 为所有租户相关表启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ... 其他表
```

### 4.2 创建策略

```sql
-- 用户只能访问自己租户的数据
CREATE POLICY tenant_isolation_policy ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy ON pages
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 为管理员创建绕过策略
CREATE POLICY admin_bypass_policy ON users
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = current_setting('app.current_user_id')::uuid
        AND r.name = 'admin'
    )
  );
```

---

## 五、数据迁移策略

### 5.1 版本管理

使用 Drizzle Kit 进行数据库迁移：

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config
```

### 5.2 迁移脚本

```bash
# 生成迁移文件
pnpm drizzle-kit generate:pg

# 执行迁移
pnpm drizzle-kit push:pg

# 查看迁移状态
pnpm drizzle-kit introspect:pg
```

---

## 六、数据备份策略

### 6.1 备份计划

- **全量备份**: 每天凌晨 2:00
- **增量备份**: 每 6 小时一次
- **保留策略**: 
  - 最近 7 天：全量 + 增量
  - 7-30 天：每日全量
  - 30-90 天：每周全量
  - 90 天以上：每月全量

### 6.2 备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/postgres"
DATABASE="lowcoder"

# 全量备份
pg_dump -U postgres -d $DATABASE -F c -b -v -f "$BACKUP_DIR/full_$DATE.dump"

# 增量备份（使用 WAL 归档）
pg_basebackup -U postgres -D "$BACKUP_DIR/incremental_$DATE" -F tar -z -P
```

---

## 七、性能优化

### 7.1 查询优化

- 使用合适的索引
- 避免 SELECT *
- 使用 EXPLAIN ANALYZE 分析查询计划
- 合理使用连接池

### 7.2 缓存策略

- 页面 Schema 缓存到 Redis
- 组件元数据缓存
- 用户权限缓存
- 租户配置缓存

### 7.3 分区策略

对于大表（如审计日志、使用量统计）使用分区：

```sql
-- 按月分区审计日志
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL,
  -- ...
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

---

## 八、总结

数据库设计已完成：

✅ **完整的表结构**：租户、用户、页面、组件、工作流等15+核心表  
✅ **索引优化**：关键字段索引 + GIN索引支持JSONB查询  
✅ **RLS策略**：Row Level Security 实现租户隔离  
✅ **迁移方案**：Drizzle Kit 管理数据库版本  
✅ **备份策略**：全量+增量备份方案  
✅ **性能优化**：缓存策略 + 分区表设计  

**下一步**：使用 Drizzle ORM 实现数据库模型代码。
