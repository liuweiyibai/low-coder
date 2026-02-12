# 按钮颜色问题完整排查报告

## 已修复的问题

### 1. ✅ CSS 变量重复定义
**问题**: `globals.css` 中有两处定义 CSS 变量，顶部的旧定义覆盖了底部 `@layer base` 中的新定义
```css
/* 错误：顶部有旧的深色定义 */
:root {
  --primary: 222.2 47.4% 11.2%; /* 深灰色 */
}

/* 被覆盖的正确定义 */
@layer base {
  :root {
    --primary: 217 91% 60%; /* 蓝色 */
  }
}
```

**修复**: 已移除顶部的重复定义，只保留 `@layer base` 中的定义

### 2. ✅ React 组件未重新渲染
**问题**: Button 组件的 props 变化时可能不会触发重新渲染
**修复**: 为 Button 添加了 key prop `key={node.id}-${buttonVariant}`，确保 variant 变化时强制重新渲染

### 3. ✅ 添加了完整的调试日志
- PropertyPanel: 属性变化时的日志
- Store updateNode: 更新前后的对比日志  
- CanvasNode Button: 渲染时的 variant 值

## 当前代码状态

### globals.css
```css
@layer base {
  :root {
    --primary: 217 91% 60%;           /* 蓝色 */
    --primary-foreground: 0 0% 100%;  /* 白色文字 */
    --destructive: 0 84.2% 60.2%;     /* 红色 */
    --destructive-foreground: 0 0% 98%; /* 白色文字 */
    --secondary: 0 0% 96.1%;          /* 浅灰色 */
    --secondary-foreground: 0 0% 9%;  /* 深灰色文字 */
  }
}
```

### CanvasNode.tsx - Button 部分
```tsx
case "Button":
  const variantMap = {
    primary: "default",      // -> 蓝色
    secondary: "secondary",  // -> 浅灰色
    danger: "destructive",   // -> 红色
    outline: "outline",      // -> 边框
    ghost: "ghost",          // -> 透明
    link: "link",            // -> 链接样式
  };
  
  const buttonVariant = node.props?.variant || "primary";
  const shadcnVariant = variantMap[buttonVariant] || "default";
  
  return (
    <Button
      key={`${node.id}-${buttonVariant}`}  // 强制重新渲染
      variant={shadcnVariant}
      onClick={handleButtonClick}
    >
      {node.props?.text || "按钮"}
    </Button>
  );
```

## 测试步骤

### 步骤 1: 清理缓存（重要！）
```bash
cd /Users/liuweiyibai/Desktop/low-coder/apps/builder
rm -rf .next
pnpm dev
```

### 步骤 2: 打开浏览器
1. 访问 http://localhost:3000
2. 打开开发者工具 (F12)
3. 切换到 Console 标签

### 步骤 3: 测试按钮
1. 从左侧组件面板拖拽 **Button** 组件到画布
2. 点击选中按钮
3. 在右侧属性面板修改"按钮类型"

### 步骤 4: 观察控制台日志
应该看到以下日志序列：

```javascript
// 1. PropertyPanel 触发更新
PropertyPanel - handlePropChange: {
  nodeId: "xxx",
  nodeType: "Button",
  key: "variant",
  value: "danger",
  currentProps: {text: "按钮", variant: "primary"}
}

// 2. Store 执行更新
Store - updateNode: {
  nodeId: "xxx",
  nodeType: "Button",
  updates: {props: {text: "按钮", variant: "danger"}},
  beforeProps: {text: "按钮", variant: "primary"}
}

Store - updateNode after: {
  afterProps: {text: "按钮", variant: "danger"}
}

// 3. Button 重新渲染
Button render: {
  nodeId: "xxx",
  variant: "danger",
  shadcnVariant: "destructive",
  props: {text: "按钮", variant: "danger"}
}
```

### 步骤 5: 验证视觉效果
切换按钮类型时，按钮颜色应该**立即**变化：
- **主要按钮** → 🔵 蓝色背景，白色文字
- **次要按钮** → ⚪ 浅灰色背景，深灰色文字
- **危险按钮** → 🔴 红色背景，白色文字
- **轮廓按钮** → ⚪ 透明背景，灰色边框
- **幽灵按钮** → ⚪ 透明背景，悬停时显示
- **链接按钮** → 🔵 蓝色文字，下划线

## 故障排除

### 问题 1: 颜色还是深灰色/黑色
**原因**: 浏览器缓存了旧的 CSS
**解决**:
```bash
# 1. 硬刷新浏览器
Cmd/Ctrl + Shift + R

# 2. 清理浏览器缓存
开发者工具 → Network 标签 → 勾选 "Disable cache"

# 3. 重新构建
rm -rf .next
pnpm dev
```

### 问题 2: 控制台没有日志
**原因**: 可能开发服务器没有重新加载
**解决**:
1. 停止开发服务器 (Ctrl+C)
2. 删除 .next 文件夹
3. 重新启动 `pnpm dev`

### 问题 3: 日志显示正确但颜色不变
**原因**: CSS 变量可能没有正确应用
**检查**:
1. 在浏览器开发者工具中
2. 选择 Elements 标签
3. 选中 `<html>` 元素
4. 查看 Computed 样式
5. 搜索 `--primary`，应该显示 `217 91% 60%`（蓝色）

### 问题 4: variant 值没有更新
**原因**: store 的 updateNode 可能有问题
**检查**:
- 查看 "Store - updateNode" 日志
- 确认 beforeProps 和 afterProps 不同
- 如果相同，说明 Object.assign 没有正确工作

## 验证 CSS 变量的简单测试

在浏览器控制台执行：
```javascript
// 获取 CSS 变量值
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// 应该返回: " 217 91% 60%"

// 测试按钮颜色
const testBtn = document.createElement('button');
testBtn.className = 'inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md';
testBtn.textContent = '测试按钮';
document.body.appendChild(testBtn);
```

## 预期结果

✅ 修改按钮类型后，按钮颜色应该**立即**变化  
✅ 控制台应该显示完整的更新日志  
✅ 不需要刷新页面  
✅ 颜色应该是明显的蓝色/红色/灰色，而不是深灰色

## 如果问题依然存在

请提供以下信息：
1. 浏览器控制台的完整日志
2. Elements 标签中按钮元素的 HTML 结构
3. Computed Styles 中 `--primary` 的值
4. 按钮元素的 className 属性值

这样我可以进一步诊断问题。
