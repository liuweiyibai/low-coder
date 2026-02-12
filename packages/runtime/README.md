# @low-coder/runtime

运行时渲染引擎 - 负责将 Schema 动态渲染为 UI，支持 SSR 和组件动态加载。

## 功能特性

### 核心能力

1. **Schema 渲染引擎**
   - 将 PageSchema 渲染为虚拟 DOM
   - 支持组件树遍历和渲染
   - 支持条件渲染和循环渲染

2. **数据绑定系统**
   - 静态数据绑定
   - 表达式绑定
   - 数据源绑定 (DataSource)
   - 状态绑定 (State)
   - 变量绑定 (Variable)
   - 上下文绑定 (Context)
   - 计算属性绑定 (Computed)

3. **事件处理系统**
   - 声明式事件处理
   - 事件动作链
   - 条件事件触发
   - 防抖和节流支持

4. **条件渲染**
   - 简单条件 (equals, contains, greaterThan 等)
   - 复杂条件 (AND/OR 逻辑组合)
   - 原始表达式条件

5. **表达式执行**
   - 安全的表达式求值
   - 表达式验证
   - 变量提取

6. **Schema 分析**
   - 依赖分析
   - 性能统计
   - Schema 验证

## 安装

```bash
pnpm add @low-coder/runtime
```

## 使用示例

### 基础渲染

```typescript
import { createEngine } from '@low-coder/runtime'
import type { PageSchema, RenderContext } from '@low-coder/runtime'

// 创建渲染引擎
const engine = createEngine({
  cache: {
    enabled: true,
    ttl: 60000
  }
})

// 准备 Schema
const schema: PageSchema = {
  id: 'page-1',
  version: '1.0.0',
  root: {
    id: 'root',
    type: 'Container',
    props: {
      className: 'app-container'
    },
    children: [
      {
        id: 'title',
        type: 'Text',
        props: {
          content: 'Hello World'
        }
      }
    ]
  }
}

// 准备渲染上下文
const context: RenderContext = {
  schema,
  data: {},
  state: {},
  variables: {},
  params: {},
  query: {}
}

// 渲染
const result = await engine.render(schema, context)
console.log(result.content)
```

### 数据绑定

```typescript
import { defaultResolver } from '@low-coder/runtime'

// 创建数据绑定
const binding = {
  type: 'datasource' as const,
  target: 'userName',
  source: 'user.name',
  defaultValue: 'Guest'
}

// 解析绑定
const value = defaultResolver.resolve(binding, context)
```

### 条件评估

```typescript
import { defaultEvaluator } from '@low-coder/runtime'

// 简单条件
const condition = {
  type: 'simple' as const,
  field: 'user.role',
  operator: 'equals' as const,
  value: 'admin'
}

const result = defaultEvaluator.evaluate(condition, context)
```

### 表达式执行

```typescript
import { defaultExecutor } from '@low-coder/runtime'

const expression = 'user.name + " - " + user.email'
const ctx = {
  user: {
    name: 'John',
    email: 'john@example.com'
  }
}

const result = defaultExecutor.execute(expression, ctx)
// 结果: "John - john@example.com"
```

## API 文档

### RenderEngine

主渲染引擎类。

```typescript
class RenderEngine {
  constructor(config?: EngineConfig)
  render(schema: PageSchema, context: RenderContext, options?: RenderOptions): Promise<RenderResult>
  setComponentManager(manager: ComponentManager): void
  clearCache(): void
  getCacheStats(): { size: number; maxSize: number }
}
```

### DataBindingResolver

数据绑定解析器。

```typescript
interface DataBindingResolver {
  resolve(binding: DataBinding, context: RenderContext): any
  resolveAll(bindings: DataBinding[], context: RenderContext): any[]
}
```

### ConditionEvaluator

条件评估器。

```typescript
interface ConditionEvaluator {
  evaluate(condition: ConditionExpression, context: RenderContext): boolean
  evaluateAll(conditions: ConditionExpression[], context: RenderContext): boolean[]
}
```

### ExpressionExecutor

表达式执行器。

```typescript
interface ExpressionExecutor {
  execute(expression: string, context: Record<string, any>): any
  validate(expression: string): boolean
  extractVariables(expression: string): string[]
}
```

## 最佳实践

1. **启用缓存** - 对于相同的 Schema，启用缓存可以显著提升性能
2. **使用默认实例** - 对于简单场景，使用 `defaultResolver`、`defaultEvaluator` 等默认实例
3. **错误处理** - 配置 `errorHandler` 处理渲染错误
4. **性能追踪** - 开发环境启用 `enablePerformanceTracking`

## 许可证

MIT
