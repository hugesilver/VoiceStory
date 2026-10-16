import { beforeEach, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useRecording } from "../use-recording";

const mockEvents = {};
jest.mock("expo-speech-recognition", () => ({
  useSpeechRecognitionEvent: (name, handler) => { mockEvents[name] = handler; },
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: async () => ({ granted: true }),
    stop: jest.fn(), abort: jest.fn(),
  },
}));
jest.mock("@/utils/haptics", () => ({ hapticMedium: jest.fn() }));
jest.mock("expo-device", () => ({}));
jest.mock("expo-localization", () => ({ getLocales: () => [] }));
jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(), deactivateKeepAwake: jest.fn(),
}));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

let result;
beforeEach(async () => {
  ({ result } = await renderHook(() => useRecording()));
  await act(() => mockEvents.audiostart());
});

it("종료 중 client 오류가 와도 audioend와 end까지 기다려 확정 결과를 반환한다", async () => {
  await act(() => mockEvents.result({ isFinal: true, results: [{ transcript: "일기" }] }));
  let stopped;
  await act(() => { stopped = result.current.recordStop(); });
  let settled = false;
  const observeStop = async () => {
    await stopped;
    settled = true;
  };
  const stopObserved = observeStop();
  await act(async () => mockEvents.error({ error: "client", message: "client failure" }));
  expect(settled).toBe(false);
  await act(() => mockEvents.audioend({ uri: "file:///record.wav" }));
  await act(() => mockEvents.end());
  await expect(stopped).resolves.toEqual({ text: "일기", audioUri: "file:///record.wav" });
  await stopObserved;
  expect(result.current.error).toBeNull();
});

it.each(["client", "not-allowed"])("사용 가능한 결과가 없는 %s 오류는 성공으로 처리하지 않는다", async (code) => {
  let stopped;
  await act(() => { stopped = result.current.recordStop(); });
  await act(() => mockEvents.error({ error: code, message: "failure" }));
  await act(() => mockEvents.audioend({ uri: null }));
  await act(() => mockEvents.end());
  await expect(stopped).resolves.toBeNull();
  expect(result.current.error).toBe(code === "not-allowed"
    ? "record.error.permissionMessage" : "record.error.message");
});
