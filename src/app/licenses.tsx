import { IconSize, Layout, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface License {
  name: string;
  license: string;
  copyright: string;
}

// package.json의 직접 의존성 기준. 각 패키지의 LICENSE 파일에서 뽑았다
const LICENSES: License[] = [
  { name: "@expo/ui", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "@react-native-async-storage/async-storage", license: "MIT", copyright: "Copyright (c) 2015-present, Facebook, Inc." },
  { name: "@react-native-vector-icons/ionicons", license: "MIT", copyright: "Copyright (c) 2015 Joel Arvidsson" },
  { name: "expo", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-asset", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-audio", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-build-properties", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-constants", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-device", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-file-system", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-font", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-glass-effect", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-haptics", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-image", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-keep-awake", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-linking", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-localization", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-router", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-speech-recognition", license: "MIT", copyright: "Copyright (c) 2024 jamsch" },
  { name: "expo-splash-screen", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-sqlite", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-status-bar", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-symbols", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-system-ui", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "expo-web-browser", license: "MIT", copyright: "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" },
  { name: "i18next", license: "MIT", copyright: "Copyright (c) 2011-present i18next" },
  { name: "react", license: "MIT", copyright: "Copyright (c) Meta Platforms, Inc. and affiliates." },
  { name: "react-dom", license: "MIT", copyright: "Copyright (c) Meta Platforms, Inc. and affiliates." },
  { name: "react-i18next", license: "MIT", copyright: "Copyright (c) 2015-present i18next" },
  { name: "react-native", license: "MIT", copyright: "Copyright (c) Meta Platforms, Inc. and affiliates." },
  { name: "react-native-executorch", license: "MIT", copyright: "Copyright (c) Software Mansion" },
  { name: "react-native-executorch-expo-resource-fetcher", license: "MIT", copyright: "Copyright (c) Software Mansion" },
  { name: "react-native-gesture-handler", license: "MIT", copyright: "Copyright (c) 2016 Software Mansion <swmansion.com>" },
  { name: "react-native-reanimated", license: "MIT", copyright: "Copyright (c) 2016 Software Mansion <swmansion.com>" },
  { name: "react-native-safe-area-context", license: "MIT", copyright: "Copyright (c) 2019 Th3rd Wave" },
  { name: "react-native-screens", license: "MIT", copyright: "Copyright (c) 2018 Software Mansion <swmansion.com>" },
  { name: "react-native-web", license: "MIT", copyright: "Copyright (c) Nicolas Gallagher." },
  { name: "react-native-worklets", license: "MIT", copyright: "Copyright (c) Software Mansion" },
];

export default function LicensesScreen() {
  const { t } = useTranslation();
  const color = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: color.surface }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons
            name="chevron-back"
            size={IconSize.header}
            color={color.textPrimary}
          />
        </Pressable>
        <Text
          style={[styles.title, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {t("settings.about.license")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: color.textSecondary }]}>
          {t("settings.about.licenseDescription")}
        </Text>

        {LICENSES.map((item) => (
          <View
            key={item.name}
            style={[
              styles.card,
              { backgroundColor: color.card, borderColor: color.border },
            ]}
            accessible
            accessibilityLabel={`${item.name}, ${item.license}, ${item.copyright}`}
          >
            <Text style={[styles.name, { color: color.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.license, { color: color.textSecondary }]}>
              {item.license}
            </Text>
            {item.copyright ? (
              <Text style={[styles.copyright, { color: color.textSecondary }]}>
                {item.copyright}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: TouchSize.min,
    height: TouchSize.min,
    borderRadius: TouchSize.min / 2,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
    gap: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.sans,
    lineHeight: 22,
    paddingBottom: 8,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.sansMedium,
  },
  license: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  copyright: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    lineHeight: 18,
  },
});
