import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { lessons } from "../../../db/schema";
import { isEditorRequest } from "../../../lib/editor-auth";
import { parseLessonPayload, serializeLesson } from "../../../lib/lesson";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "기록을 처리하지 못했습니다.";
  const status = message.includes("UNIQUE") || message.includes("unique")
    ? 409
    : message.includes("수업") || message.includes("과제") || message.includes("종료")
      ? 400
      : 500;
  const publicMessage =
    status === 409
      ? "같은 날짜의 수업 기록이 이미 있습니다."
      : status === 500
        ? "잠시 후 다시 시도해주세요."
        : message;

  return Response.json({ error: publicMessage }, { status });
}

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(lessons).orderBy(asc(lessons.lessonDate));
    return Response.json({ lessons: rows.map(serializeLesson) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!(await isEditorRequest(request))) {
    return Response.json(
      { error: "선생님 비밀번호를 다시 입력해주세요." },
      { status: 401 },
    );
  }

  try {
    const values = parseLessonPayload(await request.json());
    const db = await getDb();
    const [created] = await db.insert(lessons).values(values).returning();
    return Response.json({ lesson: serializeLesson(created) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
