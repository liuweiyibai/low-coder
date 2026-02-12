/**
 * Schema Core - 核心类型定义
 * 
 * 定义低代码平台的所有核心Schema类型
 */

import { z } from 'zod'

// ============= 通用类型 =============

/**
 * 版本化Schema基类
 */
export const VersionedSchemaSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, '必须是语义化版本格式'),
  $schema: z.string().url().optional()
})

export type VersionedSchema = z.infer<typeof VersionedSchemaSchema>

/**
 * 间距类型
 */
export const SpacingSchema = z.object({
  top: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  left: z.union([z.number(), z.string()]).optional()
})

export type Spacing = z.infer<typeof SpacingSchema>

// ============= 页面Schema =============

/**
 * 页面配置
 */
export const PageConfigSchema = z.object({
  layout: z.object({
    type: z.enum(['fixed', 'fluid', 'responsive']).default('fluid'),
    width: z.union([z.number(), z.string()]).optional(),
    minWidth: z.number().optional(),
    maxWidth: z.number().optional(),
    padding: SpacingSchema.optional(),
    background: z.any().optional()
  }).optional(),
  
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().url().optional(),
    canonical: z.string().url().optional()
  }).optional(),
  
  performance: z.object({
    ssr: z.boolean().default(true),
    ssg: z.boolean().default(false),
    isr: z.number().optional(),
    preload: z.array(z.string()).optional()
  }).optional(),
  
  permission: z.object({
    required: z.array(z.string()).default([]),
    roles: z.array(z.string()).optional(),
    public: z.boolean().default(false)
  }).optional()
})

export type PageConfig = z.infer<typeof PageConfigSchema>

/**
 * 页面元信息
 */
export const PageMetaSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  updatedBy: z.string(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

export type PageMeta = z.infer<typeof PageMetaSchema>

/**
 * 样式配置
 */
export const StyleConfigSchema = z.object({
  className: z.array(z.string()).optional(),
  style: z.record(z.any()).optional(),
  responsive: z.record(z.record(z.any())).optional(),
  states: z.object({
    hover: z.record(z.any()).optional(),
    active: z.record(z.any()).optional(),
    focus: z.record(z.any()).optional(),
    disabled: z.record(z.any()).optional()
  }).optional(),
  tokens: z.record(z.string()).optional()
})

export type StyleConfig = z.infer<typeof StyleConfigSchema>

/**
 * 布局配置
 */
export const LayoutConfigSchema = z.object({
  display: z.enum(['flex', 'grid', 'block', 'inline', 'none']).optional(),
  flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
  justifyContent: z.enum(['start', 'end', 'center', 'between', 'around']).optional(),
  alignItems: z.enum(['start', 'end', 'center', 'stretch', 'baseline']).optional(),
  gap: z.union([z.number(), z.string()]).optional(),
  
  gridTemplateColumns: z.string().optional(),
  gridTemplateRows: z.string().optional(),
  gridColumn: z.string().optional(),
  gridRow: z.string().optional(),
  
  position: z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky']).optional(),
  top: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  left: z.union([z.number(), z.string()]).optional(),
  zIndex: z.number().optional(),
  
  width: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
  minWidth: z.union([z.number(), z.string()]).optional(),
  maxWidth: z.union([z.number(), z.string()]).optional(),
  minHeight: z.union([z.number(), z.string()]).optional(),
  maxHeight: z.union([z.number(), z.string()]).optional(),
  
  margin: z.union([SpacingSchema, z.number(), z.string()]).optional(),
  padding: z.union([SpacingSchema, z.number(), z.string()]).optional()
})

export type LayoutConfig = z.infer<typeof LayoutConfigSchema>

/**
 * 数据绑定
 */
export const DataBindingSchema: z.ZodType<any> = z.lazy(() => 
  z.object({
    target: z.string(),
    type: z.enum(['static', 'expression', 'datasource', 'state', 'variable', 'context', 'computed']),
    source: z.object({
      type: z.enum(['api', 'state', 'variable', 'context', 'computed']),
      path: z.string(),
      api: z.object({
        id: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        params: z.record(z.any()).optional()
      }).optional(),
      computed: z.object({
        dependencies: z.array(z.string()),
        compute: z.string()
      }).optional()
    }),
    transform: z.object({
      type: z.enum(['builtin', 'custom']),
      builtin: z.enum(['format', 'filter', 'map', 'reduce']).optional(),
      config: z.record(z.any()).optional(),
      custom: z.object({
        code: z.string(),
        params: z.array(z.string()).optional()
      }).optional()
    }).optional(),
    defaultValue: z.any().optional(),
    mode: z.enum(['one-way', 'two-way']).default('one-way')
  })
)

export type DataBinding = z.infer<typeof DataBindingSchema>

/**
 * 条件表达式
 */
export const ConditionExpressionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(['simple', 'complex']),
    simple: z.object({
      left: z.string(),
      operator: z.enum(['==', '!=', '>', '<', '>=', '<=', 'in', 'contains']),
      right: z.any()
    }).optional(),
    complex: z.object({
      logic: z.enum(['and', 'or']),
      conditions: z.array(ConditionExpressionSchema)
    }).optional(),
    raw: z.string().optional()
  })
)

export type ConditionExpression = z.infer<typeof ConditionExpressionSchema>

/**
 * 循环配置
 */
export const LoopConfigSchema = z.object({
  dataSource: z.string(),
  itemKey: z.string().default('item'),
  indexKey: z.string().default('index')
})

export type LoopConfig = z.infer<typeof LoopConfigSchema>

/**
 * 事件处理器
 */
export const EventHandlerSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    event: z.string(),
    actions: z.array(ActionSchema),
    condition: ConditionExpressionSchema.optional(),
    debounce: z.number().optional(),
    throttle: z.number().optional(),
    preventDefault: z.boolean().default(false),
    stopPropagation: z.boolean().default(false)
  })
)

export type EventHandler = z.infer<typeof EventHandlerSchema>

/**
 * 动作
 */
export const ActionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum([
      'setState', 'setVariable', 'callAPI',
      'navigate', 'openModal', 'closeModal',
      'updateComponent', 'showComponent', 'hideComponent',
      'condition', 'loop', 'parallel', 'sequence',
      'showMessage', 'showNotification',
      'customCode', 'callWorkflow'
    ]),
    config: z.record(z.any()),
    condition: ConditionExpressionSchema.optional(),
    onError: z.array(ActionSchema).optional(),
    onSuccess: z.array(ActionSchema).optional()
  })
)

export type Action = z.infer<typeof ActionSchema>

/**
 * 组件节点
 */
export const ComponentNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    props: z.record(z.any()).default({}),
    style: StyleConfigSchema.optional(),
    layout: LayoutConfigSchema.optional(),
    bindings: z.array(DataBindingSchema).optional(),
    events: z.array(EventHandlerSchema).optional(),
    condition: ConditionExpressionSchema.optional(),
    loop: LoopConfigSchema.optional(),
    children: z.array(ComponentNodeSchema).optional(),
    slots: z.record(z.array(ComponentNodeSchema)).optional(),
    meta: z.object({
      locked: z.boolean().default(false),
      hidden: z.boolean().default(false),
      label: z.string().optional()
    }).optional()
  })
)

export type ComponentNode = z.infer<typeof ComponentNodeSchema>

/**
 * 页面Schema
 */
export const PageSchemaSchema = VersionedSchemaSchema.extend({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  config: PageConfigSchema.default({}),
  root: ComponentNodeSchema,
  dataSources: z.array(z.any()).optional(),
  state: z.record(z.any()).optional(),
  variables: z.array(z.any()).optional(),
  lifecycle: z.object({
    onMount: z.string().optional(),
    onUnmount: z.string().optional(),
    onUpdate: z.string().optional()
  }).optional(),
  meta: PageMetaSchema
})

export type PageSchema = z.infer<typeof PageSchemaSchema>

// ============= 组件元数据Schema =============

/**
 * 组件分类
 */
export enum ComponentCategory {
  Layout = 'layout',
  Form = 'form',
  DataDisplay = 'data-display',
  Feedback = 'feedback',
  Navigation = 'navigation',
  Input = 'input',
  Media = 'media',
  Chart = 'chart',
  Business = 'business',
  Other = 'other'
}

/**
 * 事件定义
 */
export const EventDefinitionSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  params: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional()
  })).optional(),
  category: z.enum(['mouse', 'keyboard', 'form', 'lifecycle', 'custom']).optional()
})

export type EventDefinition = z.infer<typeof EventDefinitionSchema>

/**
 * 插槽定义
 */
export const SlotDefinitionSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  accept: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  max: z.number().optional()
})

export type SlotDefinition = z.infer<typeof SlotDefinitionSchema>

/**
 * 组件元数据
 */
export const ComponentMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  version: z.string(),
  description: z.string().optional(),
  
  category: z.nativeEnum(ComponentCategory),
  tags: z.array(z.string()).optional(),
  
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  
  propsSchema: z.any(), // JSON Schema
  defaultProps: z.record(z.any()).optional(),
  
  styleSchema: z.any().optional(),
  styleCategories: z.array(z.string()).optional(),
  
  events: z.array(EventDefinitionSchema).default([]),
  
  dataBindings: z.array(z.any()).optional(),
  
  children: z.object({
    accept: z.array(z.string()).optional(),
    max: z.number().optional(),
    min: z.number().optional(),
    required: z.boolean().default(false)
  }).optional(),
  
  slots: z.array(SlotDefinitionSchema).optional(),
  
  lifecycle: z.object({
    onMount: z.boolean().default(false),
    onUnmount: z.boolean().default(false),
    onUpdate: z.boolean().default(false)
  }).optional(),
  
  permissions: z.object({
    required: z.array(z.string()).optional(),
    optional: z.array(z.string()).optional()
  }).optional(),
  
  dependencies: z.object({
    components: z.array(z.string()).optional(),
    libraries: z.array(z.string()).optional()
  }).optional(),
  
  editor: z.object({
    resize: z.boolean().default(true),
    drag: z.boolean().default(true),
    drop: z.boolean().default(true),
    delete: z.boolean().default(true),
    copy: z.boolean().default(true)
  }).optional()
})

export type ComponentMeta = z.infer<typeof ComponentMetaSchema>

// ============= 插件Schema =============

/**
 * 插件类型
 */
export enum PluginType {
  Component = 'component',
  DataSource = 'datasource',
  EditorExtension = 'editor',
  WorkflowNode = 'workflow',
  Permission = 'permission',
  Theme = 'theme',
  Integration = 'integration',
  Function = 'function'
}

/**
 * 插件元数据
 */
export const PluginMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    url: z.string().url().optional()
  }),
  
  type: z.nativeEnum(PluginType),
  
  dependencies: z.object({
    platform: z.string().optional(),
    plugins: z.record(z.string()).optional(),
    libraries: z.array(z.string()).optional()
  }).optional(),
  
  capabilities: z.array(z.object({
    type: z.string(),
    config: z.record(z.any())
  })).default([]),
  
  configSchema: z.any().optional(),
  
  permissions: z.array(z.string()).optional(),
  
  lifecycle: z.object({
    onInstall: z.string().optional(),
    onUninstall: z.string().optional(),
    onEnable: z.string().optional(),
    onDisable: z.string().optional(),
    onConfigUpdate: z.string().optional()
  }).default({})
})

export type PluginMeta = z.infer<typeof PluginMetaSchema>
