import { Colors, IconSize, TouchSize } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";

interface Props {
  onPress: () => void;
}

export const RecordButton = ({ onPress }: Props) => {
  const { t } = useTranslation();

  // Medium 햅틱 후 onPress 실행
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={t("home.recordNew")}
      accessibilityHint={t("home.recordHint")}
    >
      <Ionicons name="mic" size={IconSize.primary} color={Colors.onPrimary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: TouchSize.primary,
    height: TouchSize.primary,
    borderRadius: TouchSize.primary / 2,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
