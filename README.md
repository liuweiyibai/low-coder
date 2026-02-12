# 企业级低代码平台 (Enterprise Low-Code Platform)

> 对标飞书低代码 / 阿里宜搭 / 腾讯微搭 / OutSystems 的企业级低代码平台

## 🎯 系统目标

构建一个支持多租户 SaaS、插件生态、AI 辅助开发、业务编排能力的企业级低代码平台。

## 🏗️ 核心能力

- ✅ 可视化页面搭建（拖拽编辑器）
- ✅ 组件协议标准化与插件生态
- ✅ 数据驱动页面渲染
- ✅ 多租户 SaaS 架构
- ✅ 运行时动态渲染引擎
- ✅ 业务流程编排（Workflow / BPMN）
- ✅ AI 自动生成页面与组件
- ✅ DSL 描述页面与业务逻辑
- ✅ 企业级权限与组织体系
- ✅ 页面发布与灰度发布
- ✅ 企业级可扩展插件系统
- ✅ 多端运行能力（Web / H5 / 可扩展）

## 📦 Monorepo 结构

```
low-coder/
├── apps/                        # 应用层
│   ├── builder/                 # 可视化编辑器
│   ├── runtime/                 # 页面运行时
│   ├── web-portal/             # 企业门户
│   └── ai-service/             # AI 辅助服务
├── packages/                    # 共享包
│   ├── ui-system/              # UI 组件系统
│   ├── schema-core/            # Schema 核心协议
│   ├── component-sdk/          # 组件开发 SDK
│   ├── workflow-engine/        # 工作流引擎
│   ├── plugin-sdk/             # 插件开发 SDK
│   ├── shared-utils/           # 共享工具
│   └── design-tokens/          # 设计令牌
└── docs/                       # 架构文档
    ├── architecture/           # 架构设计
    ├── protocols/              # 协议标准
    └── guides/                 # 开发指南
```

## 🛠️ 技术栈

### 前端框架
- **Next.js 15+** (App Router)
- **React 19+**
- **TypeScript** (严格模式)
- **React Server Components**
- **Server Actions**

### UI 系统
- **Tailwind CSS**
- **shadcn/ui**
- **Radix UI**

### 编辑器
- **dnd-kit** (拖拽系统)
- 自研布局引擎

### 数据层
- **PostgreSQL**
- **Drizzle ORM**
- **Redis**

### 认证与权限
- **Auth.js**
- **RBAC + ABAC**

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

## 📚 文档

详细文档请查看 [docs](./docs) 目录：

- [总体架构设计](./docs/architecture/01-system-architecture.md)
- [核心协议标准](./docs/protocols/01-schema-protocol.md)
- [插件系统设计](./docs/architecture/05-plugin-system.md)
- [多租户架构](./docs/architecture/06-multi-tenant.md)

## 🎨 设计原则

- **Schema 驱动优先**
- **插件优先设计**
- **高内聚低耦合**
- **SaaS 优先**
- **安全优先**
- **可观测性优先**
- **可扩展优先**

## 📄 License

MIT

## 👥 贡献

欢迎贡献代码、提出问题和建议。
