# 按钮样式测试说明

## 问题修复

已修复按钮类型切换时颜色不变化的问题。现在使用 **shadcn/ui** 的 Button 组件，提供更专业的 UI 体验。

## 按钮类型对比

### 修改前（自定义样式）
- primary: 蓝色背景
- secondary: 灰色背景
- success: 绿色背景
- danger: 红色背景

问题：由于 className 优先级问题，切换类型时样式可能不生效。

### 修改后（shadcn/ui）
- **primary** → shadcn `default` - 深色背景，专业主题色
- **secondary** → shadcn `secondary` - 浅灰色背景
- **danger** → shadcn `destructive` - 红色背景，用于危险操作
- **outline** → shadcn `outline` - 透明背景，边框样式
- **ghost** → shadcn `ghost` - 透明背景，悬停时显示
- **link** → shadcn `link` - 链接样式

优势：
1. ✅ 类型切换立即生效，无需刷新
2. ✅ 样式由 shadcn/ui 管理，避免自定义 CSS 冲突
3. ✅ 支持更多按钮类型（outline、ghost、link）
4. ✅ 统一的设计语言，符合现代 UI 规范
5. ✅ 内置悬停、焦点、禁用等状态样式

## 测试步骤

1. 启动开发服务器：`pnpm dev`
2. 拖拽 **Button** 组件到画布
3. 在属性面板切换 **按钮类型**：
   - 主要按钮
   - 次要按钮
   - 危险按钮
   - 轮廓按钮
   - 幽灵按钮
   - 链接按钮
4. 观察按钮样式实时变化

## 自定义样式

如果需要进一步自定义样式，可以在 **样式类名** 中添加 Tailwind CSS 类：

```
w-full rounded-lg text-lg
```

这些类会与 shadcn/ui 的默认样式合并，不会覆盖按钮类型的样式。

## 其他可用组件

除了 Button，项目还集成了以下 shadcn/ui 组件：
- **Input** - 输入框
- **Select** - 下拉选择
- **Card** - 卡片容器

后续可以根据需要添加更多组件。详见 [SHADCN_UI.md](./SHADCN_UI.md)。
