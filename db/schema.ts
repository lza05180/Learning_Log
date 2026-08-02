import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    lessonDate: text("lesson_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    progress: text("progress").notNull(),
    assignment: text("assignment").notNull().default(""),
    performance: text("performance").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lessons_lesson_date_unique").on(table.lessonDate),
  ],
);
