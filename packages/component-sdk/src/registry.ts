/**
 * Component Registry - 组件注册中心
 * 
 * 负责组件的注册、查询、卸载等管理功能
 */

import { EventEmitter } from 'eventemitter3'
import type { ComponentMeta } from '@low-coder/schema-core'
import type {
    ComponentDefinition,
    ComponentRegisterOptions,
    ComponentRenderFn
} from './types'

/**
 * 组件注册表项
 */
interface RegistryEntry {
    definition: ComponentDefinition
    registeredAt: Date
    group?: string
    global: boolean
}

/**
 * 组件注册中心
 */
export class ComponentRegistry extends EventEmitter {
    private components: Map<string, RegistryEntry> = new Map()
    private groups: Map<string, Set<string>> = new Map()

    /**
     * 注册组件
     */
    register(
        meta: ComponentMeta,
        render: ComponentRenderFn,
        options: ComponentRegisterOptions = {}
    ): void {
        const componentId = meta.id

        // 检查是否已存在
        if (this.components.has(componentId) && !options.override) {
            throw new Error(`Component "${componentId}" is already registered`)
        }

        // 验证组件元数据
        this.validateComponentMeta(meta)

        // 创建组件定义
        const definition: ComponentDefinition = {
            meta,
            render
        }

        // 创建注册表项
        const entry: RegistryEntry = {
            definition,
            registeredAt: new Date(),
            group: options.group,
            global: options.global ?? false
        }

        // 保存到注册表
        this.components.set(componentId, entry)

        // 添加到分组
        if (options.group) {
            if (!this.groups.has(options.group)) {
                this.groups.set(options.group, new Set())
            }
            this.groups.get(options.group)!.add(componentId)
        }

        // 触发注册事件
        this.emit('component:registered', { componentId, meta })
    }

    /**
     * 批量注册组件
     */
    registerBatch(components: Array<{
        meta: ComponentMeta
        render: ComponentRenderFn
        options?: ComponentRegisterOptions
    }>): void {
        for (const { meta, render, options } of components) {
            this.register(meta, render, options)
        }
    }

    /**
     * 注销组件
     */
    unregister(componentId: string): boolean {
        const entry = this.components.get(componentId)
        if (!entry) {
            return false
        }

        // 从分组中移除
        if (entry.group) {
            this.groups.get(entry.group)?.delete(componentId)
        }

        // 从注册表中移除
        this.components.delete(componentId)

        // 触发注销事件
        this.emit('component:unregistered', { componentId })

        return true
    }

    /**
     * 获取组件定义
     */
    get(componentId: string): ComponentDefinition | null {
        return this.components.get(componentId)?.definition ?? null
    }

    /**
     * 获取组件元数据
     */
    getMeta(componentId: string): ComponentMeta | null {
        return this.components.get(componentId)?.definition.meta ?? null
    }

    /**
     * 检查组件是否已注册
     */
    has(componentId: string): boolean {
        return this.components.has(componentId)
    }

    /**
     * 获取所有已注册组件
     */
    getAll(): ComponentDefinition[] {
        return Array.from(this.components.values()).map(entry => entry.definition)
    }

    /**
     * 获取所有组件ID
     */
    getAllIds(): string[] {
        return Array.from(this.components.keys())
    }

    /**
     * 按分类获取组件
     */
    getByCategory(category: string): ComponentDefinition[] {
        return this.getAll().filter(
            def => def.meta.category === category
        )
    }

    /**
     * 按分组获取组件
     */
    getByGroup(group: string): ComponentDefinition[] {
        const componentIds = this.groups.get(group)
        if (!componentIds) {
            return []
        }

        return Array.from(componentIds)
            .map(id => this.get(id))
            .filter((def): def is ComponentDefinition => def !== null)
    }

    /**
     * 搜索组件
     */
    search(query: string): ComponentDefinition[] {
        const lowerQuery = query.toLowerCase()

        return this.getAll().filter(def => {
            const meta = def.meta
            return (
                meta.name.toLowerCase().includes(lowerQuery) ||
                meta.displayName.toLowerCase().includes(lowerQuery) ||
                meta.description?.toLowerCase().includes(lowerQuery) ||
                meta.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            )
        })
    }

    /**
     * 获取全局组件
     */
    getGlobalComponents(): ComponentDefinition[] {
        return Array.from(this.components.values())
            .filter(entry => entry.global)
            .map(entry => entry.definition)
    }

    /**
     * 清空注册表
     */
    clear(): void {
        this.components.clear()
        this.groups.clear()
        this.emit('registry:cleared')
    }

    /**
     * 获取注册表统计信息
     */
    getStats(): {
        total: number
        byCategory: Record<string, number>
        byGroup: Record<string, number>
        global: number
    } {
        const stats = {
            total: this.components.size,
            byCategory: {} as Record<string, number>,
            byGroup: {} as Record<string, number>,
            global: 0
        }

        for (const entry of this.components.values()) {
            const category = entry.definition.meta.category
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

            if (entry.group) {
                stats.byGroup[entry.group] = (stats.byGroup[entry.group] || 0) + 1
            }

            if (entry.global) {
                stats.global++
            }
        }

        return stats
    }

    /**
     * 验证组件元数据
     */
    private validateComponentMeta(meta: ComponentMeta): void {
        if (!meta.id) {
            throw new Error('Component meta must have an id')
        }

        if (!meta.name) {
            throw new Error('Component meta must have a name')
        }

        if (!meta.displayName) {
            throw new Error('Component meta must have a displayName')
        }

        if (!meta.version) {
            throw new Error('Component meta must have a version')
        }

        if (!meta.category) {
            throw new Error('Component meta must have a category')
        }

        if (!meta.propsSchema) {
            throw new Error('Component meta must have a propsSchema')
        }
    }

    /**
     * 导出注册表配置
     */
    export(): Array<{
        componentId: string
        meta: ComponentMeta
        group?: string
        global: boolean
    }> {
        return Array.from(this.components.entries()).map(([componentId, entry]) => ({
            componentId,
            meta: entry.definition.meta,
            group: entry.group,
            global: entry.global
        }))
    }
}

/**
 * 创建组件注册中心实例
 */
export function createRegistry(): ComponentRegistry {
    return new ComponentRegistry()
}

/**
 * 全局默认注册中心
 */
export const defaultRegistry = createRegistry()
