import { useTheme } from "@/hooks/use-theme";
import { isOnboardingCompleted } from "@/utils/onboarding";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
  const color = useTheme();
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingCompleted().then(setIsCompleted);
  }, []);

  if (isCompleted === null) {
    return <View style={{ flex: 1, backgroundColor: color.surface }} />;
  }

  return <Redirect href={isCompleted ? "/(tabs)/home" : "/onboarding"} />;
}
