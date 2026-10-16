import { afterEach, beforeEach, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
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
  jest.replaceProperty(Platform, "OS", "android");
  ({ result } = await renderHook(() => useRecording()));
  await act(() => mockEvents.audiostart());
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function stopWithError(code, uri = "file:///record.wav") {
  let stopped;
  await act(() => { stopped = result.current.recordStop(); });
  await act(() => mockEvents.error({ error: code, message: "failure" }));
  await act(() => mockEvents.audioend({ uri }));
  await act(() => mockEvents.end());
  return await stopped;
}

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

it("Android 종료 중 client 오류가 나면 최종 결과가 없어도 마지막 임시 결과와 파일을 반환한다", async () => {
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "오늘" }] }));
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "오늘은 좋은 날" }] }));

  expect(await stopWithError("client")).toEqual({ text: "오늘은 좋은 날", audioUri: "file:///record.wav" });
  expect(result.current.transcript).toBe("오늘은 좋은 날");
  expect(result.current.error).toBeNull();
});

it("이미 확정된 구간 뒤에 마지막 임시 구간을 붙여 끝 문장을 보존한다", async () => {
  await act(() => mockEvents.result({ isFinal: true, results: [{ transcript: "오늘은 " }] }));
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "친구를 만났다" }] }));

  expect(await stopWithError("client")).toEqual({ text: "오늘은 친구를 만났다", audioUri: "file:///record.wav" });
});

it("임시 결과가 최종 결과로 확정되면 같은 문장을 두 번 붙이지 않는다", async () => {
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "일" }] }));
  await act(() => mockEvents.result({ isFinal: true, results: [{ transcript: "일기" }] }));

  expect(await stopWithError("client")).toEqual({ text: "일기", audioUri: "file:///record.wav" });
});

it.each(["not-allowed", "service-not-allowed", "network", "audio-capture", "no-speech"])(
  "임시 텍스트와 파일이 있어도 %s 오류는 성공으로 처리하지 않는다", async (code) => {
    await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "일기" }] }));

    expect(await stopWithError(code)).toBeNull();
    expect(result.current.error).not.toBeNull();
  },
);

it("임시 텍스트가 있어도 녹음 파일이 없으면 client 오류를 성공으로 처리하지 않는다", async () => {
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "일기" }] }));

  expect(await stopWithError("client", null)).toBeNull();
  expect(result.current.error).toBe("record.error.message");
});

it("사용자가 종료를 요청하지 않았다면 임시 텍스트가 있어도 client 오류를 안내한다", async () => {
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "일기" }] }));
  await act(() => mockEvents.error({ error: "client", message: "failure" }));
  await act(() => mockEvents.audioend({ uri: "file:///record.wav" }));
  await act(() => mockEvents.end());

  expect(result.current.error).toBe("record.error.message");
});

it("iOS의 client 오류에는 Android 임시 결과 보완을 적용하지 않는다", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  await act(() => mockEvents.result({ isFinal: false, results: [{ transcript: "일기" }] }));

  expect(await stopWithError("client")).toBeNull();
  expect(result.current.error).toBe("record.error.message");
});
