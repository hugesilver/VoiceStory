interface colorTypes {
  primary: string;
  onPrimary: string;
  primarySoft: string;
  surface: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  emotion: {
    happy: string;
    neutral: string;
    sad: string;
    angry: string;
    tired: string;
  };
  emotionSoft: {
    happy: string;
    neutral: string;
    sad: string;
    angry: string;
    tired: string;
  };
  success: string;
  onSuccess: string;
  error: string;
  scrim: string;
}

export const Colors: Record<"light" | "dark", colorTypes> = {
  light: {
    primary: "#2F3A99", // deepened indigo — AAA (~9:1 on cream surface, ~10:1 white-on-it)
    onPrimary: "#FFFFFF",
    primarySoft: "#E4E5F4", // 선택/플레이 배경용 페일 인디고
    surface: "#F5F3EF",
    card: "#FFFFFF",
    textPrimary: "#1C1B1A",
    textSecondary: "#6B6A66",
    border: "#E0DDD6",
    // 감정
    emotion: {
      happy: "#7A5800",
      neutral: "#4A4845",
      sad: "#1A4F80",
      angry: "#802220",
      tired: "#4A3A80",
    },
    // emotion chip 배경용 soft 톤
    emotionSoft: {
      happy: "#F3ECD8",
      neutral: "#ECEAE5",
      sad: "#DEE9F4",
      angry: "#F4E2E1",
      tired: "#E7E2F2",
    },
    success: "#2D8A56",
    onSuccess: "#FFFFFF",
    error: "#9E3A37",
    scrim: "rgba(28,27,26,0.45)",
  },
  dark: {
    primary: "#9B9EE8", // 다크 모드 전용 — lifted indigo, requires DARK ink for AA
    onPrimary: "#1C1B1A", // 다크 모드 lifted indigo 위 텍스트 — white는 AA 미달
    primarySoft: "#3E3F5C",
    surface: "#2C2B28",
    card: "#3A3935",
    textPrimary: "#E8E6E1",
    textSecondary: "#9C9A92",
    border: "#4A4945",
    // 감정
    emotion: {
      happy: "#F0C030",
      neutral: "#C8C6C0",
      sad: "#80B8E8",
      angry: "#F2A0A0", // card 위 4.39:1로 AA 미달이라 밝힘 (5.68:1)
      tired: "#C0A8E8",
    },
    // emotion chip 배경용 soft 톤
    emotionSoft: {
      happy: "#4A3F1E",
      neutral: "#403F3A",
      sad: "#22384C",
      angry: "#4A2A2A",
      tired: "#3A3252",
    },
    success: "#5FC98C", // 다크 모드 surface 위 AA 충족
    onSuccess: "#10241A",
    error: "#E07070", // 다크 모드 전용 — #2C2B28 배경에서 WCAG AA (5.3:1)
    scrim: "rgba(0,0,0,0.6)",
  },
};

export const Fonts = {
  sans: "NotoSansCJKkr-Regular",
  sansMedium: "NotoSansCJKkr-Medium",
  sansBold: "NotoSansCJKkr-Bold",
  sansExtra: "NotoSansCJKkr-Black",
};
