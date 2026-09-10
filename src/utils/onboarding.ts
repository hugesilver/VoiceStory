import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "onboarding_completed";

export const isOnboardingCompleted = async () =>
  (await AsyncStorage.getItem(STORAGE_KEY)) === "true";

export const completeOnboarding = async () => {
  await AsyncStorage.setItem(STORAGE_KEY, "true");
};
