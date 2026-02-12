/**
 * Schema Analyzer - Schema 分析器
 * 
 * 分析 PageSchema，提取依赖和统计信息
 */

import type { PageSchema, ComponentNode, DataBinding } from '@low-coder/schema-core'
import { traverseComponentTree } from '@low-coder/schema-core'
import type { SchemaAnalysis } from './types'

/**
 * 分析 PageSchema
 */
export function analyzeSchema(schema: PageSchema): SchemaAnalysis {
    const componentDependencies = new Set<string>()
    const dataBindings: DataBinding[] = []
    const eventHandlers: Array<{ nodeId: string; event: string; actions: any[] }> = []
    const conditionalNodes: string[] = []
    const loopNodes: string[] = []
    let maxDepth = 0
    let totalNodes = 0

    // 遍历组件树
    const traverse = (node: ComponentNode, depth: number = 0) => {
        totalNodes++
        maxDepth = Math.max(maxDepth, depth)

        // 收集组件依赖
        componentDependencies.add(node.type)

        // 收集数据绑定
        if (node.bindings) {
            dataBindings.push(...node.bindings)
        }

        // 收集事件处理器
        if (node.events) {
            for (const handler of node.events) {
                eventHandlers.push({
                    nodeId: node.id,
                    event: handler.event,
                    actions: handler.actions
                })
            }
        }

        // 收集条件渲染节点
        if (node.condition) {
            conditionalNodes.push(node.id)
        }

        // 收集循环渲染节点
        if (node.loop) {
            loopNodes.push(node.id)
        }

        // 递归遍历子节点
        if (node.children) {
            for (const child of node.children) {
                traverse(child, depth + 1)
            }
        }

        // 递归遍历插槽
        if (node.slots) {
            for (const slotNodes of Object.values(node.slots)) {
                for (const slotNode of slotNodes as ComponentNode[]) {
                    traverse(slotNode, depth + 1)
                }
            }
        }
    }

    // 从根节点开始遍历
    traverse(schema.root)

    return {
        componentDependencies: Array.from(componentDependencies),
        dataBindings,
        eventHandlers,
        conditionalNodes,
        loopNodes,
        maxDepth,
        totalNodes
    }
}

/**
 * 提取数据依赖
 */
export function extractDataDependencies(schema: PageSchema): string[] {
    const dependencies = new Set<string>()

    const analysis = analyzeSchema(schema)

    // 从数据绑定中提取依赖
    for (const binding of analysis.dataBindings) {
        if (binding.type === 'datasource') {
            dependencies.add(binding.source)
        } else if (binding.type === 'state') {
            dependencies.add(`state:${binding.source}`)
        } else if (binding.type === 'variable') {
            dependencies.add(`variable:${binding.source}`)
        }
    }

    return Array.from(dependencies)
}

/**
 * 验证 Schema
 */
export function validateSchema(schema: PageSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!schema.root) {
        errors.push('Schema must have a root node')
    }

    if (!schema.version) {
        errors.push('Schema must have a version')
    }

    if (!schema.id) {
        errors.push('Schema must have an id')
    }

    // 检查循环引用
    const nodeIds = new Set<string>()
    const checkDuplicateIds = (node: ComponentNode) => {
        if (nodeIds.has(node.id)) {
            errors.push(`Duplicate node id: ${node.id}`)
        }
        nodeIds.add(node.id)

        if (node.children) {
            for (const child of node.children) {
                checkDuplicateIds(child)
            }
        }

        if (node.slots) {
            for (const slotNodes of Object.values(node.slots)) {
                for (const slotNode of slotNodes as ComponentNode[]) {
                    checkDuplicateIds(slotNode)
                }
            }
        }
    }

    if (schema.root) {
        checkDuplicateIds(schema.root)
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * 计算 Schema 哈希
 */
export function computeSchemaHash(schema: PageSchema): string {
    // 简化实现，实际应使用更好的哈希算法
    const str = JSON.stringify(schema)
    let hash = 0

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36)
}
