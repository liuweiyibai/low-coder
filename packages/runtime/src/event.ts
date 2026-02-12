/**
 * Event Handler Executor - 事件处理执行器
 * 
 * 执行组件事件处理逻辑
 */

import { EventEmitter } from 'eventemitter3'
import type { EventHandler, Action } from '@low-coder/schema-core'
import type { EventHandlerExecutor, RenderContext } from './types'
import { defaultExecutor } from './expression'
import { defaultEvaluator } from './condition'

/**
 * 创建事件处理执行器
 */
export function createEventHandlerExecutor(): EventHandlerExecutor {
    const emitter = new EventEmitter()
    const handlers = new Map<string, Map<string, EventHandler[]>>()

    /**
     * 执行事件处理
     */
    const execute = async (event: string, data: any, context: RenderContext): Promise<void> => {
        try {
            // 触发全局事件
            emitter.emit('event:triggered', { event, data, timestamp: Date.now() })

            // 查找并执行事件处理器
            for (const [nodeId, eventMap] of handlers.entries()) {
                const eventHandlers = eventMap.get(event)
                if (!eventHandlers) continue

                for (const handler of eventHandlers) {
                    await executeEventHandler(handler, data, context, nodeId)
                }
            }
        } catch (error) {
            console.error('Event execution error:', error)
            emitter.emit('event:error', { event, data, error })
            throw error
        }
    }

    /**
     * 注册事件处理器
     */
    const register = (nodeId: string, event: string, handler: Function): void => {
        if (!handlers.has(nodeId)) {
            handlers.set(nodeId, new Map())
        }

        const eventMap = handlers.get(nodeId)!
        if (!eventMap.has(event)) {
            eventMap.set(event, [])
        }

        // 这里简化处理，实际应该存储 EventHandler 结构
        // eventMap.get(event)!.push(handler)
    }

    /**
     * 注销事件处理器
     */
    const unregister = (nodeId: string, event?: string): void => {
        if (!event) {
            // 删除节点的所有事件处理器
            handlers.delete(nodeId)
        } else {
            // 删除特定事件的处理器
            const eventMap = handlers.get(nodeId)
            if (eventMap) {
                eventMap.delete(event)
            }
        }
    }

    return {
        execute,
        register,
        unregister
    }
}

/**
 * 执行单个事件处理器
 */
async function executeEventHandler(
    handler: EventHandler,
    eventData: any,
    context: RenderContext,
    nodeId: string
): Promise<void> {
    // 检查条件
    if (handler.condition) {
        const conditionMet = defaultEvaluator.evaluate(handler.condition, context)
        if (!conditionMet) {
            return
        }
    }

    // 防抖处理
    if (handler.debounce) {
        // TODO: 实现防抖逻辑
    }

    // 节流处理
    if (handler.throttle) {
        // TODO: 实现节流逻辑
    }

    // 执行动作序列
    for (const action of handler.actions) {
        try {
            await executeAction(action, eventData, context, nodeId)
        } catch (error) {
            console.error(`Action execution error:`, error)

            // 执行错误处理
            if (action.onError) {
                for (const errorAction of action.onError) {
                    await executeAction(errorAction, { error, eventData }, context, nodeId)
                }
            }

            // 如果没有错误处理，则抛出错误
            if (!action.onError) {
                throw error
            }
        }
    }
}

/**
 * 执行单个动作
 */
async function executeAction(
    action: Action,
    data: any,
    context: RenderContext,
    nodeId: string
): Promise<void> {
    // 检查条件
    if (action.condition) {
        const conditionMet = defaultEvaluator.evaluate(action.condition, context)
        if (!conditionMet) {
            return
        }
    }

    switch (action.type) {
        case 'setState':
            // 设置状态
            await executeSetState(action, data, context)
            break

        case 'callApi':
            // 调用 API
            await executeCallApi(action, data, context)
            break

        case 'navigate':
            // 导航
            await executeNavigate(action, data, context)
            break

        case 'showMessage':
            // 显示消息
            await executeShowMessage(action, data, context)
            break

        case 'openModal':
            // 打开模态框
            await executeOpenModal(action, data, context)
            break

        case 'closeModal':
            // 关闭模态框
            await executeCloseModal(action, data, context)
            break

        case 'executeCode':
            // 执行代码
            await executeCode(action, data, context)
            break

        case 'triggerEvent':
            // 触发事件
            await executeTriggerEvent(action, data, context)
            break

        case 'callFunction':
            // 调用函数
            await executeCallFunction(action, data, context)
            break

        default:
            console.warn(`Unknown action type: ${action.type}`)
    }

    // 执行成功回调
    if (action.onSuccess) {
        for (const successAction of action.onSuccess) {
            await executeAction(successAction, data, context, nodeId)
        }
    }
}

/**
 * 执行设置状态动作
 */
async function executeSetState(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.key) {
        throw new Error('setState action requires a key')
    }

    // 计算新值
    let value = config.value
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // 表达式
        const expression = value.slice(2, -2).trim()
        const executionContext = { eventData: data, ...context }
        value = defaultExecutor.execute(expression, executionContext)
    }

    console.log('Set state:', config.key, value)
    // 实际实现中应该更新组件状态
}

/**
 * 执行 API 调用动作
 */
async function executeCallApi(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.url) {
        throw new Error('callApi action requires a url')
    }

    // 构建请求配置
    const requestConfig: RequestInit = {
        method: config.method || 'GET',
        headers: config.headers || {},
        body: config.body ? JSON.stringify(config.body) : undefined
    }

    // 发送请求
    const response = await fetch(config.url, requestConfig)

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`)
    }

    const result = await response.json()

    // 保存结果到状态
    if (config.resultKey) {
        context.state[config.resultKey] = result
    }
}

/**
 * 执行导航动作
 */
async function executeNavigate(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.url) {
        throw new Error('navigate action requires a url')
    }

    console.log('Navigate to:', config.url)
    // 实际实现中应该使用路由库进行导航
}

/**
 * 执行显示消息动作
 */
async function executeShowMessage(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.message) {
        throw new Error('showMessage action requires a message')
    }

    console.log(`[${config.type || 'info'}]`, config.message)
    // 实际实现中应该显示 Toast/Notification
}

/**
 * 执行打开模态框动作
 */
async function executeOpenModal(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.modalId) {
        throw new Error('openModal action requires a modalId')
    }

    console.log('Open modal:', config.modalId)
    // 实际实现中应该管理模态框状态
}

/**
 * 执行关闭模态框动作
 */
async function executeCloseModal(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    console.log('Close modal:', config?.modalId || 'current')
    // 实际实现中应该管理模态框状态
}

/**
 * 执行代码动作
 */
async function executeCode(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.code) {
        throw new Error('executeCode action requires code')
    }

    const executionContext = { eventData: data, ...context }
    defaultExecutor.execute(config.code, executionContext)
}

/**
 * 执行触发事件动作
 */
async function executeTriggerEvent(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.event) {
        throw new Error('triggerEvent action requires an event')
    }

    console.log('Trigger event:', config.event, config.data)
    // 实际实现中应该触发自定义事件
}

/**
 * 执行调用函数动作
 */
async function executeCallFunction(action: Action, data: any, context: RenderContext): Promise<void> {
    const config = action.config
    if (!config || !config.function) {
        throw new Error('callFunction action requires a function')
    }

    console.log('Call function:', config.function, config.args)
    // 实际实现中应该调用注册的函数
}

/**
 * 默认事件处理执行器实例
 */
export const defaultEventExecutor = createEventHandlerExecutor()
