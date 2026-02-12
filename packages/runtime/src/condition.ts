/**
 * Condition Evaluator - 条件评估器
 * 
 * 评估条件渲染表达式
 */

import type { ConditionExpression } from '@low-coder/schema-core'
import type { ConditionEvaluator, RenderContext } from './types'
import { defaultExecutor } from './expression'

/**
 * 创建条件评估器
 */
export function createConditionEvaluator(): ConditionEvaluator {
    /**
     * 评估条件表达式
     */
    const evaluate = (condition: ConditionExpression, context: RenderContext): boolean => {
        try {
            if (!condition) {
                return true
            }

            switch (condition.type) {
                case 'simple':
                    return evaluateSimpleCondition(condition, context)

                case 'complex':
                    return evaluateComplexCondition(condition, context, evaluate)

                case 'raw':
                    return evaluateRawExpression(condition.expression!, context)

                default:
                    console.warn(`Unknown condition type: ${(condition as any).type}`)
                    return true
            }
        } catch (error) {
            console.error('Condition evaluation error:', error)
            return false
        }
    }

    /**
     * 批量评估条件
     */
    const evaluateAll = (conditions: ConditionExpression[], context: RenderContext): boolean[] => {
        return conditions.map(condition => evaluate(condition, context))
    }

    return {
        evaluate,
        evaluateAll
    }
}

/**
 * 评估简单条件
 */
function evaluateSimpleCondition(condition: ConditionExpression, context: RenderContext): boolean {
    if (!condition.field || !condition.operator) {
        return true
    }

    // 解析字段值
    const fieldValue = resolveField(condition.field, context)
    const compareValue = condition.value

    // 根据操作符比较
    switch (condition.operator) {
        case 'equals':
            return fieldValue === compareValue

        case 'notEquals':
            return fieldValue !== compareValue

        case 'contains':
            return String(fieldValue).includes(String(compareValue))

        case 'notContains':
            return !String(fieldValue).includes(String(compareValue))

        case 'greaterThan':
            return Number(fieldValue) > Number(compareValue)

        case 'lessThan':
            return Number(fieldValue) < Number(compareValue)

        case 'greaterThanOrEqual':
            return Number(fieldValue) >= Number(compareValue)

        case 'lessThanOrEqual':
            return Number(fieldValue) <= Number(compareValue)

        case 'isEmpty':
            return !fieldValue || fieldValue === '' ||
                (Array.isArray(fieldValue) && fieldValue.length === 0) ||
                (typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0)

        case 'isNotEmpty':
            return !!fieldValue &&
                (Array.isArray(fieldValue) ? fieldValue.length > 0 : true) &&
                (typeof fieldValue === 'object' ? Object.keys(fieldValue).length > 0 : true)

        case 'in':
            return Array.isArray(compareValue) && compareValue.includes(fieldValue)

        case 'notIn':
            return Array.isArray(compareValue) && !compareValue.includes(fieldValue)

        case 'startsWith':
            return String(fieldValue).startsWith(String(compareValue))

        case 'endsWith':
            return String(fieldValue).endsWith(String(compareValue))

        case 'matches':
            try {
                const regex = new RegExp(String(compareValue))
                return regex.test(String(fieldValue))
            } catch {
                return false
            }

        default:
            console.warn(`Unknown operator: ${condition.operator}`)
            return true
    }
}

/**
 * 评估复杂条件（AND/OR 组合）
 */
function evaluateComplexCondition(
    condition: ConditionExpression,
    context: RenderContext,
    evaluate: (cond: ConditionExpression, ctx: RenderContext) => boolean
): boolean {
    const { logic, conditions } = condition

    if (!conditions || conditions.length === 0) {
        return true
    }

    if (logic === 'and') {
        // 所有条件都必须为真
        return conditions.every((cond: ConditionExpression) => evaluate(cond, context))
    } else if (logic === 'or') {
        // 至少一个条件为真
        return conditions.some((cond: ConditionExpression) => evaluate(cond, context))
    }

    return true
}

/**
 * 评估原始表达式
 */
function evaluateRawExpression(expression: string, context: RenderContext): boolean {
    const executionContext = {
        data: context.data,
        state: context.state,
        variables: context.variables,
        params: context.params,
        query: context.query,
        user: context.user,
        tenant: context.tenant
    }

    const result = defaultExecutor.execute(expression, executionContext)
    return Boolean(result)
}

/**
 * 解析字段值
 */
function resolveField(field: string, context: RenderContext): any {
    // 支持多种字段格式：
    // - data.user.name
    // - state.count
    // - variables.theme
    // - user.id
    // - params.id

    const parts = field.split('.')
    const rootKey = parts[0]
    const path = parts.slice(1).join('.')

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
        case 'params':
            root = context.params
            break
        case 'query':
            root = context.query
            break
        case 'user':
            root = context.user
            break
        case 'tenant':
            root = context.tenant
            break
        default:
            // 尝试从 data 中查找
            root = context.data
            return resolvePath(root, field)
    }

    if (!path) {
        return root
    }

    return resolvePath(root, path)
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
        current = current[part]
    }

    return current
}

/**
 * 默认条件评估器实例
 */
export const defaultEvaluator = createConditionEvaluator()
