import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { LLMType, models, useLLM } from "react-native-executorch";
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
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [isSettingLoaded, setIsSettingLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setIsAiEnabled(stored === "true");
      setIsSettingLoaded(true);
    };

    load();
  }, []);

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

  // useLLM은 호출 될 떄마다 LLM controller를 새로 생성하므로, 앱 전체에서 한 번만 호출
  const llm = useLLM({
    model: AI_MODEL,
    preventLoad: !isAiEnabled,
  });

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
