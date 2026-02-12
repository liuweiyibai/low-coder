# 用户登录认证系统

本系统已完成用户登录认证功能的集成，确保发布和保存草稿等操作需要用户先登录。

## 功能特性

### 1. 用户注册和登录
- ✅ 邮箱密码注册
- ✅ 邮箱密码登录
- ✅ 密码加密存储（bcrypt）
- ✅ NextAuth.js 会话管理

### 2. API 路由保护
以下 API 路由已添加登录验证：

- `POST /api/publish` - 发布页面（需要登录）
- `DELETE /api/publish` - 删除页面（需要登录 + 所有权验证）
- `GET /api/publish/list` - 获取页面列表（需要登录，只返回用户自己的页面）

### 3. 前端集成
- ✅ AuthModal 支持登录/注册切换
- ✅ Toolbar 显示用户登录状态
- ✅ PublishModal 发布前检查登录状态
- ✅ 未登录时自动弹出登录框

## 技术栈

- **NextAuth.js 4.x**: 认证框架
- **bcryptjs**: 密码加密
- **Session**: JWT 策略
- **Database**: 使用现有的 Drizzle ORM + PostgreSQL

## 环境配置

在 `.env.local` 文件中配置：

```env
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only-change-in-production
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/lowcoder
```

⚠️ **生产环境**：必须修改 `NEXTAUTH_SECRET` 为强随机字符串（至少32字符）

生成安全的密钥：
```bash
openssl rand -base64 32
```

## 使用流程

### 用户注册
1. 点击工具栏"登录"按钮
2. 切换到"注册"标签
3. 输入用户名（可选）、邮箱、密码（至少6个字符）
4. 点击"注册"按钮
5. 注册成功后自动登录

### 用户登录
1. 点击工具栏"登录"按钮
2. 输入已注册的邮箱和密码
3. 点击"登录"按钮

### 发布页面
1. 必须先登录
2. 点击工具栏"发布"按钮
3. 输入页面名称
4. 点击"发布"按钮
5. 发布成功后显示页面链接

### 管理页面
1. 必须先登录
2. 点击工具栏"我的页面"按钮
3. 查看、编辑、删除自己发布的页面
4. 只能操作自己创建的页面

## API 接口

### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名（可选）"
}
```

### 登录
NextAuth 标准接口：
```
POST /api/auth/signin/credentials
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

或使用 NextAuth 客户端：
```typescript
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: false,
});
```

### 登出
```typescript
import { signOut } from "next-auth/react";

await signOut();
```

### 获取会话
```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

## 数据结构

### 用户表（users）
```sql
- id: UUID (主键)
- email: VARCHAR(255) (唯一)
- username: VARCHAR(100)
- displayName: VARCHAR(100)
- passwordHash: TEXT
- status: ENUM ('active', 'inactive', 'suspended')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### 发布页面（内存存储）
```typescript
{
  id: string;           // 页面 ID
  name: string;         // 页面名称
  schema: PageSchema;   // 页面结构
  userId: string;       // 创建者 ID
  userName: string;     // 创建者名称
  status: string;       // 页面状态
  publishedAt: string;  // 发布时间
  updatedAt: string;    // 更新时间
  url: string;          // 访问路径
}
```

## 安全特性

1. **密码加密**: 使用 bcrypt 加密，加密强度 12
2. **会话管理**: JWT token，httpOnly cookie
3. **权限验证**: 
   - 发布/删除页面需要登录
   - 只能操作自己的页面
4. **输入验证**:
   - 邮箱格式验证
   - 密码长度验证（最少6个字符）
   - 邮箱唯一性检查

## 待优化项

1. **邮箱验证**: 发送验证邮件
2. **密码重置**: 忘记密码功能
3. **OAuth 集成**: GitHub、Google 登录
4. **记住我**: 延长会话时间
5. **数据持久化**: publishedPages 使用数据库存储
6. **速率限制**: 防止暴力破解
7. **日志记录**: 登录/注销日志

## 故障排查

### 登录失败
- 检查邮箱和密码是否正确
- 确认用户状态为 'active'
- 查看浏览器控制台错误信息

### 发布失败
- 确认已登录（工具栏显示用户名）
- 检查网络请求是否返回 401
- 查看浏览器控制台错误信息

### 会话丢失
- 检查 NEXTAUTH_SECRET 配置
- 清除浏览器 cookie
- 重新登录

## 测试建议

1. 注册新用户
2. 登出后重新登录
3. 未登录时尝试发布（应提示登录）
4. 发布页面成功
5. 查看"我的页面"列表
6. 删除自己创建的页面
7. 退出登录

## 开发注意事项

- 生产环境必须使用 HTTPS
- 定期更新 NEXTAUTH_SECRET
- 监控异常登录行为
- 定期备份用户数据
