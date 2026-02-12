/**
 * PageRenderer - React 页面渲染器组件
 *
 * 将 Schema 渲染为 React 组件
 */

import React, { useMemo } from "react";
import type { PageSchema, ComponentNode } from "@low-coder/schema-core";

/**
 * 页面渲染器属性
 */
export interface PageRendererProps {
  /** 页面 Schema */
  schema: PageSchema;
  /** 全局数据上下文 */
  context?: Record<string, any>;
  /** 组件映射表 */
  components?: Record<string, React.ComponentType<any>>;
}

/**
 * 渲染单个节点
 */
function renderNode(
  node: ComponentNode,
  context: Record<string, any> = {},
  components: Record<string, React.ComponentType<any>> = {},
  key?: string,
): React.ReactNode {
  // 检查条件渲染
  if (node.condition) {
    // TODO: 实现条件评估
    // const shouldRender = evaluateCondition(node.condition, context)
    // if (!shouldRender) return null
  }

  // 处理循环渲染
  if (node.loop) {
    // TODO: 实现循环渲染
    // return renderLoop(node, context, components)
  }

  // 获取组件类型
  const Component = components[node.type];

  // 如果没有注册对应的组件，渲染为 div
  if (!Component) {
    return (
      <div
        key={key || node.id}
        data-component-id={node.id}
        data-component-type={node.type}
        style={{
          padding: "8px",
          border: "1px dashed #ccc",
          borderRadius: "4px",
          margin: "4px",
        }}
      >
        <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
          {node.type} (未注册)
        </div>
        {node.children?.map((child: ComponentNode, index: number) =>
          renderNode(child, context, components, `${node.id}-${index}`),
        )}
      </div>
    );
  }

  // 渲染子节点
  const children = node.children?.map((child: ComponentNode, index: number) =>
    renderNode(child, context, components, `${node.id}-${index}`),
  );

  // 渲染插槽
  const slots: Record<string, React.ReactNode> = {};
  if (node.slots) {
    for (const [slotName, slotNodes] of Object.entries(node.slots)) {
      slots[slotName] = (slotNodes as ComponentNode[]).map(
        (slotNode: ComponentNode, index: number) =>
          renderNode(
            slotNode,
            context,
            components,
            `${node.id}-slot-${slotName}-${index}`,
          ),
      );
    }
  }

  // 解析属性（数据绑定）
  const props = {
    ...node.props,
    key: key || node.id,
    "data-component-id": node.id,
    children: children || undefined,
    ...slots,
  };

  return React.createElement(Component, props);
}

/**
 * 页面渲染器组件
 */
export function PageRenderer({
  schema,
  context = {},
  components = {},
}: PageRendererProps) {
  // 渲染页面内容
  const content = useMemo(() => {
    return renderNode(schema.root, context, components);
  }, [schema, context, components]);

  return (
    <div
      data-page-id={schema.id}
      data-page-name={schema.name}
      style={{ width: "100%", height: "100%" }}
    >
      {content}
    </div>
  );
}
