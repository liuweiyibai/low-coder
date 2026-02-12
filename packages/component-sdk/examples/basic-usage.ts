/**
 * Component SDK 基础使用示例
 */

import {
    ComponentManager,
    ComponentRegistry,
    createManager
} from '@low-coder/component-sdk'
import type { ComponentMeta } from '@low-coder/schema-core'

// 1. 创建组件管理器
const manager = createManager({
    enableLifecycle: true,
    enablePerformanceTracking: true
})

// 2. 获取注册中心
const registry = manager.getRegistry()

// 3. 定义组件元数据
const buttonMeta: ComponentMeta = {
    version: '1.0.0',
    id: 'button',
    name: 'Button',
    displayName: '按钮',
    description: '通用按钮组件',
    category: 'input',
    tags: ['button', 'input', 'form'],
    propsSchema: {
        type: 'object',
        properties: {
            text: {
                type: 'string',
                default: '按钮'
            },
            type: {
                type: 'string',
                enum: ['primary', 'secondary', 'danger'],
                default: 'primary'
            },
            disabled: {
                type: 'boolean',
                default: false
            }
        }
    },
    events: [
        {
            name: 'click',
            displayName: '点击事件',
            category: 'mouse'
        },
        {
            name: 'doubleClick',
            displayName: '双击事件',
            category: 'mouse'
        }
    ],
    defaultProps: {
        text: '按钮',
        type: 'primary',
        disabled: false
    }
}

// 4. 定义组件渲染函数
const buttonRender = (props: any, context: any) => {
    return {
        type: 'button',
        props: {
            className: `btn btn-${props.type}`,
            disabled: props.disabled,
            onClick: () => context.emit('click', { timestamp: Date.now() })
        },
        children: props.text
    }
}

// 5. 注册组件
registry.register(buttonMeta, buttonRender, {
    global: true,
    group: 'common'
})

console.log('✅ 组件注册成功')

// 6. 查询组件
const buttonDef = registry.get('button')
console.log('组件定义:', buttonDef?.meta.displayName)

// 7. 搜索组件
const searchResults = registry.search('按钮')
console.log('搜索结果:', searchResults.length, '个组件')

// 8. 获取统计信息
const stats = registry.getStats()
console.log('注册统计:', stats)

// 9. 创建组件实例
async function createButtonInstance() {
    const instance = await manager.createInstance({
        id: 'btn_001',
        type: 'button',
        props: {
            text: '点击我',
            type: 'primary'
        }
    })

    console.log('✅ 组件实例创建成功:', instance.id)
    return instance
}

// 10. 监听事件
manager.on('component:event', (event) => {
    console.log('组件事件:', event)
})

manager.on('instance:created', (event) => {
    console.log('实例创建:', event)
})

manager.on('instance:updated', (event) => {
    console.log('实例更新:', event)
})

manager.on('performance:createInstance', (event) => {
    console.log('性能追踪:', event)
})

    // 11. 执行示例
    ; (async () => {
        console.log('\n=== Component SDK 使用示例 ===\n')

        // 创建实例
        const instance = await createButtonInstance()

        // 更新实例
        await manager.updateInstance(instance.id, {
            props: {
                text: '已更新',
                type: 'danger'
            }
        })

        console.log('✅ 实例更新成功')

        // 获取实例
        const inst = manager.getInstance(instance.id)
        console.log('当前属性:', inst?.props)

        // 获取所有实例
        const allInstances = manager.getAllInstances()
        console.log('实例总数:', allInstances.length)

        // 获取管理器统计
        const managerStats = manager.getStats()
        console.log('管理器统计:', managerStats)

        // 销毁实例
        await manager.destroyInstance(instance.id)
        console.log('✅ 实例已销毁')

        console.log('\n=== 示例完成 ===\n')
    })()
