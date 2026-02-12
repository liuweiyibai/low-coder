/**
 * Schema 验证器
 * 
 * 提供Schema验证功能
 */

import { ZodSchema, ZodError } from 'zod'
import {
    PageSchemaSchema,
    ComponentNodeSchema,
    ComponentMetaSchema,
    PluginMetaSchema,
    type PageSchema,
    type ComponentNode,
    type ComponentMeta,
    type PluginMeta
} from './types'

export interface ValidationResult<T = any> {
    success: boolean
    data?: T
    errors?: ValidationError[]
}

export interface ValidationError {
    path: string[]
    message: string
    code?: string
}

/**
 * Schema 验证器类
 */
export class SchemaValidator {
    /**
     * 验证页面Schema
     */
    static validatePageSchema(data: unknown): ValidationResult<PageSchema> {
        return this.validate(PageSchemaSchema, data) as ValidationResult<PageSchema>
    }

    /**
     * 验证组件节点
     */
    static validateComponentNode(data: unknown): ValidationResult<ComponentNode> {
        return this.validate(ComponentNodeSchema, data) as ValidationResult<ComponentNode>
    }

    /**
     * 验证组件元数据
     */
    static validateComponentMeta(data: unknown): ValidationResult<ComponentMeta> {
        return this.validate(ComponentMetaSchema, data) as ValidationResult<ComponentMeta>
    }

    /**
     * 验证插件元数据
     */
    static validatePluginMeta(data: unknown): ValidationResult<PluginMeta> {
        return this.validate(PluginMetaSchema, data) as ValidationResult<PluginMeta>
    }

    /**
     * 通用验证方法
     */
    private static validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
        try {
            const result = schema.parse(data)
            return {
                success: true,
                data: result
            }
        } catch (error) {
            if (error instanceof ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(err => ({
                        path: err.path.map(String),
                        message: err.message,
                        code: err.code
                    }))
                }
            }
            return {
                success: false,
                errors: [{
                    path: [],
                    message: error instanceof Error ? error.message : 'Unknown validation error'
                }]
            }
        }
    }

    /**
     * 安全解析（返回 undefined 而不是抛出错误）
     */
    static safeParse<T>(schema: ZodSchema<T>, data: unknown): T | undefined {
        const result = schema.safeParse(data)
        return result.success ? result.data : undefined
    }
}
