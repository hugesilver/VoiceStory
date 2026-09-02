import type { Emotion } from "@/constants/emotion";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("voicestory.db");
const SCHEMA_VERSION: number = 4;

interface RawDiaryRow {
  id: number;
  text: string;
  content: string;
  emotion: string;
  audioPath: string;
  isFavorite: number;
  createdAt: number;
  updatedAt: number;
}

export interface DiaryRow {
  id: number;
  text: string;
  content: string;
  emotion: Emotion;
  audioPath: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

// 출시본(v3)의 createdAt/updatedAt는 초 단위
// ms로 바꾸면 기존 일기의 날짜가 1970년으로 읽힘
const nowInSeconds = () => Math.floor(Date.now() / 1000);

const toDiaryRow = (row: RawDiaryRow): DiaryRow => {
  return {
    id: row.id,
    text: row.text,
    content: row.content,
    emotion: row.emotion as Emotion,
    audioPath: row.audioPath,
    isFavorite: row.isFavorite === 1,
    createdAt: new Date(row.createdAt * 1000),
    updatedAt: new Date(row.updatedAt * 1000),
  };
};

export const getDiaries = (): DiaryRow[] => {
  const rows = db.getAllSync<RawDiaryRow>(
    `SELECT * FROM diaries ORDER BY createdAt DESC`,
  );

  return rows.map(toDiaryRow);
};

export const getDiaryById = (id: number): DiaryRow | null => {
  const row = db.getFirstSync<RawDiaryRow>(
    `SELECT * FROM diaries WHERE id = ?`,
    [id],
  );

  return row ? toDiaryRow(row) : null;
};

export const createDiary = (diary: {
  text: string;
  content: string;
  emotion: Emotion;
  audioPath: string;
}) => {
  const now = nowInSeconds();

  db.runSync(
    `INSERT INTO diaries (text, content, emotion, audioPath, isFavorite, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [diary.text, diary.content, diary.emotion, diary.audioPath, 0, now, now],
  );
};

export const updateDiary = (diary: {
  id: number;
  content: string;
  emotion: Emotion;
}) => {
  const now = nowInSeconds();

  db.runSync(
    `UPDATE diaries SET content = ?, emotion = ?, updatedAt = ? WHERE id = ?`,
    [diary.content, diary.emotion, now, diary.id],
  );
};

// 녹음본 삭제
export const clearDiaryAudio = (id: number) => {
  const now = nowInSeconds();

  db.runSync(`UPDATE diaries SET audioPath = '', updatedAt = ? WHERE id = ?`, [
    now,
    id,
  ]);
};

export const deleteDiary = (id: number) => {
  db.runSync(`DELETE FROM diaries WHERE id = ?`, [id]);
};
