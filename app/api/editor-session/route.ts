import {
  clearEditorSessionCookie,
  createEditorSessionCookie,
  isEditorRequest,
  verifyTeacherPassword,
} from "../../../lib/editor-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === "https:";
}

export async function GET(request: Request) {
  return Response.json(
    { authenticated: await isEditorRequest(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return Response.json(
      { error: "비밀번호를 입력해주세요." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!(await verifyTeacherPassword(password))) {
    return Response.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    return Response.json(
      { authenticated: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": await createEditorSessionCookie(isSecureRequest(request)),
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "선생님 인증을 시작하지 못했습니다.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(request: Request) {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": clearEditorSessionCookie(isSecureRequest(request)),
      },
    },
  );
}
