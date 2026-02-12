/**
 * Runtime - 类型定义
 */

import type { PageSchema, ComponentNode, DataBinding } from '@low-coder/schema-core'

/**
 * 渲染上下文
 */
export interface RenderContext {
    // 页面 Schema
    schema: PageSchema

    // 数据上下文
    data: Record<string, any>

    // 全局状态
    state: Record<string, any>

    // 变量
    variables: Record<string, any>

    // 路径参数
    params: Record<string, any>

    // 查询参数
    query: Record<string, any>

    // 用户信息
    user?: {
        id: string
        name: string
        roles: string[]
        [key: string]: any
    }

    // 租户信息
    tenant?: {
        id: string
        name: string
        [key: string]: any
    }
}

/**
 * 渲染选项
 */
export interface RenderOptions {
    // 是否服务端渲染
    ssr?: boolean

    // 是否静态生成
    ssg?: boolean

    // 是否增量静态生成
    isr?: boolean

    // 是否开启调试
    debug?: boolean

    // 是否启用性能追踪
    enablePerformanceTracking?: boolean

    // 组件懒加载
    lazyLoad?: boolean

    // 错误边界
    errorBoundary?: boolean
}

/**
 * 渲染结果
 */
export interface RenderResult {
    // 渲染的内容
    content: any

    // 使用的组件列表
    components: string[]

    // 数据依赖
    dataDependencies: string[]

    // 性能指标
    performance?: {
        renderTime: number
        componentCount: number
        dataBindingCount: number
        eventHandlerCount: number
    }
}

/**
 * 数据绑定解析器
 */
export interface DataBindingResolver {
    // 解析数据绑定
    resolve: (binding: DataBinding, context: RenderContext) => any

    // 批量解析
    resolveAll: (bindings: DataBinding[], context: RenderContext) => any[]
}

/**
 * 事件处理器
 */
export interface EventHandlerExecutor {
    // 执行事件处理
    execute: (event: string, data: any, context: RenderContext) => Promise<void>

    // 注册事件处理器
    register: (nodeId: string, event: string, handler: Function) => void

    // 注销事件处理器
    unregister: (nodeId: string, event?: string) => void
}

/**
 * 条件渲染评估器
 */
export interface ConditionEvaluator {
    // 评估条件表达式
    evaluate: (condition: any, context: RenderContext) => boolean

    // 批量评估
    evaluateAll: (conditions: any[], context: RenderContext) => boolean[]
}

/**
 * 循环渲染处理器
 */
export interface LoopHandler {
    // 处理循环渲染
    handle: (loop: any, context: RenderContext) => any[]
}

/**
 * 组件渲染器接口
 */
export interface ComponentRenderer {
    // 渲染组件
    render: (node: ComponentNode, context: RenderContext) => any

    // 渲染子组件
    renderChildren: (children: ComponentNode[], context: RenderContext) => any[]

    // 渲染插槽
    renderSlot: (slotName: string, slotNodes: ComponentNode[], context: RenderContext) => any
}

/**
 * Schema 解析结果
 */
export interface SchemaAnalysis {
    // 组件依赖
    componentDependencies: string[]

    // 数据绑定列表
    dataBindings: DataBinding[]

    // 事件处理器列表
    eventHandlers: Array<{
        nodeId: string
        event: string
        actions: any[]
    }>

    // 条件渲染节点
    conditionalNodes: string[]

    // 循环渲染节点
    loopNodes: string[]

    // 最大嵌套深度
    maxDepth: number

    // 节点总数
    totalNodes: number
}

/**
 * 表达式执行器
 */
export interface ExpressionExecutor {
    // 执行表达式
    execute: (expression: string, context: Record<string, any>) => any

    // 验证表达式
    validate: (expression: string) => boolean

    // 提取变量
    extractVariables: (expression: string) => string[]
}

/**
 * 渲染引擎配置
 */
export interface EngineConfig {
    // 默认渲染选项
    defaultOptions?: RenderOptions

    // 最大渲染深度
    maxDepth?: number

    // 最大节点数
    maxNodes?: number

    // 缓存配置
    cache?: {
        enabled: boolean
        ttl?: number
        maxSize?: number
    }

    // 错误处理
    errorHandler?: (error: Error, context?: any) => void
}
