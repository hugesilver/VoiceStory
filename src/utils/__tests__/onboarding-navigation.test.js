import { afterEach, beforeEach, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Text } from "react-native";
import { act, fireEvent, renderRouter, screen, testRouter, waitFor } from "expo-router/testing-library";
import { Stack, Tabs, router } from "expo-router";
import Index from "../../app/index";
import OnboardingScreen from "../../app/onboarding";
import { completeOnboarding, isOnboardingCompleted } from "../onboarding";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("@/hooks/use-theme", () => ({ useTheme: () => ({}) }));
jest.mock("@react-native-vector-icons/ionicons", () => ({ Ionicons: () => null }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key) => key }) }));

// 앱과 같은 루트 anchor 및 중첩 탭/모달 구조로 실제 라우터의 뒤로 가기 이력을 확인한다.
const routes = {
  _layout: {
    unstable_settings: { anchor: "(tabs)" },
    default: () => (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ presentation: "card" }} />
        <Stack.Screen name="(modals)" options={{ presentation: "fullScreenModal" }} />
      </Stack>
    ),
  },
  index: Index,
  onboarding: OnboardingScreen,
  "(tabs)/_layout": () => <Tabs screenOptions={{ headerShown: false }} />,
  "(tabs)/home": () => <Text>home</Text>,
  "(modals)/_layout": () => <Stack screenOptions={{ headerShown: false }} />,
  "(modals)/record": () => <Text>record</Text>,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

function expectSingleHome() {
  expect(screen).toHavePathname("/home");
  expect(screen.getRouterState().routes.map((route) => route.name)).toEqual(["(tabs)"]);
  expect(router.canGoBack()).toBe(false);
}

it("첫 실행에서 온보딩을 완료하면 홈만 남고 뒤로 갈 화면이 없다", async () => {
  await renderRouter(routes);

  await fireEvent.press(await screen.findByLabelText("onboarding.startButton"));

  expect(await isOnboardingCompleted()).toBe(true);
  await waitFor(expectSingleHome);
});

it("온보딩 완료 후 앱을 다시 켜도 홈을 중복해서 쌓지 않는다", async () => {
  await completeOnboarding();

  await renderRouter(routes);

  await waitFor(expectSingleHome);
});

it("완료 상태를 읽지 못해도 빈 화면 대신 온보딩으로 이동한다", async () => {
  AsyncStorage.getItem.mockRejectedValueOnce(new Error("storage unavailable"));

  await renderRouter(routes);

  await waitFor(() => expect(screen).toHavePathname("/onboarding"));
  expect(await screen.findByLabelText("onboarding.startButton")).toBeTruthy();
});

it("첫 화면을 떠난 뒤 도착한 완료 상태가 위젯 진입 경로를 덮어쓰지 않는다", async () => {
  let resolveStatus;
  AsyncStorage.getItem.mockImplementationOnce(() => new Promise((resolve) => {
    resolveStatus = resolve;
  }));

  await renderRouter(routes);
  await testRouter.push("/onboarding?next=record");

  await act(() => { resolveStatus("true"); });

  expect(screen).toHavePathname("/onboarding");
  expect(screen).toHaveSearchParams({ next: "record" });
});

it("위젯 온보딩은 녹음 화면을 열고 뒤로 가면 홈 하나만 남는다", async () => {
  await renderRouter(routes, { initialUrl: "/onboarding?next=record" });

  await fireEvent.press(await screen.findByLabelText("onboarding.startButton"));

  await waitFor(() => expect(screen).toHavePathname("/record"));
  expect(await isOnboardingCompleted()).toBe(true);
  expect(screen.getRouterState().routes.map((route) => route.name)).toEqual(["(tabs)", "(modals)"]);

  await testRouter.back("/home");

  expectSingleHome();
});
