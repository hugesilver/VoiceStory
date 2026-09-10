export const SCHEMA_VERSION = 4;

export const CREATE_DIARIES_TABLE = `CREATE TABLE IF NOT EXISTS diaries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  emotion    TEXT    NOT NULL,
  audioPath  TEXT    NOT NULL DEFAULT '',
  isFavorite INTEGER NOT NULL DEFAULT 0,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL)`;

// v3 -> v4 마이그레이션: 기존 polishedText/selectedText를 content로
export const MIGRATIONS: Record<number, string[]> = {
  3: [
    `ALTER TABLE diaries ADD COLUMN content TEXT NOT NULL DEFAULT ''`,
    `UPDATE diaries SET content =
       CASE WHEN selectedText = 'polished' AND polishedText <> '' THEN polishedText
       ELSE text
       END`,
  ],
};
