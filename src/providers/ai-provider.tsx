import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Platform } from "react-native";
import {
  LLMType,
  models,
  RnExecutorchErrorCode,
  useLLM,
} from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";

const AI_MODEL = models.llm.qwen3_1_7b();
const STORAGE_KEY = "ai_enabled";

// 안드로이드 기기에서 최소 4GB RAM 필요
const MINIMUM_RAM_BYTES = 4 * 1024 * 1024 * 1024;
const IS_DEVICE_SUPPORTED =
  Platform.OS !== "android" ||
  (Device.totalMemory !== null && Device.totalMemory >= MINIMUM_RAM_BYTES);

// useLLM이 주는 값
type AIContextValue = LLMType & {
  isAiEnabled: boolean;
  isSettingLoaded: boolean;
  isDeviceSupported: boolean;
  setAiEnabled: (enabled: boolean) => Promise<void>;
  getModelSize: () => Promise<number>;
};
const AIContext = createContext<AIContextValue | null>(null);

// AI 관련 값 사용
export const useAI = () => {
  const value = useContext(AIContext);

  if (!value) {
    // null 반환 시 AIProvider 밖에서 useAI를 호출한 것임 AI 사용 불가
    throw new Error("useAI는 AIProvider 안에서만 사용할 수 있습니다");
  }

  return value;
};

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();

  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isSettingLoaded, setIsSettingLoaded] = useState(false);

  // 디스크에 있는 모델을 로드한 경우와 실제 다운로드를 구분하기 위한 표시
  const wasDownloadingRef = useRef(false);

  // 마지막으로 음성 안내한 진행률 구간
  const lastMilestoneRef = useRef(0);

  // useLLM은 호출 될 떄마다 LLM controller를 새로 생성하므로, 앱 전체에서 한 번만 호출
  const llm = useLLM({
    model: AI_MODEL,
    preventLoad: !isAiEnabled,
  });

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setIsAiEnabled(stored === "true");
      setIsSettingLoaded(true);
    };

    load();
  }, []);

  // 다운로드는 몇 분이 걸려 화면을 음성으로 알림(진행률 0 제외)
  useEffect(() => {
    const percent = Math.floor(llm.downloadProgress * 100);

    if (percent > 0 && !llm.isReady) {
      wasDownloadingRef.current = true;

      // 매 %마다 말하면 계속 끊으므로 25% 단위로만
      const milestone = Math.floor(percent / 25) * 25;

      if (milestone > 0 && milestone > lastMilestoneRef.current) {
        lastMilestoneRef.current = milestone;
        AccessibilityInfo.announceForAccessibility(
          t("home.modelDownload.label", { percent: milestone }),
        );
      }

      return;
    }

    // AI 모델 다운로드 완료 및 준비 완료 음성 안내
    if (llm.isReady && wasDownloadingRef.current) {
      // 다시 받을 때 또 안내하도록 초기화
      wasDownloadingRef.current = false;
      lastMilestoneRef.current = 0;
      AccessibilityInfo.announceForAccessibility(
        t("home.modelDownload.completed"),
      );
    }
  }, [llm.downloadProgress, llm.isReady, t]);

  useEffect(() => {
    if (!isAiEnabled) {
      wasDownloadingRef.current = false;
      lastMilestoneRef.current = 0;
    }
  }, [isAiEnabled]);

  // 취소 시 알리지 않음
  useEffect(() => {
    if (
      llm.error &&
      llm.error.code !== RnExecutorchErrorCode.DownloadInterrupted
    ) {
      AccessibilityInfo.announceForAccessibility(
        t("home.modelDownload.errorMessage"),
      );
    }
  }, [llm.error, t]);

  // 끄면 다운로드 취소 및 AI 모델 삭제
  const setAiEnabled = async (enabled: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
    setIsAiEnabled(enabled);

    // 켤 때는 아무것도 안 함
    if (enabled) {
      return;
    }

    // AI 모델 다운로드 중이면 취소
    try {
      await ExpoResourceFetcher.cancelFetching(
        AI_MODEL.modelSource,
        AI_MODEL.tokenizerSource,
        AI_MODEL.tokenizerConfigSource,
      );
    } catch {
      // 진행 중인 다운로드가 없으면 무시
    }

    await ExpoResourceFetcher.deleteResources(
      AI_MODEL.modelSource,
      AI_MODEL.tokenizerSource,
      AI_MODEL.tokenizerConfigSource,
    );
  };

  // AI 모델 용량 조회
  const getModelSize = () =>
    ExpoResourceFetcher.getFilesTotalSize(
      AI_MODEL.modelSource,
      AI_MODEL.tokenizerSource,
      AI_MODEL.tokenizerConfigSource,
    );

  return (
    <AIContext.Provider
      value={{
        ...llm,
        isAiEnabled,
        isSettingLoaded,
        isDeviceSupported: IS_DEVICE_SUPPORTED,
        setAiEnabled,
        getModelSize,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

// 레거시 AI 모델 정리
const LEGACY_SOURCES = [
  "https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.8.0/qwen-3-1.7B/quantized/qwen3_1_7b_8da4w.pte",
  "https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.8.0/tokenizer.json",
  "https://huggingface.co/software-mansion/react-native-executorch-qwen-3/resolve/v0.8.0/tokenizer_config.json",
];

export const cleanupLegacyModel = async () => {
  try {
    await ExpoResourceFetcher.deleteResources(...LEGACY_SOURCES);
  } catch (error) {
    console.warn("AI 레거시 모델 정리 실패:", error);
  }
};
