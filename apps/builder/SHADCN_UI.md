# shadcn/ui 组件集成指南

本项目已集成 [shadcn/ui](https://ui.shadcn.com/) 组件库，提供高质量、可自定义的 React 组件。

## 已安装的组件

- **Button** - 按钮组件，支持多种样式和尺寸
- **Input** - 输入框组件
- **Select** - 选择器组件
- **Card** - 卡片组件

## 如何添加更多组件

使用以下命令添加 shadcn/ui 组件：

```bash
pnpm dlx shadcn@latest add [component-name]
```

例如：

```bash
# 添加 Dialog 组件
pnpm dlx shadcn@latest add dialog

# 添加 Dropdown Menu 组件
pnpm dlx shadcn@latest add dropdown-menu

# 添加 Table 组件
pnpm dlx shadcn@latest add table

# 添加 Form 组件
pnpm dlx shadcn@latest add form
```

## 使用示例

### Button 组件

```tsx
import { Button } from "@/components/ui/button";

// 默认按钮
<Button>Click me</Button>

// 不同样式
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// 不同尺寸
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Input 组件

```tsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="Enter email..." />
<Input type="password" placeholder="Enter password..." />
```

### Select 组件

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Card 组件

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## 自定义主题

shadcn/ui 使用 CSS 变量进行主题配置。可以在 `src/app/globals.css` 中修改：

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    /* ... 更多变量 */
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... 暗色主题变量 */
  }
}
```

## 在 CanvasNode 中使用

在 `CanvasNode.tsx` 中导入并使用 shadcn/ui 组件：

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// 在组件渲染中使用
case "Button":
  return (
    <Button variant={node.props?.variant} onClick={handleClick}>
      {node.props?.text}
    </Button>
  );
```

## 参考资源

- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [shadcn/ui GitHub](https://github.com/shadcn-ui/ui)
- [Radix UI](https://www.radix-ui.com/) - shadcn/ui 的底层组件库
- [Tailwind CSS](https://tailwindcss.com/) - 样式系统
