import { Layout, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CorrectionModal() {
  const { t } = useTranslation();
  const color = useTheme();
  const insets = useSafeAreaInsets();
  const { isAiEnabled } = useAI();

  const {
    text,
    content: correctedText,
    audioUri,
    emotion,
    announcement,
  } = useLocalSearchParams<{
    text: string;
    content: string;
    audioUri: string;
    emotion: string;
    announcement: string;
  }>();

  const originalText = text ?? "";

  // 최종 본문
  const [content, setContent] = useState(correctedText || originalText);

  useEffect(() => {
    if (!announcement) {
      return;
    }

    AccessibilityInfo.announceForAccessibilityWithOptions(
      t(`correction.announcement.${announcement}`),
      { queue: true },
    );
  }, [announcement, t]);

  const handleClose = () => {
    Alert.alert(
      t("correction.closeConfirm.title"),
      t("correction.closeConfirm.message"),
      [
        { text: t("correction.closeConfirm.cancel"), style: "cancel" },
        {
          text: t("correction.closeConfirm.confirm"),
          style: "destructive",
          onPress: () => router.dismiss(),
        },
      ],
    );
  };

  const handleNext = () => {
    router.push({
      pathname: "/save",
      params: {
        text: originalText,
        content,
        audioUri: audioUri ?? "",
        // 파라미터는 문자열만 실을 수 있어 못 고른 경우는 빈 값으로
        emotion: emotion ?? "",
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: color.surface }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleClose}
          style={[
            styles.closeButton,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("correction.close")}
        >
          <Ionicons name="close" size={32} color={color.textPrimary} />
        </Pressable>
        <Text
          style={[styles.title, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {isAiEnabled ? t("correction.title") : t("correction.titleWithoutAi")}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingTop: insets.top + TouchSize.min + 24 },
        ]}
        keyboardDismissMode="interactive"
      >
        {/* AI를 안 쓰면 교정본이 없어 원본과 본문이 같으므로 하나만 보여준다 */}
        {isAiEnabled ? (
          <>
            <Text
              style={[styles.sectionLabel, { color: color.textSecondary }]}
              accessibilityRole="header"
            >
              {t("correction.original")}
            </Text>
            <TextInput
              value={originalText}
              multiline
              editable={false}
              style={[
                styles.input,
                styles.readOnlyInput,
                { color: color.textSecondary, borderColor: color.border },
              ]}
              accessibilityLabel={t("correction.original")}
            />
          </>
        ) : null}

        {/* 최종 본문 */}
        <Text
          style={[styles.sectionLabel, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {isAiEnabled ? t("correction.corrected") : t("correction.body")}
        </Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          multiline
          style={[
            styles.input,
            { color: color.textPrimary, borderColor: color.border },
          ]}
          accessibilityLabel={t("correction.editingLabel")}
          accessibilityHint={t("correction.editingHint")}
        />

        {/* AI 교정 오류 복귀 */}
        {content !== originalText ? (
          <Pressable
            onPress={() => setContent(originalText)}
            style={styles.textButton}
            accessibilityRole="button"
            accessibilityLabel={t("correction.useOriginal")}
          >
            <Text style={[styles.textButtonLabel, { color: color.primary }]}>
              {t("correction.useOriginal")}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* 다음 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: color.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t("correction.next")}
        >
          <Text style={[styles.nextLabel, { color: color.onPrimary }]}>
            {t("correction.next")}
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
    paddingTop: 20,
    paddingBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    paddingTop: 12,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontFamily: Fonts.sans,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    minHeight: 100,
    borderStyle: "dashed",
  },
  textButton: {
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: 48,
  },
  textButtonLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 8,
  },
  nextButton: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  nextLabel: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
});
