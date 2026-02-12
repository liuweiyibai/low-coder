/**
 * DraftManager - 草稿管理器
 * 自动保存和恢复草稿数据
 */

"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor";

export function DraftManager() {
  const saveDraft = useEditorStore((state) => state.saveDraft);
  const loadDraft = useEditorStore((state) => state.loadDraft);
  const schema = useEditorStore((state) => state.schema);
  const deviceType = useEditorStore((state) => state.deviceType);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);

  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 页面加载时恢复草稿
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const loaded = loadDraft();
      if (loaded) {
        console.log("✅ 已恢复草稿数据");
      }
    }
  }, [loadDraft]);

  // 监听数据变化，自动保存草稿（防抖）
  useEffect(() => {
    if (!isInitialized.current) return;

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 延迟保存（防抖 1 秒）
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [schema, deviceType, selectedNodeId, saveDraft]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveDraft]);

  return null; // 这是一个纯逻辑组件，不渲染任何内容
}
