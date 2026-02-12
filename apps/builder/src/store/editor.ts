/**
 * Editor Store - 编辑器状态管理
 */

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { PageSchema, ComponentNode } from '@low-coder/schema-core'

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export interface EditorState {
    // 当前页面 Schema
    schema: PageSchema

    // 选中的节点ID
    selectedNodeId: string | null

    // 悬停的节点ID
    hoveredNodeId: string | null

    // 当前设备类型
    deviceType: DeviceType

    // 是否显示组件面板
    showComponentPanel: boolean

    // 是否显示属性面板
    showPropertyPanel: boolean

    // 是否显示结构树面板
    showStructurePanel: boolean

    // 操作历史
    history: PageSchema[]
    historyIndex: number

    // Actions
    setSchema: (schema: PageSchema) => void
    selectNode: (nodeId: string | null) => void
    hoverNode: (nodeId: string | null) => void
    setDeviceType: (deviceType: DeviceType) => void
    toggleComponentPanel: () => void
    togglePropertyPanel: () => void
    toggleStructurePanel: () => void

    // Node operations
    addNode: (parentId: string, node: ComponentNode, index?: number) => void
    updateNode: (nodeId: string, updates: Partial<ComponentNode>) => void
    deleteNode: (nodeId: string) => void
    moveNode: (nodeId: string, newParentId: string, index: number) => void

    // History operations
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean

    // Draft operations
    saveDraft: () => void
    loadDraft: () => void
    clearDraft: () => void
    hasDraft: () => boolean
}

const initialSchema: PageSchema = {
    id: 'page-1',
    version: '1.0.0',
    name: 'Untitled Page',
    config: {},
    meta: {
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
    },
    root: {
        id: 'root',
        type: 'Container',
        props: {
            className: 'min-h-screen bg-white'
        },
        children: []
    }
}

export const useEditorStore = create<EditorState>((set, get) => ({
    schema: initialSchema,
    selectedNodeId: null,
    hoveredNodeId: null,
    deviceType: 'desktop',
    showComponentPanel: true,
    showPropertyPanel: true,
    showStructurePanel: true,
    history: [initialSchema],
    historyIndex: 0,

    setSchema: (schema) => {
        const { history, historyIndex } = get()
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(schema)

        set({
            schema,
            history: newHistory,
            historyIndex: newHistory.length - 1
        })
    },

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

    hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),

    setDeviceType: (deviceType) => set({ deviceType }),

    toggleComponentPanel: () => set((state) => ({
        showComponentPanel: !state.showComponentPanel
    })),

    togglePropertyPanel: () => set((state) => ({
        showPropertyPanel: !state.showPropertyPanel
    })),

    toggleStructurePanel: () => set((state) => ({
        showStructurePanel: !state.showStructurePanel
    })),

    addNode: (parentId, node, index) => {
        const { schema } = get()
        const newSchema = JSON.parse(JSON.stringify(schema)) as PageSchema

        const parent = findNodeById(newSchema.root, parentId)
        if (parent) {
            if (!parent.children) {
                parent.children = []
            }

            if (index !== undefined && index >= 0 && index <= parent.children.length) {
                parent.children.splice(index, 0, node)
            } else {
                parent.children.push(node)
            }

            get().setSchema(newSchema)
            get().selectNode(node.id)
        }
    },

    updateNode: (nodeId, updates) => {
        const { schema } = get()
        const newSchema = JSON.parse(JSON.stringify(schema)) as PageSchema

        const node = findNodeById(newSchema.root, nodeId)
        if (node) {
            console.log("Store - updateNode:", {
                nodeId,
                nodeType: node.type,
                updates,
                beforeProps: node.props,
            });
            Object.assign(node, updates)
            console.log("Store - updateNode after:", {
                afterProps: node.props,
            });
            get().setSchema(newSchema)
        }
    },

    deleteNode: (nodeId) => {
        const { schema, selectedNodeId } = get()

        if (nodeId === 'root') return

        const newSchema = JSON.parse(JSON.stringify(schema)) as PageSchema

        const parent = findParentNode(newSchema.root, nodeId)
        if (parent && parent.children) {
            parent.children = parent.children.filter((child: any) => child.id !== nodeId)
            get().setSchema(newSchema)

            if (selectedNodeId === nodeId) {
                get().selectNode(null)
            }
        }
    },

    moveNode: (nodeId, newParentId, index) => {
        const { schema } = get()

        if (nodeId === 'root' || nodeId === newParentId) return

        const newSchema = JSON.parse(JSON.stringify(schema)) as PageSchema

        // Remove from old parent
        const oldParent = findParentNode(newSchema.root, nodeId)
        if (!oldParent || !oldParent.children) return

        const nodeToMove = oldParent.children.find((child: any) => child.id === nodeId)
        if (!nodeToMove) return

        oldParent.children = oldParent.children.filter((child: any) => child.id !== nodeId)

        // Add to new parent
        const newParent = findNodeById(newSchema.root, newParentId)
        if (newParent) {
            if (!newParent.children) {
                newParent.children = []
            }

            newParent.children.splice(index, 0, nodeToMove)
            get().setSchema(newSchema)
        }
    },

    undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
            set({
                schema: history[historyIndex - 1],
                historyIndex: historyIndex - 1
            })
        }
    },

    redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
            set({
                schema: history[historyIndex + 1],
                historyIndex: historyIndex + 1
            })
        }
    },

    canUndo: () => get().historyIndex > 0,

    canRedo: () => get().historyIndex < get().history.length - 1,

    // 保存草稿到 localStorage
    saveDraft: () => {
        const { schema, deviceType, selectedNodeId } = get()
        const draft = {
            schema,
            deviceType,
            selectedNodeId,
            timestamp: Date.now()
        }
        try {
            localStorage.setItem('editor-draft', JSON.stringify(draft))
            console.log('草稿已保存')
        } catch (error) {
            console.error('草稿保存失败:', error)
        }
    },

    // 从 localStorage 加载草稿
    loadDraft: () => {
        try {
            const draftStr = localStorage.getItem('editor-draft')
            if (draftStr) {
                const draft = JSON.parse(draftStr)
                set({
                    schema: draft.schema,
                    deviceType: draft.deviceType || 'desktop',
                    selectedNodeId: draft.selectedNodeId || null,
                    history: [draft.schema],
                    historyIndex: 0
                })
                console.log('草稿已加载')
                return true
            }
        } catch (error) {
            console.error('草稿加载失败:', error)
        }
        return false
    },

    // 清除草稿
    clearDraft: () => {
        try {
            localStorage.removeItem('editor-draft')
            console.log('草稿已清除')
        } catch (error) {
            console.error('草稿清除失败:', error)
        }
    },

    // 检查是否有草稿
    hasDraft: () => {
        try {
            return localStorage.getItem('editor-draft') !== null
        } catch (error) {
            return false
        }
    },
}))

/**
 * 根据ID查找节点
 */
function findNodeById(node: ComponentNode, id: string): ComponentNode | null {
    if (node.id === id) {
        return node
    }

    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id)
            if (found) return found
        }
    }

    if (node.slots) {
        for (const slotNodes of Object.values(node.slots)) {
            for (const slotNode of slotNodes as ComponentNode[]) {
                const found = findNodeById(slotNode, id)
                if (found) return found
            }
        }
    }

    return null
}

/**
 * 查找节点的父节点
 */
function findParentNode(node: ComponentNode, childId: string): ComponentNode | null {
    if (node.children) {
        if (node.children.some((child: any) => child.id === childId)) {
            return node
        }

        for (const child of node.children) {
            const found = findParentNode(child, childId)
            if (found) return found
        }
    }

    if (node.slots) {
        for (const slotNodes of Object.values(node.slots)) {
            if ((slotNodes as ComponentNode[]).some(slotNode => slotNode.id === childId)) {
                return node
            }

            for (const slotNode of slotNodes as ComponentNode[]) {
                const found = findParentNode(slotNode, childId)
                if (found) return found
            }
        }
    }

    return null
}
