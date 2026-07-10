import { Colors, Fonts, IconSize, Radius } from "@/constants/theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface Diary {
  id: string;
  emotion: Emotion;
  createdAt: Date;
  preview: string;
  audioPath: string;
}

export type Emotion = "happy" | "neutral" | "sad" | "angry" | "tired";
const EMOTION_ICONS: Record<Emotion, ComponentProps<typeof Ionicons>["name"]> =
  {
    happy: "happy-outline",
    neutral: "remove-circle-outline",
    sad: "sad-outline",
    angry: "flame",
    tired: "bed-outline",
  };

interface Props {
  diary: Diary;
  onPress: () => void;
}

// 일기 셀 날짜, 시간, 감정 배지, 미리보기
export const DiaryCell = ({ diary, onPress }: Props) => {
  const { t, i18n } = useTranslation();

  const emotionColor = Colors.emotion[diary.emotion];
  const emotionLabel = t(`diary.emotion.${diary.emotion}`);

  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(diary.createdAt);

  // 시간 12시간제, 분
  const formattedTime = new Intl.DateTimeFormat(i18n.language, {
    hour: "numeric",
    minute: "2-digit",
  }).format(diary.createdAt);

  // VoiceOver용 요일
  const formattedDateFull = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(diary.createdAt);

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={t("diary.accessibilityLabel", {
        date: formattedDateFull,
        emotion: emotionLabel,
        preview: diary.preview,
      })}
    >
      <View style={styles.dateRow}>
        <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
          {formattedDate}
        </Text>
        <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
          {formattedTime}
        </Text>
      </View>

      <View style={styles.emotionRow}>
        <Ionicons
          name={EMOTION_ICONS[diary.emotion]}
          size={IconSize.content}
          color={emotionColor}
        />
        <Text
          style={[styles.emotionLabel, { color: emotionColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {emotionLabel}
        </Text>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {diary.preview}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 20,
    gap: 6,
    minHeight: 96,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  date: {
    flexShrink: 1,
    fontSize: 19,
    fontFamily: Fonts.sansBold,
    color: Colors.textPrimary,
  },
  time: {
    fontSize: 14,
    fontFamily: Fonts.sansSemibold,
    color: Colors.textSecondary,
  },
  emotionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emotionLabel: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: Fonts.sansSemibold,
  },
  preview: {
    fontSize: 16,
    fontFamily: Fonts.sans,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
});
