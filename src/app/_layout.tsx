import "@/locales/i18n";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

import { initDatabase } from "@/db/database";

// DB 초기화
initDatabase();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Executorch 초기화
  initExecutorch({
    resourceFetcher: ExpoResourceFetcher,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* 헤더 안 보이게 */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="(modals)/record"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
