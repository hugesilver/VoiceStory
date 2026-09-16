import { afterEach, beforeEach, expect, it, jest } from "@jest/globals";
import React, { useLayoutEffect } from "react";
import { act, create } from "react-test-renderer";
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

let current;
let root;
function Harness() {
  const recording = useRecording();
  useLayoutEffect(() => {
    current = recording;
  }, [recording]);
  return null;
}
beforeEach(async () => {
  await act(async () => { root = create(<Harness />); });
  act(() => mockEvents.audiostart());
});
afterEach(() => { act(() => root.unmount()); });

it("종료 중 client 오류가 와도 audioend와 end까지 기다려 확정 결과를 반환한다", async () => {
  act(() => mockEvents.result({ isFinal: true, results: [{ transcript: "일기" }] }));
  let stopped;
  act(() => { stopped = current.recordStop(); });
  let settled = false;
  stopped.then(() => { settled = true; });
  await act(async () => mockEvents.error({ error: "client", message: "client failure" }));
  expect(settled).toBe(false);
  act(() => mockEvents.audioend({ uri: "file:///record.wav" }));
  act(() => mockEvents.end());
  await expect(stopped).resolves.toEqual({ text: "일기", audioUri: "file:///record.wav" });
  expect(current.error).toBeNull();
});

it.each(["client", "not-allowed"])("사용 가능한 결과가 없는 %s 오류는 성공으로 처리하지 않는다", async (code) => {
  let stopped;
  act(() => { stopped = current.recordStop(); });
  act(() => mockEvents.error({ error: code, message: "failure" }));
  act(() => mockEvents.audioend({ uri: null }));
  act(() => mockEvents.end());
  await expect(stopped).resolves.toBeNull();
  expect(current.error).toBe(code === "not-allowed"
    ? "record.error.permissionMessage" : "record.error.message");
});
