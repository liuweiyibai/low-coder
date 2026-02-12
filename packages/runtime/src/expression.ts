/**
 * Expression Executor - 表达式执行器
 * 
 * 安全地执行 JavaScript 表达式
 */

import type { ExpressionExecutor } from './types'

/**
 * 创建表达式执行器
 */
export function createExpressionExecutor(): ExpressionExecutor {
    /**
     * 执行表达式
     */
    const execute = (expression: string, context: Record<string, any>): any => {
        try {
            // 创建安全的执行环境
            const contextKeys = Object.keys(context)
            const contextValues = Object.values(context)

            // 使用 Function 构造器创建函数
            const fn = new Function(...contextKeys, `
        'use strict';
        return (${expression});
      `)

            // 执行函数
            return fn(...contextValues)
        } catch (error) {
            console.error('Expression execution error:', error)
            throw new Error(`Failed to execute expression: ${expression}`)
        }
    }

    /**
     * 验证表达式
     */
    const validate = (expression: string): boolean => {
        try {
            // 尝试编译表达式
            new Function(`return (${expression})`)
            return true
        } catch {
            return false
        }
    }

    /**
     * 提取变量
     */
    const extractVariables = (expression: string): string[] => {
        const variables = new Set<string>()

        // 简单的正则匹配（可以改进为 AST 分析）
        const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
        const matches = expression.matchAll(identifierRegex)

        for (const match of matches) {
            const identifier = match[1]

            // 排除 JavaScript 关键字和常见全局对象
            if (!isReservedWord(identifier) && !isGlobalObject(identifier)) {
                variables.add(identifier)
            }
        }

        return Array.from(variables)
    }

    return {
        execute,
        validate,
        extractVariables
    }
}

/**
 * 检查是否为保留字
 */
function isReservedWord(word: string): boolean {
    const reserved = new Set([
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
        'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
        'void', 'while', 'with', 'yield', 'true', 'false', 'null', 'undefined'
    ])

    return reserved.has(word)
}

/**
 * 检查是否为全局对象
 */
function isGlobalObject(word: string): boolean {
    const globals = new Set([
        'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math',
        'Number', 'Object', 'Promise', 'RegExp', 'String', 'Symbol',
        'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
        'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent'
    ])

    return globals.has(word)
}

/**
 * 默认表达式执行器实例
 */
export const defaultExecutor = createExpressionExecutor()
