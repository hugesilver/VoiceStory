import "@/locales/i18n";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AIProvider, cleanupLegacyModel } from "@/providers/ai-provider";
import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

import { initDatabase } from "@/db/database";
import { loadHapticSetting } from "@/utils/haptics";
import * as Notifications from "expo-notifications";

// 위젯이나 딥링크로 진입할 때 대상 화면 아래에 기본 탭 화면 유지하도록
export const unstable_settings = { anchor: "(tabs)" };

// 앱 켜진 상태에서는 배너로
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
              name="onboarding"
              options={{ presentation: "card" }}
            />
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
