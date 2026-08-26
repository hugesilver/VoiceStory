import { Directory, File, Paths } from "expo-file-system";

const RECORDINGS_DIR = "recordings";

export const keepAudio = (cacheUri: string): string => {
  if (!cacheUri) {
    return "";
  }

  try {
    const source = new File(cacheUri);

    if (!source.exists) {
      return "";
    }

    const directory = new Directory(Paths.document, RECORDINGS_DIR);

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

export const getAudioUri = (fileName: string): string => {
  if (!fileName) {
    return "";
  }

  return new File(Paths.document, RECORDINGS_DIR, fileName).uri;
};

export const deleteAudio = (fileName: string) => {
  if (!fileName) {
    return;
  }

  try {
    const file = new File(Paths.document, RECORDINGS_DIR, fileName);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("녹음 파일 삭제 실패:", error);
  }
};
