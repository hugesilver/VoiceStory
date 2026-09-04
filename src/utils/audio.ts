import { Directory, File, Paths } from "expo-file-system";

// 출시본이 쓰던 이름 그대로. 바꾸면 기존 사용자의 녹음을 못 찾는다
export const AUDIO_DIR_NAME = "voicestory-audio";

// 예전 출시본은 절대 경로를 저장한 행이 있다. iOS는 업데이트 때 Documents의 UUID가
// 바뀌어 그 경로가 끊기므로, 파일명만 뽑아 현재 경로로 다시 만든다
const toFileName = (stored: string) => stored.split("/").pop() ?? "";

export const keepAudio = (cacheUri: string): string => {
  if (!cacheUri) {
    return "";
  }

  try {
    const source = new File(cacheUri);

    if (!source.exists) {
      return "";
    }

    const directory = new Directory(Paths.document, AUDIO_DIR_NAME);

    if (!directory.exists) {
      directory.create({ intermediates: true });
    }

    const fileName = `${Date.now()}-${source.name}`;

    source.moveSync(new File(directory, fileName));

    return fileName;
  } catch (error) {
    // 본문은 저장
    console.warn("녹음 파일 보관 실패:", error);

    return "";
  }
};

export const getAudioUri = (stored: string): string => {
  const fileName = toFileName(stored);

  if (!fileName) {
    return "";
  }

  return new File(Paths.document, AUDIO_DIR_NAME, fileName).uri;
};

export const deleteAudio = (stored: string) => {
  const fileName = toFileName(stored);

  if (!fileName) {
    return;
  }

  try {
    const file = new File(Paths.document, AUDIO_DIR_NAME, fileName);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("녹음 파일 삭제 실패:", error);
  }
};

// 전체 초기화
export const clearAllAudio = () => {
  try {
    const directory = new Directory(Paths.document, AUDIO_DIR_NAME);

    if (directory.exists) {
      directory.delete();
    }
  } catch (error) {
    console.warn("녹음 폴더 정리 실패:", error);
  }
};
