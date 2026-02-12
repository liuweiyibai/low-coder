# 数据库密码修复说明

## 问题描述
之前数据库中的 admin 用户 `password_hash` 字段为空，认证逻辑使用硬编码方式。

## 解决方案

### 1. 数据库更改
- ✅ 更新了 `scripts/init-db.sql`，为 admin 用户添加了加密的密码哈希
- ✅ 创建了 `scripts/update-admin-password.sql` 用于更新现有数据库

### 2. 认证逻辑改进
- ✅ 修改了 `apps/builder/src/lib/auth.ts`
- ✅ 移除了硬编码的认证方式
- ✅ 改为从数据库读取密码哈希并验证
- ✅ 支持使用邮箱或用户名登录

### 3. 安全性提升
- 密码使用 bcrypt 加密（10轮加盐）
- 支持修改密码（通过数据库更新）
- 标准的密码验证流程
- 用户状态检查

## 使用说明

### 新数据库初始化
```bash
# 运行初始化脚本（admin 用户已包含密码哈希）
psql -d lowcoder -f scripts/init-db.sql
```

### 更新现有数据库
```bash
# 如果你的数据库中已有 admin 用户但密码为空
psql -d lowcoder -f scripts/update-admin-password.sql
```

### 登录凭据
- **用户名/邮箱**: `admin` 或 `admin@lowcoder.com`
- **密码**: `admin`

⚠️ **重要**: 生产环境中请修改默认密码！

## 修改密码

### 方法 1: 通过 SQL
```sql
-- 生成新密码哈希（使用 Node.js）
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('新密码', 10).then(hash => console.log(hash));"

-- 更新密码
UPDATE users 
SET password_hash = '生成的哈希值',
    updated_at = NOW()
WHERE username = 'admin';
```

### 方法 2: 通过 Node.js 脚本
```javascript
const bcrypt = require('bcryptjs');
const { getDb } = require('./src/lib/db');
const { users } = require('@low-coder/database/schemas');
const { eq } = require('drizzle-orm');

async function updatePassword() {
    const newPassword = '新密码';
    const hash = await bcrypt.hash(newPassword, 10);
    
    const db = getDb();
    await db
        .update(users)
        .set({ passwordHash: hash, updatedAt: new Date() })
        .where(eq(users.username, 'admin'));
    
    console.log('密码已更新');
}

updatePassword();
```

## 技术细节

### 密码哈希
- 算法: bcrypt
- 成本因子: 10
- 示例哈希: `$2a$10$0N0avZgQmTAxDgaXp.rvYeUcAV.j94lsGxI99LM/1wOokMoJS/qdm`

### 认证流程
1. 用户输入邮箱/用户名和密码
2. 从数据库查询用户（支持邮箱或用户名）
3. 检查用户状态是否为 `active`
4. 验证密码哈希
5. 返回用户信息并创建会话

### 数据库字段
```sql
CREATE TABLE users (
    ...
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50),
    password_hash TEXT,  -- bcrypt 哈希，可为空（OAuth 用户）
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    ...
);
```

## 安全建议

1. ✅ 生产环境修改默认密码
2. ✅ 定期更新密码
3. ✅ 使用强密码（至少8个字符，包含大小写、数字、特殊字符）
4. ✅ 启用双因素认证（未来功能）
5. ✅ 监控异常登录尝试

## 相关文件

- [scripts/init-db.sql](scripts/init-db.sql) - 数据库初始化脚本
- [scripts/update-admin-password.sql](scripts/update-admin-password.sql) - 密码更新脚本
- [apps/builder/src/lib/auth.ts](apps/builder/src/lib/auth.ts) - 认证逻辑
- [packages/database/src/schemas/core.ts](packages/database/src/schemas/core.ts) - 数据库 Schema
