/**
 * Canvas - 画布区域
 */

"use client";

import { useEditorStore } from "@/store/editor";
import { CanvasNode } from "./CanvasNode";

// 设备尺寸配置
const DEVICE_SIZES = {
  desktop: {
    width: "100%",
    maxWidth: "1280px",
    minHeight: "600px",
  },
  tablet: {
    width: "768px",
    maxWidth: "768px",
    minHeight: "1024px",
  },
  mobile: {
    width: "375px",
    maxWidth: "375px",
    minHeight: "667px",
  },
};

export function Canvas() {
  const schema = useEditorStore((state) => state.schema);
  const deviceType = useEditorStore((state) => state.deviceType);

  const deviceSize = DEVICE_SIZES[deviceType];

  return (
    <div className="flex-1 overflow-auto p-8 bg-gray-50">
      <div
        className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
        style={{
          width: deviceSize.width,
          maxWidth: deviceSize.maxWidth,
        }}
      >
        {/* 画布内容 */}
        <div style={{ minHeight: deviceSize.minHeight }}>
          <CanvasNode node={schema.root} />
        </div>
      </div>
    </div>
  );
}
