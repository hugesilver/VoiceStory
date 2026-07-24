/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

// 기기 다크모드에 따라 변환, OS 설정이 바뀌면 자동 재렌더돼 컬러 갱신
export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === "unspecified" ? "light" : scheme;

  return Colors[theme];
}
