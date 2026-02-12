/**
 * 公开访问的页面路由
 * /p/[id] - 访问已发布的页面
 */

"use client";

import { use, useEffect, useState } from "react";
import { PageRenderer } from "@low-coder/runtime/react";
import type { PageSchema } from "@low-coder/schema-core";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublishedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params promise
  const { id } = use(params);

  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/publish?id=${id}`);
        const result = await response.json();

        if (result.success) {
          setPage(result.data);
        } else {
          setError(result.error || "页面不存在");
        }
      } catch (err) {
        setError("加载页面失败");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">页面不存在</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageRenderer
        schema={page.schema}
        components={{
          Container: ({ children, className, style }: any) => (
            <div className={className} style={style}>
              {children}
            </div>
          ),
          Row: ({ children, className }: any) => (
            <div className={className || "flex flex-row gap-4"}>{children}</div>
          ),
          Column: ({ children, className }: any) => (
            <div className={className || "flex flex-col gap-4"}>{children}</div>
          ),
          Text: ({ content, className }: any) => (
            <div className={className}>{content || "文本"}</div>
          ),
          Button: ({ text, onClick, href, variant, className }: any) => {
            const handleClick = () => {
              if (onClick) {
                try {
                  const fn = new Function(onClick);
                  fn();
                } catch (error) {
                  console.error("按钮点击事件执行错误:", error);
                }
              }
              if (href) {
                window.open(href, "_blank");
              }
            };

            // 映射 variant 到 shadcn variant
            const variantMap: Record<
              string,
              | "default"
              | "destructive"
              | "outline"
              | "secondary"
              | "ghost"
              | "link"
            > = {
              primary: "default",
              secondary: "secondary",
              danger: "destructive",
              outline: "outline",
              ghost: "ghost",
              link: "link",
            };

            const shadcnVariant = variantMap[variant] || "default";

            // 过滤背景色类
            const filteredClassName = className
              ? className
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

            return (
              <Button
                onClick={handleClick}
                variant={shadcnVariant}
                className={filteredClassName}
              >
                {text || "按钮"}
              </Button>
            );
          },
          Image: ({ src, alt, className, style }: any) => (
            <img
              src={src || "https://via.placeholder.com/400x300"}
              alt={alt || ""}
              className={className}
              style={style}
            />
          ),
          Table: ({ dataSource, columns, tableId }: any) => {
            let data = [];
            let cols = [];

            try {
              data =
                typeof dataSource === "string"
                  ? JSON.parse(dataSource)
                  : dataSource || [];
              cols =
                typeof columns === "string"
                  ? JSON.parse(columns)
                  : columns || [];
            } catch (error) {
              console.error("表格数据解析错误:", error);
            }

            if (cols.length === 0 || data.length === 0) {
              return <div className="text-gray-500 text-sm">暂无数据</div>;
            }

            return (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {cols.map((col: any, index: number) => (
                      <th
                        key={index}
                        className="border border-gray-300 px-4 py-2 text-left"
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {cols.map((col: any, colIndex: number) => (
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
            );
          },
        }}
      />
    </div>
  );
}
