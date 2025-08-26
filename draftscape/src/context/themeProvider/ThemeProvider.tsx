// ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, type ThemeConfig, type Mode } from "./themes";

type ThemeState = {
  mode: Mode;
  themeId: keyof typeof THEMES;
  theme: ThemeConfig;
  setMode: (m: Mode) => void;
  setThemeId: (id: keyof typeof THEMES) => void;
  stickerBasePath: string;
};

const ThemeCtx = createContext<ThemeState | null>(null);

const STORAGE_KEYS = {
  mode: "ficweaver:mode",
  theme: "ficweaver:theme",
};

// ThemeProvider.tsx

function applyAttributes(mode: Mode, theme: ThemeConfig) {
  const root = document.documentElement;
  root.setAttribute("data-mode", mode);
  root.setAttribute("data-theme", theme.id);

  const c = theme.colors[mode];
  root.style.setProperty("--color-bg", c.bg);
  root.style.setProperty("--color-panel", c.panel);
  root.style.setProperty("--color-panelAlt", c.panelAlt);  // ✅ NEW
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-border", c.border);
  root.style.setProperty("--color-accent", c.accent);
  root.style.setProperty("--color-accentText", c.accentText);
  root.style.setProperty("--color-warningBg", c.warningBg);
  root.style.setProperty("--color-warningBorder", c.warningBorder);
  root.style.setProperty("--color-warningText", c.warningText);
  root.style.setProperty("--color-nodeConnection", c.nodeConnection);

  theme.chapterColors[mode].forEach((color, i) => {
    root.style.setProperty(`--chapter-color-${i + 1}`, color);
  });

  root.style.setProperty("--font-ui", theme.fonts.ui);
  root.style.setProperty("--font-display", theme.fonts.display);
  if (theme.fonts.mono) root.style.setProperty("--font-mono", theme.fonts.mono);
  document.documentElement.style.setProperty("--font-ui-scale", String(theme.fonts.scale?.ui ?? 1));
  document.documentElement.style.setProperty("--font-display-scale", String(theme.fonts.scale?.display ?? 1));

  root.classList.toggle("dark", mode === "dark");
}




export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.mode) as Mode;
    return stored === "dark" || stored === "light" ? stored : "light";
  });

  const [themeId, setThemeId] = useState<keyof typeof THEMES>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) as keyof typeof THEMES | null;
    return saved && THEMES[saved] ? saved : "default";
  });

  const theme = useMemo(() => THEMES[themeId], [themeId]);

  // Immediate theme application on mount to avoid flash
  useEffect(() => {
    applyAttributes(mode, theme);
  }, []); // runs once on mount

  // Apply whenever mode or theme changes
  useEffect(() => {
    applyAttributes(mode, theme);
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    localStorage.setItem(STORAGE_KEYS.theme, themeId);
  }, [mode, theme, themeId]);

  const value: ThemeState = {
    mode,
    themeId,
    theme,
    setMode,
    setThemeId,
    stickerBasePath: theme.stickerBasePath[mode],
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
