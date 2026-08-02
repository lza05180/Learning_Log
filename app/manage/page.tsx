import { isEditorSignedIn } from "../../lib/editor-auth";
import ManageLessons from "./ManageLessons";
import TeacherLogin from "./TeacherLogin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ManagePage() {
  const isSignedIn = await isEditorSignedIn();

  return isSignedIn ? <ManageLessons /> : <TeacherLogin />;
}
