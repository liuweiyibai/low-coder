/**
 * Schema 工具函数
 * 
 * 提供Schema操作的工具函数
 */

import { nanoid } from 'nanoid'
import deepEqual from 'fast-deep-equal'
import type { ComponentNode, PageSchema } from './types'

/**
 * 生成唯一ID
 */
export function generateId(prefix?: string): string {
    const id = nanoid(12)
    return prefix ? `${prefix}_${id}` : id
}

/**
 * 遍历组件树
 */
export function traverseComponentTree(
    node: ComponentNode,
    callback: (node: ComponentNode, parent?: ComponentNode) => void,
    parent?: ComponentNode
): void {
    callback(node, parent)

    // 遍历子节点
    if (node.children) {
        for (const child of node.children) {
            traverseComponentTree(child, callback, node)
        }
    }

    // 遍历插槽
    if (node.slots) {
        for (const slotNodes of Object.values(node.slots) as ComponentNode[][]) {
            for (const slotNode of slotNodes) {
                traverseComponentTree(slotNode, callback, node)
            }
        }
    }
}

/**
 * 查找组件节点
 */
export function findComponentNode(
    root: ComponentNode,
    predicate: (node: ComponentNode) => boolean
): ComponentNode | null {
    if (predicate(root)) {
        return root
    }

    if (root.children) {
        for (const child of root.children) {
            const found = findComponentNode(child, predicate)
            if (found) return found
        }
    }

    if (root.slots) {
        for (const slotNodes of Object.values(root.slots) as ComponentNode[][]) {
            for (const slotNode of slotNodes) {
                const found = findComponentNode(slotNode, predicate)
                if (found) return found
            }
        }
    }

    return null
}

/**
 * 根据ID查找组件节点
 */
export function findComponentNodeById(
    root: ComponentNode,
    id: string
): ComponentNode | null {
    return findComponentNode(root, node => node.id === id)
}

/**
 * 收集所有组件节点
 */
export function collectComponentNodes(root: ComponentNode): ComponentNode[] {
    const nodes: ComponentNode[] = []
    traverseComponentTree(root, node => {
        nodes.push(node)
    })
    return nodes
}

/**
 * 克隆组件节点（深拷贝）
 */
export function cloneComponentNode(node: ComponentNode): ComponentNode {
    return JSON.parse(JSON.stringify(node))
}

/**
 * 更新组件节点
 */
export function updateComponentNode(
    root: ComponentNode,
    id: string,
    updater: (node: ComponentNode) => Partial<ComponentNode>
): ComponentNode | null {
    const clonedRoot = cloneComponentNode(root)
    const node = findComponentNodeById(clonedRoot, id)

    if (!node) return null

    const updates = updater(node)
    Object.assign(node, updates)

    return clonedRoot
}

/**
 * 删除组件节点
 */
export function removeComponentNode(
    root: ComponentNode,
    id: string
): ComponentNode | null {
    const clonedRoot = cloneComponentNode(root)

    const removeFromArray = (nodes: ComponentNode[]): boolean => {
        const index = nodes.findIndex(n => n.id === id)
        if (index !== -1) {
            nodes.splice(index, 1)
            return true
        }
        return false
    }

    const removeRecursive = (node: ComponentNode): boolean => {
        // 从子节点中删除
        if (node.children) {
            if (removeFromArray(node.children)) return true
            for (const child of node.children) {
                if (removeRecursive(child)) return true
            }
        }

        // 从插槽中删除
        if (node.slots) {
            for (const slotNodes of Object.values(node.slots) as ComponentNode[][]) {
                if (removeFromArray(slotNodes)) return true
                for (const slotNode of slotNodes) {
                    if (removeRecursive(slotNode)) return true
                }
            }
        }

        return false
    }

    if (clonedRoot.id === id) {
        return null // 不能删除根节点
    }

    removeRecursive(clonedRoot)
    return clonedRoot
}

/**
 * 插入组件节点
 */
export function insertComponentNode(
    root: ComponentNode,
    parentId: string,
    node: ComponentNode,
    index?: number
): ComponentNode | null {
    const clonedRoot = cloneComponentNode(root)
    const parent = findComponentNodeById(clonedRoot, parentId)

    if (!parent) return null

    if (!parent.children) {
        parent.children = []
    }

    if (index !== undefined && index >= 0) {
        parent.children.splice(index, 0, node)
    } else {
        parent.children.push(node)
    }

    return clonedRoot
}

/**
 * 移动组件节点
 */
export function moveComponentNode(
    root: ComponentNode,
    nodeId: string,
    targetParentId: string,
    index?: number
): ComponentNode | null {
    const node = findComponentNodeById(root, nodeId)
    if (!node) return null

    // 1. 删除节点
    let newRoot = removeComponentNode(root, nodeId)
    if (!newRoot) return null

    // 2. 插入到新位置
    newRoot = insertComponentNode(newRoot, targetParentId, node, index)
    return newRoot
}

/**
 * 比较两个Schema是否相等
 */
export function isSchemaN(schema1: any, schema2: any): boolean {
    return deepEqual(schema1, schema2)
}

/**
 * 计算Schema差异
 */
export interface SchemaDiff {
    type: 'added' | 'removed' | 'modified' | 'moved'
    path: string[]
    oldValue?: any
    newValue?: any
}

export function computeSchemaDiff(
    oldSchema: PageSchema,
    newSchema: PageSchema
): SchemaDiff[] {
    const diffs: SchemaDiff[] = []

    // 简单实现：比较组件树
    const oldNodes = collectComponentNodes(oldSchema.root)
    const newNodes = collectComponentNodes(newSchema.root)

    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]))
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]))

    // 查找新增和修改的节点
    for (const [id, newNode] of newNodeMap) {
        const oldNode = oldNodeMap.get(id)
        if (!oldNode) {
            diffs.push({
                type: 'added',
                path: ['root', id],
                newValue: newNode
            })
        } else if (!deepEqual(oldNode, newNode)) {
            diffs.push({
                type: 'modified',
                path: ['root', id],
                oldValue: oldNode,
                newValue: newNode
            })
        }
    }

    // 查找删除的节点
    for (const [id, oldNode] of oldNodeMap) {
        if (!newNodeMap.has(id)) {
            diffs.push({
                type: 'removed',
                path: ['root', id],
                oldValue: oldNode
            })
        }
    }

    return diffs
}

/**
 * 应用Schema差异
 */
export function applySchemaDiff(
    schema: PageSchema,
    diffs: SchemaDiff[]
): PageSchema {
    let result = cloneComponentNode(schema.root)

    for (const diff of diffs) {
        const nodeId = diff.path[diff.path.length - 1]

        switch (diff.type) {
            case 'added':
                // 添加节点（简化实现）
                break

            case 'removed':
                result = removeComponentNode(result, nodeId) || result
                break

            case 'modified':
                result = updateComponentNode(result, nodeId, () => diff.newValue) || result
                break

            case 'moved':
                // 移动节点（简化实现）
                break
        }
    }

    return {
        ...schema,
        root: result
    }
}

/**
 * 验证组件引用完整性
 */
export function validateComponentReferences(schema: PageSchema): string[] {
    const errors: string[] = []
    const nodeIds = new Set<string>()

    // 收集所有节点ID
    traverseComponentTree(schema.root, node => {
        if (nodeIds.has(node.id)) {
            errors.push(`Duplicate node ID: ${node.id}`)
        }
        nodeIds.add(node.id)
    })

    return errors
}

/**
 * 获取组件路径
 */
export function getComponentPath(
    root: ComponentNode,
    targetId: string
): ComponentNode[] | null {
    const path: ComponentNode[] = []

    function findPath(node: ComponentNode): boolean {
        path.push(node)

        if (node.id === targetId) {
            return true
        }

        if (node.children) {
            for (const child of node.children) {
                if (findPath(child)) return true
            }
        }

        if (node.slots) {
            for (const slotNodes of Object.values(node.slots) as ComponentNode[][]) {
                for (const slotNode of slotNodes) {
                    if (findPath(slotNode)) return true
                }
            }
        }

        path.pop()
        return false
    }

    return findPath(root) ? path : null
}
