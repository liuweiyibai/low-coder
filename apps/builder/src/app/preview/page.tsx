/**
 * Preview Page - 预览页面
 */

"use client";

import { useEffect, useState } from "react";
import { PageRenderer } from "@low-coder/runtime/react";
import { X, Monitor, Tablet, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PageSchema } from "@low-coder/schema-core";

type DeviceType = "desktop" | "tablet" | "mobile";

// 设备尺寸配置
const DEVICE_SIZES = {
  desktop: {
    width: "100%",
    maxWidth: "1280px",
    label: "桌面",
  },
  tablet: {
    width: "768px",
    maxWidth: "768px",
    label: "平板",
  },
  mobile: {
    width: "375px",
    maxWidth: "375px",
    label: "手机",
  },
};

export default function PreviewPage() {
  const router = useRouter();
  const [schema, setSchema] = useState<PageSchema | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    // 从 localStorage 读取预览数据
    const previewData = localStorage.getItem("preview-schema");
    const savedDevice = localStorage.getItem("preview-device") as DeviceType;

    if (previewData) {
      try {
        setSchema(JSON.parse(previewData));
      } catch (error) {
        console.error("Failed to parse preview schema:", error);
      }
    }

    if (savedDevice && ["desktop", "tablet", "mobile"].includes(savedDevice)) {
      setDeviceType(savedDevice);
    }
  }, []);

  const handleClose = () => {
    router.push("/");
  };

  if (!schema) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">加载预览中...</div>
        </div>
      </div>
    );
  }

  const deviceSize = DEVICE_SIZES[deviceType];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      {/* 预览顶部工具栏 */}
      <div className="h-14 bg-gray-900 text-white flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">预览模式</div>
          <div className="text-xs text-gray-400">{schema.name}</div>
        </div>

        {/* 设备切换按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceType("desktop")}
            className={`p-2 rounded-lg transition-colors ${
              deviceType === "desktop"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="桌面视图"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType("tablet")}
            className={`p-2 rounded-lg transition-colors ${
              deviceType === "tablet"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="平板视图"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType("mobile")}
            className={`p-2 rounded-lg transition-colors ${
              deviceType === "mobile"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
            }`}
            title="手机视图"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="关闭预览"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 预览内容区域 */}
      <div className="flex-1 overflow-auto p-8">
        <div
          className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: deviceSize.width,
            maxWidth: deviceSize.maxWidth,
            minHeight: "600px",
          }}
        >
          <PageRenderer
            schema={schema}
            components={{
              Container: ({ children, style, className }) => (
                <div style={style} className={className}>
                  {children}
                </div>
              ),
              Row: ({ children, style, className }) => (
                <div
                  style={{ ...style, display: "flex", flexDirection: "row" }}
                  className={className}
                >
                  {children}
                </div>
              ),
              Column: ({ children, style, className }) => (
                <div
                  style={{ ...style, display: "flex", flexDirection: "column" }}
                  className={className}
                >
                  {children}
                </div>
              ),
              Text: ({ content, style, className }) => (
                <div
                  style={style}
                  className={className}
                  dangerouslySetInnerHTML={{ __html: content || "文本内容" }}
                />
              ),
              Button: ({
                content,
                variant,
                style,
                className,
                onClick,
                href,
              }) => {
                // 映射 variant 到 shadcn UI 的 variant
                const variantMap: Record<string, any> = {
                  primary: "default",
                  secondary: "secondary",
                  danger: "destructive",
                  outline: "outline",
                  ghost: "ghost",
                  link: "link",
                };

                const buttonVariant =
                  variantMap[variant || "primary"] || "default";

                // 过滤掉 className 中的颜色相关类
                const filteredClassName = className
                  ?.split(" ")
                  .filter(
                    (cls: string) =>
                      !cls.startsWith("bg-") &&
                      !cls.startsWith("text-") &&
                      !cls.startsWith("hover:bg-") &&
                      !cls.startsWith("hover:text-"),
                  )
                  .join(" ");

                const handleClick = () => {
                  if (href) {
                    window.open(href, "_blank");
                  } else if (onClick) {
                    onClick();
                  }
                };

                return (
                  <Button
                    variant={buttonVariant}
                    style={style}
                    className={filteredClassName}
                    onClick={handleClick}
                  >
                    {content || "按钮"}
                  </Button>
                );
              },
              Image: ({ src, alt, style, className }) => (
                <img
                  src={src || "https://via.placeholder.com/400x300"}
                  alt={alt || "图片"}
                  style={style}
                  className={className}
                />
              ),
              Table: ({ dataSource, columns, style, className }) => {
                let data = [];
                let cols = [];

                try {
                  data =
                    typeof dataSource === "string"
                      ? JSON.parse(dataSource)
                      : dataSource;
                } catch (e) {
                  data = [];
                }

                try {
                  cols =
                    typeof columns === "string" ? JSON.parse(columns) : columns;
                } catch (e) {
                  cols = [];
                }

                return (
                  <div style={style} className={className}>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          {cols.map((col: any, idx: number) => (
                            <th
                              key={idx}
                              className="border border-gray-300 px-4 py-2 bg-gray-100"
                            >
                              {col.title}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row: any, rowIdx: number) => (
                          <tr key={rowIdx}>
                            {cols.map((col: any, colIdx: number) => (
                              <td
                                key={colIdx}
                                className="border border-gray-300 px-4 py-2"
                              >
                                {row[col.dataIndex]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
