import { Layout, Radius } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { deleteAllDiaries, getDiaries } from "@/db/database";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { clearAllAudio } from "@/utils/audio";
import { formatBytes } from "@/utils/format";
import {
  hapticLight,
  hapticSuccess,
  hapticWarning,
  loadHapticSetting,
  setHapticEnabled,
} from "@/utils/haptics";
import { clearCache, exportDiaries, importDiaries } from "@/utils/transfer";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_VERSION = Constants.expoConfig?.version ?? "";

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

  const [isHapticEnabled, setIsHapticEnabled] = useState(true);

  // 내보내기, 가져오기 진행 중
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    loadHapticSetting().then(setIsHapticEnabled);
  }, []);

  const handleExport = async () => {
    if (getDiaries().length === 0) {
      Alert.alert(
        t("settings.data.exportEmptyTitle"),
        t("settings.data.exportEmptyMessage"),
      );

      return;
    }

    setIsBusy(true);

    try {
      await exportDiaries();
    } catch {
      Alert.alert(
        t("settings.data.exportFailureTitle"),
        t("settings.data.exportFailure"),
      );
    } finally {
      setIsBusy(false);
    }
  };

  // 기존 데이터를 모두 지우므로 반드시 확인을 받는다
  const handleImport = () => {
    Alert.alert(
      t("settings.data.importConfirmTitle"),
      t("settings.data.importConfirmMessage"),
      [
        { text: t("settings.data.importCancel"), style: "cancel" },
        {
          text: t("settings.data.importConfirm"),
          style: "destructive",
          onPress: async () => {
            setIsBusy(true);

            try {
              const result = await importDiaries();

              // 파일 선택을 취소한 경우
              if (!result) {
                return;
              }

              hapticSuccess();

              const added = t("settings.data.importSuccess", {
                count: result.imported,
              });
              const skipped = result.skipped
                ? `\n${t("settings.data.importSkipped", { count: result.skipped })}`
                : "";

              Alert.alert(
                t("settings.data.importSuccessTitle"),
                `${added}${skipped}`,
              );
            } catch {
              Alert.alert(
                t("settings.data.importFailureTitle"),
                t("settings.data.importFailure"),
              );
            } finally {
              setIsBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t("settings.data.clearCacheConfirmTitle"),
      t("settings.data.clearCacheConfirmMessage"),
      [
        { text: t("settings.data.clearCacheCancel"), style: "cancel" },
        {
          text: t("settings.data.clearCacheConfirm"),
          onPress: () => {
            clearCache();
            Alert.alert(t("settings.data.clearCacheSuccess"));
          },
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(
      t("settings.data.resetConfirmTitle"),
      t("settings.data.resetConfirmMessage"),
      [
        { text: t("settings.data.resetCancel"), style: "cancel" },
        {
          text: t("settings.data.resetConfirm"),
          style: "destructive",
          onPress: () => {
            deleteAllDiaries();
            clearAllAudio();
            hapticWarning();
            Alert.alert(t("settings.data.resetSuccess"));
          },
        },
      ],
    );
  };

  const handleHapticToggle = (enabled: boolean) => {
    setIsHapticEnabled(enabled);
    setHapticEnabled(enabled);

    if (enabled) {
      hapticLight();
    }
  };

  // RAM 확인
  useEffect(() => {
    const bytes = Device.totalMemory;

    console.debug(
      "RAM:",
      bytes,
      bytes === null ? "" : `(${(bytes / 1024 ** 3).toFixed(2)} GiB)`,
      `지원: ${isDeviceSupported}`,
    );
  }, [isDeviceSupported]);

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

  // 확인 중에는 모델이 디스크에 있는지 확인하는 중이므로 토글을 막음
  const isChecking = isAiEnabled && !isReady && downloadProgress === 0;

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

  // AI 모델 안내
  const aiModelHintText = !isDeviceSupported
    ? t("settings.ai.unsupportedMemory")
    : isAiEnabled
      ? t("settings.ai.enableCorrectionOnHint")
      : t("settings.ai.enableCorrectionOffHint");

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
            hapticWarning();
            await setAiEnabled(false);
          },
        },
      ],
    );
  };

  const handleToggle = (enabled: boolean) => {
    hapticLight();

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
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: color.surface }]}
    >
      {/* header 역할을 줘야 스크린 리더에서 제목 단위로 건너뛸 수 있다 */}
      <Text
        style={[styles.title, { color: color.textPrimary }]}
        accessibilityRole="header"
      >
        {t("settings.title")}
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[styles.section, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("settings.section.ai")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
        >
          {/* AI 교정 토글 */}
          <View style={styles.row}>
            <View
              style={styles.rowText}
              accessible
              accessibilityLabel={`${t("settings.ai.enableCorrection")}, ${aiModelHintText}`}
            >
              <Text style={[styles.label, { color: color.textPrimary }]}>
                {t("settings.ai.enableCorrection")}
              </Text>
              <Text style={[styles.hint, { color: color.textSecondary }]}>
                {aiModelHintText}
              </Text>
            </View>
            {/* 용량 조회 중에 따른 분기 처리 */}
            {isPreparing ? (
              <ActivityIndicator
                size="small"
                color={color.textSecondary}
                style={styles.control}
                accessibilityLabel={t("settings.ai.modelChecking")}
              />
            ) : (
              <Switch
                value={isAiEnabled}
                onValueChange={handleToggle}
                disabled={!isSettingLoaded || !isDeviceSupported || isChecking}
                accessibilityLabel={t("settings.ai.enableCorrection")}
                accessibilityHint={
                  isAiEnabled
                    ? t("settings.ai.deleteConfirmMessage")
                    : t("settings.ai.enableCorrectionOnHint")
                }
              />
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: color.border }]} />

          {/* AI 모델 상태 */}
          <View
            style={styles.row}
            accessible
            accessibilityLabel={`${t("settings.ai.modelTitle")}, ${getStatusText()}`}
          >
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
        </View>

        <Text
          style={[styles.section, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("settings.section.data")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
        >
          <Pressable
            onPress={handleExport}
            disabled={isBusy}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={t("settings.data.export")}
            accessibilityState={{ disabled: isBusy }}
          >
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.data.export")}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: color.border }]} />

          <Pressable
            onPress={handleImport}
            disabled={isBusy}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={t("settings.data.import")}
            accessibilityHint={t("settings.data.importHint")}
            accessibilityState={{ disabled: isBusy }}
          >
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.data.import")}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: color.border }]} />

          <Pressable
            onPress={handleClearCache}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={t("settings.data.clearCache")}
          >
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.data.clearCache")}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: color.border }]} />

          <Pressable
            onPress={handleReset}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={t("settings.data.reset")}
          >
            <Text style={[styles.label, { color: color.error }]}>
              {t("settings.data.reset")}
            </Text>
          </Pressable>
        </View>

        <Text
          style={[styles.section, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("settings.section.accessibility")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.accessibility.haptic")}
            </Text>
            <Switch
              value={isHapticEnabled}
              onValueChange={handleHapticToggle}
              accessibilityLabel={t("settings.accessibility.haptic")}
            />
          </View>
        </View>

        <Text
          style={[styles.section, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("settings.section.about")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
        >
          <View
            style={styles.row}
            accessible
            accessibilityLabel={`${t("settings.about.version")}, ${APP_VERSION}`}
          >
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.about.version")}
            </Text>
            <Text style={[styles.status, { color: color.textSecondary }]}>
              {APP_VERSION}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: color.border }]} />

          <Pressable
            onPress={() => router.push("/licenses")}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={t("settings.about.license")}
          >
            <Text style={[styles.label, { color: color.textPrimary }]}>
              {t("settings.about.license")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.sansBold,
    paddingVertical: 16,
  },
  content: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  divider: {
    height: 1,
  },
  section: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
    paddingTop: 20,
    paddingBottom: 10,
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
