/**
 * Component Loader - 组件加载器
 * 
 * 负责组件的动态加载、预加载、缓存等功能
 */

import { EventEmitter } from 'eventemitter3'
import type { ComponentDefinition, ComponentLoadOptions } from './types'
import type { ComponentRegistry } from './registry'

/**
 * 组件加载器配置
 */
export interface LoaderConfig {
    // 默认超时时间（毫秒）
    defaultTimeout?: number

    // 是否启用缓存
    enableCache?: boolean

    // 缓存过期时间（毫秒）
    cacheExpiration?: number

    // 最大并发加载数
    maxConcurrent?: number
}

/**
 * 加载状态
 */
enum LoadState {
    Idle = 'idle',
    Loading = 'loading',
    Loaded = 'loaded',
    Failed = 'failed'
}

/**
 * 缓存项
 */
interface CacheEntry {
    definition: ComponentDefinition
    loadedAt: Date
    expiresAt?: Date
}

/**
 * 加载任务
 */
interface LoadTask {
    componentId: string
    options: ComponentLoadOptions
    resolve: (definition: ComponentDefinition) => void
    reject: (error: Error) => void
}

/**
 * 组件加载器
 */
export class ComponentLoader extends EventEmitter {
    private config: Required<LoaderConfig>
    private registry: ComponentRegistry
    private cache: Map<string, CacheEntry> = new Map()
    private loadStates: Map<string, LoadState> = new Map()
    private loadQueue: LoadTask[] = []
    private activeLoads: number = 0

    constructor(registry: ComponentRegistry, config: LoaderConfig = {}) {
        super()

        this.registry = registry
        this.config = {
            defaultTimeout: config.defaultTimeout ?? 5000,
            enableCache: config.enableCache ?? true,
            cacheExpiration: config.cacheExpiration ?? 5 * 60 * 1000, // 5分钟
            maxConcurrent: config.maxConcurrent ?? 5
        }
    }

    /**
     * 加载组件
     */
    async load(
        componentId: string,
        options: ComponentLoadOptions = {}
    ): Promise<ComponentDefinition> {
        // 检查缓存
        if (this.config.enableCache) {
            const cached = this.getFromCache(componentId)
            if (cached) {
                this.emit('component:loaded', { componentId, fromCache: true })
                return cached
            }
        }

        // 检查加载状态
        const state = this.loadStates.get(componentId)

        if (state === LoadState.Loading) {
            // 等待正在进行的加载
            return this.waitForLoad(componentId)
        }

        // 开始加载
        return this.performLoad(componentId, options)
    }

    /**
     * 批量加载组件
     */
    async loadBatch(
        componentIds: string[],
        options: ComponentLoadOptions = {}
    ): Promise<ComponentDefinition[]> {
        const promises = componentIds.map(id => this.load(id, options))
        return Promise.all(promises)
    }

    /**
     * 预加载组件
     */
    async preload(componentId: string): Promise<void> {
        try {
            await this.load(componentId, { async: true })
        } catch (error) {
            // 预加载失败不影响主流程
            console.warn(`Failed to preload component: ${componentId}`, error)
        }
    }

    /**
     * 批量预加载
     */
    async preloadBatch(componentIds: string[]): Promise<void> {
        const promises = componentIds.map(id => this.preload(id))
        await Promise.allSettled(promises)
    }

    /**
     * 预加载依赖
     */
    async preloadDependencies(componentId: string): Promise<void> {
        const definition = await this.load(componentId)
        const dependencies = definition.meta.dependencies?.components ?? []

        if (dependencies.length > 0) {
            await this.preloadBatch(dependencies)
        }
    }

    /**
     * 获取加载状态
     */
    getLoadState(componentId: string): LoadState {
        return this.loadStates.get(componentId) ?? LoadState.Idle
    }

    /**
     * 清除缓存
     */
    clearCache(componentId?: string): void {
        if (componentId) {
            this.cache.delete(componentId)
            this.emit('cache:cleared', { componentId })
        } else {
            this.cache.clear()
            this.emit('cache:cleared', { all: true })
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats(): {
        size: number
        entries: Array<{ componentId: string; loadedAt: Date; expiresAt?: Date }>
    } {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([componentId, entry]) => ({
                componentId,
                loadedAt: entry.loadedAt,
                expiresAt: entry.expiresAt
            }))
        }
    }

    /**
     * 执行加载
     */
    private async performLoad(
        componentId: string,
        options: ComponentLoadOptions
    ): Promise<ComponentDefinition> {
        // 设置加载状态
        this.loadStates.set(componentId, LoadState.Loading)
        this.emit('component:loading', { componentId })

        try {
            // 检查是否超过最大并发数
            if (this.activeLoads >= this.config.maxConcurrent) {
                await this.queueLoad(componentId, options)
            }

            this.activeLoads++

            // 从注册表获取组件
            const definition = this.registry.get(componentId)

            if (!definition) {
                throw new Error(`Component "${componentId}" not found in registry`)
            }

            // 预加载依赖
            if (options.preloadDependencies) {
                await this.preloadDependencies(componentId)
            }

            // 设置超时
            const timeout = options.timeout ?? this.config.defaultTimeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Component load timeout')), timeout)
            })

            // 加载组件（这里简化处理，实际可能需要动态导入等）
            await Promise.race([
                Promise.resolve(definition),
                timeoutPromise
            ])

            // 保存到缓存
            if (this.config.enableCache) {
                this.saveToCache(componentId, definition)
            }

            // 更新状态
            this.loadStates.set(componentId, LoadState.Loaded)
            this.emit('component:loaded', { componentId, fromCache: false })

            return definition
        } catch (error) {
            // 更新状态
            this.loadStates.set(componentId, LoadState.Failed)
            this.emit('component:loadFailed', {
                componentId,
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        } finally {
            this.activeLoads--
            this.processQueue()
        }
    }

    /**
     * 加入队列
     */
    private queueLoad(
        componentId: string,
        options: ComponentLoadOptions
    ): Promise<ComponentDefinition> {
        return new Promise((resolve, reject) => {
            this.loadQueue.push({
                componentId,
                options,
                resolve,
                reject
            })
        })
    }

    /**
     * 处理队列
     */
    private processQueue(): void {
        if (this.loadQueue.length === 0) {
            return
        }

        if (this.activeLoads >= this.config.maxConcurrent) {
            return
        }

        const task = this.loadQueue.shift()
        if (task) {
            this.performLoad(task.componentId, task.options)
                .then(task.resolve)
                .catch(task.reject)
        }
    }

    /**
     * 等待加载完成
     */
    private waitForLoad(componentId: string): Promise<ComponentDefinition> {
        return new Promise((resolve, reject) => {
            const onLoaded = (event: any) => {
                if (event.componentId === componentId) {
                    cleanup()
                    const definition = this.registry.get(componentId)
                    if (definition) {
                        resolve(definition)
                    } else {
                        reject(new Error(`Component "${componentId}" not found`))
                    }
                }
            }

            const onFailed = (event: any) => {
                if (event.componentId === componentId) {
                    cleanup()
                    reject(new Error(event.error))
                }
            }

            const cleanup = () => {
                this.off('component:loaded', onLoaded)
                this.off('component:loadFailed', onFailed)
            }

            this.on('component:loaded', onLoaded)
            this.on('component:loadFailed', onFailed)
        })
    }

    /**
     * 从缓存获取
     */
    private getFromCache(componentId: string): ComponentDefinition | null {
        const entry = this.cache.get(componentId)

        if (!entry) {
            return null
        }

        // 检查是否过期
        if (entry.expiresAt && entry.expiresAt < new Date()) {
            this.cache.delete(componentId)
            return null
        }

        return entry.definition
    }

    /**
     * 保存到缓存
     */
    private saveToCache(componentId: string, definition: ComponentDefinition): void {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + this.config.cacheExpiration)

        this.cache.set(componentId, {
            definition,
            loadedAt: now,
            expiresAt
        })
    }
}

/**
 * 创建组件加载器
 */
export function createLoader(
    registry: ComponentRegistry,
    config?: LoaderConfig
): ComponentLoader {
    return new ComponentLoader(registry, config)
}
