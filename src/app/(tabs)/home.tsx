import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiaryCell, type Diary } from "../../components/ui/diary-cell";
import { RecordButton } from "../../components/ui/record-button";
import { Fonts } from "../../constants/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const color = useTheme();

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
        <RecordButton onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
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
