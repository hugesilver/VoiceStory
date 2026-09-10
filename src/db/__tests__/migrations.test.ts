import { CREATE_DIARIES_TABLE, MIGRATIONS, SCHEMA_VERSION } from "@/db/migrations";
import { DatabaseSync } from "node:sqlite";

// 출시본(v3)의 스키마. 원본과 교정본을 따로 들고 selectedText로 무엇을 쓸지 정했다
const V3_SCHEMA = `CREATE TABLE diaries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  text         TEXT    NOT NULL,
  polishedText TEXT    NOT NULL DEFAULT '',
  selectedText TEXT    NOT NULL DEFAULT 'original',
  emotion      TEXT    NOT NULL,
  audioPath    TEXT    NOT NULL DEFAULT '',
  isFavorite   INTEGER NOT NULL DEFAULT 0,
  createdAt    INTEGER NOT NULL,
  updatedAt    INTEGER NOT NULL)`;

interface V3Row {
  text: string;
  polishedText: string;
  selectedText: string;
}

// v3 일기가 든 DB를 만들고 마이그레이션을 실제로 돌린다
const migrateFromV3 = (rows: V3Row[]) => {
  const db = new DatabaseSync(":memory:");

  db.exec(V3_SCHEMA);
  db.exec("PRAGMA user_version = 3");

  const insert = db.prepare(
    `INSERT INTO diaries (text, polishedText, selectedText, emotion, createdAt, updatedAt)
     VALUES (?, ?, ?, 'neutral', 1000, 1000)`,
  );

  for (const row of rows) {
    insert.run(row.text, row.polishedText, row.selectedText);
  }

  const version = (
    db.prepare("PRAGMA user_version").get() as { user_version: number }
  ).user_version;

  for (let from = version; from < SCHEMA_VERSION; from += 1) {
    for (const statement of MIGRATIONS[from] ?? []) {
      db.exec(statement);
    }
  }

  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);

  return db;
};

describe("v3 → v4 마이그레이션", () => {
  it("교정본을 골랐으면 polishedText가 content가 된다", () => {
    const db = migrateFromV3([
      { text: "원본", polishedText: "교정본", selectedText: "polished" },
    ]);

    expect(db.prepare("SELECT content FROM diaries").get()).toMatchObject({
      content: "교정본",
    });
  });

  it("원본을 골랐으면 text가 content가 된다", () => {
    const db = migrateFromV3([
      { text: "원본", polishedText: "교정본", selectedText: "original" },
    ]);

    expect(db.prepare("SELECT content FROM diaries").get()).toMatchObject({
      content: "원본",
    });
  });

  it("교정본을 골랐지만 값이 비어 있으면 원본으로 되돌아간다", () => {
    // AI 교정이 실패한 채로 저장된 일기. 빈 본문이 남으면 안 된다
    const db = migrateFromV3([
      { text: "원본", polishedText: "", selectedText: "polished" },
    ]);

    expect(db.prepare("SELECT content FROM diaries").get()).toMatchObject({
      content: "원본",
    });
  });

  it("여러 건을 각각의 기준으로 채운다", () => {
    const db = migrateFromV3([
      { text: "첫째 원본", polishedText: "첫째 교정", selectedText: "polished" },
      { text: "둘째 원본", polishedText: "둘째 교정", selectedText: "original" },
      { text: "셋째 원본", polishedText: "", selectedText: "polished" },
    ]);

    const contents = (
      db.prepare("SELECT content FROM diaries ORDER BY id").all() as {
        content: string;
      }[]
    ).map((row) => row.content);

    expect(contents).toEqual(["첫째 교정", "둘째 원본", "셋째 원본"]);
  });

  it("본문이 비어 있는 일기가 남지 않는다", () => {
    const db = migrateFromV3([
      { text: "원본", polishedText: "교정본", selectedText: "polished" },
      { text: "원본", polishedText: "", selectedText: "polished" },
      { text: "원본", polishedText: "교정본", selectedText: "original" },
    ]);

    const empty = db
      .prepare("SELECT COUNT(*) AS count FROM diaries WHERE content = ''")
      .get() as { count: number };

    expect(empty.count).toBe(0);
  });

  it("기존 컬럼은 그대로 남는다", () => {
    const db = migrateFromV3([
      { text: "원본", polishedText: "교정본", selectedText: "polished" },
    ]);

    expect(db.prepare("SELECT * FROM diaries").get()).toMatchObject({
      text: "원본",
      emotion: "neutral",
      createdAt: 1000,
      updatedAt: 1000,
    });
  });

  it("마이그레이션 후 스키마 버전이 올라간다", () => {
    const db = migrateFromV3([]);

    expect(db.prepare("PRAGMA user_version").get()).toMatchObject({
      user_version: SCHEMA_VERSION,
    });
  });
});

describe("첫 실행 스키마", () => {
  it("테이블이 만들어지고 새 일기를 넣을 수 있다", () => {
    const db = new DatabaseSync(":memory:");

    db.exec(CREATE_DIARIES_TABLE);
    db.prepare(
      `INSERT INTO diaries (text, content, emotion, createdAt, updatedAt)
       VALUES ('원본', '본문', 'happy', 1000, 1000)`,
    ).run();

    expect(db.prepare("SELECT * FROM diaries").get()).toMatchObject({
      content: "본문",
      emotion: "happy",
      audioPath: "",
      isFavorite: 0,
    });
  });
});
