/**
 * Plugin Context - 插件上下文
 * 
 * 为插件提供平台 API 访问能力
 */

import { nanoid } from 'nanoid'
import type {
    PluginContext,
    PlatformAPI,
    ComponentAPI,
    DataSourceAPI,
    EditorAPI,
    WorkflowAPI,
    StorageAPI,
    EventAPI,
    HttpAPI,
    UtilsAPI,
    LoggerAPI
} from './types'

/**
 * 创建插件上下文
 */
export function createPluginContext(pluginId: string): PluginContext {
    // 平台 API
    const platform: PlatformAPI = {
        getVersion: () => '1.0.0',
        getTenantId: () => 'default',
        getUserId: () => 'user_001',
        getConfig: (key: string) => null
    }

    // 组件 API
    const component: ComponentAPI = {
        register: (meta: any, render: any) => {
            console.log(`[Plugin ${pluginId}] Register component:`, meta.id)
        },
        unregister: (componentId: string) => {
            console.log(`[Plugin ${pluginId}] Unregister component:`, componentId)
        },
        get: (componentId: string) => null,
        getAll: () => []
    }

    // 数据源 API
    const datasource: DataSourceAPI = {
        create: async (config: any) => {
            console.log(`[Plugin ${pluginId}] Create datasource:`, config)
            return nanoid()
        },
        update: async (id: string, config: any) => {
            console.log(`[Plugin ${pluginId}] Update datasource:`, id)
        },
        delete: async (id: string) => {
            console.log(`[Plugin ${pluginId}] Delete datasource:`, id)
        },
        query: async (id: string, query: any) => {
            console.log(`[Plugin ${pluginId}] Query datasource:`, id)
            return []
        }
    }

    // 编辑器 API
    const editor: EditorAPI = {
        getSelectedNode: () => null,
        selectNode: (nodeId: string) => {
            console.log(`[Plugin ${pluginId}] Select node:`, nodeId)
        },
        updateNode: (nodeId: string, updates: any) => {
            console.log(`[Plugin ${pluginId}] Update node:`, nodeId)
        },
        addNode: (parentId: string, node: any) => {
            console.log(`[Plugin ${pluginId}] Add node:`, node.id)
        },
        removeNode: (nodeId: string) => {
            console.log(`[Plugin ${pluginId}] Remove node:`, nodeId)
        },
        registerPanel: (panelConfig: any) => {
            console.log(`[Plugin ${pluginId}] Register panel:`, panelConfig.id)
        },
        registerToolbar: (toolbarConfig: any) => {
            console.log(`[Plugin ${pluginId}] Register toolbar:`, toolbarConfig.id)
        }
    }

    // 工作流 API
    const workflow: WorkflowAPI = {
        registerNode: (nodeConfig: any) => {
            console.log(`[Plugin ${pluginId}] Register workflow node:`, nodeConfig.type)
        },
        execute: async (workflowId: string, input?: any) => {
            console.log(`[Plugin ${pluginId}] Execute workflow:`, workflowId)
            return {}
        },
        getStatus: async (executionId: string) => {
            console.log(`[Plugin ${pluginId}] Get workflow status:`, executionId)
            return { status: 'completed' }
        }
    }

    // 存储 API（简化实现，实际应使用持久化存储）
    const storageMap = new Map<string, any>()
    const storage: StorageAPI = {
        get: async (key: string) => {
            return storageMap.get(`${pluginId}:${key}`)
        },
        set: async (key: string, value: any) => {
            storageMap.set(`${pluginId}:${key}`, value)
        },
        delete: async (key: string) => {
            storageMap.delete(`${pluginId}:${key}`)
        },
        keys: async () => {
            const prefix = `${pluginId}:`
            return Array.from(storageMap.keys())
                .filter(k => k.startsWith(prefix))
                .map(k => k.slice(prefix.length))
        },
        clear: async () => {
            const prefix = `${pluginId}:`
            for (const key of storageMap.keys()) {
                if (key.startsWith(prefix)) {
                    storageMap.delete(key)
                }
            }
        }
    }

    // 事件 API（简化实现）
    const eventHandlers = new Map<string, Set<Function>>()
    const events: EventAPI = {
        on: (event: string, handler: (...args: any[]) => void) => {
            if (!eventHandlers.has(event)) {
                eventHandlers.set(event, new Set())
            }
            eventHandlers.get(event)!.add(handler)
        },
        off: (event: string, handler: (...args: any[]) => void) => {
            eventHandlers.get(event)?.delete(handler)
        },
        emit: (event: string, ...args: any[]) => {
            eventHandlers.get(event)?.forEach(handler => {
                try {
                    handler(...args)
                } catch (error) {
                    console.error(`Event handler error:`, error)
                }
            })
        },
        once: (event: string, handler: (...args: any[]) => void) => {
            const wrapper = (...args: any[]) => {
                handler(...args)
                events.off(event, wrapper)
            }
            events.on(event, wrapper)
        }
    }

    // HTTP API（简化实现）
    const http: HttpAPI = {
        get: async (url: string, options?: any) => {
            console.log(`[Plugin ${pluginId}] HTTP GET:`, url)
            return {}
        },
        post: async (url: string, data?: any, options?: any) => {
            console.log(`[Plugin ${pluginId}] HTTP POST:`, url)
            return {}
        },
        put: async (url: string, data?: any, options?: any) => {
            console.log(`[Plugin ${pluginId}] HTTP PUT:`, url)
            return {}
        },
        delete: async (url: string, options?: any) => {
            console.log(`[Plugin ${pluginId}] HTTP DELETE:`, url)
            return {}
        },
        request: async (config: any) => {
            console.log(`[Plugin ${pluginId}] HTTP Request:`, config.method, config.url)
            return {}
        }
    }

    // 工具函数 API
    const utils: UtilsAPI = {
        generateId: () => nanoid(),
        formatDate: (date: Date, format?: string) => date.toISOString(),
        debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
            let timeoutId: NodeJS.Timeout
            return ((...args: any[]) => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(() => fn(...args), delay)
            }) as T
        },
        throttle: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
            let lastCall = 0
            return ((...args: any[]) => {
                const now = Date.now()
                if (now - lastCall >= delay) {
                    lastCall = now
                    return fn(...args)
                }
            }) as T
        },
        deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
        deepMerge: <T>(target: T, ...sources: Partial<T>[]): T => {
            return Object.assign({}, target, ...sources)
        }
    }

    // 日志 API
    const logger: LoggerAPI = {
        debug: (message: string, ...args: any[]) => {
            console.debug(`[Plugin ${pluginId}] ${message}`, ...args)
        },
        info: (message: string, ...args: any[]) => {
            console.info(`[Plugin ${pluginId}] ${message}`, ...args)
        },
        warn: (message: string, ...args: any[]) => {
            console.warn(`[Plugin ${pluginId}] ${message}`, ...args)
        },
        error: (message: string, ...args: any[]) => {
            console.error(`[Plugin ${pluginId}] ${message}`, ...args)
        }
    }

    return {
        pluginId,
        platform,
        component,
        datasource,
        editor,
        workflow,
        storage,
        events,
        http,
        utils,
        logger
    }
}
