/**
 * Plugin SDK 基础使用示例
 */

import {
    PluginManager,
    PluginState,
    PluginPermission,
    createPluginContext,
    createSandbox
} from '@low-coder/plugin-sdk'
import type { PluginMeta } from '@low-coder/schema-core'

console.log('\n=== Plugin SDK 使用示例 ===\n')

// 1. 创建插件管理器
const manager = new PluginManager()

// 2. 定义插件元数据
const pluginMeta: PluginMeta = {
    version: '1.0.0',
    id: 'demo-plugin',
    name: 'Demo Plugin',
    type: 'component',
    author: {
        name: 'Developer',
        email: 'dev@example.com'
    },
    description: '示例插件',
    permissions: ['component:write', 'storage:read']
}

// 3. 定义生命周期钩子
const hooks = {
    onInstall: async () => {
        console.log('✅ [生命周期] 插件安装完成')
    },
    onEnable: async () => {
        console.log('✅ [生命周期] 插件已启用')
    },
    onDisable: async () => {
        console.log('✅ [生命周期] 插件已禁用')
    },
    onUninstall: async () => {
        console.log('✅ [生命周期] 插件已卸载')
    },
    onConfigUpdate: async (newConfig: any, oldConfig: any) => {
        console.log('✅ [生命周期] 配置已更新')
        console.log('  旧配置:', oldConfig)
        console.log('  新配置:', newConfig)
    }
}

// 4. 监听插件事件
manager.on('plugin:installing', ({ pluginId }) => {
    console.log(`📦 [事件] 正在安装插件: ${pluginId}`)
})

manager.on('plugin:installed', ({ pluginId }) => {
    console.log(`✅ [事件] 插件已安装: ${pluginId}`)
})

manager.on('plugin:enabling', ({ pluginId }) => {
    console.log(`🔄 [事件] 正在启用插件: ${pluginId}`)
})

manager.on('plugin:enabled', ({ pluginId }) => {
    console.log(`✅ [事件] 插件已启用: ${pluginId}`)
})

manager.on('plugin:disabling', ({ pluginId }) => {
    console.log(`🔄 [事件] 正在禁用插件: ${pluginId}`)
})

manager.on('plugin:disabled', ({ pluginId }) => {
    console.log(`✅ [事件] 插件已禁用: ${pluginId}`)
})

manager.on('plugin:error', ({ pluginId, error }) => {
    console.error(`❌ [事件] 插件错误: ${pluginId} - ${error}`)
})

manager.on('plugin:permissionGranted', ({ pluginId, permission }) => {
    console.log(`🔑 [事件] 权限已授予: ${pluginId} - ${permission}`)
})

    // 5. 执行示例
    ; (async () => {
        try {
            // 安装插件
            console.log('\n--- 步骤 1: 安装插件 ---')
            await manager.install(pluginMeta, hooks, {
                autoEnable: false,
                config: {
                    theme: 'dark',
                    enabled: true
                },
                permissions: [PluginPermission.ReadComponent, PluginPermission.WriteStorage]
            })

            // 查询插件
            console.log('\n--- 步骤 2: 查询插件 ---')
            const plugin = manager.getPlugin('demo-plugin')
            console.log('插件信息:')
            console.log('  ID:', plugin?.id)
            console.log('  名称:', plugin?.meta.name)
            console.log('  状态:', plugin?.state)
            console.log('  权限:', plugin?.permissions)

            // 启用插件
            console.log('\n--- 步骤 3: 启用插件 ---')
            await manager.enable('demo-plugin')

            // 检查状态
            console.log('\n--- 步骤 4: 检查状态 ---')
            console.log('已安装:', manager.hasPlugin('demo-plugin'))
            console.log('已启用:', manager.isEnabled('demo-plugin'))
            console.log('有读取权限:', manager.hasPermission('demo-plugin', PluginPermission.ReadComponent))
            console.log('有写入权限:', manager.hasPermission('demo-plugin', PluginPermission.WriteComponent))

            // 授予权限
            console.log('\n--- 步骤 5: 授予权限 ---')
            manager.grantPermission('demo-plugin', PluginPermission.WriteComponent)
            console.log('有写入权限:', manager.hasPermission('demo-plugin', PluginPermission.WriteComponent))

            // 测试插件上下文
            console.log('\n--- 步骤 6: 测试插件上下文 ---')
            const updatedPlugin = manager.getPlugin('demo-plugin')
            if (updatedPlugin?.sandbox) {
                const context = updatedPlugin.sandbox.context

                // 测试日志
                context.logger.info('这是一条信息日志')
                context.logger.warn('这是一条警告日志')

                // 测试工具函数
                const id = context.utils.generateId()
                console.log('生成的 ID:', id)

                // 测试存储
                await context.storage.set('test-key', 'test-value')
                const value = await context.storage.get('test-key')
                console.log('从存储读取:', value)

                // 测试事件
                context.events.on('custom:event', (data) => {
                    console.log('收到自定义事件:', data)
                })
                context.events.emit('custom:event', { message: 'Hello from plugin!' })
            }

            // 测试沙箱执行
            console.log('\n--- 步骤 7: 测试沙箱执行 ---')
            if (updatedPlugin?.sandbox) {
                const result = await updatedPlugin.sandbox.execute(`
        const id = context.utils.generateId()
        context.logger.info('在沙箱中生成 ID:', id)
        return { id, message: '沙箱执行成功' }
      `)
                console.log('沙箱执行结果:', result)
                console.log('资源使用情况:', updatedPlugin.sandbox.usage)
            }

            // 更新配置
            console.log('\n--- 步骤 8: 更新配置 ---')
            await manager.updateConfig('demo-plugin', {
                theme: 'light',
                enabled: true,
                newOption: 'test'
            })

            // 获取统计信息
            console.log('\n--- 步骤 9: 获取统计信息 ---')
            const stats = manager.getStats()
            console.log('插件统计:')
            console.log('  总数:', stats.total)
            console.log('  按状态:', stats.byState)
            console.log('  按类型:', stats.byType)

            // 获取所有插件
            console.log('\n--- 步骤 10: 获取所有插件 ---')
            const allPlugins = manager.getAllPlugins()
            console.log('所有插件:', allPlugins.map(p => ({
                id: p.id,
                name: p.meta.name,
                state: p.state
            })))

            // 获取已启用插件
            const enabledPlugins = manager.getEnabledPlugins()
            console.log('已启用插件:', enabledPlugins.map(p => p.id))

            // 禁用插件
            console.log('\n--- 步骤 11: 禁用插件 ---')
            await manager.disable('demo-plugin')

            // 卸载插件
            console.log('\n--- 步骤 12: 卸载插件 ---')
            await manager.uninstall('demo-plugin')

            console.log('\n=== 示例完成 ===\n')
        } catch (error) {
            console.error('\n❌ 错误:', error)
        }
    })()
