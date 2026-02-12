/**
 * Component SDK - 类型定义
 */

import type { ComponentMeta, ComponentNode } from '@low-coder/schema-core'

/**
 * 组件渲染函数类型
 */
export type ComponentRenderFn<P = any> = (props: P, context: ComponentContext) => any

/**
 * 组件上下文
 */
export interface ComponentContext {
    // 组件ID
    nodeId: string

    // 组件类型
    type: string

    // 父组件上下文
    parent?: ComponentContext

    // 子组件
    children?: any[]

    // 插槽
    slots?: Record<string, any[]>

    // 数据绑定值
    bindings?: Record<string, any>

    // 事件处理器
    emit: (event: string, data?: any) => void

    // 获取组件实例
    getInstance: () => ComponentInstance | null

    // 更新属性
    updateProps: (props: Partial<any>) => void
}

/**
 * 组件实例
 */
export interface ComponentInstance {
    // 组件ID
    id: string

    // 组件类型
    type: string

    // 组件节点
    node: ComponentNode

    // 组件元数据
    meta: ComponentMeta

    // 当前属性
    props: Record<string, any>

    // 状态
    state?: Record<string, any>

    // 生命周期方法
    lifecycle?: ComponentLifecycle

    // 挂载状态
    mounted: boolean

    // 销毁方法
    destroy: () => void
}

/**
 * 组件生命周期
 */
export interface ComponentLifecycle {
    // 挂载前
    onBeforeMount?: () => void | Promise<void>

    // 挂载后
    onMounted?: () => void | Promise<void>

    // 更新前
    onBeforeUpdate?: (prevProps: any, nextProps: any) => void | Promise<void>

    // 更新后
    onUpdated?: (prevProps: any, nextProps: any) => void | Promise<void>

    // 卸载前
    onBeforeUnmount?: () => void | Promise<void>

    // 卸载后
    onUnmounted?: () => void | Promise<void>

    // 错误处理
    onError?: (error: Error) => void
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
    // 组件元数据
    meta: ComponentMeta

    // 渲染函数
    render: ComponentRenderFn

    // 生命周期
    lifecycle?: ComponentLifecycle

    // 默认状态
    defaultState?: Record<string, any>
}

/**
 * 组件注册选项
 */
export interface ComponentRegisterOptions {
    // 是否覆盖已存在的组件
    override?: boolean

    // 是否全局组件
    global?: boolean

    // 组件分组
    group?: string
}

/**
 * 组件加载选项
 */
export interface ComponentLoadOptions {
    // 是否异步加载
    async?: boolean

    // 加载超时时间（毫秒）
    timeout?: number

    // 是否预加载依赖
    preloadDependencies?: boolean
}

/**
 * 组件事件
 */
export interface ComponentEvent {
    // 事件类型
    type: string

    // 组件ID
    componentId: string

    // 事件数据
    data?: any

    // 时间戳
    timestamp: number
}
