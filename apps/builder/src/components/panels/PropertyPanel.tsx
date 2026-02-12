/**
 * Property Panel - 属性面板
 */

"use client";

import { useEditorStore } from "@/store/editor";
import { Settings, X } from "lucide-react";

export function PropertyPanel() {
  const schema = useEditorStore((state) => state.schema);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const updateNode = useEditorStore((state) => state.updateNode);
  const selectNode = useEditorStore((state) => state.selectNode);

  const selectedNode = selectedNodeId
    ? findNodeById(schema.root, selectedNodeId)
    : null;

  if (!selectedNode) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">属性面板</h2>
        </div>
        <div className="text-center text-gray-500 text-sm py-8">
          请选择一个组件
        </div>
      </div>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    console.log("PropertyPanel - handlePropChange:", {
      nodeId: selectedNode.id,
      nodeType: selectedNode.type,
      key,
      value,
      currentProps: selectedNode.props,
    });
    updateNode(selectedNode.id, {
      props: {
        ...selectedNode.props,
        [key]: value,
      },
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-900">属性面板</h2>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="space-y-4">
        {/* 组件类型 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            组件类型
          </label>
          <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
            {selectedNode.type}
          </div>
        </div>

        {/* ID */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            组件 ID
          </label>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
            {selectedNode.id}
          </div>
        </div>

        {/* 动态属性编辑器 */}
        {renderPropertyEditor(selectedNode, handlePropChange)}
      </div>
    </div>
  );
}

/**
 * 渲染属性编辑器
 */
function renderPropertyEditor(
  node: any,
  onChange: (key: string, value: any) => void,
) {
  const props = node.props || {};

  // 容器组件
  if (
    node.type === "Container" ||
    node.type === "Row" ||
    node.type === "Column"
  ) {
    return (
      <>
        <PropertyInput
          label="样式类名"
          value={props.className || ""}
          onChange={(value) => onChange("className", value)}
        />
        <PropertyInput
          label="背景图片 URL"
          value={props.backgroundImage || ""}
          onChange={(value) => onChange("backgroundImage", value)}
          placeholder="https://example.com/image.jpg"
        />
        <PropertySelect
          label="背景尺寸"
          value={props.backgroundSize || "cover"}
          options={[
            { label: "覆盖 (cover)", value: "cover" },
            { label: "包含 (contain)", value: "contain" },
            { label: "拉伸 (100% 100%)", value: "100% 100%" },
            { label: "原始尺寸 (auto)", value: "auto" },
          ]}
          onChange={(value) => onChange("backgroundSize", value)}
        />
        <PropertySelect
          label="背景位置"
          value={props.backgroundPosition || "center"}
          options={[
            { label: "居中 (center)", value: "center" },
            { label: "顶部 (top)", value: "top" },
            { label: "底部 (bottom)", value: "bottom" },
            { label: "左侧 (left)", value: "left" },
            { label: "右侧 (right)", value: "right" },
          ]}
          onChange={(value) => onChange("backgroundPosition", value)}
        />
        <PropertySelect
          label="背景重复"
          value={props.backgroundRepeat || "no-repeat"}
          options={[
            { label: "不重复 (no-repeat)", value: "no-repeat" },
            { label: "重复 (repeat)", value: "repeat" },
            { label: "横向重复 (repeat-x)", value: "repeat-x" },
            { label: "纵向重复 (repeat-y)", value: "repeat-y" },
          ]}
          onChange={(value) => onChange("backgroundRepeat", value)}
        />
        <PropertyInput
          label="最小高度"
          value={props.minHeight || ""}
          onChange={(value) => onChange("minHeight", value)}
          placeholder="100vh, 500px"
        />
      </>
    );
  }

  // 文本组件
  if (node.type === "Text") {
    return (
      <>
        <PropertyInput
          label="文本内容"
          value={props.content || ""}
          onChange={(value) => onChange("content", value)}
        />
        <PropertyInput
          label="样式类名"
          value={props.className || ""}
          onChange={(value) => onChange("className", value)}
        />
      </>
    );
  }

  // 按钮组件
  if (node.type === "Button") {
    return (
      <>
        <PropertyInput
          label="按钮文本"
          value={props.text || ""}
          onChange={(value) => onChange("text", value)}
        />
        <PropertyInput
          label="点击事件 (JavaScript)"
          type="textarea"
          value={props.onClick || ""}
          onChange={(value) => onChange("onClick", value)}
          placeholder="console.log('按钮被点击'); alert('提交成功!');"
        />
        <PropertyInput
          label="跳转链接"
          value={props.href || ""}
          onChange={(value) => onChange("href", value)}
          placeholder="https://example.com"
        />
        <PropertySelect
          label="按钮类型"
          value={props.variant || "primary"}
          options={[
            { label: "主要按钮", value: "primary" },
            { label: "次要按钮", value: "secondary" },
            { label: "危险按钮", value: "danger" },
            { label: "轮廓按钮", value: "outline" },
            { label: "幽灵按钮", value: "ghost" },
            { label: "链接按钮", value: "link" },
          ]}
          onChange={(value) => onChange("variant", value)}
        />
        <PropertyInput
          label="样式类名"
          value={props.className || ""}
          onChange={(value) => onChange("className", value)}
        />
      </>
    );
  }

  // 图片组件
  if (node.type === "Image") {
    return (
      <>
        <PropertyInput
          label="图片地址"
          value={props.src || ""}
          onChange={(value) => onChange("src", value)}
          placeholder="https://example.com/image.jpg"
        />
        <PropertyInput
          label="替代文本"
          value={props.alt || ""}
          onChange={(value) => onChange("alt", value)}
        />
        <PropertySelect
          label="显示模式"
          value={props.objectFit || "cover"}
          options={[
            { label: "覆盖 (cover)", value: "cover" },
            { label: "包含 (contain)", value: "contain" },
            { label: "填充 (fill)", value: "fill" },
            { label: "原始尺寸 (none)", value: "none" },
          ]}
          onChange={(value) => onChange("objectFit", value)}
        />
        <PropertyInput
          label="宽度"
          value={props.width || ""}
          onChange={(value) => onChange("width", value)}
          placeholder="100%, 500px, auto"
        />
        <PropertyInput
          label="高度"
          value={props.height || ""}
          onChange={(value) => onChange("height", value)}
          placeholder="100vh, 300px, auto"
        />
        <PropertyInput
          label="样式类名"
          value={props.className || ""}
          onChange={(value) => onChange("className", value)}
        />
      </>
    );
  }

  // 表格组件
  if (node.type === "Table") {
    return (
      <>
        <PropertyInput
          label="表格 ID"
          value={props.tableId || "table1"}
          onChange={(value) => onChange("tableId", value)}
        />
        <PropertyInput
          label="数据源 (JSON)"
          type="textarea"
          value={props.dataSource || ""}
          onChange={(value) => onChange("dataSource", value)}
          placeholder='[{"name":"张三","age":25},{"name":"李四","age":30}]'
        />
        <PropertyInput
          label="列配置 (JSON)"
          type="textarea"
          value={props.columns || ""}
          onChange={(value) => onChange("columns", value)}
          placeholder='[{"key":"name","title":"姓名"},{"key":"age","title":"年龄"}]'
        />
        <PropertyInput
          label="样式类名"
          value={props.className || ""}
          onChange={(value) => onChange("className", value)}
        />
      </>
    );
  }

  // 容器组件
  return (
    <PropertyInput
      label="样式类名"
      value={props.className || ""}
      onChange={(value) => onChange("className", value)}
    />
  );
}

interface PropertyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea";
  placeholder?: string;
}

function PropertyInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: PropertyInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );
}

interface PropertySelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

function PropertySelect({
  label,
  value,
  options,
  onChange,
}: PropertySelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * 查找节点
 */
function findNodeById(node: any, id: string): any {
  if (node.id === id) return node;

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}
