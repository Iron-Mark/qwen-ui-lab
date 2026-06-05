import type { Dictionary } from "./en";

/** Simplified Chinese stub — hero strings only; falls back to English for missing keys. */
export const zh = {
  hero: {
    badgeDemo: "Qwen 见面会演示",
    badgeOffline: "离线安全 · 即时预览",
    title: "将 UI 截图转为可落地的 React 脚手架",
    subtitle:
      "借助 Qwen3-VL 与 Qwen Code，将 UI 截图转为 React + Tailwind 脚手架。上传、分析、导出只需几分钟——适合现场演示，无需调用生产 API。",
    ctaPrimary: "体验完整流程",
    ctaSecondary: "浏览设计系统",
    trustDemo: "演示模式 — 无需 API 密钥",
    trustOffline: "见面会可离线运行",
    benefitUploadTitle: "从任意截图开始",
    benefitUploadBody: "支持 PNG、JPG、SVG、WebP，或一键加载内置样例。",
    benefitAnalyzeTitle: "先看清结构再写代码",
    benefitAnalyzeBody: "获得布局分析、计划卡片，以及可继续打磨的 React + Tailwind 脚手架。",
    benefitDesignTitle: "用设计系统收尾",
    benefitDesignBody: "浏览原子组件片段与 UX 法则模式，加速最后一步。",
  },
} satisfies Dictionary;
