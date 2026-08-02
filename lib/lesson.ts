export const performanceValues = [
  "매우 좋음",
  "좋음",
  "보통",
  "미흡",
  "매우 미흡",
] as const;

export type Performance = (typeof performanceValues)[number];

export type LessonRecord = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  time: string;
  durationMinutes: number;
  progress: string;
  assignment: string;
  performance: Performance;
  comment: string;
};

type LessonPayload = {
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  progress?: unknown;
  assignment?: unknown;
  performance?: unknown;
  comment?: unknown;
};

export function serializeLesson(row: {
  id: number;
  lessonDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  progress: string;
  assignment: string;
  performance: string;
  comment: string;
}): LessonRecord {
  return {
    id: row.id,
    date: row.lessonDate,
    startTime: row.startTime,
    endTime: row.endTime,
    time: `${formatKoreanTime(row.startTime)} – ${formatKoreanTime(row.endTime)}`,
    durationMinutes: row.durationMinutes,
    progress: row.progress,
    assignment: row.assignment,
    performance: performanceValues.includes(row.performance as Performance)
      ? (row.performance as Performance)
      : "보통",
    comment: row.comment,
  };
}

export function parseLessonPayload(payload: LessonPayload) {
  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  const startTime =
    typeof payload.startTime === "string" ? payload.startTime.trim() : "";
  const endTime =
    typeof payload.endTime === "string" ? payload.endTime.trim() : "";
  const progress =
    typeof payload.progress === "string" ? payload.progress.trim() : "";
  const assignment =
    typeof payload.assignment === "string" ? payload.assignment.trim() : "";
  const performance =
    typeof payload.performance === "string" ? payload.performance.trim() : "";
  const comment =
    typeof payload.comment === "string" ? payload.comment.trim() : "";

  if (!isValidDate(date)) {
    throw new Error("수업 날짜를 정확히 입력해주세요.");
  }
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    throw new Error("수업 시작과 종료 시간을 정확히 입력해주세요.");
  }
  if (!progress) {
    throw new Error("학습 내용 및 진도를 입력해주세요.");
  }
  if (!performanceValues.includes(performance as Performance)) {
    throw new Error("과제 수행도를 선택해주세요.");
  }

  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (durationMinutes <= 0) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }

  return {
    lessonDate: date,
    startTime,
    endTime,
    durationMinutes,
    progress,
    assignment,
    performance: performance as Performance,
    comment,
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function formatKoreanTime(value: string) {
  const [hourValue, minute] = value.split(":").map(Number);
  const period = hourValue < 12 ? "오전" : "오후";
  const hour = hourValue % 12 || 12;
  return `${period} ${hour}:${String(minute).padStart(2, "0")}`;
}
