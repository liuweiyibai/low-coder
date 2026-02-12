# 多租户 SaaS 架构设计

## 文档版本

| 版本 | 日期       | 作者       | 说明     |
| ---- | ---------- | ---------- | -------- |
| v1.0 | 2026-02-11 | 首席架构师 | 初始版本 |

---

## 一、多租户概述

### 1.1 设计目标

1. **完全隔离**：租户间数据、资源、权限完全隔离
2. **弹性扩展**：支持从小型到大型企业的扩展
3. **资源配额**：灵活的资源配额管理
4. **个性化定制**：支持租户级别的主题、配置定制
5. **计费灵活**：支持多种计费模式
6. **高可用性**：单租户故障不影响其他租户

### 1.2 核心概念

```typescript
/**
 * 租户层级结构
 */
interface TenantHierarchy {
  // 平台（Platform）
  // └── 租户（Tenant）
  //     ├── 组织（Organization）
  //     │   ├── 部门（Department）
  //     │   └── 团队（Team）
  //     └── 应用（Application）
  //         └── 页面（Page）
}

/**
 * 租户
 */
interface Tenant {
  id: string
  name: string
  slug: string                  // 租户唯一标识（用于域名）
  plan: SubscriptionPlan        // 订阅计划
  status: TenantStatus          // 租户状态
  quota: ResourceQuota          // 资源配额
  settings: TenantSettings      // 租户配置
  domain?: string               // 自定义域名
  createdAt: Date
  updatedAt: Date
}

/**
 * 组织
 */
interface Organization {
  id: string
  tenantId: string              // 所属租户
  name: string
  description?: string
  settings: OrganizationSettings
  createdAt: Date
}

/**
 * 部门/团队
 */
interface Department {
  id: string
  organizationId: string
  parentId?: string             // 父部门（支持树形结构）
  name: string
  type: 'department' | 'team'
  members: Member[]
}
```

---

## 二、隔离策略

### 2.1 数据隔离模式

支持三种数据隔离模式：

#### 模式一：共享数据库 + 共享 Schema（推荐）

```
┌────────────────────────────────────────┐
│           Database (PostgreSQL)        │
├────────────────────────────────────────┤
│                                        │
│  Table: users                          │
│  ┌──────────┬──────────┬──────────┐   │
│  │tenant_id │   id     │   name   │   │
│  ├──────────┼──────────┼──────────┤   │
│  │  tenant1 │  user1   │  Alice   │   │
│  │  tenant1 │  user2   │  Bob     │   │
│  │  tenant2 │  user3   │  Charlie │   │
│  └──────────┴──────────┴──────────┘   │
│                                        │
│  所有表都包含 tenant_id 列             │
│  通过 Row Level Security (RLS) 隔离   │
│                                        │
└────────────────────────────────────────┘
```

**优点**：
- 成本最低
- 维护简单
- 扩展性好

**缺点**：
- 需要严格的查询过滤
- 数据泄漏风险需要特别注意

#### 模式二：共享数据库 + 独立 Schema

```
┌────────────────────────────────────────┐
│           Database (PostgreSQL)        │
├────────────────────────────────────────┤
│  Schema: tenant1                       │
│  ├── users                             │
│  ├── pages                             │
│  └── ...                               │
│                                        │
│  Schema: tenant2                       │
│  ├── users                             │
│  ├── pages                             │
│  └── ...                               │
│                                        │
└────────────────────────────────────────┘
```

**优点**：
- 数据隔离性好
- 备份恢复方便
- 可以为大租户单独优化

**缺点**：
- Schema 数量有限制
- 迁移复杂度增加

#### 模式三：独立数据库

```
┌──────────────────┐  ┌──────────────────┐
│  Database:       │  │  Database:       │
│  tenant1_db      │  │  tenant2_db      │
├──────────────────┤  ├──────────────────┤
│  users           │  │  users           │
│  pages           │  │  pages           │
│  ...             │  │  ...             │
└──────────────────┘  └──────────────────┘
```

**优点**：
- 隔离性最强
- 可以物理分布在不同服务器
- 适合大型企业客户

**缺点**：
- 成本最高
- 维护复杂
- 扩展性受限

### 2.2 采用的隔离策略

**小型租户**：共享数据库 + 共享 Schema + Row Level Security  
**中型租户**：共享数据库 + 独立 Schema  
**大型租户**：独立数据库

### 2.3 Row Level Security 实现

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己租户的数据
CREATE POLICY tenant_isolation_policy ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 创建函数：设置当前租户
CREATE FUNCTION set_current_tenant(tenant_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql;
```

---

## 三、租户管理

### 3.1 租户注册流程

```
用户注册 → 创建租户 → 初始化配置 → 分配资源 → 激活租户
    ↓         ↓           ↓            ↓          ↓
  signup  createTenant initConfig allocateRes  activate
```

### 3.2 租户数据模型

```typescript
/**
 * 租户状态
 */
enum TenantStatus {
  Active = 'active',           // 活跃
  Suspended = 'suspended',     // 暂停
  Expired = 'expired',         // 过期
  Cancelled = 'cancelled'      // 已取消
}

/**
 * 订阅计划
 */
enum SubscriptionPlan {
  Free = 'free',               // 免费版
  Basic = 'basic',             // 基础版
  Professional = 'professional', // 专业版
  Enterprise = 'enterprise'    // 企业版
}

/**
 * 资源配额
 */
interface ResourceQuota {
  // 用户数限制
  maxUsers: number
  
  // 应用数限制
  maxApplications: number
  
  // 页面数限制
  maxPages: number
  
  // 存储空间（MB）
  storageSpace: number
  
  // API 调用次数（每月）
  apiCallsPerMonth: number
  
  // 并发用户数
  maxConcurrentUsers: number
  
  // 数据保留天数
  dataRetentionDays: number
  
  // 是否支持自定义域名
  customDomain: boolean
  
  // 是否支持 SSO
  ssoEnabled: boolean
  
  // 是否支持 API 访问
  apiAccessEnabled: boolean
  
  // 插件数量限制
  maxPlugins: number
  
  // 工作流数量限制
  maxWorkflows: number
}

/**
 * 租户配置
 */
interface TenantSettings {
  // 品牌设置
  branding: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    faviconUrl?: string
  }
  
  // 认证设置
  auth: {
    allowSignup: boolean
    passwordPolicy: PasswordPolicy
    sessionTimeout: number       // 分钟
    mfaRequired: boolean
    ssoConfig?: SSOConfig
  }
  
  // 通知设置
  notifications: {
    emailEnabled: boolean
    emailFrom?: string
    webhookUrl?: string
  }
  
  // 安全设置
  security: {
    ipWhitelist?: string[]
    allowedDomains?: string[]
    dataEncryption: boolean
    auditLogEnabled: boolean
  }
  
  // 功能开关
  features: {
    [featureName: string]: boolean
  }
  
  // 自定义配置
  custom?: Record<string, any>
}
```

### 3.3 租户初始化

```typescript
/**
 * 租户初始化服务
 */
class TenantInitializer {
  async initializeTenant(tenant: Tenant): Promise<void> {
    // 1. 创建租户 Schema（如果使用独立 Schema）
    await this.createTenantSchema(tenant.id)
    
    // 2. 初始化数据表
    await this.initializeTables(tenant.id)
    
    // 3. 创建默认角色和权限
    await this.createDefaultRoles(tenant.id)
    
    // 4. 创建默认组织
    await this.createDefaultOrganization(tenant.id)
    
    // 5. 初始化内置组件库
    await this.initializeComponents(tenant.id)
    
    // 6. 设置默认配置
    await this.applyDefaultSettings(tenant.id)
    
    // 7. 创建欢迎页面
    await this.createWelcomePage(tenant.id)
  }
  
  private async createDefaultRoles(tenantId: string): Promise<void> {
    const roles = [
      {
        name: 'admin',
        displayName: '管理员',
        permissions: ['*'] // 所有权限
      },
      {
        name: 'developer',
        displayName: '开发者',
        permissions: [
          'page:create', 'page:update', 'page:delete', 'page:read',
          'component:create', 'component:update', 'component:read',
          'workflow:create', 'workflow:update', 'workflow:read'
        ]
      },
      {
        name: 'viewer',
        displayName: '查看者',
        permissions: ['page:read', 'component:read']
      }
    ]
    
    for (const role of roles) {
      await this.roleService.create(tenantId, role)
    }
  }
}
```

---

## 四、权限系统

### 4.1 RBAC + ABAC 混合模型

```typescript
/**
 * 角色（Role）
 */
interface Role {
  id: string
  tenantId: string
  name: string
  displayName: string
  description?: string
  permissions: Permission[]     // RBAC
  policies?: Policy[]           // ABAC
  isSystem: boolean             // 是否系统角色
}

/**
 * 权限（Permission）
 */
interface Permission {
  resource: string              // 资源类型（如 "page", "component"）
  actions: Action[]             // 允许的操作
  conditions?: Condition[]      // 条件限制
}

type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'publish'

/**
 * 策略（Policy）- ABAC
 */
interface Policy {
  id: string
  name: string
  effect: 'allow' | 'deny'
  
  // 主体条件
  subject: {
    type: 'user' | 'role' | 'group'
    id?: string
    attributes?: Record<string, any>
  }
  
  // 资源条件
  resource: {
    type: string
    id?: string
    attributes?: Record<string, any>
  }
  
  // 操作
  actions: Action[]
  
  // 环境条件
  conditions?: {
    time?: TimeCondition
    ip?: string[]
    location?: LocationCondition
  }
}

/**
 * 用户角色分配
 */
interface UserRole {
  userId: string
  roleId: string
  scope: RoleScope               // 角色作用域
  expiresAt?: Date              // 角色过期时间
}

/**
 * 角色作用域
 */
interface RoleScope {
  type: 'tenant' | 'organization' | 'application' | 'page'
  id: string
}
```

### 4.2 权限检查流程

```typescript
/**
 * 权限检查器
 */
class PermissionChecker {
  /**
   * 检查用户是否有权限执行操作
   */
  async check(
    user: User,
    resource: Resource,
    action: Action,
    context?: Context
  ): Promise<boolean> {
    // 1. 检查租户状态
    if (!await this.isTenantActive(user.tenantId)) {
      return false
    }
    
    // 2. 获取用户所有角色
    const roles = await this.getUserRoles(user.id, resource)
    
    // 3. RBAC 检查
    const rbacAllowed = await this.checkRBAC(roles, resource, action)
    if (!rbacAllowed) {
      return false
    }
    
    // 4. ABAC 检查
    const abacAllowed = await this.checkABAC(user, resource, action, context)
    if (!abacAllowed) {
      return false
    }
    
    // 5. 资源所有者检查
    if (resource.ownerId === user.id) {
      return true
    }
    
    return true
  }
  
  /**
   * RBAC 检查
   */
  private async checkRBAC(
    roles: Role[],
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    for (const role of roles) {
      for (const permission of role.permissions) {
        if (
          permission.resource === resource.type &&
          permission.actions.includes(action)
        ) {
          return true
        }
      }
    }
    return false
  }
  
  /**
   * ABAC 检查
   */
  private async checkABAC(
    user: User,
    resource: Resource,
    action: Action,
    context?: Context
  ): Promise<boolean> {
    const policies = await this.getPolicies(user.tenantId)
    
    for (const policy of policies) {
      if (this.policyMatches(policy, user, resource, action, context)) {
        return policy.effect === 'allow'
      }
    }
    
    return true // 默认允许（如果没有明确的策略）
  }
}
```

### 4.3 权限装饰器

```typescript
/**
 * 权限装饰器 - 用于保护 API 端点
 */
function RequirePermission(resource: string, action: Action) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const context = args[0] // 假设第一个参数是上下文
      const user = context.user
      
      // 检查权限
      const hasPermission = await permissionChecker.check(
        user,
        { type: resource },
        action
      )
      
      if (!hasPermission) {
        throw new ForbiddenError('Permission denied')
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// 使用示例
class PageController {
  @RequirePermission('page', 'create')
  async createPage(context: Context, data: CreatePageDto) {
    // 创建页面逻辑...
  }
  
  @RequirePermission('page', 'delete')
  async deletePage(context: Context, pageId: string) {
    // 删除页面逻辑...
  }
}
```

---

## 五、资源配额管理

### 5.1 配额检查

```typescript
/**
 * 配额检查器
 */
class QuotaChecker {
  /**
   * 检查是否超出配额
   */
  async check(
    tenantId: string,
    resourceType: string,
    requestedAmount: number = 1
  ): Promise<QuotaCheckResult> {
    // 1. 获取租户配额
    const quota = await this.getQuota(tenantId)
    
    // 2. 获取当前使用量
    const usage = await this.getUsage(tenantId, resourceType)
    
    // 3. 计算剩余配额
    const limit = this.getLimit(quota, resourceType)
    const remaining = limit - usage
    
    // 4. 检查是否超出
    if (usage + requestedAmount > limit) {
      return {
        allowed: false,
        limit,
        usage,
        remaining,
        exceeded: usage + requestedAmount - limit
      }
    }
    
    return {
      allowed: true,
      limit,
      usage,
      remaining
    }
  }
  
  /**
   * 使用配额装饰器
   */
  useQuota(resourceType: string, amount: number = 1) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value
      
      descriptor.value = async function (...args: any[]) {
        const context = args[0]
        const tenantId = context.user.tenantId
        
        // 检查配额
        const result = await quotaChecker.check(tenantId, resourceType, amount)
        
        if (!result.allowed) {
          throw new QuotaExceededError(
            `Quota exceeded for ${resourceType}. ` +
            `Limit: ${result.limit}, Usage: ${result.usage}`
          )
        }
        
        // 执行原方法
        const response = await originalMethod.apply(this, args)
        
        // 增加使用量
        await quotaChecker.incrementUsage(tenantId, resourceType, amount)
        
        return response
      }
      
      return descriptor
    }
  }
}

// 使用示例
class PageService {
  @useQuota('pages', 1)
  async createPage(context: Context, data: CreatePageDto): Promise<Page> {
    // 创建页面逻辑...
  }
}
```

### 5.2 使用量统计

```typescript
/**
 * 使用量统计服务
 */
class UsageTracker {
  /**
   * 记录使用量
   */
  async track(event: UsageEvent): Promise<void> {
    await db.insert(usageEvents).values({
      tenantId: event.tenantId,
      resourceType: event.resourceType,
      action: event.action,
      amount: event.amount,
      metadata: event.metadata,
      timestamp: new Date()
    })
  }
  
  /**
   * 获取使用量报告
   */
  async getUsageReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageReport> {
    const events = await db
      .select()
      .from(usageEvents)
      .where(
        and(
          eq(usageEvents.tenantId, tenantId),
          gte(usageEvents.timestamp, startDate),
          lte(usageEvents.timestamp, endDate)
        )
      )
    
    // 聚合统计
    const report: UsageReport = {
      tenantId,
      period: { start: startDate, end: endDate },
      resources: {}
    }
    
    for (const event of events) {
      if (!report.resources[event.resourceType]) {
        report.resources[event.resourceType] = 0
      }
      report.resources[event.resourceType] += event.amount
    }
    
    return report
  }
}
```

---

## 六、租户隔离实现

### 6.1 数据访问层中间件

```typescript
/**
 * 租户上下文中间件
 */
class TenantContextMiddleware {
  async handle(context: Context, next: Next): Promise<void> {
    // 1. 从请求中提取租户信息
    const tenantId = this.extractTenantId(context)
    
    if (!tenantId) {
      throw new UnauthorizedError('Tenant ID not found')
    }
    
    // 2. 验证租户状态
    const tenant = await this.getTenant(tenantId)
    
    if (!tenant || tenant.status !== 'active') {
      throw new ForbiddenError('Tenant is not active')
    }
    
    // 3. 设置租户上下文
    context.tenantId = tenantId
    context.tenant = tenant
    
    // 4. 设置数据库会话变量（用于 RLS）
    await this.setDatabaseTenantContext(tenantId)
    
    // 5. 继续处理
    await next()
  }
  
  /**
   * 从请求中提取租户 ID
   */
  private extractTenantId(context: Context): string | null {
    // 方式1：从子域名提取
    const host = context.request.headers.get('host')
    const subdomain = this.extractSubdomain(host)
    if (subdomain) {
      return this.getTenantIdBySlug(subdomain)
    }
    
    // 方式2：从自定义域名提取
    const tenantId = await this.getTenantIdByDomain(host)
    if (tenantId) {
      return tenantId
    }
    
    // 方式3：从请求头提取
    const headerTenantId = context.request.headers.get('x-tenant-id')
    if (headerTenantId) {
      return headerTenantId
    }
    
    // 方式4：从用户信息提取
    if (context.user) {
      return context.user.tenantId
    }
    
    return null
  }
  
  /**
   * 设置数据库租户上下文
   */
  private async setDatabaseTenantContext(tenantId: string): Promise<void> {
    await db.execute(
      sql`SELECT set_current_tenant(${tenantId}::uuid)`
    )
  }
}
```

### 6.2 ORM 查询拦截器

```typescript
/**
 * Drizzle ORM 租户拦截器
 */
class TenantQueryInterceptor {
  /**
   * 拦截查询，自动添加 tenant_id 过滤
   */
  intercept(query: SelectQuery): SelectQuery {
    const tenantId = getCurrentTenantId()
    
    // 自动添加 where tenant_id = ?
    return query.where(eq(table.tenantId, tenantId))
  }
  
  /**
   * 拦截插入，自动设置 tenant_id
   */
  interceptInsert(data: any): any {
    const tenantId = getCurrentTenantId()
    
    return {
      ...data,
      tenantId
    }
  }
}

// 使用示例
const users = await db
  .select()
  .from(usersTable)
  // 自动添加 .where(eq(usersTable.tenantId, currentTenantId))
  .execute()
```

---

## 七、租户域名管理

### 7.1 域名路由策略

```typescript
/**
 * 域名路由器
 */
class TenantDomainRouter {
  /**
   * 解析租户域名
   */
  async resolve(host: string): Promise<Tenant | null> {
    // 1. 检查是否是平台域名的子域名
    // 例如：tenant1.lowcoder.com
    if (this.isPlatformSubdomain(host)) {
      const subdomain = this.extractSubdomain(host)
      return await this.getTenantBySlug(subdomain)
    }
    
    // 2. 检查是否是自定义域名
    // 例如：lowcode.company.com
    return await this.getTenantByCustomDomain(host)
  }
  
  /**
   * 绑定自定义域名
   */
  async bindCustomDomain(
    tenantId: string,
    domain: string
  ): Promise<void> {
    // 1. 验证域名格式
    if (!this.isValidDomain(domain)) {
      throw new InvalidDomainError('Invalid domain format')
    }
    
    // 2. 检查域名是否已被使用
    const existing = await this.getTenantByCustomDomain(domain)
    if (existing) {
      throw new DomainAlreadyInUseError('Domain is already in use')
    }
    
    // 3. 验证域名所有权（DNS TXT 记录）
    const verified = await this.verifyDomainOwnership(domain, tenantId)
    if (!verified) {
      throw new DomainVerificationError('Domain ownership verification failed')
    }
    
    // 4. 绑定域名
    await db.update(tenantsTable)
      .set({ customDomain: domain })
      .where(eq(tenantsTable.id, tenantId))
    
    // 5. 配置 SSL 证书（使用 Let's Encrypt）
    await this.provisionSSLCertificate(domain)
  }
  
  /**
   * 验证域名所有权
   */
  private async verifyDomainOwnership(
    domain: string,
    tenantId: string
  ): Promise<boolean> {
    // 要求用户在域名的 DNS 中添加 TXT 记录
    // 格式：_lowcoder-verification.domain.com TXT "tenant-id"
    
    const txtRecords = await dns.resolveTxt(`_lowcoder-verification.${domain}`)
    
    return txtRecords.some(record =>
      record.includes(tenantId)
    )
  }
}
```

### 7.2 Next.js 中间件实现

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  
  // 解析租户
  const tenant = await resolveTenant(host)
  
  if (!tenant) {
    return NextResponse.redirect(new URL('/404', request.url))
  }
  
  // 检查租户状态
  if (tenant.status !== 'active') {
    return NextResponse.redirect(new URL('/suspended', request.url))
  }
  
  // 设置租户信息到请求头
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenant.id)
  requestHeaders.set('x-tenant-slug', tenant.slug)
  
  // 重写 URL，添加租户前缀
  const url = request.nextUrl.clone()
  url.pathname = `/t/${tenant.slug}${url.pathname}`
  
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}
```

---

## 八、租户主题定制

### 8.1 Design Tokens 系统

```typescript
/**
 * 设计令牌
 */
interface DesignTokens {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    background: string
    surface: string
    text: string
    textSecondary: string
  }
  
  typography: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
    }
    fontWeight: {
      normal: number
      medium: number
      semibold: number
      bold: number
    }
  }
  
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  
  shadows: {
    sm: string
    md: string
    lg: string
  }
}

/**
 * 主题服务
 */
class ThemeService {
  /**
   * 获取租户主题
   */
  async getTenantTheme(tenantId: string): Promise<DesignTokens> {
    const tenant = await this.getTenant(tenantId)
    
    // 合并默认主题和租户自定义主题
    return {
      ...defaultTheme,
      ...tenant.settings.branding.theme
    }
  }
  
  /**
   * 生成 CSS 变量
   */
  generateCSSVariables(tokens: DesignTokens): string {
    return `
      :root {
        --color-primary: ${tokens.colors.primary};
        --color-secondary: ${tokens.colors.secondary};
        --color-success: ${tokens.colors.success};
        --color-warning: ${tokens.colors.warning};
        --color-error: ${tokens.colors.error};
        --color-background: ${tokens.colors.background};
        --color-surface: ${tokens.colors.surface};
        --color-text: ${tokens.colors.text};
        --color-text-secondary: ${tokens.colors.textSecondary};
        
        --font-family: ${tokens.typography.fontFamily};
        --font-size-xs: ${tokens.typography.fontSize.xs};
        --font-size-sm: ${tokens.typography.fontSize.sm};
        --font-size-base: ${tokens.typography.fontSize.base};
        --font-size-lg: ${tokens.typography.fontSize.lg};
        --font-size-xl: ${tokens.typography.fontSize.xl};
        
        --spacing-xs: ${tokens.spacing.xs};
        --spacing-sm: ${tokens.spacing.sm};
        --spacing-md: ${tokens.spacing.md};
        --spacing-lg: ${tokens.spacing.lg};
        --spacing-xl: ${tokens.spacing.xl};
        
        --border-radius-sm: ${tokens.borderRadius.sm};
        --border-radius-md: ${tokens.borderRadius.md};
        --border-radius-lg: ${tokens.borderRadius.lg};
        --border-radius-full: ${tokens.borderRadius.full};
        
        --shadow-sm: ${tokens.shadows.sm};
        --shadow-md: ${tokens.shadows.md};
        --shadow-lg: ${tokens.shadows.lg};
      }
    `
  }
}
```

### 8.2 动态主题注入

```tsx
// app/layout.tsx
import { getTenantTheme } from '@/lib/theme'

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const tenantId = await getCurrentTenantId()
  const theme = await getTenantTheme(tenantId)
  const cssVariables = generateCSSVariables(theme)
  
  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## 九、计费与订阅

### 9.1 订阅计划对比

| 功能       | 免费版 | 基础版  | 专业版   | 企业版 |
| ---------- | ------ | ------- | -------- | ------ |
| 用户数     | 5      | 20      | 100      | 无限制 |
| 应用数     | 2      | 10      | 50       | 无限制 |
| 页面数     | 20     | 100     | 500      | 无限制 |
| 存储空间   | 1GB    | 10GB    | 100GB    | 1TB+   |
| API 调用   | 1万/月 | 10万/月 | 100万/月 | 无限制 |
| 自定义域名 | ❌      | ✅       | ✅        | ✅      |
| SSO        | ❌      | ❌       | ✅        | ✅      |
| 技术支持   | 社区   | 邮件    | 电话     | 专属   |
| SLA        | 无     | 99%     | 99.9%    | 99.99% |

### 9.2 计费实现

```typescript
/**
 * 计费服务
 */
class BillingService {
  /**
   * 升级订阅计划
   */
  async upgradePlan(
    tenantId: string,
    newPlan: SubscriptionPlan
  ): Promise<void> {
    const tenant = await this.getTenant(tenantId)
    const oldPlan = tenant.plan
    
    // 1. 计算费用
    const cost = await this.calculateUpgradeCost(oldPlan, newPlan)
    
    // 2. 扣款
    await this.charge(tenant, cost)
    
    // 3. 更新订阅
    await this.updateSubscription(tenantId, newPlan)
    
    // 4. 更新配额
    await this.updateQuota(tenantId, newPlan)
    
    // 5. 发送通知
    await this.sendUpgradeNotification(tenant, newPlan)
  }
  
  /**
   * 使用量计费
   */
  async chargeByUsage(tenantId: string): Promise<void> {
    // 1. 获取本月使用量
    const usage = await this.getMonthlyUsage(tenantId)
    
    // 2. 计算费用
    const cost = this.calculateUsageCost(usage)
    
    // 3. 生成账单
    await this.createInvoice(tenantId, cost, usage)
    
    // 4. 扣款
    await this.charge(tenantId, cost)
  }
}
```

---

## 十、监控与告警

### 10.1 租户监控指标

```typescript
interface TenantMetrics {
  // 用户指标
  activeUsers: number
  totalUsers: number
  newUsersToday: number
  
  // 使用指标
  pagesViewed: number
  apiCalls: number
  storageUsed: number
  
  // 性能指标
  averageResponseTime: number
  errorRate: number
  
  // 健康状态
  healthScore: number
  quotaUsagePercent: number
}
```

### 10.2 告警规则

```typescript
const alertRules = [
  {
    name: '配额即将用完',
    condition: (metrics: TenantMetrics) =>
      metrics.quotaUsagePercent > 80,
    severity: 'warning',
    action: 'sendEmail'
  },
  {
    name: '配额已用完',
    condition: (metrics: TenantMetrics) =>
      metrics.quotaUsagePercent >= 100,
    severity: 'critical',
    action: 'suspendTenant'
  },
  {
    name: '错误率过高',
    condition: (metrics: TenantMetrics) =>
      metrics.errorRate > 5,
    severity: 'high',
    action: 'sendAlert'
  }
]
```

---

## 十一、总结

多租户 SaaS 架构设计已完成：

✅ **三种隔离策略**：共享Schema、独立Schema、独立数据库  
✅ **完整权限系统**：RBAC + ABAC 混合模型  
✅ **资源配额管理**：灵活的配额检查和使用量统计  
✅ **租户域名管理**：子域名 + 自定义域名支持  
✅ **主题定制系统**：Design Tokens + 动态注入  
✅ **计费订阅系统**：多种计划 + 使用量计费  
✅ **监控告警体系**：完整的指标和告警规则  

**下一步**：开始实现核心代码，从 Schema Core 包开始。
