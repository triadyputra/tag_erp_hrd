/**
 * Global color & font configuration
 */

import { Platform } from "react-native";

const tintColorLight = "#3B82F6";
const tintColorDark = "#60A5FA";

export const Colors = {
  light: {
    text: "#111827",
    textSecondary: "#6B7280",

    background: "#F8FAFC",
    card: "#FFFFFF",

    primary: "#3B82F6",
    border: "#E5E7EB",

    tint: tintColorLight,
    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: tintColorLight,
  },

  dark: {
    text: "#ECEDEE",
    textSecondary: "#9CA3AF",

    background: "#151718",
    card: "#1F2937",

    primary: "#60A5FA",
    border: "#374151",

    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },

  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },

  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
