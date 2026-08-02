import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let databaseInitialization: Promise<void> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL이 없습니다. Vercel에서 Postgres 데이터베이스를 연결해주세요.",
    );
  }
  return databaseUrl;
}

async function initializeDatabase(sql: NeonQueryFunction<false, false>) {
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
}

export async function getDb() {
  const sql = neon(getDatabaseUrl());

  if (!databaseInitialization) {
    databaseInitialization = initializeDatabase(sql).catch((error) => {
      databaseInitialization = null;
      throw error;
    });
  }

  await databaseInitialization;
  return drizzle({ client: sql, schema });
}
