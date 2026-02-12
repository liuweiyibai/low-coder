# 数据库使用说明

## PostgreSQL 数据库配置

项目已配置使用 PostgreSQL 数据库进行数据持久化。

### 1. 安装 PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
```

**Windows:**
下载安装包：https://www.postgresql.org/download/windows/

### 2. 创建数据库

```bash
# 登录 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE lowcoder;

# 创建用户（可选）
CREATE USER lowcoder_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lowcoder TO lowcoder_user;

# 退出
\q
```

### 3. 配置环境变量

在 `.env.local` 文件中添加：

```env
# 数据库连接字符串
DATABASE_URL=postgresql://lowcoder_user:your_password@localhost:5432/lowcoder

# 或者使用默认用户
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lowcoder
```

### 4. 运行数据库迁移

```bash
# 进入 database 包目录
cd packages/database

# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:push

# 或者直接推送 schema 到数据库（开发环境）
pnpm db:push
```

### 5. 初始化数据库

```bash
# 回到 builder 目录
cd ../../apps/builder

# 运行初始化脚本（创建默认租户和应用）
pnpm tsx scripts/init-db.ts
```

### 6. 查看数据库（可选）

使用 Drizzle Studio 查看数据库：

```bash
cd packages/database
pnpm db:studio
```

## 数据表说明

### 核心表

1. **users** - 用户表
   - 存储用户账号信息
   - 已有默认 admin 账号

2. **tenants** - 租户表
   - 多租户支持
   - 默认租户：default-tenant

3. **apps** - 应用表
   - 低代码应用
   - 默认应用：default-app

4. **pages** - 页面表
   - 存储发布的页面
   - 包含 schema、状态、创建者等信息

### 页面数据结构

```typescript
{
  id: uuid,              // 页面ID
  tenantId: uuid,        // 租户ID
  appId: uuid,           // 应用ID
  name: string,          // 页面名称
  path: string,          // 页面路径
  schema: jsonb,         // 页面结构（JSON）
  status: string,        // 状态：draft, published
  createdBy: uuid,       // 创建者ID
  publishedAt: timestamp // 发布时间
}
```

## 常用命令

```bash
# 查看数据库连接状态
psql $DATABASE_URL -c "SELECT version();"

# 查看所有表
psql $DATABASE_URL -c "\dt"

# 查看 pages 表数据
psql $DATABASE_URL -c "SELECT id, name, status, published_at FROM pages;"

# 清空 pages 表（慎用！）
psql $DATABASE_URL -c "TRUNCATE pages CASCADE;"
```

## 故障排查

### 连接失败

1. 检查 PostgreSQL 是否运行
   ```bash
   brew services list  # macOS
   sudo systemctl status postgresql  # Linux
   ```

2. 检查连接字符串是否正确
   ```bash
   psql $DATABASE_URL
   ```

3. 检查防火墙设置

### 表不存在

运行数据库迁移：
```bash
cd packages/database
pnpm db:push
```

### 权限问题

确保用户有足够的权限：
```sql
GRANT ALL PRIVILEGES ON DATABASE lowcoder TO lowcoder_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lowcoder_user;
```

## 数据备份

```bash
# 备份数据库
pg_dump $DATABASE_URL > backup.sql

# 恢复数据库
psql $DATABASE_URL < backup.sql
```

## 生产环境建议

1. 使用环境变量存储数据库连接信息
2. 定期备份数据库
3. 配置数据库连接池
4. 启用 SSL 连接
5. 监控数据库性能
6. 设置数据保留策略
