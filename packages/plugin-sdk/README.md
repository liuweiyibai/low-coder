# @low-coder/plugin-sdk

插件开发工具包 - 提供插件安装、生命周期管理、沙箱隔离等核心能力。

## 安装

```bash
pnpm add @low-coder/plugin-sdk
```

## 核心功能

### 1. 插件管理

```typescript
import { PluginManager } from '@low-coder/plugin-sdk'
import type { PluginMeta } from '@low-coder/schema-core'

const manager = new PluginManager()

// 定义插件元数据
const pluginMeta: PluginMeta = {
  version: '1.0.0',
  id: 'my-plugin',
  name: 'My Plugin',
  type: 'component',
  author: {
    name: 'Developer',
    email: 'dev@example.com'
  },
  permissions: ['component:write', 'storage:read']
}

// 定义生命周期钩子
const hooks = {
  onInstall: async () => {
    console.log('插件安装')
  },
  onEnable: async () => {
    console.log('插件启用')
  },
  onDisable: async () => {
    console.log('插件禁用')
  },
  onUninstall: async () => {
    console.log('插件卸载')
  }
}

// 安装插件
await manager.install(pluginMeta, hooks, {
  autoEnable: true,
  config: { theme: 'dark' },
  permissions: ['component:write']
})

// 启用/禁用插件
await manager.enable('my-plugin')
await manager.disable('my-plugin')

// 更新配置
await manager.updateConfig('my-plugin', { theme: 'light' })

// 卸载插件
await manager.uninstall('my-plugin')
```

### 2. 插件上下文

插件运行时可以访问丰富的平台 API：

```typescript
import { createPluginContext } from '@low-coder/plugin-sdk'

const context = createPluginContext('my-plugin')

// 平台信息
const version = context.platform.getVersion()
const tenantId = context.platform.getTenantId()

// 注册组件
context.component.register(componentMeta, renderFn)

// 操作数据源
const dsId = await context.datasource.create(config)
const data = await context.datasource.query(dsId, query)

// 编辑器操作
context.editor.selectNode('node_001')
context.editor.updateNode('node_001', { props: { text: 'Updated' } })

// 工作流
context.workflow.registerNode(nodeConfig)
await context.workflow.execute('workflow_001')

// 存储
await context.storage.set('key', 'value')
const value = await context.storage.get('key')

// 事件
context.events.on('custom:event', (data) => {
  console.log('Event received:', data)
})
context.events.emit('custom:event', { message: 'Hello' })

// HTTP 请求
const response = await context.http.get('https://api.example.com/data')

// 工具函数
const id = context.utils.generateId()
const date = context.utils.formatDate(new Date())

// 日志
context.logger.info('Plugin initialized')
context.logger.error('Something went wrong')
```

### 3. 沙箱隔离

```typescript
import { createSandbox } from '@low-coder/plugin-sdk'

// 创建沙箱
const sandbox = createSandbox('my-plugin', context, {
  maxCpuTime: 5000,      // 最大 CPU 时间 5 秒
  maxMemory: 50 * 1024 * 1024,  // 最大内存 50MB
  maxCalls: 1000,        // 最大 API 调用次数
  rateLimit: 100         // 速率限制 100 次/秒
})

// 在沙箱中执行代码
const result = await sandbox.execute(`
  const id = context.utils.generateId()
  context.logger.info('Generated ID:', id)
  return id
`)

// 查看资源使用情况
console.log('Resource usage:', sandbox.usage)

// 销毁沙箱
sandbox.destroy()
```

### 4. 资源限制

```typescript
import { ResourceLimiter } from '@low-coder/plugin-sdk'

const limiter = new ResourceLimiter({
  maxCpuTime: 10000,
  maxMemory: 100 * 1024 * 1024,
  maxCalls: 5000,
  rateLimit: 200
})

// 检查是否可以执行
if (limiter.checkLimit('apiCalls', 1)) {
  // 消费资源
  limiter.consume('apiCalls', 1)
  // 执行操作
}

// 获取使用情况
const usage = limiter.getUsage()
console.log('API calls:', usage.apiCalls)
console.log('CPU time:', usage.cpuTime, 'ms')

// 重置统计
limiter.reset()
```

### 5. 权限管理

```typescript
import { PluginPermission } from '@low-coder/plugin-sdk'

// 检查权限
if (manager.hasPermission('my-plugin', PluginPermission.WriteComponent)) {
  // 执行需要权限的操作
}

// 授予权限
manager.grantPermission('my-plugin', PluginPermission.ReadDataSource)

// 撤销权限
manager.revokePermission('my-plugin', PluginPermission.WriteComponent)
```

### 6. 事件监听

```typescript
// 监听插件事件
manager.on('plugin:installed', ({ pluginId }) => {
  console.log('插件已安装:', pluginId)
})

manager.on('plugin:enabled', ({ pluginId }) => {
  console.log('插件已启用:', pluginId)
})

manager.on('plugin:disabled', ({ pluginId }) => {
  console.log('插件已禁用:', pluginId)
})

manager.on('plugin:error', ({ pluginId, error }) => {
  console.error('插件错误:', pluginId, error)
})

manager.on('plugin:permissionGranted', ({ pluginId, permission }) => {
  console.log('权限已授予:', pluginId, permission)
})
```

### 7. 插件查询

```typescript
// 获取所有插件
const allPlugins = manager.getAllPlugins()

// 获取已启用的插件
const enabledPlugins = manager.getEnabledPlugins()

// 获取特定插件
const plugin = manager.getPlugin('my-plugin')

// 检查插件状态
const isInstalled = manager.hasPlugin('my-plugin')
const isEnabled = manager.isEnabled('my-plugin')

// 获取统计信息
const stats = manager.getStats()
console.log('Total plugins:', stats.total)
console.log('Enabled:', stats.byState.enabled)
console.log('By type:', stats.byType)
```

## API 文档

### PluginManager

| 方法                                     | 说明           |
| ---------------------------------------- | -------------- |
| `install(meta, hooks?, options?)`        | 安装插件       |
| `uninstall(pluginId)`                    | 卸载插件       |
| `enable(pluginId)`                       | 启用插件       |
| `disable(pluginId)`                      | 禁用插件       |
| `updateConfig(pluginId, config)`         | 更新配置       |
| `getPlugin(pluginId)`                    | 获取插件实例   |
| `getAllPlugins()`                        | 获取所有插件   |
| `getEnabledPlugins()`                    | 获取已启用插件 |
| `hasPlugin(pluginId)`                    | 检查是否已安装 |
| `isEnabled(pluginId)`                    | 检查是否已启用 |
| `hasPermission(pluginId, permission)`    | 检查权限       |
| `grantPermission(pluginId, permission)`  | 授予权限       |
| `revokePermission(pluginId, permission)` | 撤销权限       |
| `getStats()`                             | 获取统计信息   |
| `cleanup()`                              | 清理所有插件   |

### PluginContext API

| API          | 说明          |
| ------------ | ------------- |
| `platform`   | 平台信息 API  |
| `component`  | 组件操作 API  |
| `datasource` | 数据源 API    |
| `editor`     | 编辑器 API    |
| `workflow`   | 工作流 API    |
| `storage`    | 存储 API      |
| `events`     | 事件 API      |
| `http`       | HTTP 请求 API |
| `utils`      | 工具函数 API  |
| `logger`     | 日志 API      |

### PluginState

- `idle` - 空闲
- `installing` - 安装中
- `installed` - 已安装
- `enabling` - 启用中
- `enabled` - 已启用
- `disabling` - 禁用中
- `disabled` - 已禁用
- `uninstalling` - 卸载中
- `error` - 错误

### PluginPermission

- `component:read` - 读取组件
- `component:write` - 写入组件
- `datasource:read` - 读取数据源
- `datasource:write` - 写入数据源
- `storage:read` - 读取存储
- `storage:write` - 写入存储
- `http:request` - HTTP 请求
- `workflow:execute` - 执行工作流
- `editor:access` - 访问编辑器
- `editor:modify` - 修改编辑器

## 最佳实践

### 1. 错误处理

```typescript
try {
  await manager.install(meta, hooks)
} catch (error) {
  console.error('插件安装失败:', error)
  // 处理错误
}
```

### 2. 资源管理

```typescript
// 设置合理的资源限制
const limits = {
  maxCpuTime: 3000,
  maxMemory: 30 * 1024 * 1024,
  maxCalls: 500
}

await manager.install(meta, hooks, { limits })
```

### 3. 权限最小化

```typescript
// 只授予必要的权限
const permissions = [
  PluginPermission.ReadComponent,
  PluginPermission.ReadStorage
]

await manager.install(meta, hooks, { permissions })
```

### 4. 生命周期管理

```typescript
const hooks = {
  onEnable: async () => {
    // 初始化资源
  },
  onDisable: async () => {
    // 清理资源
  }
}
```

## License

MIT
