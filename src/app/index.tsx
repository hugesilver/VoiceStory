import { useTheme } from "@/hooks/use-theme";
import { isOnboardingCompleted } from "@/utils/onboarding";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

export default function Index() {
  const color = useTheme();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const redirect = async () => {
        let isCompleted: boolean;

        try {
          isCompleted = await isOnboardingCompleted();
        } catch {
          // 완료 상태를 읽지 못해도 빈 화면에 머물지 않도록 온보딩으로 이동한다.
          isCompleted = false;
        }

        if (!active) return;

        if (isCompleted) {
          // 루트 anchor로 생성된 홈 위에 홈을 하나 더 쌓지 않는다.
          router.dismissTo("/(tabs)/home");
        } else {
          router.replace("/onboarding");
        }
      };

      void redirect();

      return () => {
        active = false;
      };
    }, []),
  );

  return <View style={{ flex: 1, backgroundColor: color.surface }} />;
}
