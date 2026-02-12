# @low-coder/builder

Low-Code Platform Visual Builder - 可视化编辑器应用

## 功能特性

### 🎨 核心功能

1. **可视化编辑器**
   - 拖拽式组件添加
   - 实时预览
   - 多设备视口切换（桌面/平板/手机）

2. **组件面板**
   - 组件分类展示
   - 拖拽添加到画布
   - 组件搜索（待实现）

3. **画布区域**
   - 组件选中和悬停效果
   - 拖拽组件到容器
   - 嵌套布局支持
   - 实时渲染

4. **属性面板**
   - 动态属性编辑
   - 针对不同组件的定制化属性
   - 实时更新

5. **结构树面板**
   - 页面结构树状展示
   - 节点选择和删除
   - 展开/收起子节点

6. **操作历史**
   - 撤销/重做功能
   - 历史记录管理

### 📦 技术栈

- **框架**: Next.js 15 (App Router)
- **UI**: React 18 + Tailwind CSS
- **拖拽**: @dnd-kit/core
- **状态管理**: Zustand
- **图标**: Lucide React
- **类型**: TypeScript

### 🏗️ 项目结构

```
apps/builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # 组件
│   │   ├── canvas/           # 画布相关
│   │   │   ├── Canvas.tsx
│   │   │   └── CanvasNode.tsx
│   │   ├── layout/           # 布局
│   │   │   └── EditorLayout.tsx
│   │   ├── panels/           # 面板
│   │   │   ├── ComponentPanel.tsx
│   │   │   ├── PropertyPanel.tsx
│   │   │   └── StructurePanel.tsx
│   │   └── toolbar/          # 工具栏
│   │       └── Toolbar.tsx
│   └── store/                # 状态管理
│       └── editor.ts         # 编辑器状态
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## 开始使用

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 使用指南

### 基本操作

1. **添加组件**
   - 从左侧组件面板拖拽组件到画布
   - 组件会添加到目标容器中

2. **选择组件**
   - 点击画布上的组件进行选择
   - 选中的组件会显示蓝色边框

3. **编辑属性**
   - 选中组件后在右侧属性面板编辑
   - 支持文本、样式等属性的修改

4. **查看结构**
   - 右侧结构树面板显示页面层级
   - 点击节点可选中对应组件

5. **删除组件**
   - 在结构树中选中节点后点击删除按钮
   - 或使用键盘 Delete 键（待实现）

6. **撤销/重做**
   - 顶部工具栏的撤销/重做按钮
   - 或使用快捷键 Ctrl+Z / Ctrl+Shift+Z（待实现）

### 组件类型

#### 基础组件
- **容器** (Container): 布局容器，可包含子组件
- **文本** (Text): 文本内容展示
- **按钮** (Button): 按钮组件
- **图片** (Image): 图片展示

#### 布局组件
- **行** (Row): 水平布局容器
- **列** (Column): 垂直布局容器

#### 数据展示
- **列表** (List): 列表组件
- **表格** (Table): 表格组件

## 扩展开发

### 添加新组件

1. 在 `ComponentPanel.tsx` 的 `componentCategories` 中添加组件定义
2. 在 `CanvasNode.tsx` 的 `NodeRenderer` 中添加渲染逻辑
3. 在 `PropertyPanel.tsx` 的 `renderPropertyEditor` 中添加属性编辑器

### 自定义样式

修改 `tailwind.config.ts` 和 `globals.css` 以自定义主题。

## 待实现功能

- [ ] 组件搜索和过滤
- [ ] 快捷键支持
- [ ] 组件复制粘贴
- [ ] 组件拖拽排序
- [ ] 多选操作
- [ ] 网格对齐
- [ ] 组件锁定
- [ ] 响应式设计工具
- [ ] 数据绑定界面
- [ ] 事件配置界面
- [ ] 主题切换
- [ ] 导入/导出 Schema
- [ ] 模板管理
- [ ] 协作编辑

## 许可证

MIT
