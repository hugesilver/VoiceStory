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

// Qwen3는 /no_think를 줘도 <think> 블록이 남을 때가 있어 제거
const stripThinkingTags = (text: string): string =>
  text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

// 녹음 텍스트 맞춤법 교정
export const useTextCorrection = () => {
  const { generate, isAiEnabled, isReady, isGenerating, interrupt } = useAI();

  const correctText = async (text: string): Promise<string> => {
    // no_think
    const result = await generate([
      { role: "system", content: TEXT_CORRECTION_PROMPT },
      { role: "user", content: `/no_think\n${text}` },
    ]);

    return stripThinkingTags(result);
  };

  return { correctText, isAiEnabled, isReady, isGenerating, interrupt };
};
