import { Layout } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

// AI 모델 다운로드 진행률 배너
export const ModelDownloadBanner = () => {
  const { t } = useTranslation();
  const color = useTheme();

  const { downloadProgress } = useAI();

  // 1초마다 남은 시간 갱신
  const [timeRemaining, setTimeRemaining] = useState(-1);

  // 남은 시간 추정의 기준점
  const startRef = useRef<{ time: number; progress: number } | null>(null);

  // 인터벌 콜백은 설치된 렌더의 값을 붙들고 있어 진행률이 낡는다.
  // 상자에 담아두고 실행할 때 꺼내야 최신 값을 쓴다
  const progressRef = useRef(downloadProgress);

  useEffect(() => {
    progressRef.current = downloadProgress;

    if (!startRef.current) {
      startRef.current = { time: Date.now(), progress: downloadProgress };
    }
  });

  // 기준점 이후의 평균 속도로 남은 시간 추정
  useEffect(() => {
    const id = setInterval(() => {
      if (!startRef.current) {
        return;
      }

      const elapsedSeconds = (Date.now() - startRef.current.time) / 1000;
      const progressDelta = progressRef.current - startRef.current.progress;

      setTimeRemaining(
        progressDelta > 0
          ? (1 - progressRef.current) / (progressDelta / elapsedSeconds)
          : -1,
      );
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const percent = Math.round(downloadProgress * 100);

  const getTimeLabel = () => {
    if (timeRemaining < 0) {
      return t("home.modelDownload.calculating");
    }

    if (timeRemaining < 60) {
      return t("home.modelDownload.timeSeconds", {
        seconds: Math.ceil(timeRemaining),
      });
    }

    return t("home.modelDownload.timeMinutes", {
      minutes: Math.ceil(timeRemaining / 60),
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color.card, borderBottomColor: color.border },
      ]}
      accessible
      accessibilityLabel={t("home.modelDownload.accessibility", {
        percent,
        time: getTimeLabel(),
      })}
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: color.textSecondary }]}>
          {t("home.modelDownload.label", { percent })}
        </Text>
        <Text style={[styles.label, { color: color.textSecondary }]}>
          {getTimeLabel()}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: color.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, backgroundColor: color.primary },
          ]}
        />
      </View>

      <Text style={[styles.warning, { color: color.error }]}>
        {t("settings.ai.downloadWarning")}
      </Text>
    </View>
  );
};

const TRACK_HEIGHT = 4;

const styles = StyleSheet.create({
  container: {
    // 화면 좌우 여백을 상쇄해 끝까지 채운다
    marginHorizontal: -Layout.screenPadding,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  warning: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: "hidden",
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
});
