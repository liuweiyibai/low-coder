/**
 * Data Store - 数据状态管理
 * 管理页面数据源、状态和事件处理
 */

import { create } from 'zustand'

export interface DataState {
    // 全局数据状态
    globalData: Record<string, any>

    // 用户信息
    user: {
        isLoggedIn: boolean
        id?: string
        name?: string
        avatar?: string
        phone?: string
        [key: string]: any
    }

    // 表格数据
    tableData: Record<string, any[]>

    // 表单数据
    formData: Record<string, any>

    // Actions
    setGlobalData: (key: string, value: any) => void
    updateGlobalData: (data: Record<string, any>) => void

    setUser: (user: Partial<DataState['user']>) => void
    login: (userData: any) => void
    logout: () => void

    setTableData: (tableId: string, data: any[]) => void
    updateTableRow: (tableId: string, rowIndex: number, rowData: any) => void

    setFormData: (formId: string, data: any) => void
    updateFormField: (formId: string, field: string, value: any) => void
}

export const useDataStore = create<DataState>((set, get) => ({
    globalData: {},
    user: {
        isLoggedIn: false,
    },
    tableData: {},
    formData: {},

    setGlobalData: (key, value) => {
        set((state) => ({
            globalData: {
                ...state.globalData,
                [key]: value,
            },
        }))
    },

    updateGlobalData: (data) => {
        set((state) => ({
            globalData: {
                ...state.globalData,
                ...data,
            },
        }))
    },

    setUser: (userData) => {
        set((state) => ({
            user: {
                ...state.user,
                ...userData,
            },
        }))
    },

    login: (userData) => {
        set({
            user: {
                isLoggedIn: true,
                ...userData,
            },
        })
    },

    logout: () => {
        set({
            user: {
                isLoggedIn: false,
            },
        })
    },

    setTableData: (tableId, data) => {
        set((state) => ({
            tableData: {
                ...state.tableData,
                [tableId]: data,
            },
        }))
    },

    updateTableRow: (tableId, rowIndex, rowData) => {
        const table = get().tableData[tableId]
        if (table) {
            const newData = [...table]
            newData[rowIndex] = { ...newData[rowIndex], ...rowData }
            get().setTableData(tableId, newData)
        }
    },

    setFormData: (formId, data) => {
        set((state) => ({
            formData: {
                ...state.formData,
                [formId]: data,
            },
        }))
    },

    updateFormField: (formId, field, value) => {
        const form = get().formData[formId] || {}
        get().setFormData(formId, {
            ...form,
            [field]: value,
        })
    },
}))
