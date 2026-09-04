import {
  buildFolderName,
  selectNewDiaries,
  extractExtension,
  formatDateFolder,
  toContent,
  type DiaryFile,
} from "@/utils/backup-format";

// v2/v3 공통 필드를 채운 기본값. 각 테스트는 필요한 필드만 덮어쓴다
const baseDiary = (overrides: Partial<DiaryFile> = {}): DiaryFile => ({
  text: "원본 텍스트",
  audioFile: "",
  emotion: "neutral",
  isFavorite: 0,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});

describe("toContent — 백업 파일에서 본문 고르기", () => {
  it("v3 파일은 content를 그대로 쓴다", () => {
    const diary = baseDiary({ content: "최종 본문" });

    expect(toContent(diary)).toBe("최종 본문");
  });

  it("v3에서 본문이 빈 문자열이면 그 빈 값을 지킨다", () => {
    // undefined가 아니라 ''이므로 v2 경로로 새면 안 된다
    const diary = baseDiary({ content: "", text: "원본 텍스트" });

    expect(toContent(diary)).toBe("");
  });

  it("v2에서 교정본을 골랐으면 polishedText를 쓴다", () => {
    const diary = baseDiary({
      selectedText: "polished",
      polishedText: "교정된 텍스트",
    });

    expect(toContent(diary)).toBe("교정된 텍스트");
  });

  it("v2에서 원본을 골랐으면 text를 쓴다", () => {
    const diary = baseDiary({
      selectedText: "original",
      polishedText: "교정된 텍스트",
    });

    expect(toContent(diary)).toBe("원본 텍스트");
  });

  it("v2에서 교정본을 골랐지만 polishedText가 비어 있으면 text로 되돌아간다", () => {
    // AI 교정이 실패한 채로 저장된 일기. 빈 본문이 복원되면 안 된다
    const diary = baseDiary({ selectedText: "polished", polishedText: "" });

    expect(toContent(diary)).toBe("원본 텍스트");
  });

  it("v2에 selectedText가 없으면 text를 쓴다", () => {
    const diary = baseDiary({ polishedText: "교정된 텍스트" });

    expect(toContent(diary)).toBe("원본 텍스트");
  });
});

describe("formatDateFolder — 폴더용 날짜", () => {
  it("Unix 초를 YYYY-MM-DD로 바꾼다", () => {
    // 2026-09-04T12:00:00Z
    expect(formatDateFolder(1788523200)).toBe("2026-09-04");
  });

  it("기기 시간대와 무관하게 UTC 기준으로 자른다", () => {
    // 2026-09-04T23:30:00Z — 한국(UTC+9)에서는 이미 9월 5일
    const utcLateNight = 1788564600;

    expect(formatDateFolder(utcLateNight)).toBe("2026-09-04");
  });

  it("월과 일을 두 자리로 채운다", () => {
    // 2026-01-05T00:00:00Z
    expect(formatDateFolder(1767571200)).toBe("2026-01-05");
  });
});

describe("buildFolderName — 하루 안의 일련번호", () => {
  it("일련번호를 다섯 자리로 채운다", () => {
    expect(buildFolderName("2026-09-04", 1)).toBe("2026-09-04-00001");
  });

  it("자릿수가 늘어도 형식을 지킨다", () => {
    expect(buildFolderName("2026-09-04", 123)).toBe("2026-09-04-00123");
  });

  it("정렬했을 때 순서가 유지된다", () => {
    const names = [2, 10, 1].map((n) => buildFolderName("2026-09-04", n));

    expect([...names].sort()).toEqual([
      "2026-09-04-00001",
      "2026-09-04-00002",
      "2026-09-04-00010",
    ]);
  });
});

describe("extractExtension — 녹음 파일 확장자", () => {
  it("확장자를 뽑는다", () => {
    expect(extractExtension("audio.m4a")).toBe("m4a");
  });

  it("확장자가 없으면 wav로 본다", () => {
    expect(extractExtension("audio")).toBe("wav");
  });

  it("점이 여러 개면 마지막 것을 쓴다", () => {
    expect(extractExtension("1757000000-audio.rec.wav")).toBe("wav");
  });

  it("빈 문자열이면 wav로 본다", () => {
    expect(extractExtension("")).toBe("wav");
  });
});

describe("selectNewDiaries — 가져오기에서 이미 있는 일기 거르기", () => {
  const entry = (createdAt: number) => ({ createdAt });

  it("기존에 없는 것만 고른다", () => {
    const picked = selectNewDiaries([entry(100), entry(200)], [100]);

    expect(picked).toEqual([entry(200)]);
  });

  it("기존 목록이 비어 있으면 전부 고른다", () => {
    const picked = selectNewDiaries([entry(100), entry(200)], []);

    expect(picked).toEqual([entry(100), entry(200)]);
  });

  it("같은 백업을 두 번 가져와도 아무것도 추가되지 않는다", () => {
    const backup = [entry(100), entry(200)];
    const picked = selectNewDiaries(backup, [100, 200]);

    expect(picked).toEqual([]);
  });

  it("백업 안에 같은 시각이 두 번 있으면 한 번만 남긴다", () => {
    const picked = selectNewDiaries([entry(100), entry(100)], []);

    expect(picked).toEqual([entry(100)]);
  });

  it("순서를 유지한다", () => {
    const picked = selectNewDiaries([entry(300), entry(100), entry(200)], []);

    expect(picked.map((item) => item.createdAt)).toEqual([300, 100, 200]);
  });

  it("원본 배열을 건드리지 않는다", () => {
    const diaries = [entry(100), entry(200)];

    selectNewDiaries(diaries, [100]);

    expect(diaries).toHaveLength(2);
  });
});
