import { hapticLight } from "@/utils/haptics";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts } from "../../constants/theme";

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 64;
  const TAB_ICON_SIZE = 30;

  const { t } = useTranslation();
  const color = useTheme();
  const accessibility = (announcement: string) => {
    hapticLight();
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.textSecondary,
        tabBarStyle: {
          backgroundColor: color.card,
          borderTopColor: color.border,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontFamily: Fonts.sansMedium,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
        tabBarIconStyle: {
          width: TAB_ICON_SIZE,
          height: TAB_ICON_SIZE,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: t("tab.home"),
          tabBarAccessibilityLabel: t("tab.home"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => accessibility(t("tab.homeAnnouncement")),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: t("tab.search"),
          tabBarAccessibilityLabel: t("tab.search"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => accessibility(t("tab.searchAnnouncement")),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: t("tab.settings"),
          tabBarAccessibilityLabel: t("tab.settings"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
        listeners={{
          tabPress: () => accessibility(t("tab.settingsAnnouncement")),
        }}
      />
    </Tabs>
  );
}
