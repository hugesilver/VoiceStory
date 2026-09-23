const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

// iOS 설정
function iosPatchRecordingWidget(source) {
  const entry = "      WidgetsEntryView(entry: entry)";
  // JS 레이아웃 등록 전에도 배경색과 녹음 바로가기가 적용되도록 Swift에서 설정
  const replacement = `      ZStack {
        Color.clear
        WidgetsEntryView(entry: entry)
      }
      .containerBackground(Color(red: 47.0 / 255, green: 58.0 / 255, blue: 153.0 / 255), for: .widget)
      .widgetURL(URL(string: "voicestory://record"))`;
  if (source.includes(replacement)) return source;
  if (!source.includes(entry) || source.includes(".containerBackground(") || source.includes(".widgetURL(")) {
    throw new Error("RecordShortcut 코드가 예상한 형식과 다릅니다. iOS 위젯 설정을 확인하세요.");
  }
  return source.replace(entry, replacement);
}

function withWidgets(config) {
  // Android 설정
  // WorkManager 관련 의존성 버전을 맞춰 클래스 중복 방지
  config = withAppBuildGradle(config, (config) => {
    const dependency = 'implementation("androidx.work:work-runtime-ktx:2.8.1")';
    if (!config.modResults.contents.includes(dependency)) {
      config.modResults.contents += `\ndependencies {\n    ${dependency}\n}\n`;
    }
    return config;
  });

  // iOS 설정 함수를 사용해 생성된 Swift 파일에 위젯 설정 반영
  return withDangerousMod(config, ["ios", async (config) => {
    const file = path.join(config.modRequest.platformProjectRoot, "ExpoWidgetsTarget", "RecordShortcut.swift");
    const source = await fs.readFile(file, "utf8");
    await fs.writeFile(file, iosPatchRecordingWidget(source));
    return config;
  }]);
}

module.exports = withWidgets;
