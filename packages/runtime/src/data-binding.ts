/**
 * Data Binding Resolver - 数据绑定解析器
 * 
 * 解析和计算数据绑定表达式
 */

import type { DataBinding } from '@low-coder/schema-core'
import type { DataBindingResolver, RenderContext } from './types'
import { defaultExecutor } from './expression'

/**
 * 创建数据绑定解析器
 */
export function createDataBindingResolver(): DataBindingResolver {
    /**
     * 解析单个数据绑定
     */
    const resolve = (binding: DataBinding, context: RenderContext): any => {
        try {
            switch (binding.type) {
                case 'static':
                    // 静态值
                    return binding.source

                case 'expression':
                    // 表达式
                    return resolveExpression(binding.source, context)

                case 'datasource':
                    // 数据源（从 data 中获取）
                    return resolvePath(context.data, binding.source)

                case 'state':
                    // 状态
                    return resolvePath(context.state, binding.source)

                case 'variable':
                    // 变量
                    return resolvePath(context.variables, binding.source)

                case 'context':
                    // 上下文（可以是 user, tenant, params, query 等）
                    return resolveContextPath(binding.source, context)

                case 'computed':
                    // 计算属性
                    return resolveComputed(binding.source, context)

                default:
                    console.warn(`Unknown binding type: ${binding.type}`)
                    return binding.defaultValue
            }
        } catch (error) {
            console.error('Data binding resolution error:', error)

            // 返回默认值
            if (binding.defaultValue !== undefined) {
                return binding.defaultValue
            }

            // 根据模式决定是否抛出错误
            if (binding.mode === 'strict') {
                throw error
            }

            return undefined
        }
    }

    /**
     * 批量解析数据绑定
     */
    const resolveAll = (bindings: DataBinding[], context: RenderContext): any[] => {
        return bindings.map(binding => resolve(binding, context))
    }

    return {
        resolve,
        resolveAll
    }
}

/**
 * 解析表达式
 */
function resolveExpression(expression: string, context: RenderContext): any {
    // 构建执行上下文
    const executionContext = {
        data: context.data,
        state: context.state,
        variables: context.variables,
        params: context.params,
        query: context.query,
        user: context.user,
        tenant: context.tenant
    }

    return defaultExecutor.execute(expression, executionContext)
}

/**
 * 解析路径
 */
function resolvePath(obj: any, path: string): any {
    if (!path) return obj

    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
        if (current == null) {
            return undefined
        }

        // 处理数组索引
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
            const [, key, index] = arrayMatch
            current = current[key]?.[parseInt(index)]
        } else {
            current = current[part]
        }
    }

    return current
}

/**
 * 解析上下文路径
 */
function resolveContextPath(path: string, context: RenderContext): any {
    const parts = path.split('.')
    const contextKey = parts[0]
    const restPath = parts.slice(1).join('.')

    let contextValue: any

    switch (contextKey) {
        case 'user':
            contextValue = context.user
            break
        case 'tenant':
            contextValue = context.tenant
            break
        case 'params':
            contextValue = context.params
            break
        case 'query':
            contextValue = context.query
            break
        default:
            return undefined
    }

    if (!restPath) {
        return contextValue
    }

    return resolvePath(contextValue, restPath)
}

/**
 * 解析计算属性
 */
function resolveComputed(expression: string, context: RenderContext): any {
    // 计算属性本质上也是表达式
    return resolveExpression(expression, context)
}

/**
 * 应用转换函数
 */
function applyTransform(value: any, transform: string, context: RenderContext): any {
    try {
        const executionContext = {
            value,
            ...context
        }

        return defaultExecutor.execute(transform, executionContext)
    } catch (error) {
        console.error('Transform error:', error)
        return value
    }
}

/**
 * 默认数据绑定解析器实例
 */
export const defaultResolver = createDataBindingResolver()
