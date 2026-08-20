import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { formatBytes } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const color = useTheme();
  const {
    isAiEnabled,
    isSettingLoaded,
    isDeviceSupported,
    isReady,
    downloadProgress,
    error,
    setAiEnabled,
    getModelSize,
  } = useAI();

  // 모델 용량 조회 진행 상태(비동기)
  const [isPreparing, setIsPreparing] = useState(false);

  // 모델 다운로드 디버깅
  useEffect(() => {
    console.debug(
      `AI 다운로드: ${Math.round(downloadProgress * 100)}%`,
      `준비 상태: ${isReady}`,
      `error: ${error?.message ?? "-"}`,
    );
  }, [downloadProgress, isReady, error]);

  // 진행률이 0이면 다운로드 중이 아님(디스크에서 모델 확인 중일 수 있음)
  const isDownloading = isAiEnabled && !isReady && downloadProgress > 0;

  const getStatusText = () => {
    // AI 모델 미설치
    if (!isAiEnabled) {
      return t("settings.ai.modelNotReady");
    }

    // AI 모델 설치됨
    if (isReady) {
      return t("settings.ai.modelReady");
    }

    // AI 모델 설치 중
    if (downloadProgress > 0) {
      return `${t("settings.ai.modelDownloading")} ${Math.round(downloadProgress * 100)}%`;
    }

    // 확인 중
    return t("settings.ai.modelChecking");
  };

  // AI 모델 다운로드 안내
  const confirmDownload = async () => {
    let size = t("home.aiConsent.unknownSize");

    // 비동기로 용량 조회하기 때문에 indicator로 표시
    setIsPreparing(true);

    try {
      size = formatBytes(await getModelSize());
    } catch {
      // 원격 조회 실패
    }

    setIsPreparing(false);

    // AI 모델 다운로드 안내
    Alert.alert(
      t("home.aiConsent.title"),
      t("home.aiConsent.message", { size }),
      [
        { text: t("home.aiConsent.deny"), style: "cancel" },
        {
          text: t("home.aiConsent.allow"),
          onPress: () => setAiEnabled(true),
        },
      ],
    );
  };

  // 끄면 모델이 삭제되므로 설치가 끝난 상태에서만 확인한다
  const confirmDelete = () => {
    // AI 모델 삭제 확인
    Alert.alert(
      t("settings.ai.deleteConfirmTitle"),
      t("settings.ai.deleteConfirmMessage"),
      [
        { text: t("settings.ai.deleteCancel"), style: "cancel" },
        {
          text: t("settings.ai.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
            await setAiEnabled(false);
          },
        },
      ],
    );
  };

  const handleToggle = (enabled: boolean) => {
    // 토글 켬
    if (enabled) {
      confirmDownload();
      return;
    }

    // 설치 전
    if (!isReady) {
      setAiEnabled(false);
      return;
    }

    // 토글 끔 및 AI 모델 삭제 확인
    confirmDelete();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: color.surface }]}>
      <Text style={[styles.title, { color: color.textPrimary }]}>
        {t("settings.title")}
      </Text>

      <Text style={[styles.section, { color: color.textSecondary }]}>
        {t("settings.section.ai")}
      </Text>

      {/* AI 교정 토글 */}
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: color.textPrimary }]}>
            {t("settings.ai.enableCorrection")}
          </Text>
          <Text style={[styles.hint, { color: color.textSecondary }]}>
            {isDeviceSupported
              ? isAiEnabled
                ? t("settings.ai.enableCorrectionOnHint")
                : t("settings.ai.enableCorrectionOffHint")
              : t("settings.ai.unsupportedMemory")}
          </Text>
        </View>
        {/* 용량 조회 중에 따른 분기 처리 */}
        {isPreparing ? (
          <ActivityIndicator
            size="small"
            color={color.textSecondary}
            style={styles.control}
          />
        ) : (
          <Switch
            value={isAiEnabled}
            onValueChange={handleToggle}
            disabled={!isSettingLoaded || !isDeviceSupported}
            accessibilityLabel={t("settings.ai.enableCorrection")}
          />
        )}
      </View>

      {/* AI 모델 상태 */}
      <View style={styles.row}>
        <Text style={[styles.label, { color: color.textPrimary }]}>
          {t("settings.ai.modelTitle")}
        </Text>
        <Text style={[styles.status, { color: color.textSecondary }]}>
          {getStatusText()}
        </Text>
      </View>

      {isDownloading ? (
        <Text style={[styles.hint, { color: color.textSecondary }]}>
          {t("settings.ai.downloadWarning")}
        </Text>
      ) : null}

      {error ? (
        <Text style={[styles.hint, { color: color.error }]}>
          {error.message}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
    paddingVertical: 16,
  },
  section: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  // 스위치와 너비를 맞춰 교체될 때 행이 흔들리지 않게
  control: {
    width: 52,
  },
  label: {
    fontSize: 17,
    fontFamily: Fonts.sans,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },
  status: {
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
});
