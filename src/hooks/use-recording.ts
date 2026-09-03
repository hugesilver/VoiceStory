import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { getLocales } from "expo-localization";
import {
  AVAudioSessionCategory,
  AVAudioSessionCategoryOptions,
  AVAudioSessionMode,
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo } from "react-native";

type RecordingState = "idle" | "recording" | "stopping";
export type RecordResult = {
  text: string;
  audioUri: string;
};

// regionCode 보정
const getSpeechLocale = async (): Promise<string> => {
  const deviceLocale = getLocales()[0];
  const { locales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});

  // 중국어 예외 처리(지역으로 간체/번체)
  if (deviceLocale.languageCode === "zh") {
    const isTraditional = ["TW", "HK", "MO"].includes(
      deviceLocale.regionCode ?? "",
    );
    return isTraditional ? "zh-TW" : "zh-CN";
  }

  // 기기 언어 태그가 지원 목록에 있는가? en-US(O) en-KR(X)
  if (locales.includes(deviceLocale.languageTag)) {
    return deviceLocale.languageTag;
  }

  // en- 등 같은 언어코드가 있는지 확인 후 미지원 시 같은 언어(locales) 배열의 먼저 나오는 값을 반환
  const firstSameLanguage = locales.find((s) =>
    s.startsWith(`${deviceLocale.languageCode}-`),
  );

  return firstSameLanguage ?? "en-US"; // 기본값 en-US
};

export const useRecording = () => {
  const { t } = useTranslation();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasPermissionRef = useRef<boolean | null>(null);
  const transcriptRef = useRef("");
  const audioUriRef = useRef<string | null>(null);
  const stopResolveRef = useRef<((result: RecordResult) => void) | null>(null);

  useEffect(() => {
    return () => {
      // 녹음종료 | 언마운트 시 녹음 중단
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  useEffect(() => {
    if (recordingState !== "recording") {
      return;
    }

    activateKeepAwakeAsync();

    // id로 누수 방지
    const id = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(id); // 언마운트 시 타이머 종료
      deactivateKeepAwake();
    };
  }, [recordingState]);

  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync().then((result) => {
      hasPermissionRef.current = result.granted;
      setHasPermission(result.granted);
    });
  }, []);

  // 녹음 시작 이벤트
  useSpeechRecognitionEvent("audiostart", () => {
    setRecordingState("recording");
    setTimer(0);
    AccessibilityInfo.announceForAccessibility(
      t("record.recording.startAnnouncement"),
    );
  });

  // 녹음 종료 이벤트
  useSpeechRecognitionEvent("audioend", (event) => {
    setRecordingState("stopping");
    setAudioUri(event.uri);
    audioUriRef.current = event.uri;
  });

  // 녹음 중단 이벤트
  useSpeechRecognitionEvent("end", () => {
    setRecordingState("idle");

    if (stopResolveRef.current) {
      stopResolveRef.current({
        text: transcriptRef.current,
        audioUri: audioUriRef.current ?? "",
      });
      stopResolveRef.current = null;
    }
  });

  // 음성 인식 결과 이벤트
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";

    // 확정된 문장만
    if (event.isFinal) {
      transcriptRef.current += text;
      setTranscript(transcriptRef.current);

      return;
    }

    // 미확정 구간은 누적본 뒤에 붙여서 미리보기만
    setTranscript(transcriptRef.current + text);
  });

  // 음성 인식 오류 이벤트
  useSpeechRecognitionEvent("error", (event) => {
    // 일시적 시스템 중단은 제외
    if (event.error === "interrupted") {
      console.warn("error code:", event.error, "error message:", event.message);
      return;
    }

    if (stopResolveRef.current) {
      stopResolveRef.current({
        text: transcriptRef.current,
        audioUri: audioUriRef.current ?? "",
      });
      stopResolveRef.current = null;
    }

    console.error("error code:", event.error, "error message:", event.message);
    setError(event.message);
  });

  // 녹음 시작
  const recordStart = async () => {
    // 초기화
    transcriptRef.current = "";
    setTranscript("");
    setAudioUri(null);
    audioUriRef.current = null;
    setError(null);

    // 음성 인식 가능 여부 확인
    console.debug(
      "available:",
      ExpoSpeechRecognitionModule.isRecognitionAvailable(),
    );
    console.debug(
      "onDevice:",
      ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
    );

    // 권한 확인(디버그 용)
    const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    console.debug("Status:", permission.status);
    console.debug("Granted:", permission.granted);
    console.debug("Restricted:", permission.restricted); // (iOS only)
    console.debug("Can ask again:", permission.canAskAgain);
    console.debug("Expires:", permission.expires);

    // 권한 요청
    if (hasPermissionRef.current !== true) {
      return;
    }

    // 권한 확인 완료 후 녹음 시작
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // 햅틱 피드백
    ExpoSpeechRecognitionModule.start({
      lang: await getSpeechLocale(),
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition:
        Device.isDevice &&
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
      recordingOptions: { persist: true },
      iosCategory: {
        category: AVAudioSessionCategory.playAndRecord,
        categoryOptions: [
          AVAudioSessionCategoryOptions.defaultToSpeaker,
          AVAudioSessionCategoryOptions.allowBluetooth,
          AVAudioSessionCategoryOptions.mixWithOthers,
        ],
        mode: AVAudioSessionMode.default,
      },
    });
  };

  // 녹음 완료
  const recordStop = (): Promise<RecordResult> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // 햅틱 피드백

    if (recordingState !== "recording") {
      return Promise.resolve({
        text: transcriptRef.current,
        audioUri: audioUriRef.current ?? "",
      });
    }

    setRecordingState("stopping");

    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  };

  return {
    recordingState,
    hasPermission,
    transcript,
    timer,
    recordStart,
    recordStop,
    audioUri,
    error,
  };
};
