import { CalendarView } from "@/components/ui/calendar-view";
import { DiaryCell, type Diary } from "@/components/ui/diary-cell";
import { Layout, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { getDiaries, searchDiaries, type DiaryRow } from "@/db/database";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SearchState = "idle" | "results" | "empty";

const rowToDiary = (row: DiaryRow): Diary => ({
  id: String(row.id),
  emotion: row.emotion,
  createdAt: row.createdAt,
  content: row.content.slice(0, 100),
  audioPath: row.audioPath,
});

const toDateString = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

export default function SearchScreen() {
  const { t } = useTranslation();
  const color = useTheme();

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Diary>>(null);

  // 포커스 시 입력칸을 화면 위로 올리기 위한 위치
  const searchRowY = useRef(0);

  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [results, setResults] = useState<Diary[]>([]);
  const [state, setState] = useState<SearchState>("idle");

  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();

    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useFocusEffect(
    useCallback(() => {
      setDiaries(getDiaries().map(rowToDiary));
    }, []),
  );

  // state는 비동기라 검색 조건을 인자로 직접 받는다
  const runSearch = (searchKeyword: string, searchDate: Date | null) => {
    const trimmed = searchKeyword.trim();

    if (!trimmed && !searchDate) {
      setState("idle");
      setResults([]);

      return;
    }

    Keyboard.dismiss();
    inputRef.current?.blur();

    const rows = searchDiaries(
      trimmed,
      searchDate ? toDateString(searchDate) : "",
    );
    const found = rows.map(rowToDiary);

    setResults(found);
    setState(found.length > 0 ? "results" : "empty");

    AccessibilityInfo.announceForAccessibility(
      t("search.announcement.results", { count: found.length }),
    );
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    runSearch(keyword, date);
  };

  const handleDateClear = () => {
    setSelectedDate(null);
    runSearch(keyword, null);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: color.surface }]}
    >
      <FlatList
        ref={listRef}
        data={state === "results" ? results : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DiaryCell
            diary={item}
            onPress={() => router.push(`/diary/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        // 키보드가 올라온 만큼 목록이 자동으로 위로 올라가도록
        automaticallyAdjustKeyboardInsets
        ListHeaderComponent={
          <View style={styles.header}>
            <Text
              style={[styles.title, { color: color.textPrimary }]}
              accessibilityRole="header"
            >
              {t("search.title")}
            </Text>

            {/* 날짜 필터 */}
            <View
              style={[
                styles.card,
                { backgroundColor: color.card, borderColor: color.border },
              ]}
            >
              <CalendarView
                year={calendarMonth.year}
                month={calendarMonth.month}
                diaries={diaries}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onMonthChange={(year, month) =>
                  setCalendarMonth({ year, month })
                }
              />

              {selectedDate ? (
                <Pressable
                  onPress={handleDateClear}
                  style={styles.textButton}
                  hitSlop={16}
                  accessibilityRole="button"
                  accessibilityLabel={t("search.dateClear")}
                >
                  <Text
                    style={[styles.textButtonLabel, { color: color.primary }]}
                  >
                    {t("search.dateClear")}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <View
              style={styles.searchRow}
              onLayout={(event) => {
                searchRowY.current = event.nativeEvent.layout.y;
              }}
            >
              <TextInput
                ref={inputRef}
                value={keyword}
                onChangeText={setKeyword}
                onSubmitEditing={() => runSearch(keyword, selectedDate)}
                // 캘린더 아래라 그냥 두면 키보드에 바짝 붙는다. 위로 올려 띄운다
                onFocus={() =>
                  listRef.current?.scrollToOffset({
                    offset: Math.max(searchRowY.current - 16, 0),
                    animated: true,
                  })
                }
                returnKeyType="search"
                placeholder={t("search.placeholder")}
                placeholderTextColor={color.textSecondary}
                autoCorrect={false}
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: color.card,
                    borderColor: color.border,
                    color: color.textPrimary,
                  },
                ]}
                accessibilityLabel={t("search.placeholder")}
              />
              <Pressable
                onPress={() => runSearch(keyword, selectedDate)}
                style={[
                  styles.searchButton,
                  { backgroundColor: color.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("search.searchButton")}
              >
                <Ionicons name="search" size={24} color={color.onPrimary} />
              </Pressable>
            </View>

            {state === "results" ? (
              <Text
                style={[styles.resultCount, { color: color.textSecondary }]}
              >
                {t("search.resultCount", { count: results.length })}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={state === "idle" ? "search-outline" : "document-outline"}
              size={64}
              color={color.textSecondary}
            />
            <Text style={[styles.emptyText, { color: color.textSecondary }]}>
              {state === "idle" ? t("search.noQuery") : t("search.noResult")}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 24,
  },
  header: {
    gap: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.sansBold,
    marginTop: 16,
    marginBottom: 12,
  },
  searchRow: {
    justifyContent: "center",
  },
  input: {
    height: TouchSize.min,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 60,
    fontSize: 18,
    fontFamily: Fonts.sans,
  },
  searchButton: {
    position: "absolute",
    right: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  textButton: {
    justifyContent: "center",
  },
  textButtonLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  resultCount: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: "center",
    gap: 16,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
});
