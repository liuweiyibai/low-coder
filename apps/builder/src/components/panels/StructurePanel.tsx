/**
 * Structure Panel - 结构树面板
 */

"use client";

import { useEditorStore } from "@/store/editor";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ComponentNode } from "@low-coder/schema-core";

export function StructurePanel() {
  const schema = useEditorStore((state) => state.schema);

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">页面结构</h2>
      <div className="space-y-1">
        <TreeNode node={schema.root} level={0} />
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: ComponentNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);
  const deleteNode = useEditorStore((state) => state.deleteNode);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const canDelete = node.id !== "root";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDelete) {
      deleteNode(node.id);
    }
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer
          hover:bg-gray-100 transition-colors
          ${isSelected ? "bg-blue-100 text-blue-900" : "text-gray-700"}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* 展开/收起图标 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* 节点名称 */}
        <span className="flex-1 text-sm font-medium truncate">{node.type}</span>

        {/* 删除按钮 */}
        {canDelete && isSelected && (
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 子节点 */}
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child: any) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
