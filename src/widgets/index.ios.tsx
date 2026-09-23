import i18n from "@/locales/i18n";
import { Image, Text, VStack } from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";

type ShortcutProps = { title?: string; openRecording?: string };

const recordingWidget = createWidget(
  "RecordShortcut",
  (props: ShortcutProps) => {
    "widget";
    const title = props.title ?? "Write a voice diary";
    const hint = props.openRecording ?? "Open recording screen";
    return (
      <VStack
        spacing={8}
        modifiers={[
          frame({ maxWidth: Infinity, maxHeight: Infinity }),
          foregroundStyle("#FFFFFF"),
          accessibilityElement("ignore"),
          accessibilityLabel(`${title}, ${hint}`),
          accessibilityAddTraits(["isButton"]),
        ]}
      >
        <Image
          systemName="mic.fill"
          size={44}
          modifiers={[accessibilityHidden()]}
        />
        <Text
          modifiers={[
            font({ textStyle: "headline" }),
            multilineTextAlignment("center"),
          ]}
        >
          {title}
        </Text>
      </VStack>
    );
  },
);

recordingWidget.updateSnapshot({
  title: i18n.t("widget.title"),
  openRecording: i18n.t("widget.openRecording"),
});
