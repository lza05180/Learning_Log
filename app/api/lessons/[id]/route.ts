import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { lessons } from "../../../../db/schema";
import { isEditorRequest } from "../../../../lib/editor-auth";
import { parseLessonPayload, serializeLesson } from "../../../../lib/lesson";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isEditorRequest(request))) {
    return Response.json(
      { error: "선생님 비밀번호를 다시 입력해주세요." },
      { status: 401 },
    );
  }

  const id = parseId((await params).id);
  if (!id) {
    return Response.json({ error: "잘못된 기록 번호입니다." }, { status: 400 });
  }

  try {
    const values = parseLessonPayload(await request.json());
    const db = await getDb();
    const [updated] = await db
      .update(lessons)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ lesson: serializeLesson(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isEditorRequest(request))) {
    return Response.json(
      { error: "선생님 비밀번호를 다시 입력해주세요." },
      { status: 401 },
    );
  }

  const id = parseId((await params).id);
  if (!id) {
    return Response.json({ error: "잘못된 기록 번호입니다." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const [deleted] = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning({ id: lessons.id });

    if (!deleted) {
      return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ deletedId: deleted.id });
  } catch (error) {
    return errorResponse(error);
  }
}
