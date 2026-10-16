import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const STORAGE_KEY = "haptic_enabled";

let isEnabled = true;

export const loadHapticSetting = async () => {
  isEnabled = (await AsyncStorage.getItem(STORAGE_KEY)) !== "false";

  return isEnabled;
};

export const setHapticEnabled = async (enabled: boolean) => {
  isEnabled = enabled;
  await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
};

export const hapticLight = async () => {
  if (isEnabled) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const hapticMedium = async () => {
  if (isEnabled) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

export const hapticSuccess = async () => {
  if (isEnabled) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

export const hapticWarning = async () => {
  if (isEnabled) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};
