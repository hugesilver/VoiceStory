import { getDiaries, type DiaryRow } from "@/db/database";
import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RnExecutorchErrorCode } from "react-native-executorch";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiaryCell, type Diary } from "../../components/ui/diary-cell";
import { ModelDownloadBanner } from "../../components/ui/model-download-banner";
import { RecordButton } from "../../components/ui/record-button";
import { Layout, Radius, TouchSize } from "../../constants/layout";
import { Fonts } from "../../constants/theme";

// 시각에 따른 인사말 키
const greetingKey = (hour: number) => {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
};

const rowToDiary = (row: DiaryRow): Diary => ({
  id: String(row.id),
  emotion: row.emotion,
  createdAt: row.createdAt,
  content: row.content.slice(0, 100), // 100글자까지
  audioPath: row.audioPath,
});

// 빈 상태
const EmptyView = () => {
  const { t } = useTranslation();
  const color = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="mic-outline" size={56} color={color.textSecondary} />
      <Text style={[styles.emptyText, { color: color.textSecondary }]}>
        {t("home.empty.message")}
      </Text>
      <Pressable
        onPress={() => router.push("/record")}
        style={[styles.emptyButton, { backgroundColor: color.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t("home.empty.startButton")}
      >
        <Text style={[styles.emptyButtonText, { color: color.onPrimary }]}>
          {t("home.empty.startButton")}
        </Text>
      </Pressable>
    </View>
  );
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const color = useTheme();
  const { isReady, downloadProgress, error } = useAI();

  const [diaries, setDiaries] = useState<Diary[]>([]);

  const greeting = greetingKey(new Date().getHours());

  // 다운로드 실패는 AI 기능 전체가 막히는 상황이라 놓치지 않게 Alert으로 알린다
  // 취소는 사용자 의도이므로 제외
  useEffect(() => {
    if (!error || error.code === RnExecutorchErrorCode.DownloadInterrupted) {
      return;
    }

    Alert.alert(
      t("home.modelDownload.errorTitle"),
      t("home.modelDownload.errorMessage"),
    );
  }, [error, t]);

  // 저장 화면에서 넘겨받은 파라미터
  const { saved } = useLocalSearchParams<{ saved?: string }>();

  // expo-router에서 제공하는 화면이 포커스 얻을 때마다 실행
  // 저장 화면에서 새 일기가 들어와도 홈은 이미 마운트된 상태, 들어올 때마다 재호출
  useFocusEffect(
    useCallback(() => {
      setDiaries(getDiaries().map(rowToDiary));
    }, []),
  );

  // 저장 완료 안내
  useFocusEffect(
    useCallback(() => {
      if (saved !== "true") {
        return;
      }

      // 탭을 이동으로 인해 중복 발화 방지
      router.setParams({ saved: "" });

      AccessibilityInfo.announceForAccessibilityWithOptions(
        t("save.announcement.saved"),
        { queue: true },
      );
    }, [saved, t]),
  );

  // 진행률이 0이면 확인 중(디스크의 모델을 로드하는 중)
  const isDownloading =
    !isReady && downloadProgress > 0 && downloadProgress < 1;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: color.surface }]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/images/logo-mark.png")}
          style={[styles.headerLogo, { tintColor: color.primary }]}
          accessibilityIgnoresInvertColors
        />
        <Text style={[styles.headerTitle, { color: color.primary }]}>
          {t("common.appName")}
        </Text>
      </View>

      {/* 인사말 */}
      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { color: color.textSecondary }]}>
          {t(`home.greeting.${greeting}`)}
        </Text>
        <Text
          style={[styles.hero, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {t("home.hero")}
        </Text>
      </View>

      {/* AI 모델 다운로드 진행률 */}
      {isDownloading ? <ModelDownloadBanner /> : null}

      {/* 리스트 */}
      <FlatList
        style={styles.list}
        data={diaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DiaryCell diary={item} onPress={() => {}} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          diaries.length > 0 ? (
            <Text style={[styles.sectionLabel, { color: color.textSecondary }]}>
              {t("home.recentEntries")}
            </Text>
          ) : null
        }
        ListEmptyComponent={EmptyView}
        showsVerticalScrollIndicator={false}
      />

      {/* 녹음 플로트 버튼 */}
      <View style={styles.fabContainer}>
        <RecordButton onPress={() => router.push("/record")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    flexDirection: "row",
    width: "100%",
    height: 50,
    alignItems: "center",
  },
  headerLogo: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: Fonts.sansExtra,
    letterSpacing: -0.5,
    fontSize: 22,
  },
  greetingBlock: {
    gap: 2,
    marginTop: 8,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    lineHeight: 22,
  },
  hero: {
    fontSize: 32,
    fontFamily: Fonts.sansExtra,
    lineHeight: 38,
  },
  list: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 160,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: Fonts.sans,
  },
  emptyButton: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: Radius.button,
    minWidth: 160,
    minHeight: TouchSize.min,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyButtonText: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
  },
  separator: {
    height: 12,
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 24,
  },
});
