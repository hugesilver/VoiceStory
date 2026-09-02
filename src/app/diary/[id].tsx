import { EmotionPicker } from "@/components/ui/emotion-picker";
import { type Emotion } from "@/constants/emotion";
import { IconSize, Layout, Radius, TouchSize } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
import {
  clearDiaryAudio,
  deleteDiary,
  getDiaryById,
  updateDiary,
  type DiaryRow,
} from "@/db/database";
import { formatPlayerTime, useAudioPlayer } from "@/hooks/use-audio-player";
import { useTheme } from "@/hooks/use-theme";
import { deleteAudio, getAudioUri } from "@/utils/audio";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BodyProps {
  diary: DiaryRow;
  setDiary: (diary: DiaryRow) => void;
}

const DiaryBody = ({ diary, setDiary }: BodyProps) => {
  const { t, i18n } = useTranslation();
  const color = useTheme();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const player = useAudioPlayer(
    diary.audioPath ? getAudioUri(diary.audioPath) : "",
  );

  const dateLabel = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(diary.createdAt);

  const timeLabel = new Intl.DateTimeFormat(i18n.language, {
    hour: "numeric",
    minute: "2-digit",
  }).format(diary.createdAt);

  const handleEditStart = () => {
    setEditedContent(diary.content);
    setIsEditing(true);
    AccessibilityInfo.announceForAccessibility(
      t("correction.announcement.editStarted"),
    );
  };

  const handleEditDone = () => {
    updateDiary({
      id: diary.id,
      content: editedContent,
      emotion: diary.emotion,
    });
    setDiary({ ...diary, content: editedContent });
    setIsEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility(
      t("diaryDetail.announcement.textSaved"),
    );
  };

  const handleSelectEmotion = (emotion: Emotion) => {
    updateDiary({ id: diary.id, content: diary.content, emotion });
    setDiary({ ...diary, emotion });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // 녹음본 삭제
  const handleDeleteAudio = () => {
    Alert.alert(
      t("diaryDetail.delete.audioConfirmTitle"),
      t("diaryDetail.delete.audioConfirmMessage"),
      [
        { text: t("diaryDetail.delete.cancel"), style: "cancel" },
        {
          text: t("diaryDetail.delete.confirm"),
          style: "destructive",
          onPress: () => {
            clearDiaryAudio(diary.id);
            deleteAudio(diary.audioPath);
            setDiary({ ...diary, audioPath: "" });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            AccessibilityInfo.announceForAccessibility(
              t("diaryDetail.delete.audioAnnouncement"),
            );
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t("diaryDetail.delete.confirmTitle"),
      t("diaryDetail.delete.confirmMessage"),
      [
        { text: t("diaryDetail.delete.cancel"), style: "cancel" },
        {
          text: t("diaryDetail.delete.confirm"),
          style: "destructive",
          onPress: () => {
            deleteDiary(diary.id);
            deleteAudio(diary.audioPath);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            AccessibilityInfo.announceForAccessibility(
              t("diaryDetail.delete.announcement"),
            );
            router.back();
          },
        },
      ],
    );
  };

  const progress = player.duration
    ? (player.position / player.duration) * 100
    : 0;

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[
        styles.bodyContent,
        { paddingTop: insets.top + TouchSize.min + 24 },
      ]}
      keyboardDismissMode="interactive"
    >
      {/* 날짜 */}
      <View accessible accessibilityLabel={`${dateLabel} ${timeLabel}`}>
        <Text style={[styles.date, { color: color.textPrimary }]}>
          {dateLabel}
        </Text>
        <Text style={[styles.time, { color: color.textSecondary }]}>
          {timeLabel}
        </Text>
      </View>

      {/* 본문 */}
      <View
        style={[
          styles.card,
          { backgroundColor: color.card, borderColor: color.border },
        ]}
      >
        <Text
          style={[styles.cardLabel, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("diaryDetail.text")}
        </Text>

        {isEditing ? (
          <TextInput
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            style={[
              styles.input,
              { color: color.textPrimary, borderColor: color.border },
            ]}
            accessibilityLabel={t("diaryDetail.editingLabel")}
            accessibilityHint={t("diaryDetail.editingHint")}
          />
        ) : (
          <Text style={[styles.content, { color: color.textPrimary }]}>
            {diary.content}
          </Text>
        )}

        <Pressable
          onPress={isEditing ? handleEditDone : handleEditStart}
          style={styles.textButton}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={
            isEditing
              ? t("diaryDetail.editTextDone")
              : t("diaryDetail.editText")
          }
        >
          <Text style={[styles.textButtonLabel, { color: color.primary }]}>
            {isEditing
              ? t("diaryDetail.editTextDone")
              : t("diaryDetail.editText")}
          </Text>
        </Pressable>
      </View>

      {/* 녹음 */}
      {diary.audioPath ? (
        <View
          style={[
            styles.card,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
        >
          <Text
            style={[styles.cardLabel, { color: color.textSecondary }]}
            accessibilityRole="header"
          >
            {t("diaryDetail.audioPlayer.title")}
          </Text>

          <View style={styles.playerRow}>
            <Pressable
              onPress={player.isPlaying ? player.pause : player.play}
              style={[styles.playButton, { backgroundColor: color.primary }]}
              accessibilityRole="button"
              accessibilityLabel={
                player.isPlaying
                  ? t("diaryDetail.audioPlayer.pause")
                  : t("diaryDetail.audioPlayer.play")
              }
            >
              <Ionicons
                name={player.isPlaying ? "pause" : "play"}
                size={IconSize.content}
                color={color.onPrimary}
              />
            </Pressable>

            <View
              style={styles.playerProgress}
              accessible
              accessibilityLabel={t("diaryDetail.audioPlayer.accessibility", {
                position: formatPlayerTime(player.position),
                duration: formatPlayerTime(player.duration),
              })}
            >
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: color.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%`, backgroundColor: color.primary },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text
                  style={[styles.timeLabel, { color: color.textSecondary }]}
                >
                  {formatPlayerTime(player.position)}
                </Text>
                <Text
                  style={[styles.timeLabel, { color: color.textSecondary }]}
                >
                  {formatPlayerTime(player.duration)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={player.cycleSpeed}
              style={[styles.speedButton, { borderColor: color.border }]}
              accessibilityRole="button"
              accessibilityLabel={t("diaryDetail.speed", {
                speed: player.speed,
              })}
            >
              <Text
                style={[styles.speedLabel, { color: color.textPrimary }]}
                numberOfLines={1}
              >
                {t("diaryDetail.speed", { speed: player.speed })}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleDeleteAudio}
            style={styles.textButton}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel={t("diaryDetail.delete.audioButton")}
          >
            <Text style={[styles.textButtonLabel, { color: color.error }]}>
              {t("diaryDetail.delete.audioButton")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* 감정 */}
      <View
        style={[
          styles.card,
          { backgroundColor: color.card, borderColor: color.border },
        ]}
      >
        <Text
          style={[styles.cardLabel, { color: color.textSecondary }]}
          accessibilityRole="header"
        >
          {t("diaryDetail.emotionLabel")}
        </Text>
        <EmotionPicker selected={diary.emotion} onSelect={handleSelectEmotion} />
      </View>

      {/* 삭제 */}
      <Pressable
        onPress={handleDelete}
        style={[styles.deleteButton, { borderColor: color.error }]}
        accessibilityRole="button"
        accessibilityLabel={t("diaryDetail.delete.button")}
      >
        <Text style={[styles.deleteLabel, { color: color.error }]}>
          {t("diaryDetail.delete.button")}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

export default function DiaryDetailScreen() {
  const { t } = useTranslation();
  const color = useTheme();
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();

  // 동기 조회라 effect 없이 첫 렌더에서 한 번 읽는다
  const [diary, setDiary] = useState<DiaryRow | null>(() =>
    getDiaryById(Number(id)),
  );

  return (
    <View style={[styles.root, { backgroundColor: color.surface }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: color.card, borderColor: color.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons
            name="chevron-back"
            size={IconSize.header}
            color={color.textPrimary}
          />
        </Pressable>
        <Text
          style={[styles.title, { color: color.textPrimary }]}
          accessibilityRole="header"
        >
          {t("diaryDetail.title")}
        </Text>
      </View>

      {/* 바디 */}
      {diary ? <DiaryBody diary={diary} setDiary={setDiary} /> : null}
    </View>
  );
}

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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: Layout.screenPadding,
  },
  iconButton: {
    width: TouchSize.min,
    height: TouchSize.min,
    borderRadius: TouchSize.min / 2,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.sansBold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  date: {
    fontSize: 20,
    fontFamily: Fonts.sansMedium,
  },
  time: {
    fontSize: 16,
    fontFamily: Fonts.sans,
    paddingTop: 2,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: TouchSize.min,
    height: TouchSize.min,
    borderRadius: TouchSize.min / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  playerProgress: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontVariant: ["tabular-nums"],
  },
  speedButton: {
    minWidth: TouchSize.min,
    minHeight: TouchSize.min,
    paddingHorizontal: 8,
    borderRadius: Radius.chip,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  speedLabel: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
  textButton: {
    justifyContent: "center",
  },
  textButtonLabel: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  content: {
    fontSize: 18,
    fontFamily: Fonts.sans,
    lineHeight: 28,
  },
  input: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    fontFamily: Fonts.sans,
    lineHeight: 28,
    textAlignVertical: "top",
  },
  deleteButton: {
    height: 60,
    borderRadius: Radius.button,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  deleteLabel: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
  },
});
