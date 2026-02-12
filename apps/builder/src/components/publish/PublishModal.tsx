/**
 * 发布页面对话框
 */

"use client";

import { useState } from "react";
import { X, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { useEditorStore } from "@/store/editor";
import { useSession } from "next-auth/react";

interface PublishModalProps {
  onClose: () => void;
  onNeedLogin: () => void;
}

export function PublishModal({ onClose, onNeedLogin }: PublishModalProps) {
  const { data: session } = useSession();
  const schema = useEditorStore((state) => state.schema);
  const [pageName, setPageName] = useState(schema.name || "未命名页面");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handlePublish = async () => {
    // 检查登录状态
    if (!session?.user) {
      onClose();
      onNeedLogin();
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pageName,
          schema,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        // 未登录
        onClose();
        onNeedLogin();
        return;
      }

      if (result.success) {
        const fullUrl = `${window.location.origin}${result.data.url}`;
        setPageUrl(fullUrl);
        setPublished(true);
      } else {
        alert("发布失败: " + result.error);
      }
    } catch (error) {
      console.error("发布失败:", error);
      alert("发布失败，请重试");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleOpenPage = () => {
    window.open(pageUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {published ? "发布成功" : "发布页面"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          {!published ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  页面名称
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入页面名称"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  发布后，页面将可以通过唯一链接公开访问。
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  页面链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pageUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">复制</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-1">
                  ✅ 页面已成功发布
                </p>
                <p className="text-sm text-green-700">
                  您可以分享此链接给其他人访问
                </p>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {!published ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={publishing}
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !pageName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>发布中...</span>
                  </>
                ) : (
                  <span>发布</span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleOpenPage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>访问页面</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
