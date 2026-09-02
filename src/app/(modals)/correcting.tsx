import { Layout, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useAITasks } from "@/hooks/use-ai-tasks";
import { RecordResult } from "@/hooks/use-recording";
import { useTheme } from "@/hooks/use-theme";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

// 딜레이 취소 시간
const CANCEL_BUTTON_DELAY_SECONDS = 5;

export default function CorrectingModal() {
  const { t } = useTranslation();
  const color = useTheme();

  const { text, audioUri } = useLocalSearchParams<RecordResult>();
  const originalText = text ?? "";

  const { correctText, detectEmotion, isReady, interrupt } = useAITasks();

  const [isDetectingEmotion, setIsDetectingEmotion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 반복 교정 방지
  const hasCorrectedRef = useRef(false);

  // 취소 후 도착 한 결과 무시
  const isCancelledRef = useRef(false);

  const toCorrection = useCallback(
    (content: string, emotion: string, announcement: string) => {
      router.replace({
        pathname: "/correction",
        params: {
          text: originalText,
          content,
          audioUri: audioUri ?? "",
          emotion,
          announcement,
        },
      });
    },
    [originalText, audioUri],
  );

  useEffect(() => {
    // 모델 로드가 끝나기 전까지 대기
    if (!isReady || hasCorrectedRef.current || !originalText) {
      return;
    }

    hasCorrectedRef.current = true;

    const run = async () => {
      try {
        const corrected = await correctText(originalText);

        if (isCancelledRef.current) {
          return;
        }

        setIsDetectingEmotion(true);

        const detected = await detectEmotion(corrected);

        if (isCancelledRef.current) {
          return;
        }

        toCorrection(corrected, detected ?? "", "done");
      } catch {
        // 실패 시 원본으로
        if (!isCancelledRef.current) {
          toCorrection(originalText, "", "failed");
        }
      }
    };

    run();
  }, [isReady, originalText, correctText, detectEmotion, toCorrection]);

  // 대기 경과 시간
  useEffect(() => {
    const now = Date.now();
    const id = setInterval(
      () => setElapsedSeconds(Math.floor((Date.now() - now) / 1000)),
      1000,
    );

    return () => clearInterval(id);
  }, []);

  const handleCancel = () => {
    isCancelledRef.current = true;
    interrupt();
    toCorrection(originalText, "", "cancelled");
  };

  return (
    <View style={[styles.root, { backgroundColor: color.surface }]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text
          style={[styles.status, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {isDetectingEmotion
            ? t("correction.detectingEmotion")
            : t("correction.correcting")}
        </Text>
        <Text style={[styles.elapsed, { color: color.textSecondary }]}>
          {t("correction.elapsed", { seconds: elapsedSeconds })}
        </Text>

        {elapsedSeconds >= CANCEL_BUTTON_DELAY_SECONDS ? (
          <Pressable
            onPress={handleCancel}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel={t("correction.cancel")}
          >
            <Text style={[styles.cancelLabel, { color: color.error }]}>
              {t("correction.cancel")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  cancelButton: {
    justifyContent: "center",
    minHeight: TouchSize.min,
  },
  cancelLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
});
