# @low-coder/component-sdk

组件开发工具包 - 提供组件注册、加载、实例化等核心能力。

## 安装

```bash
pnpm add @low-coder/component-sdk
```

## 核心功能

### 1. 组件注册

```typescript
import { ComponentRegistry } from '@low-coder/component-sdk'

const registry = new ComponentRegistry()

// 注册组件
registry.register(
  {
    id: 'button',
    name: 'Button',
    displayName: '按钮',
    version: '1.0.0',
    category: 'input',
    propsSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        type: { type: 'string', enum: ['primary', 'secondary'] }
      }
    }
  },
  (props, context) => {
    return <button onClick={() => context.emit('click')}>{props.text}</button>
  }
)

// 查询组件
const definition = registry.get('button')

// 搜索组件
const results = registry.search('按钮')
```

### 2. 组件加载

```typescript
import { ComponentLoader } from '@low-coder/component-sdk'

const loader = new ComponentLoader(registry)

// 加载单个组件
const definition = await loader.load('button')

// 批量加载
const definitions = await loader.loadBatch(['button', 'input', 'select'])

// 预加载
await loader.preload('button')

// 预加载依赖
await loader.preloadDependencies('form')
```

### 3. 组件实例管理

```typescript
import { ComponentManager } from '@low-coder/component-sdk'

const manager = new ComponentManager()

// 注册组件
manager.getRegistry().register(meta, render)

// 创建实例
const instance = await manager.createInstance({
  id: 'btn_001',
  type: 'button',
  props: {
    text: '点击我',
    type: 'primary'
  }
})

// 更新实例
await manager.updateInstance('btn_001', {
  props: { text: '已更新' }
})

// 销毁实例
await manager.destroyInstance('btn_001')

// 获取统计
const stats = manager.getStats()
```

### 4. 生命周期

```typescript
registry.register(
  meta,
  (props) => <div>{props.text}</div>,
  {
    lifecycle: {
      onBeforeMount: async () => {
        console.log('组件即将挂载')
      },
      onMounted: async () => {
        console.log('组件已挂载')
      },
      onBeforeUpdate: async (prevProps, nextProps) => {
        console.log('组件即将更新', prevProps, nextProps)
      },
      onUpdated: async (prevProps, nextProps) => {
        console.log('组件已更新')
      },
      onBeforeUnmount: async () => {
        console.log('组件即将卸载')
      },
      onUnmounted: async () => {
        console.log('组件已卸载')
      },
      onError: (error) => {
        console.error('组件错误', error)
      }
    }
  }
)
```

### 5. 事件系统

```typescript
// 监听事件
manager.on('component:event', (event) => {
  console.log('组件事件', event)
})

manager.on('instance:created', (event) => {
  console.log('实例已创建', event)
})

manager.on('instance:updated', (event) => {
  console.log('实例已更新', event)
})

// 在组件中触发事件
const render = (props, context) => {
  return (
    <button onClick={() => context.emit('click', { text: props.text })}>
      {props.text}
    </button>
  )
}
```

## API 文档

### ComponentRegistry

| 方法                               | 说明             |
| ---------------------------------- | ---------------- |
| `register(meta, render, options?)` | 注册组件         |
| `unregister(componentId)`          | 注销组件         |
| `get(componentId)`                 | 获取组件定义     |
| `getMeta(componentId)`             | 获取组件元数据   |
| `has(componentId)`                 | 检查组件是否存在 |
| `getAll()`                         | 获取所有组件     |
| `getByCategory(category)`          | 按分类获取       |
| `search(query)`                    | 搜索组件         |
| `clear()`                          | 清空注册表       |

### ComponentLoader

| 方法                                | 说明         |
| ----------------------------------- | ------------ |
| `load(componentId, options?)`       | 加载组件     |
| `loadBatch(componentIds, options?)` | 批量加载     |
| `preload(componentId)`              | 预加载       |
| `preloadBatch(componentIds)`        | 批量预加载   |
| `preloadDependencies(componentId)`  | 预加载依赖   |
| `getLoadState(componentId)`         | 获取加载状态 |
| `clearCache(componentId?)`          | 清除缓存     |

### ComponentManager

| 方法                              | 说明         |
| --------------------------------- | ------------ |
| `getRegistry()`                   | 获取注册表   |
| `getLoader()`                     | 获取加载器   |
| `createInstance(node)`            | 创建实例     |
| `getInstance(nodeId)`             | 获取实例     |
| `updateInstance(nodeId, updates)` | 更新实例     |
| `destroyInstance(nodeId)`         | 销毁实例     |
| `getAllInstances()`               | 获取所有实例 |
| `getStats()`                      | 获取统计信息 |
| `cleanup()`                       | 清理所有实例 |

## License

MIT
