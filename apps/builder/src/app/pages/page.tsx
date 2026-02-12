/**
 * 页面管理界面
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FileText,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Check,
  Loader2,
  Plus,
} from "lucide-react";

interface Page {
  id: string;
  name: string;
  url: string;
  publishedAt: string;
}

export default function PagesManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // 检查登录状态
    if (status === "unauthenticated") {
      alert("请先登录");
      router.push("/?needLogin=true");
      return;
    }

    if (status === "authenticated") {
      fetchPages();
    }
  }, [status, router]);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/publish/list");

      if (response.status === 401) {
        alert("请先登录");
        router.push("/?needLogin=true");
        return;
      }

      const result = await response.json();
      if (result.success) {
        setPages(result.data);
      }
    } catch (error) {
      console.error("获取页面列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    try {
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除页面"${name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/publish?id=${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        alert("请先登录");
        router.push("/?needLogin=true");
        return;
      }

      const result = await response.json();
      if (result.success) {
        setPages(pages.filter((p) => p.id !== id));
      } else {
        alert("删除失败: " + result.error);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    }
  };

  const handleEdit = (id: string) => {
    // 跳转到编辑器，加载该页面
    router.push(`/?pageId=${id}`);
  };

  const handleView = (url: string) => {
    window.open(url, "_blank");
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">页面管理</h1>
            </div>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建页面</span>
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无已发布页面
            </h3>
            <p className="text-gray-500 mb-6">
              在编辑器中设计完页面后，点击"发布"按钮即可发布
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始创建
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div
                key={page.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {page.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(page.publishedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={`${window.location.origin}${page.url}`}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 truncate"
                    />
                    <button
                      onClick={() => handleCopy(page.url, page.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="复制链接"
                    >
                      {copiedId === page.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(page.url)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>访问</span>
                    </button>
                    <button
                      onClick={() => handleEdit(page.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </button>
                    <button
                      onClick={() => handleDelete(page.id, page.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
