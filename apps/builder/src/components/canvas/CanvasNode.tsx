/**
 * Canvas Node - 画布节点组件
 */

"use client";

import { useDroppable } from "@dnd-kit/core";
import { useEditorStore } from "@/store/editor";
import type { ComponentNode } from "@low-coder/schema-core";
import clsx from "clsx";
import { Button } from "@/components/ui/button";

interface CanvasNodeProps {
  node: ComponentNode;
}

export function CanvasNode({ node }: CanvasNodeProps) {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const hoveredNodeId = useEditorStore((state) => state.hoveredNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);
  const hoverNode = useEditorStore((state) => state.hoverNode);

  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    data: {
      type: "node",
      nodeId: node.id,
    },
  });

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    hoverNode(node.id);
  };

  const handleMouseLeave = () => {
    hoverNode(null);
  };

  // 判断是否为容器类组件
  const isContainer = ["Container", "Row", "Column"].includes(node.type);

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        "relative transition-all",
        {
          "ring-2 ring-blue-500": isSelected,
          "ring-1 ring-blue-300": isHovered && !isSelected,
          "ring-2 ring-green-400": isOver,
        },
        isContainer ? node.props?.className : "",
      )}
      style={{
        ...(node.props?.backgroundImage && {
          backgroundImage: `url(${node.props.backgroundImage})`,
          backgroundSize: node.props.backgroundSize || "cover",
          backgroundPosition: node.props.backgroundPosition || "center",
          backgroundRepeat: node.props.backgroundRepeat || "no-repeat",
        }),
        ...(node.props?.minHeight && {
          minHeight: node.props.minHeight,
        }),
      }}
    >
      {/* 节点标签 */}
      {(isSelected || isHovered) && (
        <div className="absolute -top-6 left-0 px-2 py-1 bg-blue-600 text-white text-xs rounded-t z-10">
          {node.type}
        </div>
      )}

      {/* 渲染节点内容 */}
      <NodeRenderer node={node} />

      {/* 渲染子节点 */}
      {node.children && node.children.length > 0 && (
        <>
          {node.children.map((child: any) => (
            <CanvasNode key={child.id} node={child} />
          ))}
        </>
      )}

      {/* 空状态提示 */}
      {(!node.children || node.children.length === 0) &&
        (node.type === "Container" ||
          node.type === "Row" ||
          node.type === "Column") && (
          <div className="text-center text-gray-400 text-sm py-8">
            拖拽组件到此处
          </div>
        )}
    </div>
  );
}

/**
 * 节点渲染器
 */
function NodeRenderer({ node }: { node: ComponentNode }) {
  switch (node.type) {
    case "Container":
    case "Row":
    case "Column":
      return null; // 容器类组件由子节点填充

    case "Text":
      return (
        <div className={node.props?.className}>
          {node.props?.content || "文本"}
        </div>
      );

    case "Button":
      const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发节点选择
        // 执行自定义点击事件
        if (node.props?.onClick) {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function(node.props.onClick);
            fn();
          } catch (error) {
            console.error("按钮点击事件执行错误:", error);
          }
        }
        // 处理跳转链接
        if (node.props?.href) {
          window.open(node.props.href, "_blank");
        }
      };

      // 映射自定义 variant 到 shadcn ui variant
      const variantMap: Record<
        string,
        "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
      > = {
        primary: "default",
        secondary: "secondary",
        success: "default", // shadcn 没有 success，使用 default
        danger: "destructive",
        outline: "outline",
        ghost: "ghost",
        link: "link",
      };

      const buttonVariant = node.props?.variant || "primary";
      const shadcnVariant = variantMap[buttonVariant] || "default";

      // 过滤掉 className 中的背景色和文字颜色类，避免覆盖 variant 样式
      const filteredClassName = node.props?.className
        ? node.props.className
            .split(" ")
            .filter(
              (cls: string) =>
                !cls.startsWith("bg-") &&
                !cls.startsWith("text-") &&
                !cls.startsWith("hover:bg-") &&
                !cls.startsWith("hover:text-"),
            )
            .join(" ")
        : "";

      console.log("Button render:", {
        nodeId: node.id,
        variant: buttonVariant,
        shadcnVariant,
        originalClassName: node.props?.className,
        filteredClassName,
        props: node.props,
      });

      return (
        <Button
          key={`${node.id}-${buttonVariant}`}
          onClick={handleButtonClick}
          variant={shadcnVariant}
          className={filteredClassName}
        >
          {node.props?.text || "按钮"}
        </Button>
      );

    case "Image":
      return (
        <img
          src={node.props?.src || "https://via.placeholder.com/400x300"}
          alt={node.props?.alt || ""}
          className={node.props?.className}
          style={{
            objectFit: node.props?.objectFit || "cover",
            width: node.props?.width || "auto",
            height: node.props?.height || "auto",
          }}
        />
      );

    case "List":
      return (
        <ul className={node.props?.className}>
          <li>列表项 1</li>
          <li>列表项 2</li>
          <li>列表项 3</li>
        </ul>
      );

    case "Table":
      // 解析数据源
      let dataSource = [];
      let columns = [];

      try {
        if (node.props?.dataSource) {
          dataSource = JSON.parse(node.props.dataSource);
        }
        if (node.props?.columns) {
          columns = JSON.parse(node.props.columns);
        }
      } catch (error) {
        console.error("表格数据解析错误:", error);
      }

      // 默认数据
      if (dataSource.length === 0) {
        dataSource = [
          { name: "张三", age: 25, city: "北京" },
          { name: "李四", age: 30, city: "上海" },
          { name: "王五", age: 28, city: "广州" },
        ];
      }

      if (columns.length === 0) {
        columns = [
          { key: "name", title: "姓名" },
          { key: "age", title: "年龄" },
          { key: "city", title: "城市" },
        ];
      }

      return (
        <div className={`overflow-x-auto ${node.props?.className || ""}`}>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((col: any, index: number) => (
                  <th
                    key={index}
                    className="border border-gray-300 px-4 py-2 text-left font-semibold"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataSource.map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((col: any, colIndex: number) => (
                    <td
                      key={colIndex}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div className="text-gray-500">未知组件: {node.type}</div>;
  }
}
