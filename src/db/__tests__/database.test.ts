import { DatabaseSync } from "node:sqlite";
import { initDatabase } from "@/db/database";
import { SCHEMA_VERSION } from "@/db/migrations";

let mockDatabase: DatabaseSync;

// 앱의 실제 초기화 함수를 실행하되 SQL은 인메모리 SQLite에서 검증한다.
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: () => ({
    getFirstSync: (sql: string) => mockDatabase.prepare(sql).get(),
    execSync: (sql: string) => mockDatabase.exec(sql),
    withTransactionSync: (action: () => void) => {
      mockDatabase.exec("BEGIN");
      try {
        action();
        mockDatabase.exec("COMMIT");
      } catch (error) {
        mockDatabase.exec("ROLLBACK");
        throw error;
      }
    },
  }),
}));

beforeEach(() => {
  mockDatabase = new DatabaseSync(":memory:");
});
afterEach(() => mockDatabase.close());

it("첫 실행 후 일기를 저장할 수 있고 재초기화해도 유지된다", () => {
  initDatabase();
  mockDatabase.exec(`INSERT INTO diaries (text, content, emotion, createdAt, updatedAt)
    VALUES ('원본', '본문', 'happy', 1000, 1000)`);
  initDatabase();
  expect(mockDatabase.prepare("SELECT content FROM diaries").all()).toEqual([
    { content: "본문" },
  ]);
  expect(mockDatabase.prepare("PRAGMA user_version").get()).toEqual({
    user_version: SCHEMA_VERSION,
  });
});

it("기존 v3 DB의 교정본과 일기 데이터를 유지하며 업그레이드한다", () => {
  mockDatabase.exec(`CREATE TABLE diaries (
    id INTEGER PRIMARY KEY, text TEXT NOT NULL,
    polishedText TEXT NOT NULL DEFAULT '', selectedText TEXT NOT NULL DEFAULT 'original',
    emotion TEXT NOT NULL, audioPath TEXT NOT NULL DEFAULT '',
    isFavorite INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
  );
  INSERT INTO diaries VALUES (1, '원본', '교정본', 'polished', 'happy', 'voice.m4a', 1, 1000, 2000);
  PRAGMA user_version = 3;`);
  initDatabase();
  initDatabase();
  expect(mockDatabase.prepare("SELECT * FROM diaries").get()).toMatchObject({
    id: 1, text: "원본", content: "교정본", audioPath: "voice.m4a",
    isFavorite: 1, createdAt: 1000, updatedAt: 2000,
  });
  expect(mockDatabase.prepare("PRAGMA user_version").get()).toEqual({
    user_version: SCHEMA_VERSION,
  });
});
