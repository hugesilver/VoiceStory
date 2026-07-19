import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts } from "../../constants/theme";

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 64;
  const TAB_ICON_SIZE = 30;

  const { t } = useTranslation();
  const accessibility = (announcement: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
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
    </Tabs>
  );
}
