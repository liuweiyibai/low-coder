# Low-Coder 实际应用场景指南

本文档介绍如何使用 Low-Coder 构建真实的应用场景。

## 1. 全屏背景图片 / 自适应图片

### 方法一：使用 Container 组件

1. 拖拽 **Container** 组件到画布
2. 在右侧属性面板配置：
   - **背景图片 URL**: `https://images.unsplash.com/photo-1...`
   - **背景尺寸**: 选择 `覆盖 (cover)` - 图片会覆盖整个容器
   - **背景位置**: 选择 `居中 (center)`
   - **背景重复**: 选择 `不重复 (no-repeat)`
   - **最小高度**: 输入 `100vh` (全屏高度)

### 方法二：使用 Image 组件

1. 拖拽 **Image** 组件到画布
2. 在右侧属性面板配置：
   - **图片地址**: `https://your-image-url.jpg`
   - **显示模式**: 选择 `覆盖 (cover)` 或 `包含 (contain)`
   - **宽度**: `100%` (自适应宽度)
   - **高度**: `100vh` (全屏高度) 或 `auto` (自适应高度)

---

## 2. 按钮点击事件

### 按钮样式类型

平台已集成 **shadcn/ui** 组件库，提供专业的 UI 组件。按钮支持以下类型：

- **主要按钮** (primary) - 蓝色主题，用于主要操作
- **次要按钮** (secondary) - 灰色主题，用于次要操作  
- **危险按钮** (danger) - 红色主题，用于删除等危险操作
- **轮廓按钮** (outline) - 带边框的透明按钮
- **幽灵按钮** (ghost) - 无边框的透明按钮
- **链接按钮** (link) - 链接样式的按钮

### 配置按钮点击行为

1. 拖拽 **Button** 组件到画布
2. 在属性面板配置：

**基础属性**:
- **按钮文本**: "提交报名"
- **按钮类型**: 选择样式 (主要/次要/危险/轮廓/幽灵/链接)

**点击事件** (JavaScript 代码):
```javascript
// 显示提示
alert('报名成功！');

// 打印日志
console.log('用户点击了按钮');

// 调用全局函数
window.submitForm();

// 发送统计数据
fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify({ action: 'click', button: '报名按钮' })
});
```

**跳转链接**:
- 输入: `https://example.com/success` (点击后打开新页面)

---

## 3. 表格展示自定义数据

### 配置表格数据

1. 拖拽 **Table** 组件到画布
2. 在属性面板配置：

**表格 ID**:
```
userTable
```

**数据源** (JSON 格式):
```json
[
  {
    "name": "张三",
    "age": 25,
    "city": "北京",
    "status": "已报名"
  },
  {
    "name": "李四",
    "age": 30,
    "city": "上海",
    "status": "待审核"
  },
  {
    "name": "王五",
    "age": 28,
    "city": "广州",
    "status": "已通过"
  }
]
```

**列配置** (JSON 格式):
```json
[
  {
    "key": "name",
    "title": "姓名"
  },
  {
    "key": "age",
    "title": "年龄"
  },
  {
    "key": "city",
    "title": "城市"
  },
  {
    "key": "status",
    "title": "状态"
  }
]
```

### 动态数据加载

如果需要从 API 加载数据，可以在页面中添加按钮，点击事件配置为：

```javascript
// 获取数据
fetch('/api/users')
  .then(res => res.json())
  .then(data => {
    // 更新表格数据
    window.updateTableData('userTable', data);
  });
```

---

## 4. 用户登录认证

### 使用内置登录功能

1. 点击顶部工具栏右侧的 **"登录"** 按钮
2. 选择登录方式：
   - **手机登录**: 输入手机号和验证码
   - **微信登录**: 扫码登录（模拟功能）

### 登录后的功能

登录成功后，系统会保存用户信息：
- 用户 ID
- 用户名
- 手机号
- 头像 (微信登录)

### 检查登录状态

在任何组件的点击事件中，可以使用：

```javascript
// 检查是否登录
if (!window.userIsLoggedIn()) {
  alert('请先登录！');
  window.showLogin();
  return;
}

// 获取用户信息
const user = window.getCurrentUser();
console.log('当前用户:', user.name);

// 执行需要登录的操作
fetch('/api/activity/join', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.id}`
  },
  body: JSON.stringify({
    activityId: '123',
    userId: user.id
  })
});
```

---

## 完整示例：活动报名页面

### 页面结构

```
Container (全屏背景)
├── Container (内容区域)
│   ├── Text (活动标题)
│   ├── Image (活动海报)
│   ├── Text (活动说明)
│   ├── Button (立即报名)
│   └── Table (报名列表)
```

### 配置步骤

1. **主容器**:
   - 背景图片: 活动背景图
   - 最小高度: `100vh`
   - 样式类名: `flex items-center justify-center`

2. **内容容器**:
   - 样式类名: `bg-white rounded-lg shadow-xl p-8 max-w-4xl`

3. **活动标题**:
   - 文本内容: "春季运动会报名"
   - 样式类名: `text-3xl font-bold mb-4`

4. **报名按钮**:
   - 按钮文本: "立即报名"
   - 按钮类型: "主要按钮"
   - 点击事件:
   ```javascript
   // 检查登录
   if (!window.userIsLoggedIn()) {
     alert('请先登录再报名！');
     window.showLogin();
     return;
   }
   
   // 提交报名
   const user = window.getCurrentUser();
   fetch('/api/activity/join', {
     method: 'POST',
     body: JSON.stringify({
       activityId: 'spring-sports-2024',
       userId: user.id,
       userName: user.name,
       phone: user.phone
     })
   }).then(() => {
     alert('报名成功！');
     // 刷新报名列表
     location.reload();
   });
   ```

5. **报名列表表格**:
   - 数据源: 从 `/api/activity/members` API 获取
   - 列配置: 姓名、手机号、报名时间、状态

---

## 样式类名参考

使用 Tailwind CSS 类名快速美化组件：

### 布局
- `flex` - 弹性布局
- `items-center` - 垂直居中
- `justify-center` - 水平居中
- `w-full` - 宽度 100%
- `h-screen` - 高度 100vh

### 间距
- `p-4` - 内边距 1rem
- `m-4` - 外边距 1rem
- `gap-4` - 间距 1rem

### 颜色
- `bg-blue-600` - 蓝色背景
- `text-white` - 白色文字
- `border-gray-300` - 灰色边框

### 圆角和阴影
- `rounded-lg` - 大圆角
- `shadow-lg` - 大阴影

---

## 技巧和最佳实践

1. **使用预览功能**: 随时点击 "预览" 按钮查看实际效果
2. **设备适配**: 使用顶部工具栏切换桌面/平板/手机视图
3. **草稿自动保存**: 编辑会自动保存，刷新页面不丢失
4. **调试技巧**: 在按钮点击事件中使用 `console.log()` 调试
5. **响应式设计**: 使用 Tailwind 的响应式类名如 `md:w-1/2` `lg:w-1/3`

---

## 常见问题

**Q: 图片不显示怎么办？**
A: 确保图片 URL 可访问，建议使用 HTTPS 链接

**Q: 点击事件不生效？**
A: 检查 JavaScript 代码是否有语法错误，打开浏览器控制台查看错误信息

**Q: 如何对接真实 API？**
A: 在点击事件中使用 `fetch()` 调用 API，需要配置 CORS

**Q: 登录状态如何持久化？**
A: 当前版本登录状态保存在内存中，刷新会丢失。可以接入真实认证系统

---

需要更多帮助？查看完整文档或联系技术支持。
