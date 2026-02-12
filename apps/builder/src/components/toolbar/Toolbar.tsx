/**
 * Toolbar - 顶部工具栏
 */

"use client";

import { useState, useEffect } from "react";
import {
  Undo,
  Redo,
  Save,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Layout,
  Settings,
  FileText,
  User,
  LogOut,
  Upload,
  FolderOpen,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditorStore } from "@/store/editor";
import { AuthModal } from "../auth/AuthModal";
import { PublishModal } from "../publish/PublishModal";
import { useSession, signOut } from "next-auth/react";

export function Toolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    schema,
    deviceType,
    setDeviceType,
    saveDraft,
  } = useEditorStore();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [hasDraftState, setHasDraftState] = useState(false);

  // 在客户端检查草稿状态，避免 hydration 错误
  useEffect(() => {
    setHasDraftState(localStorage.getItem("editor-draft") !== null);
  }, [schema]); // 当 schema 变化时重新检查

  // 检查 URL 参数，是否需要打开登录弹窗
  useEffect(() => {
    const needLogin = searchParams.get("needLogin");
    if (needLogin === "true" && !session?.user) {
      setShowAuthModal(true);
      // 清除 URL 参数
      router.replace("/");
    }
  }, [searchParams, session, router]);

  const handlePreview = () => {
    // 将当前 schema 和设备类型保存到 localStorage
    localStorage.setItem("preview-schema", JSON.stringify(schema));
    localStorage.setItem("preview-device", deviceType);
    // 打开预览页面
    window.open("/preview", "_blank");
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* 左侧 - Logo 和项目名 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Layout className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-lg">Low-Coder</span>
        </div>
        <div className="h-6 w-px bg-gray-300" />
        <button
          onClick={() => router.push("/pages")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          title="页面管理"
        >
          <FolderOpen className="w-4 h-4" />
          <span>我的页面</span>
        </button>
        <div className="h-6 w-px bg-gray-300" />
        <span className="text-sm text-gray-600">
          {schema.name || "未命名页面"}
        </span>
      </div>

      {/* 中间 - 操作按钮 */}
      <div className="flex items-center gap-2">
        <ToolbarButton
          icon={<Undo className="w-4 h-4" />}
          label="撤销"
          onClick={() => undo()}
          disabled={!canUndo()}
        />
        <ToolbarButton
          icon={<Redo className="w-4 h-4" />}
          label="重做"
          onClick={() => redo()}
          disabled={!canRedo()}
        />

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <ToolbarButton
          icon={<Monitor className="w-4 h-4" />}
          label="桌面"
          active={deviceType === "desktop"}
          onClick={() => setDeviceType("desktop")}
        />
        <ToolbarButton
          icon={<Tablet className="w-4 h-4" />}
          label="平板"
          active={deviceType === "tablet"}
          onClick={() => setDeviceType("tablet")}
        />
        <ToolbarButton
          icon={<Smartphone className="w-4 h-4" />}
          label="手机"
          active={deviceType === "mobile"}
          onClick={() => setDeviceType("mobile")}
        />
      </div>

      {/* 右侧 - 预览和保存 */}
      <div className="flex items-center gap-2">
        {hasDraftState && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            <FileText className="w-3 h-3" />
            <span>草稿已保存</span>
          </div>
        )}

        {/* 用户登录状态 */}
        {status === "loading" ? (
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        ) : session?.user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="退出登录"
            >
              <LogOut className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            <span>登录</span>
          </button>
        )}

        <ToolbarButton
          icon={<Eye className="w-4 h-4" />}
          label="预览"
          onClick={handlePreview}
        />
        <button
          onClick={() => setShowPublishModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          <span>发布</span>
        </button>
        <ToolbarButton icon={<Settings className="w-4 h-4" />} label="设置" />
        <button
          onClick={() => {
            if (!session?.user) {
              setShowAuthModal(true);
              return;
            }
            saveDraft();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          保存草稿
        </button>
      </div>

      {/* 登录弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* 发布弹窗 */}
      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          onNeedLogin={() => setShowAuthModal(true)}
        />
      )}
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-md transition-colors
        ${
          active
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100 text-gray-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      title={label}
    >
      {icon}
    </button>
  );
}
