import { getLocales } from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./langs/en.json";
import ja from "./langs/ja.json";
import ko from "./langs/ko.json";
import zhCN from "./langs/zh-CN.json";
import zhTW from "./langs/zh-TW.json";

const initI18n = () => {
  const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
  const deviceRegion = getLocales()[0]?.regionCode ?? "";

  // IETF language tag
  // 중국어는 zh 하나만 존재하기 때문에 후처리
  const language: string =
    deviceLanguage === "zh"
      ? ["TW", "HK", "MO"].includes(deviceRegion)
        ? "zh-TW"
        : "zh-CN"
      : deviceLanguage;

  i18next.use(initReactI18next).init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
    },
    lng: language,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18next;
