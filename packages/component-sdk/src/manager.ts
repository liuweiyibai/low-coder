/**
 * Component Manager - 组件管理器
 * 
 * 统一管理组件注册、加载、实例化等功能
 */

import { EventEmitter } from 'eventemitter3'
import { nanoid } from 'nanoid'
import type { ComponentNode } from '@low-coder/schema-core'
import type {
    ComponentInstance,
    ComponentContext,
    ComponentLifecycle,
    ComponentDefinition
} from './types'
import { ComponentRegistry, createRegistry } from './registry'
import { ComponentLoader, createLoader, type LoaderConfig } from './loader'

/**
 * 组件管理器配置
 */
export interface ComponentManagerConfig {
    // 加载器配置
    loaderConfig?: LoaderConfig

    // 是否启用生命周期
    enableLifecycle?: boolean

    // 是否启用性能追踪
    enablePerformanceTracking?: boolean
}

/**
 * 组件管理器
 */
export class ComponentManager extends EventEmitter {
    private config: Required<ComponentManagerConfig>
    private registry: ComponentRegistry
    private loader: ComponentLoader
    private instances: Map<string, ComponentInstance> = new Map()
    private contexts: Map<string, ComponentContext> = new Map()

    constructor(config: ComponentManagerConfig = {}) {
        super()

        this.config = {
            loaderConfig: config.loaderConfig ?? {},
            enableLifecycle: config.enableLifecycle ?? true,
            enablePerformanceTracking: config.enablePerformanceTracking ?? false
        }

        this.registry = createRegistry()
        this.loader = createLoader(this.registry, this.config.loaderConfig)

        // 转发注册表和加载器事件
        this.registry.on('component:registered', (event) => this.emit('component:registered', event))
        this.registry.on('component:unregistered', (event) => this.emit('component:unregistered', event))
        this.loader.on('component:loaded', (event) => this.emit('component:loaded', event))
        this.loader.on('component:loadFailed', (event) => this.emit('component:loadFailed', event))
    }

    /**
     * 获取注册表
     */
    getRegistry(): ComponentRegistry {
        return this.registry
    }

    /**
     * 获取加载器
     */
    getLoader(): ComponentLoader {
        return this.loader
    }

    /**
     * 创建组件实例
     */
    async createInstance(node: ComponentNode): Promise<ComponentInstance> {
        const startTime = this.config.enablePerformanceTracking ? performance.now() : 0

        try {
            // 加载组件定义
            const definition = await this.loader.load(node.type)

            // 创建组件上下文
            const context = this.createContext(node, definition)

            // 解析属性
            const props = this.resolveProps(node, definition)

            // 创建实例
            const instance: ComponentInstance = {
                id: node.id,
                type: node.type,
                node,
                meta: definition.meta,
                props,
                state: definition.defaultState ? { ...definition.defaultState } : undefined,
                lifecycle: definition.lifecycle,
                mounted: false,
                destroy: () => this.destroyInstance(node.id)
            }

            // 保存实例
            this.instances.set(node.id, instance)
            this.contexts.set(node.id, context)

            // 执行生命周期
            if (this.config.enableLifecycle) {
                await this.executeLifecycle(instance, 'onBeforeMount')
            }

            // 标记为已挂载
            instance.mounted = true

            if (this.config.enableLifecycle) {
                await this.executeLifecycle(instance, 'onMounted')
            }

            // 性能追踪
            if (this.config.enablePerformanceTracking) {
                const duration = performance.now() - startTime
                this.emit('performance:createInstance', {
                    componentId: node.id,
                    type: node.type,
                    duration
                })
            }

            this.emit('instance:created', { instanceId: node.id })

            return instance
        } catch (error) {
            this.emit('instance:createFailed', {
                nodeId: node.id,
                type: node.type,
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }

    /**
     * 获取组件实例
     */
    getInstance(nodeId: string): ComponentInstance | null {
        return this.instances.get(nodeId) ?? null
    }

    /**
     * 更新组件实例
     */
    async updateInstance(nodeId: string, updates: Partial<ComponentNode>): Promise<void> {
        const instance = this.getInstance(nodeId)
        if (!instance) {
            throw new Error(`Component instance "${nodeId}" not found`)
        }

        const prevProps = { ...instance.props }

        // 更新节点
        Object.assign(instance.node, updates)

        // 重新解析属性
        const definition = await this.loader.load(instance.type)
        const newProps = this.resolveProps(instance.node, definition)

        // 执行更新生命周期
        if (this.config.enableLifecycle) {
            await this.executeLifecycle(instance, 'onBeforeUpdate', prevProps, newProps)
        }

        // 更新属性
        instance.props = newProps

        if (this.config.enableLifecycle) {
            await this.executeLifecycle(instance, 'onUpdated', prevProps, newProps)
        }

        this.emit('instance:updated', { instanceId: nodeId })
    }

    /**
     * 销毁组件实例
     */
    async destroyInstance(nodeId: string): Promise<void> {
        const instance = this.getInstance(nodeId)
        if (!instance) {
            return
        }

        // 执行卸载生命周期
        if (this.config.enableLifecycle && instance.mounted) {
            await this.executeLifecycle(instance, 'onBeforeUnmount')
        }

        // 标记为未挂载
        instance.mounted = false

        if (this.config.enableLifecycle) {
            await this.executeLifecycle(instance, 'onUnmounted')
        }

        // 清理实例
        this.instances.delete(nodeId)
        this.contexts.delete(nodeId)

        this.emit('instance:destroyed', { instanceId: nodeId })
    }

    /**
     * 批量创建实例
     */
    async createInstances(nodes: ComponentNode[]): Promise<ComponentInstance[]> {
        const promises = nodes.map(node => this.createInstance(node))
        return Promise.all(promises)
    }

    /**
     * 批量销毁实例
     */
    async destroyInstances(nodeIds: string[]): Promise<void> {
        const promises = nodeIds.map(id => this.destroyInstance(id))
        await Promise.all(promises)
    }

    /**
     * 获取所有实例
     */
    getAllInstances(): ComponentInstance[] {
        return Array.from(this.instances.values())
    }

    /**
     * 获取统计信息
     */
    getStats(): {
        totalInstances: number
        byType: Record<string, number>
        mounted: number
        unmounted: number
    } {
        const stats = {
            totalInstances: this.instances.size,
            byType: {} as Record<string, number>,
            mounted: 0,
            unmounted: 0
        }

        for (const instance of this.instances.values()) {
            stats.byType[instance.type] = (stats.byType[instance.type] || 0) + 1
            if (instance.mounted) {
                stats.mounted++
            } else {
                stats.unmounted++
            }
        }

        return stats
    }

    /**
     * 清理所有实例
     */
    async cleanup(): Promise<void> {
        const nodeIds = Array.from(this.instances.keys())
        await this.destroyInstances(nodeIds)
    }

    /**
     * 创建组件上下文
     */
    private createContext(node: ComponentNode, definition: ComponentDefinition): ComponentContext {
        const context: ComponentContext = {
            nodeId: node.id,
            type: node.type,
            emit: (event: string, data?: any) => {
                this.emit('component:event', {
                    componentId: node.id,
                    type: node.type,
                    event,
                    data,
                    timestamp: Date.now()
                })
            },
            getInstance: () => this.getInstance(node.id),
            updateProps: (props: Partial<any>) => {
                this.updateInstance(node.id, { props: { ...node.props, ...props } })
            }
        }

        return context
    }

    /**
     * 解析组件属性
     */
    private resolveProps(node: ComponentNode, definition: ComponentDefinition): Record<string, any> {
        // 合并默认属性和节点属性
        const props = {
            ...definition.meta.defaultProps,
            ...node.props
        }

        // TODO: 处理数据绑定
        // if (node.bindings) {
        //   for (const binding of node.bindings) {
        //     // 解析绑定值
        //   }
        // }

        return props
    }

    /**
     * 执行生命周期方法
     */
    private async executeLifecycle(
        instance: ComponentInstance,
        hook: keyof ComponentLifecycle,
        ...args: any[]
    ): Promise<void> {
        if (!instance.lifecycle) {
            return
        }

        const method = instance.lifecycle[hook]
        if (!method) {
            return
        }

        try {
            // @ts-ignore - 生命周期方法签名不同，运行时正确
            await method.apply(instance, args)
        } catch (error) {
            console.error(`Lifecycle hook "${hook}" failed for component "${instance.id}":`, error)

            // 调用错误处理
            if (instance.lifecycle.onError) {
                instance.lifecycle.onError(error as Error)
            }

            this.emit('lifecycle:error', {
                instanceId: instance.id,
                hook,
                error: error instanceof Error ? error.message : String(error)
            })
        }
    }
}

/**
 * 创建组件管理器
 */
export function createManager(config?: ComponentManagerConfig): ComponentManager {
    return new ComponentManager(config)
}

/**
 * 全局默认管理器
 */
export const defaultManager = createManager()
