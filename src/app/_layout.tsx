import "@/locales/i18n";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AIProvider, cleanupLegacyModel } from "@/providers/ai-provider";
import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

import { initDatabase } from "@/db/database";
import { loadHapticSetting } from "@/utils/haptics";

// DB 초기화
initDatabase();

// 햅틱 설정값 로드
loadHapticSetting();

// Executorch 초기화
initExecutorch({
  resourceFetcher: ExpoResourceFetcher,
});

// 레거시 AI 모델 정리
cleanupLegacyModel();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AIProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="(modals)"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </ThemeProvider>
      </AIProvider>
    </SafeAreaProvider>
  );
}
