"use no memo";

import i18n from "@/locales/i18n";
import {
  FlexWidget,
  registerWidgetTaskHandler,
  SvgWidget,
  TextWidget,
  type WidgetTaskHandlerProps,
} from "react-native-android-widget";

export function RecordShortcutWidget() {
  const title = i18n.t("widget.title");
  const hint = i18n.t("widget.openRecording");
  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: "#2F3A99",
        borderRadius: 24,
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "voicestory://record" }}
      accessibilityLabel={`${title}, ${hint}`}
    >
      <SvgWidget
        svg={
          '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3" fill="white"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
        }
        style={{ width: 48, height: 48, marginBottom: 8 }}
      />
      <TextWidget
        text={title}
        style={{
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: "bold",
          textAlign: "center",
        }}
      />
    </FlexWidget>
  );
}

export async function recordWidgetTaskHandler({
  widgetInfo,
  widgetAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  if (
    widgetInfo.widgetName !== "RecordShortcut" ||
    widgetAction === "WIDGET_DELETED"
  )
    return;
  renderWidget(<RecordShortcutWidget />);
}

registerWidgetTaskHandler(recordWidgetTaskHandler);
