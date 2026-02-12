/**
 * Render Engine - 渲染引擎
 * 
 * 核心渲染引擎，负责将 Schema 渲染为 UI
 */

import { EventEmitter } from 'eventemitter3'
import type { PageSchema, ComponentNode } from '@low-coder/schema-core'
import type { ComponentManager } from '@low-coder/component-sdk'
import type {
    RenderContext,
    RenderOptions,
    RenderResult,
    EngineConfig
} from './types'
import { analyzeSchema, validateSchema, extractDataDependencies } from './analyzer'
import { defaultResolver } from './data-binding'
import { defaultEvaluator } from './condition'
import { defaultEventExecutor } from './event'

/**
 * 渲染引擎类
 */
export class RenderEngine extends EventEmitter {
    private config: Required<EngineConfig>
    private componentManager?: ComponentManager
    private renderCache = new Map<string, RenderResult>()

    constructor(config: EngineConfig = {}) {
        super()

        this.config = {
            defaultOptions: config.defaultOptions ?? {},
            maxDepth: config.maxDepth ?? 100,
            maxNodes: config.maxNodes ?? 10000,
            cache: {
                enabled: config.cache?.enabled ?? false,
                ttl: config.cache?.ttl ?? 60000,
                maxSize: config.cache?.maxSize ?? 100
            },
            errorHandler: config.errorHandler ?? ((error) => console.error(error))
        }
    }

    /**
     * 设置组件管理器
     */
    setComponentManager(manager: ComponentManager): void {
        this.componentManager = manager
    }

    /**
     * 渲染页面
     */
    async render(
        schema: PageSchema,
        context: RenderContext,
        options: RenderOptions = {}
    ): Promise<RenderResult> {
        const startTime = performance.now()

        try {
            // 合并选项
            const renderOptions = { ...this.config.defaultOptions, ...options }

            // 验证 Schema
            const validation = validateSchema(schema)
            if (!validation.valid) {
                throw new Error(`Invalid schema: ${validation.errors.join(', ')}`)
            }

            // 检查缓存
            if (this.config.cache.enabled && !renderOptions.debug) {
                const cached = this.getFromCache(schema.id)
                if (cached) {
                    this.emit('render:cached', { schemaId: schema.id })
                    return cached
                }
            }

            // 分析 Schema
            const analysis = analyzeSchema(schema)

            // 检查限制
            if (analysis.maxDepth > this.config.maxDepth) {
                throw new Error(`Max depth exceeded: ${analysis.maxDepth} > ${this.config.maxDepth}`)
            }

            if (analysis.totalNodes > this.config.maxNodes) {
                throw new Error(`Max nodes exceeded: ${analysis.totalNodes} > ${this.config.maxNodes}`)
            }

            this.emit('render:start', { schemaId: schema.id })

            // 渲染根节点
            const content = await this.renderNode(schema.root, context, renderOptions)

            const renderTime = performance.now() - startTime

            // 构建结果
            const result: RenderResult = {
                content,
                components: analysis.componentDependencies,
                dataDependencies: extractDataDependencies(schema),
                performance: renderOptions.enablePerformanceTracking ? {
                    renderTime,
                    componentCount: analysis.totalNodes,
                    dataBindingCount: analysis.dataBindings.length,
                    eventHandlerCount: analysis.eventHandlers.length
                } : undefined
            }

            // 缓存结果
            if (this.config.cache.enabled) {
                this.saveToCache(schema.id, result)
            }

            this.emit('render:complete', { schemaId: schema.id, renderTime })

            return result
        } catch (error) {
            this.emit('render:error', { schemaId: schema.id, error })
            this.config.errorHandler(error as Error, { schema, context })
            throw error
        }
    }

    /**
     * 渲染单个节点
     */
    private async renderNode(
        node: ComponentNode,
        context: RenderContext,
        options: RenderOptions
    ): Promise<any> {
        // 检查条件渲染
        if (node.condition) {
            const shouldRender = defaultEvaluator.evaluate(node.condition, context)
            if (!shouldRender) {
                return null
            }
        }

        // 处理循环渲染
        if (node.loop) {
            return this.renderLoop(node, context, options)
        }

        // 解析属性（数据绑定）
        const props = await this.resolveProps(node, context)

        // 渲染子节点
        const children = node.children
            ? await Promise.all(
                node.children.map((child: ComponentNode) => this.renderNode(child, context, options))
            )
            : []

        // 渲染插槽
        const slots: Record<string, any[]> = {}
        if (node.slots) {
            for (const [slotName, slotNodes] of Object.entries(node.slots)) {
                slots[slotName] = await Promise.all(
                    (slotNodes as ComponentNode[]).map(slotNode =>
                        this.renderNode(slotNode, context, options)
                    )
                )
            }
        }

        // 构建虚拟节点（简化表示）
        return {
            type: node.type,
            id: node.id,
            props,
            children: children.filter(c => c !== null),
            slots,
            meta: node.meta
        }
    }

    /**
     * 渲染循环
     */
    private async renderLoop(
        node: ComponentNode,
        context: RenderContext,
        options: RenderOptions
    ): Promise<any[]> {
        if (!node.loop) {
            return []
        }

        const { dataSource, itemKey, indexKey } = node.loop

        // 解析数据源
        let items: any[] = []
        if (typeof dataSource === 'string') {
            // 从上下文获取数据
            items = this.resolveDataSource(dataSource, context)
        } else if (Array.isArray(dataSource)) {
            items = dataSource
        }

        if (!Array.isArray(items)) {
            console.warn('Loop data source is not an array:', dataSource)
            return []
        }

        // 为每个项目渲染节点
        const results = await Promise.all(
            items.map(async (item, index) => {
                // 创建循环上下文
                const loopContext: RenderContext = {
                    ...context,
                    variables: {
                        ...context.variables,
                        [itemKey || 'item']: item,
                        [indexKey || 'index']: index
                    }
                }

                // 渲染节点（不包含循环配置）
                const nodeWithoutLoop = { ...node, loop: undefined }
                return this.renderNode(nodeWithoutLoop, loopContext, options)
            })
        )

        return results.filter(r => r !== null)
    }

    /**
     * 解析属性
     */
    private async resolveProps(node: ComponentNode, context: RenderContext): Promise<Record<string, any>> {
        const props: Record<string, any> = { ...node.props }

        // 解析数据绑定
        if (node.bindings) {
            for (const binding of node.bindings) {
                const value = defaultResolver.resolve(binding, context)
                props[binding.target] = value
            }
        }

        return props
    }

    /**
     * 解析数据源
     */
    private resolveDataSource(path: string, context: RenderContext): any {
        const parts = path.split('.')
        const rootKey = parts[0]
        const restPath = parts.slice(1)

        let root: any
        switch (rootKey) {
            case 'data':
                root = context.data
                break
            case 'state':
                root = context.state
                break
            case 'variables':
                root = context.variables
                break
            default:
                root = context.data
                restPath.unshift(rootKey)
        }

        let current = root
        for (const part of restPath) {
            if (current == null) {
                return undefined
            }
            current = current[part]
        }

        return current
    }

    /**
     * 从缓存获取
     */
    private getFromCache(schemaId: string): RenderResult | null {
        return this.renderCache.get(schemaId) ?? null
    }

    /**
     * 保存到缓存
     */
    private saveToCache(schemaId: string, result: RenderResult): void {
        // 检查缓存大小
        const maxSize = this.config.cache.maxSize ?? 100
        if (this.renderCache.size >= maxSize) {
            // 删除最旧的条目
            const firstKey = this.renderCache.keys().next().value
            if (firstKey) {
                this.renderCache.delete(firstKey)
            }
        }

        this.renderCache.set(schemaId, result)

        // 设置过期时间
        const ttl = this.config.cache.ttl ?? 0
        if (ttl > 0) {
            setTimeout(() => {
                this.renderCache.delete(schemaId)
            }, ttl)
        }
    }

    /**
     * 清空缓存
     */
    clearCache(): void {
        this.renderCache.clear()
        this.emit('cache:cleared')
    }

    /**
     * 获取缓存统计
     */
    getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.renderCache.size,
            maxSize: this.config.cache.maxSize ?? 100
        }
    }
}

/**
 * 创建渲染引擎
 */
export function createEngine(config?: EngineConfig): RenderEngine {
    return new RenderEngine(config)
}
