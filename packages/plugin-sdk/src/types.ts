/**
 * Plugin SDK - 类型定义
 */

import type { PluginMeta } from '@low-coder/schema-core'

/**
 * 插件状态
 */
export enum PluginState {
    Idle = 'idle',
    Installing = 'installing',
    Installed = 'installed',
    Enabling = 'enabling',
    Enabled = 'enabled',
    Disabling = 'disabling',
    Disabled = 'disabled',
    Uninstalling = 'uninstalling',
    Error = 'error'
}

/**
 * 插件权限枚举
 */
export enum PluginPermission {
    ReadComponent = 'component:read',
    WriteComponent = 'component:write',
    ReadDataSource = 'datasource:read',
    WriteDataSource = 'datasource:write',
    ReadStorage = 'storage:read',
    WriteStorage = 'storage:write',
    HttpRequest = 'http:request',
    ExecuteWorkflow = 'workflow:execute',
    AccessEditor = 'editor:access',
    ModifyEditor = 'editor:modify'
}

/**
 * 资源限制配置
 */
export interface ResourceLimits {
    // CPU 时间限制（毫秒）
    maxCpuTime?: number

    // 内存限制（字节）
    maxMemory?: number

    // 最大调用次数
    maxCalls?: number

    // API 调用频率限制（次/秒）
    rateLimit?: number

    // 存储空间限制（字节）
    maxStorage?: number

    // HTTP 请求超时（毫秒）
    httpTimeout?: number

    // 最大并发请求数
    maxConcurrentRequests?: number
}

/**
 * 插件实例
 */
export interface PluginInstance {
    // 插件ID
    id: string

    // 插件元数据
    meta: PluginMeta

    // 当前状态
    state: PluginState

    // 配置数据
    config?: Record<string, any>

    // 授权的权限列表
    permissions: PluginPermission[]

    // 资源限制
    limits: ResourceLimits

    // 沙箱环境
    sandbox?: PluginSandbox

    // 安装时间
    installedAt?: Date

    // 启用时间
    enabledAt?: Date

    // 错误信息
    error?: string
}

/**
 * 插件沙箱
 */
export interface PluginSandbox {
    // 沙箱ID
    id: string

    // 插件ID
    pluginId: string

    // 执行上下文
    context: PluginContext

    // 资源使用统计
    usage: ResourceUsage

    // 执行代码
    execute: (code: string, args?: any[]) => Promise<any>

    // 销毁沙箱
    destroy: () => void
}

/**
 * 资源使用统计
 */
export interface ResourceUsage {
    // CPU 使用时间（毫秒）
    cpuTime: number

    // 内存使用（字节）
    memory: number

    // API 调用次数
    apiCalls: number

    // 存储使用（字节）
    storage: number

    // HTTP 请求次数
    httpRequests: number

    // 最后更新时间
    lastUpdated: Date
}

/**
 * 插件上下文
 */
export interface PluginContext {
    // 插件ID
    pluginId: string

    // 平台API
    platform: PlatformAPI

    // 组件API
    component: ComponentAPI

    // 数据源API
    datasource: DataSourceAPI

    // 编辑器API
    editor: EditorAPI

    // 工作流API
    workflow: WorkflowAPI

    // 存储API
    storage: StorageAPI

    // 事件API
    events: EventAPI

    // HTTP API
    http: HttpAPI

    // 工具函数
    utils: UtilsAPI

    // 日志API
    logger: LoggerAPI
}

/**
 * 平台 API
 */
export interface PlatformAPI {
    getVersion: () => string
    getTenantId: () => string
    getUserId: () => string
    getConfig: (key: string) => any
}

/**
 * 组件 API
 */
export interface ComponentAPI {
    register: (meta: any, render: any) => void
    unregister: (componentId: string) => void
    get: (componentId: string) => any
    getAll: () => any[]
}

/**
 * 数据源 API
 */
export interface DataSourceAPI {
    create: (config: any) => Promise<string>
    update: (id: string, config: any) => Promise<void>
    delete: (id: string) => Promise<void>
    query: (id: string, query: any) => Promise<any>
}

/**
 * 编辑器 API
 */
export interface EditorAPI {
    getSelectedNode: () => any
    selectNode: (nodeId: string) => void
    updateNode: (nodeId: string, updates: any) => void
    addNode: (parentId: string, node: any) => void
    removeNode: (nodeId: string) => void
    registerPanel: (panelConfig: any) => void
    registerToolbar: (toolbarConfig: any) => void
}

/**
 * 工作流 API
 */
export interface WorkflowAPI {
    registerNode: (nodeConfig: any) => void
    execute: (workflowId: string, input?: any) => Promise<any>
    getStatus: (executionId: string) => Promise<any>
}

/**
 * 存储 API
 */
export interface StorageAPI {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    delete: (key: string) => Promise<void>
    keys: () => Promise<string[]>
    clear: () => Promise<void>
}

/**
 * 事件 API
 */
export interface EventAPI {
    on: (event: string, handler: (...args: any[]) => void) => void
    off: (event: string, handler: (...args: any[]) => void) => void
    emit: (event: string, ...args: any[]) => void
    once: (event: string, handler: (...args: any[]) => void) => void
}

/**
 * HTTP API
 */
export interface HttpAPI {
    get: (url: string, options?: any) => Promise<any>
    post: (url: string, data?: any, options?: any) => Promise<any>
    put: (url: string, data?: any, options?: any) => Promise<any>
    delete: (url: string, options?: any) => Promise<any>
    request: (config: any) => Promise<any>
}

/**
 * 工具函数 API
 */
export interface UtilsAPI {
    generateId: () => string
    formatDate: (date: Date, format?: string) => string
    debounce: <T extends (...args: any[]) => any>(fn: T, delay: number) => T
    throttle: <T extends (...args: any[]) => any>(fn: T, delay: number) => T
    deepClone: <T>(obj: T) => T
    deepMerge: <T>(target: T, ...sources: Partial<T>[]) => T
}

/**
 * 日志 API
 */
export interface LoggerAPI {
    debug: (message: string, ...args: any[]) => void
    info: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
    onInstall?: () => void | Promise<void>
    onUninstall?: () => void | Promise<void>
    onEnable?: () => void | Promise<void>
    onDisable?: () => void | Promise<void>
    onConfigUpdate?: (newConfig: any, oldConfig: any) => void | Promise<void>
}

/**
 * 插件安装选项
 */
export interface PluginInstallOptions {
    // 是否自动启用
    autoEnable?: boolean

    // 初始配置
    config?: Record<string, any>

    // 授权的权限
    permissions?: PluginPermission[]

    // 资源限制
    limits?: ResourceLimits
}

/**
 * 插件事件
 */
export interface PluginEvent {
    type: string
    pluginId: string
    timestamp: number
    data?: any
}
