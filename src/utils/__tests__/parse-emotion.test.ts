import { EMOTIONS } from "@/constants/emotion";
import { parseEmotion } from "@/utils/parse-emotion";

describe("parseEmotion — 모델 응답에서 감정 뽑기", () => {
  it("한 단어로만 답하면 그대로 읽는다", () => {
    expect(parseEmotion("sad")).toBe("sad");
  });

  it("대문자와 구두점은 무시한다", () => {
    expect(parseEmotion("Sad.")).toBe("sad");
  });

  it("앞뒤 공백과 개행을 무시한다", () => {
    expect(parseEmotion("  happy\n")).toBe("happy");
  });

  it("마크다운 강조를 무시한다", () => {
    expect(parseEmotion("**angry**")).toBe("angry");
  });

  it("모델이 모르겠다고 하면 null", () => {
    expect(parseEmotion("unknown")).toBe(null);
  });

  it("문장으로 답하면 null", () => {
    // 영문자만 남기고 이어붙이므로 문장은 어떤 감정과도 일치하지 않는다
    expect(parseEmotion("The emotion is sad.")).toBe(null);
  });

  it("감정을 여러 개 답하면 null", () => {
    expect(parseEmotion("sad, angry")).toBe(null);
  });

  it("영어가 아닌 답은 null", () => {
    expect(parseEmotion("슬픔")).toBe(null);
  });

  it("빈 응답은 null", () => {
    expect(parseEmotion("")).toBe(null);
  });

  it("다섯 감정을 모두 읽는다", () => {
    for (const emotion of EMOTIONS) {
      expect(parseEmotion(emotion)).toBe(emotion);
    }
  });
});
