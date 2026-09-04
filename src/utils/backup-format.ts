// v3 이전 레거시 포맷도 지원
export const MANIFEST_VERSION = 3;
export const MANIFEST_FILENAME = "manifest.json";
export const DIARIES_DIR_NAME = "diaries";
export const DIARY_FILENAME = "diary.json";

// 하루에 여러 건이면 폴더명 뒤에 붙는 일련번호 자릿수
const SEQUENCE_PAD_LENGTH = 5;

export interface Manifest {
  version: number;
  exportedAt: number;
}

// v3에서 쓰는 모양. v2 파일은 polishedText/selectedText가 더 들어 있다
export interface DiaryFile {
  text: string;
  content?: string;
  polishedText?: string; // v2 레거시
  selectedText?: string; // v2 레거시
  audioFile: string;
  emotion: string;
  isFavorite: number;
  createdAt: number;
  updatedAt: number;
}

export const extractExtension = (fileName: string) =>
  fileName.includes(".") ? (fileName.split(".").pop() ?? "wav") : "wav";

// Unix sec → YYYY-MM-DD (UTC)
export const formatDateFolder = (createdAt: number) => {
  const date = new Date(createdAt * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${date.getUTCFullYear()}-${month}-${day}`;
};

export const buildFolderName = (date: string, sequence: number) =>
  `${date}-${String(sequence).padStart(SEQUENCE_PAD_LENGTH, "0")}`;

// DB 마이그레이션(v3 → v4)과 같은 규칙으로 content 하나에 합친다
export const toContent = (diary: DiaryFile) => {
  if (diary.content !== undefined) {
    return diary.content;
  }

  return diary.selectedText === "polished" && diary.polishedText
    ? diary.polishedText
    : diary.text;
};

export const isSupportedVersion = (version: number) =>
  version === 2 || version === MANIFEST_VERSION;

// 병합
export const selectNewDiaries = <T extends { createdAt: number }>(
  diaries: T[],
  existingCreatedAt: number[],
): T[] => {
  const seen = new Set(existingCreatedAt);
  const selected: T[] = [];

  for (const diary of diaries) {
    if (seen.has(diary.createdAt)) {
      continue;
    }

    seen.add(diary.createdAt);
    selected.push(diary);
  }

  return selected;
};
