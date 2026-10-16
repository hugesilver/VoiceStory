import { beforeEach, expect, it, jest } from "@jest/globals";
import { getDiaries, mergeDiaries } from "@/db/database";
import { getDocumentAsync } from "expo-document-picker";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { unzip, zip } from "react-native-zip-archive";
import { exportDiaries, importDiaries } from "../transfer";

const mockFiles = new Map();
const mockDirectories = new Set();
const mockCopy = jest.fn();
const mockWrite = jest.fn();
const mockDelete = jest.fn();
let mockArchivedFiles;

jest.mock("@/db/database", () => ({ getDiaries: jest.fn(), mergeDiaries: jest.fn() }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("react-native-zip-archive", () => ({ zip: jest.fn(), unzip: jest.fn() }));
jest.mock("expo-file-system", () => ({
  Paths: { document: { uri: "file:///documents/" }, cache: { uri: "file:///cache/" } },
  File: class {
    constructor(uri) { this.uri = uri; }
    get exists() { return mockFiles.has(this.uri); }
    create() { mockFiles.set(this.uri, ""); }
    textSync() { return mockFiles.get(this.uri); }
    delete() { mockFiles.delete(this.uri); }
    async write(content) {
      await mockWrite();
      mockFiles.set(this.uri, content);
    }
    async copy(destination) {
      await mockCopy();
      mockFiles.set(destination.uri, mockFiles.get(this.uri));
    }
  },
  Directory: class {
    constructor(uri) { this.uri = uri; }
    get exists() { return mockDirectories.has(this.uri); }
    create() { mockDirectories.add(this.uri); }
    list() { return [{ name: "entry" }]; }
    delete() {
      mockDelete(this.uri);
      mockDirectories.delete(this.uri);
      for (const uri of mockFiles.keys()) {
        if (uri.startsWith(this.uri)) mockFiles.delete(uri);
      }
    }
  },
}));

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockFiles.clear();
  mockDirectories.clear();
  mockArchivedFiles = [];
  mockCopy.mockResolvedValue(undefined);
  mockWrite.mockResolvedValue(undefined);
  isAvailableAsync.mockResolvedValue(true);
  shareAsync.mockResolvedValue(undefined);
  getDiaries.mockReturnValue([{
    text: "원본", content: "일기", emotion: "neutral", isFavorite: false,
    audioPath: "source.wav", createdAt: new Date(1000000), updatedAt: new Date(1000000),
  }]);
  mockFiles.set("file:///documents/voicestory-audio/source.wav", "audio data");
  zip.mockImplementation(async (workDir, destination) => {
    mockArchivedFiles = [...mockFiles.keys()].filter((uri) => uri.startsWith(workDir));
    return destination;
  });
  getDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///backup.voicestory" }] });
  mergeDiaries.mockImplementation((diaries) => diaries.length);
  unzip.mockImplementation(async () => {
    const workDir = "file:///cache/voicestory-import/";
    mockDirectories.add(workDir);
    mockDirectories.add(`${workDir}diaries/`);
    mockFiles.set(`${workDir}manifest.json`, JSON.stringify({ version: 3, exportedAt: 1000 }));
    mockFiles.set(`${workDir}diaries/entry/diary.json`, JSON.stringify({
      text: "원본", content: "일기", audioFile: "audio.wav", emotion: "neutral",
      isFavorite: 0, createdAt: 1000, updatedAt: 1000,
    }));
    mockFiles.set(`${workDir}diaries/entry/audio.wav`, "audio data");
  });
});

it("내보내기는 오디오 복사와 JSON 쓰기가 끝난 뒤 모든 파일을 압축한다", async () => {
  const copyStarted = deferred();
  const copyFinished = deferred();
  const writeStarted = deferred();
  const writeFinished = deferred();
  mockCopy.mockImplementationOnce(async () => {
    copyStarted.resolve();
    await copyFinished.promise;
  });
  mockWrite.mockImplementation(async () => {
    writeStarted.resolve();
    await writeFinished.promise;
  });

  const exporting = exportDiaries();
  await copyStarted.promise;
  expect(zip).not.toHaveBeenCalled();
  expect(mockWrite).not.toHaveBeenCalled();

  copyFinished.resolve();
  await writeStarted.promise;
  expect(zip).not.toHaveBeenCalled();

  writeFinished.resolve();
  await exporting;
  expect(zip).toHaveBeenCalledTimes(1);
  for (const name of ["audio.wav", "diary.json", "manifest.json"]) {
    expect(mockArchivedFiles.some((uri) => uri.endsWith(`/${name}`))).toBe(true);
  }
  expect(shareAsync).toHaveBeenCalledTimes(1);
});

it("JSON 쓰기가 실패하면 불완전한 백업을 압축하거나 공유하지 않는다", async () => {
  mockWrite.mockRejectedValueOnce(new Error("write failed"));

  await expect(exportDiaries()).rejects.toThrow("write failed");

  expect(zip).not.toHaveBeenCalled();
  expect(shareAsync).not.toHaveBeenCalled();
});

it("가져오기는 오디오 복사가 끝난 뒤 DB에 반영하고 임시 폴더를 정리한다", async () => {
  const copyStarted = deferred();
  const copyFinished = deferred();
  mockCopy.mockImplementationOnce(async () => {
    copyStarted.resolve();
    await copyFinished.promise;
  });

  const importing = importDiaries();
  await copyStarted.promise;
  expect(mergeDiaries).not.toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();

  copyFinished.resolve();
  await expect(importing).resolves.toEqual({ imported: 1, skipped: 0 });
  expect(mockFiles.get("file:///documents/voicestory-audio/1000.wav")).toBe("audio data");
  expect(mergeDiaries).toHaveBeenCalledWith([expect.objectContaining({ content: "일기", audioPath: "1000.wav" })]);
  expect(mockDelete).toHaveBeenCalledWith("file:///cache/voicestory-import/");
});

it("오디오 복사가 실패하면 DB에 반영하지 않고 오류를 전달한다", async () => {
  mockCopy.mockRejectedValueOnce(new Error("copy failed"));

  await expect(importDiaries()).rejects.toThrow("copy failed");

  expect(mergeDiaries).not.toHaveBeenCalled();
  expect(mockDelete).toHaveBeenCalledWith("file:///cache/voicestory-import/");
});
