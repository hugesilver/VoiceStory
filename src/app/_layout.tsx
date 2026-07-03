import { useEffect } from "react";

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
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import AppTabs from "@/components/app-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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

  useEffect(() => {
    console.log("폰트 로딩 상태: ", fontsLoaded ? "완료" : "로딩 중");
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsError) {
      console.error("폰트 불러오는 중 오류: ", fontsError);
    }
  }, [fontsError]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
