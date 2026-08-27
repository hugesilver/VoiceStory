import { EMOTIONS, type Emotion } from "@/constants/emotion";
import { useAI } from "@/providers/ai-provider";

// STT 결과를 AI가 멋대로 수정하지 않도록 오타 수정만
const TEXT_CORRECTION_PROMPT =
  "You are a conservative spelling corrector for speech-to-text transcriptions. " +
  "Your only task is to fix unambiguous spelling errors — words that are clearly misspelled and have exactly one obvious correct form. " +
  "Rules: " +
  "Do NOT restructure, reorder, or paraphrase sentences. " +
  "Do NOT add or remove words. " +
  "Do NOT change punctuation unless it is part of a clear spelling mistake. " +
  "Do NOT interpret meaning or infer intent. " +
  "If a word could be correct in any reasonable context, leave it exactly as-is. " +
  "If the text seems incomplete, fragmented, or odd, treat it as a speech transcription artifact and leave it unchanged. " +
  "When in doubt, output the original text exactly as given. " +
  "Output only the corrected text with no explanation.";

const EMOTION_DETECTION_PROMPT =
  "You are an emotion classifier for diary entries. " +
  "Analyze the emotional tone of the given text and respond with exactly one word. " +
  "Choose the single best match: happy, neutral, sad, angry, or tired. " +
  "If the text is too short or carries no emotional signal, respond with unknown instead of guessing. " +
  "Respond only with the single word, nothing else.";

// 못 찾으면 null(unknown)
// 응답 전체에서 영문만 추출 후 감정 타입 비교
const parseEmotion = (response: string): Emotion | null => {
  const word = response.toLowerCase().replace(/[^a-z]/g, "");

  return EMOTIONS.find((emotion) => emotion === word) ?? null;
};

export const useAITasks = () => {
  const { prompt, isAiEnabled, isReady, isGenerating, interrupt } = useAI();

  const correctText = (text: string): Promise<string> =>
    prompt(TEXT_CORRECTION_PROMPT, text);

  const detectEmotion = async (text: string): Promise<Emotion | null> =>
    parseEmotion(await prompt(EMOTION_DETECTION_PROMPT, text));

  return {
    correctText,
    detectEmotion,
    isAiEnabled,
    isReady,
    isGenerating,
    interrupt,
  };
};
