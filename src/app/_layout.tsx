import "@/locales/i18n";
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
  NotoSans_800ExtraBold,
} from "@expo-google-fonts/noto-sans";
import {
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
  NotoSansJP_600SemiBold,
  NotoSansJP_700Bold,
  NotoSansJP_800ExtraBold,
} from "@expo-google-fonts/noto-sans-jp";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
} from "@expo-google-fonts/noto-sans-kr";
import {
  NotoSansSC_400Regular,
  NotoSansSC_500Medium,
  NotoSansSC_600SemiBold,
  NotoSansSC_700Bold,
  NotoSansSC_800ExtraBold,
} from "@expo-google-fonts/noto-sans-sc";
import {
  NotoSansTC_400Regular,
  NotoSansTC_500Medium,
  NotoSansTC_600SemiBold,
  NotoSansTC_700Bold,
  NotoSansTC_800ExtraBold,
} from "@expo-google-fonts/noto-sans-tc";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

import AppTabs from "@/components/app-tabs";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // 폰트 로드
  let [fontsLoaded, fontsError] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSans_800ExtraBold,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_600SemiBold,
    NotoSansKR_700Bold,
    NotoSansKR_800ExtraBold,
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
    NotoSansJP_600SemiBold,
    NotoSansJP_700Bold,
    NotoSansJP_800ExtraBold,
    NotoSansSC_400Regular,
    NotoSansSC_500Medium,
    NotoSansSC_600SemiBold,
    NotoSansSC_700Bold,
    NotoSansSC_800ExtraBold,
    NotoSansTC_400Regular,
    NotoSansTC_500Medium,
    NotoSansTC_600SemiBold,
    NotoSansTC_700Bold,
    NotoSansTC_800ExtraBold,
  });

  let [iconsLoaded, iconsError] = useFonts(Ionicons.font);

  useEffect(() => {
    console.log("폰트 로드 상태: ", fontsLoaded ? "완료" : "로드 중");
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsError) {
      console.error("폰트 불러오는 중 오류: ", fontsError);
    }
  }, [fontsError]);

  useEffect(() => {
    console.log("아이콘 로드 상태: ", iconsLoaded ? "완료" : "로드 중");
  }, [iconsLoaded]);

  useEffect(() => {
    if (iconsError) {
      console.error("아이콘 불러오는 중 오류: ", iconsError);
    }
  }, [iconsError]);

  // Executorch 초기화
  initExecutorch({
    resourceFetcher: ExpoResourceFetcher,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AppTabs />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
