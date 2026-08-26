import { EMOTION_ICONS, EMOTIONS, type Emotion } from "@/constants/emotion";
import { IconSize, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface EmotionProps {
  selected: Emotion | null;
  onSelect: (emotion: Emotion) => void;
}

export const EmotionPicker = ({ selected, onSelect }: EmotionProps) => {
  const { t } = useTranslation();
  const color = useTheme();

  const handlePress = (emotion: Emotion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(emotion);
    AccessibilityInfo.announceForAccessibility(t(`diary.emotion.${emotion}`));
  };

  return (
    <View style={styles.row}>
      {EMOTIONS.map((emotion) => {
        const isSelected = emotion === selected;
        const label = t(`diary.emotion.${emotion}`);

        return (
          <Pressable
            key={emotion}
            onPress={() => handlePress(emotion)}
            style={[
              styles.item,
              {
                backgroundColor: isSelected ? color.primary : color.card,
                borderColor: isSelected ? color.primary : color.border,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
          >
            <Ionicons
              name={EMOTION_ICONS[emotion]}
              size={IconSize.content}
              color={isSelected ? color.onPrimary : color.textSecondary}
            />
            <Text
              style={[
                styles.label,
                { color: isSelected ? color.onPrimary : color.textSecondary },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  item: {
    flex: 1,
    minHeight: TouchSize.min,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: Radius.chip,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});
