/**
 * Editor Layout - 编辑器主布局
 */

"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { Toolbar } from "../toolbar/Toolbar";
import { ComponentPanel } from "../panels/ComponentPanel";
import { Canvas } from "../canvas/Canvas";
import { PropertyPanel } from "../panels/PropertyPanel";
import { StructurePanel } from "../panels/StructurePanel";
import { DraftManager } from "../draft/DraftManager";
import { useEditorStore } from "@/store/editor";
import type { ComponentNode } from "@low-coder/schema-core";

export function EditorLayout() {
  const showComponentPanel = useEditorStore(
    (state) => state.showComponentPanel,
  );
  const showPropertyPanel = useEditorStore((state) => state.showPropertyPanel);
  const showStructurePanel = useEditorStore(
    (state) => state.showStructurePanel,
  );
  const addNode = useEditorStore((state) => state.addNode);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  const handleDragStart = (event: any) => {
    console.log("Drag started:", event.active.id);
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    console.log("Drag ended:", { active: active?.id, over: over?.id });

    if (!over) {
      setActiveId(null);
      return;
    }

    // 从组件面板拖拽新组件
    if (active.id.toString().startsWith("component-")) {
      const componentData = active.data.current;
      const targetNodeId = over.id;

      console.log("Adding component:", {
        type: componentData.componentType,
        target: targetNodeId,
      });

      const newNode: ComponentNode = {
        id: nanoid(),
        type: componentData.componentType,
        props: componentData.defaultProps,
        children: [],
      };

      addNode(targetNodeId, newNode);
    }

    setActiveId(null);
  };

  // 避免 hydration 错误，等待客户端挂载后再渲染 DndContext
  if (!isMounted) {
    return (
      <>
        <DraftManager />
        <div className="h-screen w-screen flex flex-col bg-gray-50">
          <Toolbar />
          <div className="flex-1 flex overflow-hidden">
            {showComponentPanel && (
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                <ComponentPanel />
              </div>
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Canvas />
            </div>
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {showStructurePanel && (
                <div className="flex-1 border-b border-gray-200 overflow-y-auto">
                  <StructurePanel />
                </div>
              )}
              {showPropertyPanel && (
                <div className="flex-1 overflow-y-auto">
                  <PropertyPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DraftManager />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen w-screen flex flex-col bg-gray-50">
          {/* 顶部工具栏 */}
          <Toolbar />

          {/* 主工作区 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左侧组件面板 */}
            {showComponentPanel && (
              <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                <ComponentPanel />
              </div>
            )}

            {/* 中间画布区 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Canvas />
            </div>

            {/* 右侧面板组 */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              {/* 结构树面板 */}
              {showStructurePanel && (
                <div className="flex-1 border-b border-gray-200 overflow-y-auto">
                  <StructurePanel />
                </div>
              )}

              {/* 属性面板 */}
              {showPropertyPanel && (
                <div className="flex-1 overflow-y-auto">
                  <PropertyPanel />
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg shadow-lg">
              拖拽中...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
