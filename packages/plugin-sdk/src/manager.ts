/**
 * Plugin Manager - 插件管理器
 * 
 * 负责插件的安装、启用、禁用、卸载等生命周期管理
 */

import { EventEmitter } from 'eventemitter3'
import type { PluginMeta } from '@low-coder/schema-core'
import {
    PluginState,
    PluginPermission,
    type PluginInstance,
    type PluginInstallOptions,
    type PluginLifecycleHooks,
    type ResourceLimits
} from './types'
import { createPluginContext } from './context'
import { createSandbox } from './sandbox'

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter {
    private plugins: Map<string, PluginInstance> = new Map()
    private hooks: Map<string, PluginLifecycleHooks> = new Map()

    /**
     * 安装插件
     */
    async install(
        meta: PluginMeta,
        hooks?: PluginLifecycleHooks,
        options: PluginInstallOptions = {}
    ): Promise<void> {
        const pluginId = meta.id

        // 检查是否已安装
        if (this.plugins.has(pluginId)) {
            throw new Error(`Plugin "${pluginId}" is already installed`)
        }

        // 验证插件元数据
        this.validatePluginMeta(meta)

        // 创建插件实例
        const instance: PluginInstance = {
            id: pluginId,
            meta,
            state: PluginState.Installing,
            config: options.config,
            permissions: options.permissions ?? this.getDefaultPermissions(meta),
            limits: options.limits ?? this.getDefaultLimits(),
            installedAt: new Date()
        }

        // 保存实例
        this.plugins.set(pluginId, instance)

        // 保存生命周期钩子
        if (hooks) {
            this.hooks.set(pluginId, hooks)
        }

        try {
            // 触发安装事件
            this.emit('plugin:installing', { pluginId })

            // 执行 onInstall 钩子
            await this.executeHook(pluginId, 'onInstall')

            // 更新状态
            instance.state = PluginState.Installed
            this.emit('plugin:installed', { pluginId })

            // 自动启用
            if (options.autoEnable) {
                await this.enable(pluginId)
            }
        } catch (error) {
            instance.state = PluginState.Error
            instance.error = error instanceof Error ? error.message : String(error)
            this.emit('plugin:error', { pluginId, error: instance.error })
            throw error
        }
    }

    /**
     * 卸载插件
     */
    async uninstall(pluginId: string): Promise<void> {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        // 如果已启用，先禁用
        if (instance.state === PluginState.Enabled) {
            await this.disable(pluginId)
        }

        try {
            instance.state = PluginState.Uninstalling
            this.emit('plugin:uninstalling', { pluginId })

            // 执行 onUninstall 钩子
            await this.executeHook(pluginId, 'onUninstall')

            // 销毁沙箱
            if (instance.sandbox) {
                instance.sandbox.destroy()
            }

            // 删除实例
            this.plugins.delete(pluginId)
            this.hooks.delete(pluginId)

            this.emit('plugin:uninstalled', { pluginId })
        } catch (error) {
            instance.state = PluginState.Error
            instance.error = error instanceof Error ? error.message : String(error)
            this.emit('plugin:error', { pluginId, error: instance.error })
            throw error
        }
    }

    /**
     * 启用插件
     */
    async enable(pluginId: string): Promise<void> {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        if (instance.state === PluginState.Enabled) {
            return
        }

        if (instance.state !== PluginState.Installed && instance.state !== PluginState.Disabled) {
            throw new Error(`Cannot enable plugin in state: ${instance.state}`)
        }

        try {
            instance.state = PluginState.Enabling
            this.emit('plugin:enabling', { pluginId })

            // 创建沙箱环境
            const context = createPluginContext(pluginId)
            instance.sandbox = createSandbox(pluginId, context, instance.limits)

            // 执行 onEnable 钩子
            await this.executeHook(pluginId, 'onEnable')

            // 更新状态
            instance.state = PluginState.Enabled
            instance.enabledAt = new Date()

            this.emit('plugin:enabled', { pluginId })
        } catch (error) {
            instance.state = PluginState.Error
            instance.error = error instanceof Error ? error.message : String(error)
            this.emit('plugin:error', { pluginId, error: instance.error })
            throw error
        }
    }

    /**
     * 禁用插件
     */
    async disable(pluginId: string): Promise<void> {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        if (instance.state === PluginState.Disabled) {
            return
        }

        if (instance.state !== PluginState.Enabled) {
            throw new Error(`Cannot disable plugin in state: ${instance.state}`)
        }

        try {
            instance.state = PluginState.Disabling
            this.emit('plugin:disabling', { pluginId })

            // 执行 onDisable 钩子
            await this.executeHook(pluginId, 'onDisable')

            // 销毁沙箱
            if (instance.sandbox) {
                instance.sandbox.destroy()
                instance.sandbox = undefined
            }

            // 更新状态
            instance.state = PluginState.Disabled

            this.emit('plugin:disabled', { pluginId })
        } catch (error) {
            instance.state = PluginState.Error
            instance.error = error instanceof Error ? error.message : String(error)
            this.emit('plugin:error', { pluginId, error: instance.error })
            throw error
        }
    }

    /**
     * 更新插件配置
     */
    async updateConfig(pluginId: string, newConfig: Record<string, any>): Promise<void> {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        const oldConfig = instance.config
        instance.config = newConfig

        try {
            // 执行 onConfigUpdate 钩子
            await this.executeHook(pluginId, 'onConfigUpdate', newConfig, oldConfig)
            this.emit('plugin:configUpdated', { pluginId, newConfig, oldConfig })
        } catch (error) {
            // 回滚配置
            instance.config = oldConfig
            throw error
        }
    }

    /**
     * 获取插件实例
     */
    getPlugin(pluginId: string): PluginInstance | null {
        return this.plugins.get(pluginId) ?? null
    }

    /**
     * 获取所有插件
     */
    getAllPlugins(): PluginInstance[] {
        return Array.from(this.plugins.values())
    }

    /**
     * 获取已启用的插件
     */
    getEnabledPlugins(): PluginInstance[] {
        return this.getAllPlugins().filter(p => p.state === PluginState.Enabled)
    }

    /**
     * 检查插件是否已安装
     */
    hasPlugin(pluginId: string): boolean {
        return this.plugins.has(pluginId)
    }

    /**
     * 检查插件是否已启用
     */
    isEnabled(pluginId: string): boolean {
        const instance = this.getPlugin(pluginId)
        return instance?.state === PluginState.Enabled
    }

    /**
     * 检查权限
     */
    hasPermission(pluginId: string, permission: PluginPermission): boolean {
        const instance = this.getPlugin(pluginId)
        return instance?.permissions.includes(permission) ?? false
    }

    /**
     * 授予权限
     */
    grantPermission(pluginId: string, permission: PluginPermission): void {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        if (!instance.permissions.includes(permission)) {
            instance.permissions.push(permission)
            this.emit('plugin:permissionGranted', { pluginId, permission })
        }
    }

    /**
     * 撤销权限
     */
    revokePermission(pluginId: string, permission: PluginPermission): void {
        const instance = this.getPlugin(pluginId)
        if (!instance) {
            throw new Error(`Plugin "${pluginId}" not found`)
        }

        const index = instance.permissions.indexOf(permission)
        if (index > -1) {
            instance.permissions.splice(index, 1)
            this.emit('plugin:permissionRevoked', { pluginId, permission })
        }
    }

    /**
     * 获取统计信息
     */
    getStats(): {
        total: number
        byState: Record<PluginState, number>
        byType: Record<string, number>
    } {
        const stats = {
            total: this.plugins.size,
            byState: {} as Record<PluginState, number>,
            byType: {} as Record<string, number>
        }

        // 初始化状态计数
        for (const state of Object.values(PluginState)) {
            stats.byState[state] = 0
        }

        // 统计
        for (const instance of this.plugins.values()) {
            stats.byState[instance.state]++

            const type = instance.meta.type
            stats.byType[type] = (stats.byType[type] || 0) + 1
        }

        return stats
    }

    /**
     * 清理所有插件
     */
    async cleanup(): Promise<void> {
        const pluginIds = Array.from(this.plugins.keys())

        for (const pluginId of pluginIds) {
            try {
                await this.uninstall(pluginId)
            } catch (error) {
                console.error(`Failed to uninstall plugin "${pluginId}":`, error)
            }
        }
    }

    /**
     * 执行生命周期钩子
     */
    private async executeHook(
        pluginId: string,
        hookName: keyof PluginLifecycleHooks,
        ...args: any[]
    ): Promise<void> {
        const hooks = this.hooks.get(pluginId)
        if (!hooks) return

        const hook = hooks[hookName]
        if (!hook) return

        try {
            // @ts-ignore - 运行时参数正确
            await hook.apply(null, args)
        } catch (error) {
            console.error(`Plugin lifecycle hook "${hookName}" failed:`, error)
            throw error
        }
    }

    /**
     * 验证插件元数据
     */
    private validatePluginMeta(meta: PluginMeta): void {
        if (!meta.id) {
            throw new Error('Plugin meta must have an id')
        }

        if (!meta.name) {
            throw new Error('Plugin meta must have a name')
        }

        if (!meta.version) {
            throw new Error('Plugin meta must have a version')
        }

        if (!meta.type) {
            throw new Error('Plugin meta must have a type')
        }
    }

    /**
     * 获取默认权限
     */
    private getDefaultPermissions(meta: PluginMeta): PluginPermission[] {
        // 根据插件类型返回默认权限
        return meta.permissions?.map(p => p as PluginPermission) ?? []
    }

    /**
     * 获取默认资源限制
     */
    private getDefaultLimits(): ResourceLimits {
        return {
            maxCpuTime: 5000,
            maxMemory: 50 * 1024 * 1024,
            maxCalls: 1000,
            rateLimit: 100,
            maxStorage: 10 * 1024 * 1024,
            httpTimeout: 30000,
            maxConcurrentRequests: 10
        }
    }
}

/**
 * 创建插件管理器
 */
export function createManager(): PluginManager {
    return new PluginManager()
}

/**
 * 全局默认管理器
 */
export const defaultManager = createManager()
