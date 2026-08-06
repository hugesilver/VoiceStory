import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("voicestory.db");
const SCHEMA_VERSION: number = 4;

export const initDatabase = () => {
  // 스키마 버전 확인
  const current = db.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version",
  );

  const version = current?.user_version ?? 0;

  // 최신 스키마일 경우
  if (version >= SCHEMA_VERSION) {
    return;
  }

  db.withTransactionSync(() => {
    // 첫 실행
    if (version === 0) {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS diaries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,            
      content    TEXT    NOT NULL,       
      emotion    TEXT    NOT NULL,
      audioPath  TEXT    NOT NULL DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      createdAt  INTEGER NOT NULL,
      updatedAt  INTEGER NOT NULL)
    `,
      );
    }

    // 마이그레이션
    switch (version) {
      case 3:
        db.execSync(
          `ALTER TABLE diaries ADD COLUMN content TEXT NOT NULL DEFAULT ''`,
        );
        db.execSync(
          `UPDATE diaries SET content = 
          CASE WHEN selectedText = 'polished' AND polishedText <> '' THEN polishedText
          ELSE text
          END`,
        );
    }

    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
};
