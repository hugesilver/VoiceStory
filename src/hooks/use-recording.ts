import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { getLocales } from "expo-localization";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useState } from "react";

export type RecordingState = "idle" | "recording" | "stopping";

export const useRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // 녹음 시작 이벤트
  useSpeechRecognitionEvent("audiostart", () => {
    setRecordingState("recording");
    setTimer(0);
  });

  // 녹음 종료 이벤트
  useSpeechRecognitionEvent("audioend", (event) => {
    setRecordingState("stopping");
    setAudioUri(event.uri);
  });

  // 녹음 중단 이벤트
  useSpeechRecognitionEvent("end", () => {
    setRecordingState("idle");
  });

  // 음성 인식 결과 이벤트
  useSpeechRecognitionEvent("result", (event) => {
    setTranscript(event.results[0]?.transcript ?? "");
  });

  // 음성 인식 오류 이벤트
  useSpeechRecognitionEvent("error", (event) => {
    console.error("error code:", event.error, "error message:", event.message);
    setError(event.message);
  });

  // 녹음 시작
  const recordStart = async () => {
    // 권한 확인(디버그 용)
    const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    console.debug("Status:", permission.status);
    console.debug("Granted:", permission.granted);
    console.debug("Restricted:", permission.restricted); // (iOS only)
    console.debug("Can ask again:", permission.canAskAgain);
    console.debug("Expires:", permission.expires);

    // 권한 요청
    const permissionResult =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setHasPermission(permissionResult.granted);

    if (!permissionResult.granted) {
      console.warn("Permissions not granted", permissionResult);
      return;
    }

    // 권한 확인 완료 후 녹음 시작
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // 햅틱 피드백
    ExpoSpeechRecognitionModule.start({
      lang: getLocales()[0].languageTag,
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition:
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
      recordingOptions: { persist: true },
    });
  };

  // 녹음 완료
  const recordStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // 햅틱 피드백
    setRecordingState("stopping");
    ExpoSpeechRecognitionModule.stop();
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
