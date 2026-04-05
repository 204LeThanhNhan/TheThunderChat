import { useThemeStore } from "@/stores/useThemeStore";

export const useTheme = () => {
  const { isDark } = useThemeStore();
  
  return { theme: isDark ? "dark" : "light" };
};
