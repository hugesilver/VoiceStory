import { Ionicons } from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";

export type Emotion = "happy" | "neutral" | "sad" | "angry" | "tired";

export const EMOTIONS: Emotion[] = [
  "happy",
  "neutral",
  "sad",
  "angry",
  "tired",
];

export const EMOTION_ICONS: Record<
  Emotion,
  ComponentProps<typeof Ionicons>["name"]
> = {
  happy: "happy-outline",
  neutral: "remove-circle-outline",
  sad: "sad-outline",
  angry: "flame",
  tired: "bed-outline",
};
