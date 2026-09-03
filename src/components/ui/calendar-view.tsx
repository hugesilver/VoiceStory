import { IconSize, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type Diary } from "./diary-cell";

interface Props {
  year: number;
  month: number; // 0부터 시작
  diaries: Diary[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAY_CIRCLE_SIZE = 44;
const DOT_SIZE = 8;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const CalendarView = ({
  year,
  month,
  diaries,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: Props) => {
  const { t, i18n } = useTranslation();
  const color = useTheme();

  const locale = i18n.language;
  const today = new Date();
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const monthLabel = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month, 1));

  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() + index,
      ),
    ),
  );

  // null은 앞뒤를 채우는 빈 칸
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const diariesOn = (day: number) =>
    diaries.filter((diary) =>
      isSameDay(diary.createdAt, new Date(year, month, day)),
    );

  const goToMonth = (nextYear: number, nextMonth: number) => {
    onMonthChange(nextYear, nextMonth);
    AccessibilityInfo.announceForAccessibility(
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
      }).format(new Date(nextYear, nextMonth, 1)),
    );
  };

  return (
    <View>
      {/* 월 이동 */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() =>
            month === 0 ? goToMonth(year - 1, 11) : goToMonth(year, month - 1)
          }
          style={styles.monthNavButton}
          accessibilityRole="button"
          accessibilityLabel={t("calendar.prevMonth")}
        >
          <Ionicons
            name="chevron-back"
            size={IconSize.header}
            color={color.textPrimary}
          />
        </Pressable>

        <Text
          style={[styles.monthLabel, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {monthLabel}
        </Text>

        <Pressable
          onPress={() =>
            month === 11 ? goToMonth(year + 1, 0) : goToMonth(year, month + 1)
          }
          disabled={isCurrentMonth}
          style={styles.monthNavButton}
          accessibilityRole="button"
          accessibilityLabel={t("calendar.nextMonth")}
          accessibilityState={{ disabled: isCurrentMonth }}
        >
          <Ionicons
            name="chevron-forward"
            size={IconSize.header}
            color={isCurrentMonth ? color.border : color.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Text
            key={index}
            style={[styles.weekdayLabel, { color: color.textSecondary }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selectedDate
            ? isSameDay(cellDate, selectedDate)
            : false;
          const isFuture = isCurrentMonth && day > today.getDate();
          const dayDiaries = diariesOn(day);
          const hasDiary = dayDiaries.length > 0;

          const dateLabel = new Intl.DateTimeFormat(locale, {
            month: "long",
            day: "numeric",
          }).format(cellDate);

          return (
            <Pressable
              key={day}
              onPress={() => {
                onSelectDate(cellDate);
                AccessibilityInfo.announceForAccessibility(
                  `${dateLabel}, ${t("calendar.diaryCount", { count: dayDiaries.length })}`,
                );
              }}
              disabled={isFuture || !hasDiary}
              style={styles.cell}
              // 기록이 있는 날만
              accessibilityElementsHidden={!hasDiary}
              importantForAccessibility={
                hasDiary ? "yes" : "no-hide-descendants"
              }
              accessibilityRole="button"
              accessibilityLabel={`${dateLabel}, ${t("calendar.diaryCount", { count: dayDiaries.length })}`}
              accessibilityHint={t("calendar.dayHint")}
              accessibilityState={{ selected: isSelected, disabled: !hasDiary }}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: color.primary },
                  !isSelected &&
                    isToday && { borderWidth: 2, borderColor: color.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: isSelected
                        ? color.onPrimary
                        : hasDiary
                          ? color.textPrimary
                          : color.border,
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>

              {hasDiary && !isFuture ? (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: color.emotion[dayDiaries[0].emotion] },
                  ]}
                />
              ) : (
                <View style={styles.dot} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  monthNavButton: {
    width: TouchSize.min,
    height: TouchSize.min,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 6,
    gap: 4,
  },
  dayCircle: {
    width: DAY_CIRCLE_SIZE,
    height: DAY_CIRCLE_SIZE,
    borderRadius: DAY_CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 18,
    fontFamily: Fonts.sans,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
