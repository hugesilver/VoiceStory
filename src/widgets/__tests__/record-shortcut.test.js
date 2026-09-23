import { afterEach, beforeEach, expect, it, jest } from "@jest/globals";
import React from "react";
import { buildWidgetTree } from "react-native-android-widget/lib/commonjs/api/build-widget-tree";
import { RecordShortcutWidget, recordWidgetTaskHandler } from "../index.android";
import i18n from "@/locales/i18n";
import { act, create } from "react-test-renderer";
import RecordModal from "../../app/(modals)/record";
import OnboardingScreen from "../../app/onboarding";
import { redirectSystemPath } from "../../app/+native-intent";
import { completeOnboarding, isOnboardingCompleted } from "@/utils/onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-localization", () => ({ getLocales: () => [{ languageCode: "ko", regionCode: "KR" }] }));

const mockStart = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
const mockCanDismiss = jest.fn();
let mockSearchParams = {};
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("expo-router", () => ({ useLocalSearchParams: () => mockSearchParams, router: {
  canDismiss: () => mockCanDismiss(),
  replace: (...args) => mockReplace(...args),
  dismissAll: () => mockDismissAll(),
} }));
jest.mock("@/hooks/use-recording", () => ({ useRecording: () => ({
  recordingState: "idle", transcript: "", timer: 0, hasPermission: true,
  recordStart: mockStart, recordStop: jest.fn(), error: null,
}) }));
jest.mock("@/hooks/use-theme", () => ({ useTheme: () => ({}) }));
jest.mock("@/providers/ai-provider", () => ({ useAI: () => ({ isAiEnabled: false }) }));
jest.mock("@react-native-vector-icons/ionicons", () => ({ Ionicons: () => null }));
jest.mock("react-i18next", () => ({ ...jest.requireActual("react-i18next"), useTranslation: () => ({ t: (key) => key }) }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
  SafeAreaView: require("react-native").View,
}));
let root;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockSearchParams = {};
  mockCanDismiss.mockReturnValue(false);
  root = null;
});
afterEach(() => { if (root) act(() => root.unmount()); });
async function renderScreen(screen) {
  await act(async () => { root = create(screen); });
}
function press(label) {
  act(() => root.root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === "function")[0].props.onPress());
}
it("바로가기로 화면을 열어도 녹음은 시작 버튼을 누를 때만 시작한다", async () => {
  await renderScreen(<RecordModal />);
  expect(mockStart).not.toHaveBeenCalled();
  press("record.idle.startButton");
  expect(mockStart).toHaveBeenCalledTimes(1);
});
it("탐색 이력이 없는 녹음 화면을 닫으면 앱의 시작 화면으로 돌아간다", async () => {
  await renderScreen(<RecordModal />);
  press("record.close");
  expect(mockReplace).toHaveBeenCalledWith("/");
});
it("기존 앱 화면에서 열었다면 모달을 닫고 기존 화면으로 돌아간다", async () => {
  await renderScreen(<RecordModal />);
  mockCanDismiss.mockReturnValue(true);
  press("record.close");
  expect(mockDismissAll).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it.each(["ko", "en", "ja", "zh-CN", "zh-TW"])("%s 위젯은 번역된 버튼 하나와 녹음 화면 링크만 전달한다", async (language) => {
  await i18n.changeLanguage(language);
  const tree = buildWidgetTree(<RecordShortcutWidget />);
  expect(tree.props.clickAction).toBe("OPEN_URI");
  expect(tree.props.clickActionData).toEqual({ uri: "voicestory://record" });
  expect(tree.props.accessibilityLabel).toBe(`${i18n.t("widget.title")}, ${i18n.t("widget.openRecording")}`);
  expect(tree.children.map((child) => child.type)).toEqual(["SvgWidget", "TextWidget"]);
  expect(tree.children[1].props.text).toBe(i18n.t("widget.title"));
  expect(tree.children[1].props.allowFontScaling).toBe(true);
});
it("삭제된 위젯은 다시 그리지 않는다", async () => {
  const renderWidget = jest.fn();
  await recordWidgetTaskHandler({ widgetInfo: { widgetName: "RecordShortcut" }, widgetAction: "WIDGET_DELETED", renderWidget });
  expect(renderWidget).not.toHaveBeenCalled();
});
it("크기를 바꾸면 바로가기 위젯을 다시 그린다", async () => {
  const renderWidget = jest.fn();
  await recordWidgetTaskHandler({ widgetInfo: { widgetName: "RecordShortcut" }, widgetAction: "WIDGET_RESIZED", renderWidget });
  expect(renderWidget).toHaveBeenCalledTimes(1);
  expect(buildWidgetTree(renderWidget.mock.calls[0][0]).props.clickAction).toBe("OPEN_URI");
});

it.each(["voicestory://record", "/record", "/record?source=widget"])(
  "%s 첫 진입은 온보딩을 먼저 열고, 완료 후에는 녹음 링크를 유지한다", async (path) => {
    for (const initial of [true, false]) {
      expect(await redirectSystemPath({ path, initial })).toBe("/onboarding?next=record");
    }
    await completeOnboarding();
    for (const initial of [true, false]) {
      expect(await redirectSystemPath({ path, initial })).toBe(path);
    }
  },
);

it.each(["/", "voicestory:///record", "voicestory://diary/1", "voicestory://recording", "https://example.com/record"])(
  "%s 링크에는 위젯 온보딩 규칙을 적용하지 않는다", async (path) => {
    expect(await redirectSystemPath({ path, initial: true })).toBe(path);
    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  },
);

it("완료 상태를 읽지 못해도 위젯 진입이 실패하거나 목적지를 잃지 않는다", async () => {
  AsyncStorage.getItem.mockRejectedValueOnce(new Error("storage unavailable"));
  expect(await redirectSystemPath({ path: "voicestory://record", initial: true }))
    .toBe("/onboarding?next=record");
});

it.each([
  [{ next: "record" }, "/record"],
  [{}, "/(tabs)/home"],
  [{ next: "https://example.com" }, "/(tabs)/home"],
])("온보딩 완료 후 지정된 목적지로 이동한다: %j", async (params, destination) => {
  mockSearchParams = params;
  await renderScreen(<OnboardingScreen />);
  const button = root.root.findAll((node) =>
    node.props.accessibilityLabel === "onboarding.startButton" && typeof node.props.onPress === "function")[0];
  await act(async () => { await button.props.onPress(); });
  expect(await isOnboardingCompleted()).toBe(true);
  expect(mockReplace).toHaveBeenCalledWith(destination, { withAnchor: true });
  expect(mockStart).not.toHaveBeenCalled();
});
