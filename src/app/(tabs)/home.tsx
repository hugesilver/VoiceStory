import { useTheme } from "@/hooks/use-theme";
import { useAI } from "@/providers/ai-provider";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiaryCell, type Diary } from "../../components/ui/diary-cell";
import { ModelDownloadBanner } from "../../components/ui/model-download-banner";
import { RecordButton } from "../../components/ui/record-button";
import { Layout } from "../../constants/layout";
import { Fonts } from "../../constants/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const color = useTheme();
  const { isReady, downloadProgress } = useAI();

  // 진행률이 0이면 확인 중(디스크의 모델을 로드하는 중)
  const isDownloading =
    !isReady && downloadProgress > 0 && downloadProgress < 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: color.surface }]}>
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

      {/* AI 모델 다운로드 진행률 */}
      {isDownloading ? <ModelDownloadBanner /> : null}

      {/* 리스트 */}
      <FlatList
        style={styles.list}
        data={[] as Diary[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DiaryCell diary={item} onPress={() => {}} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 160,
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
