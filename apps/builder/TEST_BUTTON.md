# 按钮颜色变化测试

## 已修复的问题

1. ✅ 更新了 CSS 变量，使用更明显的颜色
2. ✅ 添加了调试日志，方便追踪 variant 值
3. ✅ 修复了点击事件冒泡问题

## 当前颜色方案

### 主要按钮 (primary → default)
- **颜色**: 蓝色 `hsl(217, 91%, 60%)`
- **文字**: 白色
- **悬停**: 更深的蓝色

### 次要按钮 (secondary)
- **颜色**: 浅灰色 `hsl(0, 0%, 96.1%)`
- **文字**: 深灰色
- **悬停**: 更深的灰色

### 危险按钮 (danger → destructive)
- **颜色**: 红色 `hsl(0, 84.2%, 60.2%)`
- **文字**: 白色
- **悬停**: 更深的红色

### 轮廓按钮 (outline)
- **颜色**: 透明背景
- **边框**: 灰色边框
- **悬停**: 浅灰色背景

### 幽灵按钮 (ghost)
- **颜色**: 透明背景
- **悬停**: 浅灰色背景

### 链接按钮 (link)
- **颜色**: 蓝色文字
- **下划线**: 悬停时显示

## 测试步骤

1. **打开浏览器开发者工具** (F12)
2. **切换到 Console 标签**
3. **在编辑器中拖拽一个按钮组件**
4. **在右侧属性面板切换按钮类型**：
   - 主要按钮 → 应该看到蓝色
   - 次要按钮 → 应该看到浅灰色
   - 危险按钮 → 应该看到红色
   - 轮廓按钮 → 应该看到边框
   - 幽灵按钮 → 应该看到透明背景
   - 链接按钮 → 应该看到蓝色文字

5. **查看控制台输出**，应该能看到：
   ```
   Button render: {
     variant: "primary",
     shadcnVariant: "default",
     props: {...}
   }
   ```

6. **每次切换类型时**，控制台应该输出新的 variant 值

## 如果颜色还是不变

### 检查点 1: 浏览器缓存
```bash
# 硬刷新页面
Ctrl/Cmd + Shift + R
```

### 检查点 2: 确认 CSS 变量已加载
在浏览器开发者工具的 Elements 标签中，检查 `<html>` 元素的 computed styles，查找：
- `--primary` 应该是蓝色 `217 91% 60%`
- `--destructive` 应该是红色 `0 84.2% 60.2%`

### 检查点 3: 确认 Button 组件样式
在 Elements 标签中选中按钮元素，查看 className 是否包含：
- `bg-primary` (主要按钮)
- `bg-destructive` (危险按钮)
- `bg-secondary` (次要按钮)

### 检查点 4: 查看控制台日志
切换按钮类型时，应该看到 `Button render:` 日志，确认：
- `variant` 值正确（如 "danger"）
- `shadcnVariant` 值正确（如 "destructive"）

## 可能的解决方案

### 方案 1: 强制刷新样式
```bash
# 在项目根目录执行
cd /Users/liuweiyibai/Desktop/low-coder/apps/builder
rm -rf .next
pnpm dev
```

### 方案 2: 检查 Tailwind 配置
确认 `tailwind.config.ts` 包含：
```ts
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
],
```

### 方案 3: 直接使用 Tailwind 类
如果 CSS 变量不生效，可以在 PropertyPanel 的"样式类名"中直接添加：
- 蓝色按钮: `bg-blue-600 text-white hover:bg-blue-700`
- 红色按钮: `bg-red-600 text-white hover:bg-red-700`
- 绿色按钮: `bg-green-600 text-white hover:bg-green-700`

## 预期效果

切换按钮类型后，按钮颜色应该立即变化，无需刷新页面。

如果仍有问题，请：
1. 提供控制台的日志输出
2. 提供按钮元素的 HTML 结构（右键 → 检查元素）
3. 提供 Computed Styles 中的 CSS 变量值
