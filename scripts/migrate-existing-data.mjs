import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL이 없습니다. 먼저 Vercel 환경변수를 .env.local로 받아주세요.",
  );
}

const legacySiteUrl =
  process.env.LEGACY_SITE_URL ??
  "https://chaeyoon-study-log.jeongso121113.chatgpt.site";
const lessonsEndpoint = new URL("/api/lessons", legacySiteUrl);

console.log(`기존 기록을 불러오는 중: ${lessonsEndpoint.origin}`);
const response = await fetch(lessonsEndpoint, {
  headers: { accept: "application/json" },
});

if (!response.ok) {
  throw new Error(`기존 기록 조회 실패: HTTP ${response.status}`);
}

const payload = await response.json();
if (!payload || !Array.isArray(payload.lessons)) {
  throw new Error("기존 사이트가 올바른 수업 기록 목록을 반환하지 않았습니다.");
}

const lessons = payload.lessons;
await mkdir("data", { recursive: true });
const timestamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const backupPath = `data/legacy-lessons-backup-${timestamp}.json`;
await writeFile(backupPath, JSON.stringify({ lessons }, null, 2), "utf8");
console.log(`백업 완료: ${backupPath}`);

const sql = neon(databaseUrl);
await sql`
  CREATE TABLE IF NOT EXISTS lessons (
    id serial PRIMARY KEY,
    lesson_date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    duration_minutes integer NOT NULL,
    progress text NOT NULL,
    assignment text DEFAULT '' NOT NULL,
    performance text NOT NULL,
    comment text DEFAULT '' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
  )
`;
await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS lessons_lesson_date_unique
  ON lessons (lesson_date)
`;

for (const lesson of lessons) {
  if (
    typeof lesson.date !== "string" ||
    typeof lesson.startTime !== "string" ||
    typeof lesson.endTime !== "string" ||
    typeof lesson.durationMinutes !== "number" ||
    typeof lesson.progress !== "string" ||
    typeof lesson.performance !== "string"
  ) {
    throw new Error(`형식이 올바르지 않은 기록이 있습니다: ${lesson.date ?? "날짜 없음"}`);
  }

  await sql`
    INSERT INTO lessons (
      lesson_date,
      start_time,
      end_time,
      duration_minutes,
      progress,
      assignment,
      performance,
      comment
    ) VALUES (
      ${lesson.date},
      ${lesson.startTime},
      ${lesson.endTime},
      ${lesson.durationMinutes},
      ${lesson.progress},
      ${typeof lesson.assignment === "string" ? lesson.assignment : ""},
      ${lesson.performance},
      ${typeof lesson.comment === "string" ? lesson.comment : ""}
    )
    ON CONFLICT (lesson_date) DO UPDATE SET
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      duration_minutes = excluded.duration_minutes,
      progress = excluded.progress,
      assignment = excluded.assignment,
      performance = excluded.performance,
      comment = excluded.comment,
      updated_at = now()
  `;
}

console.log(`이전 완료: ${lessons.length}개의 수업 기록`);
