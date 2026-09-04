import { EMOTIONS, type Emotion } from "@/constants/emotion";

// 테스트에도 사용
// 못 찾으면 null(unknown)
// 응답 전체에서 영문만 추출 후 감정 타입 비교
export const parseEmotion = (response: string): Emotion | null => {
  const word = response.toLowerCase().replace(/[^a-z]/g, "");

  return EMOTIONS.find((emotion) => emotion === word) ?? null;
};
