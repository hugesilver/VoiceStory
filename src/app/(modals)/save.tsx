import { EmotionPicker } from "@/components/ui/emotion-picker";
import { EMOTIONS, type Emotion } from "@/constants/emotion";
import { Layout, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { createDiary } from "@/db/database";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { keepAudio } from "@/utils/audio";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SaveModal() {
  const { t, i18n } = useTranslation();
  const color = useTheme();
  const insets = useSafeAreaInsets();
  const { isAiEnabled } = useAI();

  const {
    text,
    content,
    audioUri,
    emotion: detectedParam,
  } = useLocalSearchParams<{
    text: string;
    content: string;
    audioUri: string;
    emotion: string;
  }>();

  const detectedEmotion =
    EMOTIONS.find((value) => value === detectedParam) ?? null;
  const [emotion, setEmotion] = useState<Emotion | null>(detectedEmotion);

  const [isSaving, setIsSaving] = useState(false);

  const now = new Date();

  const dateLabel = now.toLocaleDateString(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const timeLabel = now.toLocaleTimeString(i18n.language, {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleSave = async () => {
    if (!emotion || isSaving) {
      return;
    }

    setIsSaving(true);

    const audioPath = keepAudio(audioUri ?? "");

    createDiary({
      text: text ?? "",
      content: content ?? "",
      emotion,
      audioPath,
    });

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    console.debug("저장 완료:", {
      text,
      content,
      emotion,
      audioPath,
    });

    router.dismissTo({ pathname: "/home", params: { saved: "true" } });
  };

  const canSave = emotion !== null && !isSaving;

  // 감정 힌트 표시 여부
  const showHint = detectedEmotion !== null || isAiEnabled || emotion === null;

  return (
    <View style={[styles.root, { backgroundColor: color.surface }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.closeButton,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="chevron-back" size={32} color={color.textPrimary} />
        </Pressable>
        <Text
          style={[styles.title, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {t("save.title")}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingTop: insets.top + TouchSize.min + 24 },
        ]}
      >
        {/* 날짜 */}
        <View
          accessible
          accessibilityLabel={`${t("save.date")}, ${dateLabel} ${timeLabel}`}
        >
          <Text style={[styles.sectionLabel, { color: color.textSecondary }]}>
            {t("save.date")}
          </Text>
          <Text style={[styles.date, { color: color.textPrimary }]}>
            {dateLabel}
          </Text>
          <Text style={[styles.time, { color: color.textSecondary }]}>
            {timeLabel}
          </Text>
        </View>

        {/* 감정 */}
        <Text
          style={[styles.sectionLabel, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("save.emotionLabel")}
        </Text>

        {showHint ? (
          <View accessible>
            {/* AI 자동 선택 힌트 텍스트 */}
            {detectedEmotion ? (
              <Text style={[styles.hint, { color: color.textSecondary }]}>
                {t("save.emotionDetected", {
                  emotion: t(`diary.emotion.${detectedEmotion}`),
                })}
              </Text>
            ) : isAiEnabled ? (
              <Text style={[styles.hint, { color: color.textSecondary }]}>
                {t("save.emotionDetectFailed")}
              </Text>
            ) : null}

            {/* 저장이 막힌 이유 */}
            {emotion ? null : (
              <Text style={[styles.hint, { color: color.textSecondary }]}>
                {t("save.emotionRequired")}
              </Text>
            )}
          </View>
        ) : null}

        <EmotionPicker selected={emotion} onSelect={setEmotion} />
      </ScrollView>

      {/* 저장 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[
            styles.saveButton,
            { backgroundColor: canSave ? color.primary : color.border },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
          accessibilityLabel={t("save.saveButton")}
          accessibilityHint={
            emotion ? undefined : t("save.emotionRequiredHint")
          }
        >
          <Text style={[styles.saveLabel, { color: color.onPrimary }]}>
            {isSaving ? t("save.saving") : t("save.saveButton")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Layout.screenPadding,
  },
  closeButton: {
    width: TouchSize.min,
    height: TouchSize.min,
    borderRadius: TouchSize.min / 2,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    paddingTop: 12,
  },
  date: {
    fontSize: 20,
    fontFamily: Fonts.sansMedium,
  },
  time: {
    fontSize: 16,
    fontFamily: Fonts.sans,
    paddingTop: 2,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 8,
  },
  saveButton: {
    height: 60,
    borderRadius: Radius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  saveLabel: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
});
