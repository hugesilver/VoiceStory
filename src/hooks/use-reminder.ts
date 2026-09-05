import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ENABLED_KEY = "reminder_enabled";
const TIME_KEY = "reminder_time";
const NOTIFICATION_ID_KEY = "reminder_notification_id";

const DEFAULT_TIME = "21:00";

export const useReminder = () => {
  const { t, i18n } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIME);

  useEffect(() => {
    const load = async () => {
      const [enabled, saved] = await Promise.all([
        AsyncStorage.getItem(ENABLED_KEY),
        AsyncStorage.getItem(TIME_KEY),
      ]);

      setIsEnabled(enabled === "true");
      setTime(saved ?? DEFAULT_TIME);
    };

    load();
  }, []);

  const cancel = useCallback(async () => {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);

    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  }, []);

  const schedule = useCallback(
    async (nextTime: string) => {
      await cancel();

      const [hour, minute] = nextTime.split(":").map(Number);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: t("settings.reminder.notificationTitle"),
          body: t("settings.reminder.notificationBody"),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
    },
    [cancel, t],
  );

  const toggle = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          return false;
        }

        await schedule(time);
      } else {
        await cancel();
      }

      await AsyncStorage.setItem(ENABLED_KEY, String(enabled));
      setIsEnabled(enabled);

      return true;
    },
    [time, schedule, cancel],
  );

  const updateTime = useCallback(
    async (nextTime: string) => {
      await AsyncStorage.setItem(TIME_KEY, nextTime);
      setTime(nextTime);

      if (isEnabled) {
        await schedule(nextTime);
      }
    },
    [isEnabled, schedule],
  );

  // 기기 언어가 바뀌면 화면만 바뀌고 예약된 문구는 이전 언어로 남아 다시 예약
  // 켜거나 시각을 바꿀 때는 이미 예약되므로, 언어가 실제로 바뀐 경우만 다시 잡는다
  const lastLanguageRef = useRef(i18n.language);

  useEffect(() => {
    if (lastLanguageRef.current === i18n.language) {
      return;
    }

    lastLanguageRef.current = i18n.language;

    if (isEnabled) {
      schedule(time);
    }
  }, [i18n.language, isEnabled, time, schedule]);

  return { isEnabled, time, toggle, updateTime };
};
