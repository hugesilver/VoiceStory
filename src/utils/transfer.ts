import type { Emotion } from "@/constants/emotion";
import { getDiaries, mergeDiaries } from "@/db/database";
import { AUDIO_DIR_NAME } from "@/utils/audio";
import {
  buildFolderName,
  DIARIES_DIR_NAME,
  DIARY_FILENAME,
  extractExtension,
  formatDateFolder,
  isSupportedVersion,
  MANIFEST_FILENAME,
  MANIFEST_VERSION,
  toContent,
  type DiaryFile,
  type Manifest,
} from "@/utils/backup-format";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { unzip, zip } from "react-native-zip-archive";

export interface ImportResult {
  imported: number;
  skipped: number;
}

// Directory.uri는 플랫폼에 따라 끝 슬래시 유무가 달라 결합 전에 보정
const withTrailingSlash = (uri: string) =>
  uri.endsWith("/") ? uri : `${uri}/`;

const documentDir = () => withTrailingSlash(Paths.document.uri);
const cacheDir = () => withTrailingSlash(Paths.cache.uri);

const audioDir = () => `${documentDir()}${AUDIO_DIR_NAME}/`;

const removeIfExists = (target: File | Directory) => {
  if (target.exists) {
    target.delete();
  }
};

const writeText = (path: string, content: string) => {
  const file = new File(path);

  file.create({ intermediates: true, overwrite: true });
  file.write(content);
};

// 내보내기
export const exportDiaries = async () => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("이 기기에서 공유를 쓸 수 없습니다");
  }

  const workDir = `${cacheDir()}voicestory-export/`;
  const diariesDir = `${workDir}${DIARIES_DIR_NAME}/`;

  removeIfExists(new Directory(workDir));
  new Directory(diariesDir).create({ intermediates: true });

  // 오래된 것부터 담아야 폴더 일련번호가 날짜 순으로 붙는다
  const rows = [...getDiaries()].reverse();

  let currentDate = "";
  let sequenceInDay = 0;

  for (const row of rows) {
    const createdAt = Math.floor(row.createdAt.getTime() / 1000);
    const date = formatDateFolder(createdAt);

    if (date === currentDate) {
      sequenceInDay += 1;
    } else {
      currentDate = date;
      sequenceInDay = 1;
    }

    const folderName = buildFolderName(date, sequenceInDay);
    const folderPath = `${diariesDir}${folderName}/`;

    new Directory(folderPath).create({ intermediates: true });

    let audioFile = "";

    if (row.audioPath) {
      const source = new File(`${audioDir()}${row.audioPath}`);

      if (source.exists) {
        audioFile = `audio.${extractExtension(row.audioPath)}`;
        source.copy(new File(`${folderPath}${audioFile}`));
      }
    }

    const diary: DiaryFile = {
      text: row.text,
      content: row.content,
      audioFile,
      emotion: row.emotion,
      isFavorite: row.isFavorite ? 1 : 0,
      createdAt,
      updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
    };

    writeText(`${folderPath}${DIARY_FILENAME}`, JSON.stringify(diary, null, 2));
  }

  const manifest: Manifest = {
    version: MANIFEST_VERSION,
    exportedAt: Math.floor(Date.now() / 1000),
  };

  writeText(
    `${workDir}${MANIFEST_FILENAME}`,
    JSON.stringify(manifest, null, 2),
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const zipPath = `${cacheDir()}voicestory-${timestamp}.voicestory`;

  await zip(workDir, zipPath);

  await Sharing.shareAsync(zipPath, {
    mimeType: "application/zip",
    UTI: "public.zip-archive",
  });

  // zip은 OS가 정리
  removeIfExists(new Directory(workDir));
};

// 가져오기(병합)
export const importDiaries = async (): Promise<ImportResult | null> => {
  // .voicestory는 임의 확장자라 타입 지정 불가
  const picked = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (picked.canceled || picked.assets.length === 0) {
    return null;
  }

  const workDir = `${cacheDir()}voicestory-import/`;

  removeIfExists(new Directory(workDir));
  new Directory(workDir).create({ intermediates: true });

  try {
    await unzip(picked.assets[0].uri, workDir);

    const manifestFile = new File(`${workDir}${MANIFEST_FILENAME}`);

    if (!manifestFile.exists) {
      throw new Error("manifest.json이 없습니다");
    }

    const manifest = JSON.parse(manifestFile.textSync()) as Manifest;

    // 레거시(v2)도 병합
    if (!isSupportedVersion(manifest.version)) {
      throw new Error(`지원하지 않는 버전입니다: ${manifest.version}`);
    }

    const diariesDir = new Directory(`${workDir}${DIARIES_DIR_NAME}/`);

    if (!diariesDir.exists) {
      return { imported: 0, skipped: 0 };
    }

    const entries: { folderName: string; diary: DiaryFile }[] = [];

    for (const entry of diariesDir.list()) {
      const diaryJson = new File(
        `${workDir}${DIARIES_DIR_NAME}/${entry.name}/${DIARY_FILENAME}`,
      );

      // 손상된 항목은 스킵
      if (!diaryJson.exists) {
        continue;
      }

      entries.push({
        folderName: entry.name,
        diary: JSON.parse(diaryJson.textSync()) as DiaryFile,
      });
    }

    entries.sort((a, b) => a.diary.createdAt - b.diary.createdAt);

    const audioDirectory = new Directory(audioDir());

    if (!audioDirectory.exists) {
      audioDirectory.create({ intermediates: true });
    }

    const restored = entries.map(({ folderName, diary }) => {
      let audioPath = "";

      if (diary.audioFile) {
        const source = new File(
          `${workDir}${DIARIES_DIR_NAME}/${folderName}/${diary.audioFile}`,
        );

        if (source.exists) {
          audioPath = `${diary.createdAt}.${extractExtension(diary.audioFile)}`;

          const target = new File(`${audioDir()}${audioPath}`);

          if (!target.exists) {
            source.copy(target);
          }
        }
      }

      return {
        text: diary.text,
        content: toContent(diary),
        emotion: diary.emotion as Emotion,
        audioPath,
        isFavorite: diary.isFavorite,
        createdAt: diary.createdAt,
        updatedAt: diary.updatedAt,
      };
    });

    const imported = mergeDiaries(restored);

    return { imported, skipped: restored.length - imported };
  } finally {
    removeIfExists(new Directory(workDir));
  }
};

// 캐시 지우기
export const clearCache = () => {
  for (const entry of new Directory(Paths.cache).list()) {
    if (entry.name.startsWith("voicestory-")) {
      removeIfExists(entry);
    }
  }
};
