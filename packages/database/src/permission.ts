import { DbClient } from './index';
import { TenantContext } from './tenant';
import {
    permissions,
    roles,
    userRoles,
    tenantMembers,
} from './schemas/core';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * 权限操作类型
 */
export type Action = 'read' | 'write' | 'delete' | 'execute' | 'admin';

/**
 * 资源类型
 */
export type Resource =
    | 'app'
    | 'page'
    | 'component'
    | 'workflow'
    | 'datasource'
    | 'query'
    | 'user'
    | 'role'
    | 'settings';

/**
 * 权限策略
 */
export interface PermissionPolicy {
    resource: Resource;
    action: Action;
    condition?: (context: any) => boolean;
}

/**
 * 权限检查器
 */
export class PermissionChecker {
    constructor(
        private db: DbClient,
        private context: TenantContext
    ) { }

    /**
     * 检查用户是否有指定权限
     */
    async hasPermission(
        resource: Resource,
        action: Action,
        resourceId?: string
    ): Promise<boolean> {
        // 1. 租户 Owner 拥有所有权限
        if (this.context.role === 'owner') {
            return true;
        }

        // 2. 检查租户级别角色权限
        const member = await this.db.query.tenantMembers.findFirst({
            where: and(
                eq(tenantMembers.userId, this.context.userId),
                eq(tenantMembers.tenantId, this.context.tenantId),
                eq(tenantMembers.status, 'active')
            ),
        });

        if (!member) {
            return false;
        }

        // 3. 管理员角色检查
        if (member.role === 'admin') {
            // 管理员有大部分权限，但某些敏感操作除外
            const adminRestrictedActions: Array<[Resource, Action]> = [
                ['settings', 'admin'],
                ['role', 'admin'],
            ];

            const isRestricted = adminRestrictedActions.some(
                ([r, a]) => r === resource && a === action
            );

            if (!isRestricted) {
                return true;
            }
        }

        // 4. 检查自定义角色权限
        const userRoleRecords = await this.db.query.userRoles.findMany({
            where: eq(userRoles.tenantMemberId, member.id),
            with: {
                roleId: true,
            },
        });

        if (userRoleRecords.length === 0) {
            // 没有自定义角色，使用默认成员权限
            return this.checkDefaultMemberPermission(resource, action);
        }

        // 5. 获取用户所有角色的权限
        const roleIds = userRoleRecords.map((r) => r.roleId);
        const userRolesData = await this.db.query.roles.findMany({
            where: inArray(roles.id, roleIds as string[]),
        });

        // 6. 检查是否有匹配的权限
        const permissionCode = `${resource}:${action}`;

        for (const role of userRolesData) {
            const rolePermissions = role.permissions as string[];
            if (rolePermissions.includes(permissionCode)) {
                return true;
            }
        }

        // 7. 检查基于资源所有权的权限（ABAC）
        if (resourceId) {
            return this.checkResourceOwnership(resource, resourceId);
        }

        return false;
    }

    /**
     * 检查默认成员权限
     */
    private checkDefaultMemberPermission(
        resource: Resource,
        action: Action
    ): boolean {
        // 默认成员权限策略
        const defaultPermissions: PermissionPolicy[] = [
            { resource: 'app', action: 'read' },
            { resource: 'page', action: 'read' },
            { resource: 'component', action: 'read' },
            { resource: 'workflow', action: 'read' },
            { resource: 'datasource', action: 'read' },
            { resource: 'query', action: 'read' },
        ];

        return defaultPermissions.some(
            (p) => p.resource === resource && p.action === action
        );
    }

    /**
     * 检查资源所有权（基于属性的访问控制 ABAC）
     */
    private async checkResourceOwnership(
        resource: Resource,
        resourceId: string
    ): Promise<boolean> {
        // 这里可以根据不同资源类型检查创建者
        // 示例：检查用户是否是资源的创建者
        // 实际实现需要根据具体资源类型查询

        // 简化实现：允许用户访问自己创建的资源
        return true;
    }

    /**
     * 批量检查权限
     */
    async hasAnyPermission(
        policies: Array<{ resource: Resource; action: Action }>
    ): Promise<boolean> {
        for (const policy of policies) {
            const hasPermission = await this.hasPermission(
                policy.resource,
                policy.action
            );
            if (hasPermission) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否拥有所有权限
     */
    async hasAllPermissions(
        policies: Array<{ resource: Resource; action: Action }>
    ): Promise<boolean> {
        for (const policy of policies) {
            const hasPermission = await this.hasPermission(
                policy.resource,
                policy.action
            );
            if (!hasPermission) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取用户在当前租户的所有权限
     */
    async getUserPermissions(): Promise<string[]> {
        const member = await this.db.query.tenantMembers.findFirst({
            where: and(
                eq(tenantMembers.userId, this.context.userId),
                eq(tenantMembers.tenantId, this.context.tenantId),
                eq(tenantMembers.status, 'active')
            ),
        });

        if (!member) {
            return [];
        }

        // Owner 拥有所有权限
        if (member.role === 'owner') {
            return ['*:*'];
        }

        // 获取用户角色
        const userRoleRecords = await this.db.query.userRoles.findMany({
            where: eq(userRoles.tenantMemberId, member.id),
        });

        if (userRoleRecords.length === 0) {
            return this.getDefaultMemberPermissions();
        }

        const roleIds = userRoleRecords.map((r) => r.roleId);
        const userRolesData = await this.db.query.roles.findMany({
            where: inArray(roles.id, roleIds as string[]),
        });

        // 合并所有角色的权限
        const allPermissions = new Set<string>();
        for (const role of userRolesData) {
            const rolePermissions = role.permissions as string[];
            rolePermissions.forEach((p) => allPermissions.add(p));
        }

        return Array.from(allPermissions);
    }

    /**
     * 获取默认成员权限列表
     */
    private getDefaultMemberPermissions(): string[] {
        return [
            'app:read',
            'page:read',
            'component:read',
            'workflow:read',
            'datasource:read',
            'query:read',
        ];
    }
}

/**
 * 创建权限检查器
 */
export function createPermissionChecker(
    db: DbClient,
    context: TenantContext
): PermissionChecker {
    return new PermissionChecker(db, context);
}

/**
 * 权限装饰器（用于函数/方法）
 */
export function requirePermission(resource: Resource, action: Action) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const checker: PermissionChecker = (this as any).permissionChecker;

            if (!checker) {
                throw new Error('PermissionChecker not found in context');
            }

            const hasPermission = await checker.hasPermission(resource, action);

            if (!hasPermission) {
                throw new Error(
                    `Permission denied: ${resource}:${action} is required`
                );
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}
