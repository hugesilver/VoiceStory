import { Layout, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useRecording } from "@/hooks/use-recording";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIC_ICON_SIZE = 80;

// 초를 MM:SS로 변환
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export default function RecordModal() {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { isAiEnabled } = useAI();

  const {
    recordingState,
    transcript,
    timer,
    hasPermission,
    recordStart,
    recordStop,
    error,
  } = useRecording();

  // 오류 표시
  const isErrorShownRef = useRef(false);

  // 실패 시
  useEffect(() => {
    if (!error || isErrorShownRef.current) {
      return;
    }

    isErrorShownRef.current = true;

    Alert.alert(t("record.error.title"), t("record.error.message"), [
      {
        text: t("record.error.confirm"),
        onPress: () => {
          isErrorShownRef.current = false;
        },
      },
    ]);
  }, [error, t]);

  const isRecording = recordingState === "recording";
  const isStopping = recordingState === "stopping";
  const permissionDenied = hasPermission === false;

  // 녹음 중이거나 받아쓴 내용이 있으면 그냥 닫지 않는다
  const handleClose = () => {
    if (!isRecording && !transcript) {
      router.dismissAll();

      return;
    }

    Alert.alert(
      t("record.closeWhileRecording.title"),
      t("record.closeWhileRecording.message"),
      [
        { text: t("record.closeWhileRecording.cancel"), style: "cancel" },
        {
          text: t("record.closeWhileRecording.confirm"),
          style: "destructive",
          onPress: () => router.dismiss(),
        },
      ],
    );
  };

  const handleStop = async () => {
    const { text, audioUri } = await recordStop();

    router.replace({
      pathname: isAiEnabled && text ? "/correcting" : "/correction",
      params: { text, content: text, audioUri: audioUri ?? "", emotion: "" },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      {/* 헤더 닫기 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleClose}
          style={[
            styles.closeButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("record.close")}
        >
          <Ionicons name="close" size={32} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* 본문 상태별 분기 */}
      <View style={styles.body}>
        {isRecording ? (
          <View style={styles.center}>
            <Text style={[styles.label, { color: colors.error }]}>
              {t("record.recording.label")}
            </Text>
            <Text style={[styles.timer, { color: colors.textPrimary }]}>
              {formatDuration(timer)}
            </Text>
            <Pressable
              onPress={handleStop}
              style={[styles.recordButton, { backgroundColor: colors.error }]}
              accessibilityRole="button"
              accessibilityLabel={t("record.recording.stopButton")}
            >
              <Ionicons name="stop" size={56} color="#FFFFFF" />
            </Pressable>
            <Text
              style={[styles.transcript, { color: colors.textPrimary }]}
              numberOfLines={4}
            >
              {transcript}
            </Text>
          </View>
        ) : isStopping ? (
          <View style={styles.center}>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              {t("record.stopping.label")}
            </Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.center}>
            <Ionicons
              name="mic-off-outline"
              size={MIC_ICON_SIZE}
              color={colors.textSecondary}
            />
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              {t("record.permission.deniedMessage")}
            </Text>
            <Pressable
              onPress={() => Linking.openSettings()}
              style={[
                styles.settingsButton,
                { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("record.permission.goToSettings")}
            >
              <Text style={[styles.settingsText, { color: colors.onPrimary }]}>
                {t("record.permission.goToSettings")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.center}>
            <Pressable
              onPress={recordStart}
              style={[styles.recordButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={t("record.idle.startButton")}
              accessibilityHint={t("record.idle.instruction")}
            >
              <Ionicons
                name="mic"
                size={MIC_ICON_SIZE}
                color={colors.onPrimary}
              />
            </Pressable>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              {t("record.idle.instruction")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const RECORD_BUTTON_SIZE = 168;

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
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  center: {
    alignItems: "center",
    gap: 20,
  },
  label: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
  timer: {
    fontSize: 56,
    fontFamily: Fonts.sansExtra,
    fontVariant: ["tabular-nums"],
  },
  recordButton: {
    width: RECORD_BUTTON_SIZE,
    height: RECORD_BUTTON_SIZE,
    borderRadius: RECORD_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  transcript: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    textAlign: "center",
    lineHeight: 28,
  },
  instruction: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  settingsButton: {
    flexDirection: "row",
    height: 64,
    paddingHorizontal: 28,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsText: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
  },
});
