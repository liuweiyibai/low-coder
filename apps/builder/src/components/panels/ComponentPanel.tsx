/**
 * Component Panel - 组件面板
 */

"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Box,
  Type,
  Image as ImageIcon,
  Square,
  Layout,
  List,
  Table,
  MousePointer,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { ComponentNode } from "@low-coder/schema-core";

const componentCategories = [
  {
    name: "基础组件",
    components: [
      {
        type: "Container",
        label: "容器",
        icon: <Box className="w-4 h-4" />,
        description: "布局容器",
        defaultProps: {
          className:
            "p-4 border border-dashed border-gray-300 rounded min-h-[100px]",
        },
      },
      {
        type: "Text",
        label: "文本",
        icon: <Type className="w-4 h-4" />,
        description: "文本内容",
        defaultProps: {
          content: "文本内容",
          className: "text-gray-900",
        },
      },
      {
        type: "Button",
        label: "按钮",
        icon: <MousePointer className="w-4 h-4" />,
        description: "按钮组件",
        defaultProps: {
          text: "按钮",
          variant: "primary", // 使用 variant 控制样式
        },
      },
      {
        type: "Image",
        label: "图片",
        icon: <ImageIcon className="w-4 h-4" />,
        description: "图片组件",
        defaultProps: {
          src: "https://via.placeholder.com/300x200",
          alt: "图片",
          className: "w-full h-auto",
        },
      },
    ],
  },
  {
    name: "布局组件",
    components: [
      {
        type: "Row",
        label: "行",
        icon: <Layout className="w-4 h-4" />,
        description: "水平布局",
        defaultProps: {
          className: "flex flex-row gap-4",
        },
      },
      {
        type: "Column",
        label: "列",
        icon: <Square className="w-4 h-4" />,
        description: "垂直布局",
        defaultProps: {
          className: "flex flex-col gap-4",
        },
      },
    ],
  },
  {
    name: "数据展示",
    components: [
      {
        type: "List",
        label: "列表",
        icon: <List className="w-4 h-4" />,
        description: "列表组件",
        defaultProps: {
          className: "space-y-2",
        },
      },
      {
        type: "Table",
        label: "表格",
        icon: <Table className="w-4 h-4" />,
        description: "表格组件",
        defaultProps: {
          className: "w-full",
        },
      },
    ],
  },
];

export function ComponentPanel() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">组件库</h2>
      </div>

      {componentCategories.map((category) => (
        <div key={category.name}>
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
            {category.name}
          </h3>
          <div className="space-y-1">
            {category.components.map((component) => (
              <DraggableComponent key={component.type} component={component} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ComponentDef {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  defaultProps: Record<string, any>;
}

function DraggableComponent({ component }: { component: ComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component-${component.type}`,
    data: {
      type: "component",
      componentType: component.type,
      defaultProps: component.defaultProps,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border border-gray-200 bg-white
        hover:border-blue-500 hover:bg-blue-50
        cursor-move transition-all
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="text-gray-600">{component.icon}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {component.label}
          </div>
          <div className="text-xs text-gray-500">{component.description}</div>
        </div>
      </div>
    </div>
  );
}
