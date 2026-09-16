import type { Emotion } from "@/constants/emotion";
import {
  CREATE_DIARIES_TABLE,
  MIGRATIONS,
  SCHEMA_VERSION,
} from "@/db/migrations";
import { selectNewDiaries } from "@/utils/backup-format";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("voicestory.db");

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
      db.execSync(CREATE_DIARIES_TABLE);
    } else {
      // 신규 DB는 이미 최신 스키마이므로 기존 DB에만 마이그레이션 적용
      for (let from = version; from < SCHEMA_VERSION; from += 1) {
        for (const statement of MIGRATIONS[from] ?? []) {
          db.execSync(statement);
        }
      }
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

// 검색(본문, 날짜)
export const searchDiaries = (keyword: string, date: string): DiaryRow[] => {
  const conditions: string[] = [];
  const params: string[] = [];

  if (keyword) {
    conditions.push(`content LIKE ?`);
    params.push(`%${keyword}%`);
  }

  if (date) {
    // createdAt은 초 단위라 기기 시간대로 바꿔서 날짜만 비교한다
    conditions.push(
      `strftime('%Y-%m-%d', createdAt, 'unixepoch', 'localtime') = ?`,
    );
    params.push(date);
  }

  if (conditions.length === 0) {
    return [];
  }

  const rows = db.getAllSync<RawDiaryRow>(
    `SELECT * FROM diaries WHERE ${conditions.join(" AND ")} ORDER BY createdAt DESC`,
    params,
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

// 백업 복원용
export const mergeDiaries = (
  diaries: {
    text: string;
    content: string;
    emotion: Emotion;
    audioPath: string;
    isFavorite: number;
    createdAt: number;
    updatedAt: number;
  }[],
): number => {
  let inserted = 0;

  db.withTransactionSync(() => {
    const existing = db
      .getAllSync<{ createdAt: number }>(`SELECT createdAt FROM diaries`)
      .map((row) => row.createdAt);

    for (const diary of selectNewDiaries(diaries, existing)) {
      db.runSync(
        `INSERT INTO diaries (text, content, emotion, audioPath, isFavorite, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          diary.text,
          diary.content,
          diary.emotion,
          diary.audioPath,
          diary.isFavorite,
          diary.createdAt,
          diary.updatedAt,
        ],
      );

      inserted += 1;
    }
  });

  return inserted;
};

// 전체 초기화용
export const deleteAllDiaries = () => {
  db.runSync(`DELETE FROM diaries`);
};

export const deleteDiary = (id: number) => {
  db.runSync(`DELETE FROM diaries WHERE id = ?`, [id]);
};
