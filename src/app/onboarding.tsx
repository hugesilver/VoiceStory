import { IconSize, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { completeOnboarding } from "@/utils/onboarding";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FeatureBlockProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
}

const FeatureBlock = ({ icon, label }: FeatureBlockProps) => {
  const color = useTheme();

  return (
    <View
      style={[
        styles.feature,
        { backgroundColor: color.card, borderColor: color.border },
      ]}
      accessible
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={IconSize.content} color={color.primary} />
      <Text style={[styles.featureLabel, { color: color.textPrimary }]}>
        {label}
      </Text>
    </View>
  );
};

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const color = useTheme();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: color.surface }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Image
            source={require("../../assets/images/logo-mark.png")}
            style={[styles.logo, { tintColor: color.primary }]}
            accessibilityIgnoresInvertColors
          />
          <Text
            style={[styles.appName, { color: color.primary }]}
            accessibilityRole="header"
          >
            {t("common.appName")}
          </Text>
          <Text style={[styles.subtitle, { color: color.textSecondary }]}>
            {t("onboarding.subtitle")}
          </Text>
        </View>

        <View style={styles.featureList}>
          <FeatureBlock icon="mic-outline" label={t("onboarding.feature1")} />
          <FeatureBlock
            icon="sparkles-outline"
            label={t("onboarding.feature2")}
          />
          <FeatureBlock
            icon="lock-closed-outline"
            label={t("onboarding.feature3")}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleStart}
          style={[styles.startButton, { backgroundColor: color.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.startButton")}
          accessibilityHint={t("onboarding.startHint")}
        >
          <Text style={[styles.startLabel, { color: color.onPrimary }]}>
            {t("onboarding.startButton")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 40,
  },
  brand: {
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 144,
    height: 144,
  },
  appName: {
    fontSize: 36,
    fontFamily: Fonts.sansExtra,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  featureList: {
    gap: 12,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: TouchSize.min,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  featureLabel: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  startButton: {
    height: TouchSize.primary,
    borderRadius: Radius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  startLabel: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
  },
});
