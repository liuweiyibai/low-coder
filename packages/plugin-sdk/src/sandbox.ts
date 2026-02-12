/**
 * Plugin Sandbox - 插件沙箱
 * 
 * 提供隔离的执行环境，限制资源访问
 */

import { nanoid } from 'nanoid'
import type {
    PluginSandbox,
    PluginContext,
    ResourceUsage,
    ResourceLimits
} from './types'

/**
 * 创建插件沙箱
 */
export function createSandbox(
    pluginId: string,
    context: PluginContext,
    limits: ResourceLimits = {}
): PluginSandbox {
    const sandboxId = nanoid()

    // 资源使用统计
    const usage: ResourceUsage = {
        cpuTime: 0,
        memory: 0,
        apiCalls: 0,
        storage: 0,
        httpRequests: 0,
        lastUpdated: new Date()
    }

    // 资源限制检查
    const checkLimits = (type: keyof Omit<ResourceUsage, 'lastUpdated'>, increment: number = 1) => {
        const limitKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof ResourceLimits
        const limit = limits[limitKey]

        if (limit && (usage[type] as number) + increment > limit) {
            throw new Error(`Resource limit exceeded: ${type}`)
        }
    }

    // API 调用拦截器
    const createAPIProxy = <T extends object>(api: T, name: string): T => {
        return new Proxy(api, {
            get(target, prop: string) {
                const original = target[prop as keyof T]

                if (typeof original === 'function') {
                    return (...args: any[]) => {
                        // 检查调用次数限制
                        checkLimits('apiCalls')
                        usage.apiCalls++
                        usage.lastUpdated = new Date()

                        // 执行原始方法
                        return original.apply(target, args)
                    }
                }

                return original
            }
        })
    }

    // 包装上下文对象
    const wrappedContext: PluginContext = {
        pluginId: context.pluginId,
        platform: createAPIProxy(context.platform, 'platform'),
        component: createAPIProxy(context.component, 'component'),
        datasource: createAPIProxy(context.datasource, 'datasource'),
        editor: createAPIProxy(context.editor, 'editor'),
        workflow: createAPIProxy(context.workflow, 'workflow'),
        storage: createAPIProxy(context.storage, 'storage'),
        events: createAPIProxy(context.events, 'events'),
        http: createAPIProxy(context.http, 'http'),
        utils: createAPIProxy(context.utils, 'utils'),
        logger: createAPIProxy(context.logger, 'logger')
    }

    // 执行代码
    const execute = async (code: string, args: any[] = []): Promise<any> => {
        const startTime = Date.now()

        try {
            // 创建函数
            const fn = new Function('context', 'args', `
        'use strict';
        return (async () => {
          ${code}
        })();
      `)

            // 执行函数
            const result = await fn(wrappedContext, args)

            // 更新 CPU 时间
            const cpuTime = Date.now() - startTime
            usage.cpuTime += cpuTime
            usage.lastUpdated = new Date()

            // 检查 CPU 时间限制
            if (limits.maxCpuTime && usage.cpuTime > limits.maxCpuTime) {
                throw new Error('CPU time limit exceeded')
            }

            return result
        } catch (error) {
            throw error
        }
    }

    // 销毁沙箱
    const destroy = () => {
        // 清理资源
        // 这里可以添加更多清理逻辑
    }

    return {
        id: sandboxId,
        pluginId,
        context: wrappedContext,
        usage,
        execute,
        destroy
    }
}

/**
 * 资源限制器
 */
export class ResourceLimiter {
    private limits: Required<ResourceLimits>
    private usage: ResourceUsage
    private rateLimitTokens: number
    private lastRefill: number

    constructor(limits: ResourceLimits = {}) {
        this.limits = {
            maxCpuTime: limits.maxCpuTime ?? 5000,
            maxMemory: limits.maxMemory ?? 50 * 1024 * 1024, // 50MB
            maxCalls: limits.maxCalls ?? 1000,
            rateLimit: limits.rateLimit ?? 100, // 100次/秒
            maxStorage: limits.maxStorage ?? 10 * 1024 * 1024, // 10MB
            httpTimeout: limits.httpTimeout ?? 30000, // 30秒
            maxConcurrentRequests: limits.maxConcurrentRequests ?? 10
        }

        this.usage = {
            cpuTime: 0,
            memory: 0,
            apiCalls: 0,
            storage: 0,
            httpRequests: 0,
            lastUpdated: new Date()
        }

        this.rateLimitTokens = this.limits.rateLimit
        this.lastRefill = Date.now()
    }

    /**
     * 检查是否可以执行操作
     */
    checkLimit(type: keyof Omit<ResourceUsage, 'lastUpdated'>, amount: number = 1): boolean {
        // 更新令牌桶
        this.refillTokens()

        // 检查速率限制
        if (this.rateLimitTokens < 1) {
            return false
        }

        // 检查具体限制
        const limitKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof this.limits
        const limit = this.limits[limitKey]

        if ((this.usage[type] as number) + amount > limit) {
            return false
        }

        return true
    }

    /**
     * 消费资源
     */
    consume(type: keyof Omit<ResourceUsage, 'lastUpdated'>, amount: number = 1): void {
        if (!this.checkLimit(type, amount)) {
            throw new Error(`Resource limit exceeded: ${type}`)
        }

        (this.usage[type] as number) += amount
        this.rateLimitTokens--
        this.usage.lastUpdated = new Date()
    }

    /**
     * 获取使用情况
     */
    getUsage(): ResourceUsage {
        return { ...this.usage }
    }

    /**
     * 重置使用统计
     */
    reset(): void {
        this.usage = {
            cpuTime: 0,
            memory: 0,
            apiCalls: 0,
            storage: 0,
            httpRequests: 0,
            lastUpdated: new Date()
        }
        this.rateLimitTokens = this.limits.rateLimit
        this.lastRefill = Date.now()
    }

    /**
     * 补充令牌
     */
    private refillTokens(): void {
        const now = Date.now()
        const elapsed = now - this.lastRefill

        // 每秒补充 rateLimit 个令牌
        const tokensToAdd = Math.floor(elapsed / 1000) * this.limits.rateLimit

        if (tokensToAdd > 0) {
            this.rateLimitTokens = Math.min(
                this.limits.rateLimit,
                this.rateLimitTokens + tokensToAdd
            )
            this.lastRefill = now
        }
    }
}
