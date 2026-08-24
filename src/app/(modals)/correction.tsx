import { Layout, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { RecordResult } from "@/hooks/use-recording";
import { useTextCorrection } from "@/hooks/use-text-correction";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 딜레이 취소 시간
const CANCEL_BUTTON_DELAY_SECONDS = 5;

export default function CorrectionModal() {
  const { t } = useTranslation();
  const color = useTheme();
  const insets = useSafeAreaInsets();

  const { text, audioUri } = useLocalSearchParams<RecordResult>();
  const originalText = text ?? "";

  const { correctText, isAiEnabled, isReady, interrupt } = useTextCorrection();

  // 최종 본문
  const [content, setContent] = useState(originalText);
  // effect는 첫 렌더 뒤에 돌기 때문에, false로 시작하면 결과 화면이 한 번 깜빡이는 이슈가 있음
  // 모델 로드가 끝나기 전에도 기다리는 화면을 보여줘야 하므로 isReady가 아닌 isAiEnabled로 판단
  const [isCorrecting, setIsCorrecting] = useState(
    isAiEnabled && originalText.length > 0,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 반복 교정 방지
  const hasCorrectedRef = useRef(false);

  // 취소 후 도착 한 결과 무시
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // AI 비활성화 상태 or 준비 중 아님
    if (!isReady || hasCorrectedRef.current || !originalText) {
      return;
    }

    hasCorrectedRef.current = true;

    const run = async () => {
      setIsCorrecting(true);
      AccessibilityInfo.announceForAccessibility(t("correction.correcting"));

      try {
        const corrected = await correctText(originalText);

        if (isCancelledRef.current) {
          return;
        }

        setContent(corrected);
        AccessibilityInfo.announceForAccessibility(
          t("correction.announcement.done"),
        );
      } catch {
        // 실패 시 원본으로
      } finally {
        setIsCorrecting(false);
      }
    };

    run();
  }, [isReady, originalText, correctText, t]);

  // 교정 경과 시간
  useEffect(() => {
    if (!isCorrecting) {
      return;
    }

    const now = Date.now();
    const id = setInterval(
      () => setElapsedSeconds(Math.floor((Date.now() - now) / 1000)),
      1000,
    );

    return () => clearInterval(id);
  }, [isCorrecting]);

  const handleCancelCorrection = () => {
    isCancelledRef.current = true;
    interrupt();
    setIsCorrecting(false);
    AccessibilityInfo.announceForAccessibility(
      t("correction.announcement.cancelled"),
    );
  };

  const handleClose = () => {
    Alert.alert(
      t("correction.closeConfirm.title"),
      t("correction.closeConfirm.message"),
      [
        { text: t("correction.closeConfirm.cancel"), style: "cancel" },
        {
          text: t("correction.closeConfirm.confirm"),
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  const handleNext = () => {
    console.debug("본문:", content, "오디오 URI:", audioUri);
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
          {isAiEnabled
            ? t("correction.title")
            : t("correction.titleWithoutAi")}
        </Text>
      </View>

      {isCorrecting ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color.primary} />
          <Text style={[styles.status, { color: color.textPrimary }]}>
            {t("correction.correcting")}
          </Text>
          <Text style={[styles.elapsed, { color: color.textSecondary }]}>
            {t("correction.elapsed", { seconds: elapsedSeconds })}
          </Text>

          {elapsedSeconds >= CANCEL_BUTTON_DELAY_SECONDS ? (
            <Pressable
              onPress={handleCancelCorrection}
              style={styles.textButton}
              accessibilityRole="button"
              accessibilityLabel={t("correction.cancel")}
            >
              <Text style={[styles.textButtonLabel, { color: color.error }]}>
                {t("correction.cancel")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
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
      )}

      {/* 다음 */}
      {!isCorrecting ? (
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
      ) : null}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Layout.screenPadding,
  },
  status: {
    fontSize: 18,
    fontFamily: Fonts.sansMedium,
  },
  elapsed: {
    fontSize: 15,
    fontFamily: Fonts.sans,
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
