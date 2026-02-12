# 核心协议与 Schema 标准设计

## 文档版本

| 版本 | 日期       | 作者       | 说明     |
| ---- | ---------- | ---------- | -------- |
| v1.0 | 2026-02-11 | 首席架构师 | 初始版本 |

---

## 一、协议设计原则

### 1.1 设计原则

1. **可扩展性**：支持向后兼容的扩展
2. **可序列化**：支持 JSON 序列化与反序列化
3. **类型安全**：基于 TypeScript + Zod 的类型定义
4. **版本化**：支持协议版本升级与迁移
5. **人类可读**：JSON 格式，易于理解和调试
6. **标准化**：参考 JSON Schema、OpenAPI 等标准

### 1.2 版本管理策略

```typescript
// 所有 Schema 都包含版本信息
interface VersionedSchema {
  version: string  // 语义化版本，如 "1.0.0"
  $schema?: string // Schema 定义的 URI
}

// 版本兼容性规则
// - Major 版本：不兼容变更
// - Minor 版本：向后兼容的新增功能
// - Patch 版本：向后兼容的问题修复
```

---

## 二、页面 Schema 协议

### 2.1 页面 Schema 结构

```typescript
/**
 * 页面 Schema - 描述完整页面结构
 */
interface PageSchema {
  // ========== 元数据 ==========
  id: string                    // 页面唯一标识
  version: string               // Schema 版本
  name: string                  // 页面名称
  title?: string                // 页面标题
  description?: string          // 页面描述
  
  // ========== 页面配置 ==========
  config: PageConfig
  
  // ========== 页面结构 ==========
  root: ComponentNode           // 根组件节点
  
  // ========== 数据层 ==========
  dataSources?: DataSource[]    // 数据源定义
  state?: StateDefinition       // 页面状态
  variables?: Variable[]        // 页面变量
  
  // ========== 生命周期 ==========
  lifecycle?: PageLifecycle     // 生命周期钩子
  
  // ========== 元信息 ==========
  meta: PageMeta
}

/**
 * 页面配置
 */
interface PageConfig {
  // 布局配置
  layout?: {
    type: 'fixed' | 'fluid' | 'responsive'
    width?: number | string
    minWidth?: number
    maxWidth?: number
    padding?: Spacing
    background?: BackgroundStyle
  }
  
  // SEO 配置
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonical?: string
  }
  
  // 性能配置
  performance?: {
    ssr: boolean              // 服务端渲染
    ssg: boolean              // 静态生成
    isr?: number              // 增量静态再生成（秒）
    preload?: string[]        // 预加载资源
  }
  
  // 权限配置
  permission?: {
    required: string[]        // 必需权限
    roles?: string[]          // 允许的角色
    public?: boolean          // 是否公开访问
  }
}

/**
 * 页面元信息
 */
interface PageMeta {
  createdAt: string           // 创建时间
  updatedAt: string           // 更新时间
  createdBy: string           // 创建者
  updatedBy: string           // 更新者
  tags?: string[]             // 标签
  category?: string           // 分类
  status: 'draft' | 'published' | 'archived'
}
```

### 2.2 页面示例

```json
{
  "id": "page_001",
  "version": "1.0.0",
  "name": "用户管理页面",
  "title": "用户管理",
  "config": {
    "layout": {
      "type": "fluid",
      "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 }
    },
    "performance": {
      "ssr": true,
      "ssg": false
    },
    "permission": {
      "required": ["user:read"],
      "roles": ["admin", "user_manager"]
    }
  },
  "root": {
    "id": "root",
    "type": "Container",
    "props": {},
    "children": [...]
  },
  "dataSources": [...],
  "meta": {
    "createdAt": "2026-02-11T00:00:00Z",
    "updatedAt": "2026-02-11T00:00:00Z",
    "createdBy": "user_001",
    "updatedBy": "user_001",
    "status": "published"
  }
}
```

---

## 三、组件 Schema 协议

### 3.1 组件节点结构

```typescript
/**
 * 组件节点 - 组件在页面中的实例
 */
interface ComponentNode {
  // ========== 标识 ==========
  id: string                    // 节点唯一标识（页面内唯一）
  type: string                  // 组件类型（如 "Button", "Input"）
  
  // ========== 属性 ==========
  props: Record<string, any>    // 组件属性
  style?: StyleConfig           // 样式配置
  
  // ========== 布局 ==========
  layout?: LayoutConfig         // 布局配置
  
  // ========== 数据绑定 ==========
  bindings?: DataBinding[]      // 数据绑定
  
  // ========== 事件 ==========
  events?: EventHandler[]       // 事件处理
  
  // ========== 条件渲染 ==========
  condition?: ConditionExpression  // 条件表达式
  
  // ========== 循环渲染 ==========
  loop?: LoopConfig             // 循环配置
  
  // ========== 子节点 ==========
  children?: ComponentNode[]    // 子组件节点
  
  // ========== 插槽 ==========
  slots?: Record<string, ComponentNode[]>  // 命名插槽
  
  // ========== 元信息 ==========
  meta?: {
    locked?: boolean            // 是否锁定（编辑器中）
    hidden?: boolean            // 是否隐藏
    label?: string              // 显示标签
  }
}

/**
 * 样式配置
 */
interface StyleConfig {
  // 基础样式
  className?: string[]
  
  // 内联样式
  style?: React.CSSProperties
  
  // 响应式样式
  responsive?: {
    [breakpoint: string]: React.CSSProperties
  }
  
  // 状态样式
  states?: {
    hover?: React.CSSProperties
    active?: React.CSSProperties
    focus?: React.CSSProperties
    disabled?: React.CSSProperties
  }
  
  // 主题变量
  tokens?: Record<string, string>
}

/**
 * 布局配置
 */
interface LayoutConfig {
  // Flexbox
  display?: 'flex' | 'grid' | 'block' | 'inline' | 'none'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justifyContent?: 'start' | 'end' | 'center' | 'between' | 'around'
  alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  gap?: number | string
  
  // Grid
  gridTemplateColumns?: string
  gridTemplateRows?: string
  gridColumn?: string
  gridRow?: string
  
  // 定位
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  zIndex?: number
  
  // 尺寸
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string
  
  // 间距
  margin?: Spacing | number | string
  padding?: Spacing | number | string
}

/**
 * 间距类型
 */
interface Spacing {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
}
```

### 3.2 组件元数据协议

```typescript
/**
 * 组件元数据 - 描述组件的能力和配置
 */
interface ComponentMeta {
  // ========== 基础信息 ==========
  id: string                    // 组件唯一标识
  name: string                  // 组件名称
  displayName: string           // 显示名称
  version: string               // 组件版本
  description?: string          // 组件描述
  
  // ========== 分类 ==========
  category: ComponentCategory   // 组件分类
  tags?: string[]               // 标签
  
  // ========== 视觉 ==========
  icon?: string                 // 图标（SVG 或 Icon 名称）
  thumbnail?: string            // 缩略图 URL
  
  // ========== Props Schema ==========
  propsSchema: JSONSchema       // Props 的 JSON Schema
  
  // ========== 默认值 ==========
  defaultProps?: Record<string, any>
  
  // ========== 样式配置 ==========
  styleSchema?: JSONSchema      // 样式的 JSON Schema
  styleCategories?: StyleCategory[]  // 样式分类
  
  // ========== 事件定义 ==========
  events: EventDefinition[]     // 组件事件
  
  // ========== 数据绑定 ==========
  dataBindings?: DataBindingCapability[]
  
  // ========== 子组件约束 ==========
  children?: {
    accept?: string[]           // 接受的子组件类型
    max?: number                // 最大子组件数量
    min?: number                // 最小子组件数量
    required?: boolean          // 是否必需子组件
  }
  
  // ========== 插槽定义 ==========
  slots?: SlotDefinition[]
  
  // ========== 生命周期 ==========
  lifecycle?: {
    onMount?: boolean           // 是否支持 onMount
    onUnmount?: boolean         // 是否支持 onUnmount
    onUpdate?: boolean          // 是否支持 onUpdate
  }
  
  // ========== 权限 ==========
  permissions?: {
    required?: string[]         // 必需权限
    optional?: string[]         // 可选权限
  }
  
  // ========== 依赖 ==========
  dependencies?: {
    components?: string[]       // 依赖的其他组件
    libraries?: string[]        // 依赖的外部库
  }
  
  // ========== 编辑器配置 ==========
  editor?: {
    resize?: boolean            // 是否可调整大小
    drag?: boolean              // 是否可拖拽
    drop?: boolean              // 是否可接受拖放
    delete?: boolean            // 是否可删除
    copy?: boolean              // 是否可复制
  }
}

/**
 * 组件分类
 */
enum ComponentCategory {
  Layout = 'layout',           // 布局组件
  Form = 'form',               // 表单组件
  DataDisplay = 'data-display', // 数据展示
  Feedback = 'feedback',       // 反馈组件
  Navigation = 'navigation',   // 导航组件
  Input = 'input',             // 输入组件
  Media = 'media',             // 媒体组件
  Chart = 'chart',             // 图表组件
  Business = 'business',       // 业务组件
  Other = 'other'              // 其他
}

/**
 * 事件定义
 */
interface EventDefinition {
  name: string                 // 事件名称（如 "onClick"）
  displayName: string          // 显示名称
  description?: string         // 事件描述
  
  // 事件参数
  params?: {
    name: string
    type: string               // 参数类型
    description?: string
  }[]
  
  // 事件分类
  category?: 'mouse' | 'keyboard' | 'form' | 'lifecycle' | 'custom'
}

/**
 * 插槽定义
 */
interface SlotDefinition {
  name: string                 // 插槽名称
  displayName: string          // 显示名称
  description?: string         // 插槽描述
  accept?: string[]            // 接受的组件类型
  required?: boolean           // 是否必需
  max?: number                 // 最大组件数量
}
```

### 3.3 组件注册示例

```typescript
// 组件元数据定义示例
const ButtonComponentMeta: ComponentMeta = {
  id: 'button',
  name: 'Button',
  displayName: '按钮',
  version: '1.0.0',
  description: '通用按钮组件',
  category: ComponentCategory.Input,
  icon: 'IconButton',
  
  // Props Schema (使用 JSON Schema)
  propsSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        title: '按钮文本',
        default: '按钮'
      },
      type: {
        type: 'string',
        title: '按钮类型',
        enum: ['primary', 'secondary', 'danger', 'ghost'],
        default: 'primary'
      },
      size: {
        type: 'string',
        title: '尺寸',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      disabled: {
        type: 'boolean',
        title: '禁用状态',
        default: false
      },
      loading: {
        type: 'boolean',
        title: '加载状态',
        default: false
      }
    },
    required: ['text']
  },
  
  // 默认属性
  defaultProps: {
    text: '按钮',
    type: 'primary',
    size: 'medium',
    disabled: false,
    loading: false
  },
  
  // 事件定义
  events: [
    {
      name: 'onClick',
      displayName: '点击事件',
      description: '按钮被点击时触发',
      params: [
        {
          name: 'event',
          type: 'MouseEvent',
          description: '鼠标事件对象'
        }
      ],
      category: 'mouse'
    }
  ],
  
  // 编辑器配置
  editor: {
    resize: false,
    drag: true,
    drop: false,
    delete: true,
    copy: true
  }
}
```

---

## 四、数据绑定协议

### 4.1 数据绑定结构

```typescript
/**
 * 数据绑定
 */
interface DataBinding {
  // 目标属性
  target: string                // 如 "props.text", "style.color"
  
  // 绑定类型
  type: BindingType
  
  // 数据源
  source: DataSource
  
  // 转换函数
  transform?: TransformFunction
  
  // 默认值
  defaultValue?: any
  
  // 绑定模式
  mode?: 'one-way' | 'two-way'
}

/**
 * 绑定类型
 */
enum BindingType {
  Static = 'static',           // 静态值
  Expression = 'expression',   // 表达式
  DataSource = 'datasource',   // 数据源
  State = 'state',             // 状态
  Variable = 'variable',       // 变量
  Context = 'context',         // 上下文
  Computed = 'computed'        // 计算属性
}

/**
 * 数据源
 */
interface DataSource {
  // 数据源类型
  type: 'api' | 'state' | 'variable' | 'context' | 'computed'
  
  // 数据路径
  path: string                 // 如 "users[0].name", "state.count"
  
  // API 数据源配置
  api?: {
    id: string                 // 数据源 ID
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    params?: Record<string, any>
  }
  
  // 计算属性配置
  computed?: {
    dependencies: string[]     // 依赖的数据源
    compute: string            // 计算函数（表达式）
  }
}

/**
 * 转换函数
 */
interface TransformFunction {
  type: 'builtin' | 'custom'
  
  // 内置转换
  builtin?: 'format' | 'filter' | 'map' | 'reduce'
  config?: Record<string, any>
  
  // 自定义转换
  custom?: {
    code: string               // 转换函数代码
    params?: string[]          // 参数列表
  }
}
```

### 4.2 数据绑定示例

```json
{
  "id": "button_001",
  "type": "Button",
  "props": {
    "text": "提交"
  },
  "bindings": [
    {
      "target": "props.disabled",
      "type": "expression",
      "source": {
        "type": "computed",
        "computed": {
          "dependencies": ["state.form.valid"],
          "compute": "!state.form.valid"
        }
      }
    },
    {
      "target": "props.loading",
      "type": "state",
      "source": {
        "type": "state",
        "path": "loading"
      }
    }
  ]
}
```

---

## 五、事件系统协议

### 5.1 事件处理器

```typescript
/**
 * 事件处理器
 */
interface EventHandler {
  // 事件名称
  event: string                // 如 "onClick", "onChange"
  
  // 动作列表
  actions: Action[]
  
  // 条件
  condition?: ConditionExpression
  
  // 防抖/节流
  debounce?: number            // 防抖延迟（毫秒）
  throttle?: number            // 节流间隔（毫秒）
  
  // 阻止默认行为
  preventDefault?: boolean
  
  // 阻止事件冒泡
  stopPropagation?: boolean
}

/**
 * 动作
 */
interface Action {
  // 动作类型
  type: ActionType
  
  // 动作配置
  config: ActionConfig
  
  // 执行条件
  condition?: ConditionExpression
  
  // 错误处理
  onError?: Action[]
  
  // 成功回调
  onSuccess?: Action[]
}

/**
 * 动作类型
 */
enum ActionType {
  // 数据操作
  SetState = 'setState',           // 设置状态
  SetVariable = 'setVariable',     // 设置变量
  CallAPI = 'callAPI',             // 调用 API
  
  // 导航
  Navigate = 'navigate',           // 页面导航
  OpenModal = 'openModal',         // 打开弹窗
  CloseModal = 'closeModal',       // 关闭弹窗
  
  // 组件操作
  UpdateComponent = 'updateComponent',  // 更新组件
  ShowComponent = 'showComponent',      // 显示组件
  HideComponent = 'hideComponent',      // 隐藏组件
  
  // 流程控制
  Condition = 'condition',         // 条件判断
  Loop = 'loop',                   // 循环
  Parallel = 'parallel',           // 并行执行
  Sequence = 'sequence',           // 顺序执行
  
  // 反馈
  ShowMessage = 'showMessage',     // 显示消息
  ShowNotification = 'showNotification',  // 显示通知
  
  // 自定义
  CustomCode = 'customCode',       // 自定义代码
  CallWorkflow = 'callWorkflow'    // 调用工作流
}

/**
 * 条件表达式
 */
interface ConditionExpression {
  type: 'simple' | 'complex'
  
  // 简单表达式
  simple?: {
    left: string                 // 左操作数
    operator: ComparisonOperator // 操作符
    right: any                   // 右操作数
  }
  
  // 复杂表达式
  complex?: {
    logic: 'and' | 'or'
    conditions: ConditionExpression[]
  }
  
  // 原始表达式
  raw?: string
}

type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'contains'
```

### 5.2 事件处理示例

```json
{
  "events": [
    {
      "event": "onClick",
      "actions": [
        {
          "type": "callAPI",
          "config": {
            "apiId": "submitForm",
            "params": {
              "data": "{{ state.formData }}"
            }
          },
          "onSuccess": [
            {
              "type": "showMessage",
              "config": {
                "type": "success",
                "content": "提交成功"
              }
            },
            {
              "type": "navigate",
              "config": {
                "path": "/success"
              }
            }
          ],
          "onError": [
            {
              "type": "showMessage",
              "config": {
                "type": "error",
                "content": "提交失败: {{ error.message }}"
              }
            }
          ]
        }
      ],
      "condition": {
        "type": "simple",
        "simple": {
          "left": "state.formValid",
          "operator": "==",
          "right": true
        }
      }
    }
  ]
}
```

---

## 六、插件协议

### 6.1 插件定义

```typescript
/**
 * 插件元数据
 */
interface PluginMeta {
  // ========== 基础信息 ==========
  id: string                    // 插件唯一标识
  name: string                  // 插件名称
  version: string               // 插件版本
  description?: string          // 插件描述
  
  // ========== 作者信息 ==========
  author: {
    name: string
    email?: string
    url?: string
  }
  
  // ========== 插件类型 ==========
  type: PluginType
  
  // ========== 依赖 ==========
  dependencies?: {
    platform?: string           // 平台最低版本
    plugins?: Record<string, string>  // 依赖的其他插件
    libraries?: string[]        // 外部库依赖
  }
  
  // ========== 能力声明 ==========
  capabilities: PluginCapability[]
  
  // ========== 配置 Schema ==========
  configSchema?: JSONSchema
  
  // ========== 权限声明 ==========
  permissions?: string[]
  
  // ========== 生命周期 ==========
  lifecycle: {
    onInstall?: string          // 安装钩子
    onUninstall?: string        // 卸载钩子
    onEnable?: string           // 启用钩子
    onDisable?: string          // 禁用钩子
    onConfigUpdate?: string     // 配置更新钩子
  }
}

/**
 * 插件类型
 */
enum PluginType {
  Component = 'component',           // UI 组件插件
  DataSource = 'datasource',         // 数据源插件
  EditorExtension = 'editor',        // 编辑器扩展
  WorkflowNode = 'workflow',         // 工作流节点
  Permission = 'permission',         // 权限策略
  Theme = 'theme',                   // 主题插件
  Integration = 'integration'        // 集成插件
}

/**
 * 插件能力
 */
interface PluginCapability {
  type: string                   // 能力类型
  config: Record<string, any>    // 能力配置
}
```

### 6.2 插件注册示例

```typescript
// 组件插件示例
const chartPluginMeta: PluginMeta = {
  id: 'plugin-echarts',
  name: 'ECharts 图表插件',
  version: '1.0.0',
  description: '基于 Apache ECharts 的图表组件库',
  author: {
    name: 'Plugin Team',
    email: 'plugin@example.com'
  },
  type: PluginType.Component,
  dependencies: {
    platform: '^1.0.0',
    libraries: ['echarts@^5.0.0']
  },
  capabilities: [
    {
      type: 'component',
      config: {
        components: [
          {
            id: 'line-chart',
            name: 'LineChart',
            displayName: '折线图',
            category: 'chart'
          },
          {
            id: 'bar-chart',
            name: 'BarChart',
            displayName: '柱状图',
            category: 'chart'
          }
        ]
      }
    }
  ],
  configSchema: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        enum: ['light', 'dark'],
        default: 'light'
      }
    }
  },
  permissions: ['component:register'],
  lifecycle: {
    onInstall: 'handleInstall',
    onEnable: 'handleEnable'
  }
}
```

---

## 七、工作流 DSL 协议

### 7.1 工作流定义

```typescript
/**
 * 工作流定义
 */
interface WorkflowDefinition {
  id: string
  name: string
  version: string
  description?: string
  
  // 节点列表
  nodes: WorkflowNode[]
  
  // 边列表（连接）
  edges: WorkflowEdge[]
  
  // 触发器
  triggers: WorkflowTrigger[]
  
  // 全局变量
  variables?: Variable[]
  
  // 输入参数
  inputs?: Parameter[]
  
  // 输出参数
  outputs?: Parameter[]
}

/**
 * 工作流节点
 */
interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  name: string
  config: Record<string, any>
  position?: { x: number; y: number }
}

/**
 * 节点类型
 */
enum WorkflowNodeType {
  Start = 'start',
  End = 'end',
  UserTask = 'userTask',
  ServiceTask = 'serviceTask',
  ScriptTask = 'scriptTask',
  Gateway = 'gateway',
  SubProcess = 'subProcess'
}

/**
 * 工作流边
 */
interface WorkflowEdge {
  id: string
  source: string              // 源节点 ID
  target: string              // 目标节点 ID
  condition?: ConditionExpression
}

/**
 * 工作流触发器
 */
interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook'
  config: Record<string, any>
}
```

---

## 八、JSON Schema 标准

### 8.1 JSON Schema 使用

所有 Props Schema、Config Schema 都基于 JSON Schema Draft 7 标准：

```typescript
interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  title?: string
  description?: string
  default?: any
  
  // 对象类型
  properties?: Record<string, JSONSchema>
  required?: string[]
  additionalProperties?: boolean | JSONSchema
  
  // 数组类型
  items?: JSONSchema | JSONSchema[]
  minItems?: number
  maxItems?: number
  
  // 字符串类型
  enum?: any[]
  pattern?: string
  minLength?: number
  maxLength?: number
  format?: 'email' | 'uri' | 'date' | 'time' | 'color' | string
  
  // 数字类型
  minimum?: number
  maximum?: number
  multipleOf?: number
  
  // UI 扩展（用于编辑器）
  'x-component'?: string      // 使用的表单组件
  'x-component-props'?: Record<string, any>
  'x-decorator'?: string      // 装饰器
  'x-reactions'?: any[]       // 联动规则
}
```

---

## 九、协议版本与迁移

### 9.1 版本升级策略

```typescript
/**
 * Schema 迁移器
 */
interface SchemaMigrator {
  // 当前版本
  currentVersion: string
  
  // 迁移规则
  migrations: Migration[]
  
  // 执行迁移
  migrate(schema: any, targetVersion: string): MigrationResult
  
  // 验证版本兼容性
  isCompatible(fromVersion: string, toVersion: string): boolean
}

/**
 * 迁移规则
 */
interface Migration {
  from: string                // 源版本
  to: string                  // 目标版本
  up: (schema: any) => any    // 升级函数
  down?: (schema: any) => any // 降级函数（可选）
}
```

### 9.2 迁移示例

```typescript
// 从 1.0.0 迁移到 1.1.0
const migration_1_0_to_1_1: Migration = {
  from: '1.0.0',
  to: '1.1.0',
  up: (schema) => {
    // 添加新字段
    return {
      ...schema,
      version: '1.1.0',
      config: {
        ...schema.config,
        performance: {
          ssr: true,
          ssg: false
        }
      }
    }
  }
}
```

---

## 十、总结

本协议设计已完成：

✅ **页面 Schema 协议**：完整的页面结构描述  
✅ **组件 Schema 协议**：标准化的组件定义  
✅ **数据绑定协议**：灵活的数据绑定机制  
✅ **事件系统协议**：强大的事件处理能力  
✅ **插件协议**：可扩展的插件系统  
✅ **工作流 DSL**：流程编排标准  
✅ **JSON Schema 标准**：基于业界标准  
✅ **版本管理策略**：支持平滑升级  

**下一步**：实现 Schema Core 核心包，提供 Schema 验证、转换、diff 等能力。
