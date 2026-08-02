import { cookies } from "next/headers";

const SESSION_COOKIE = "chaeyoon_teacher_session";
const SESSION_VERSION = "v1";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const textEncoder = new TextEncoder();

function getTeacherPassword() {
  return process.env.TEACHER_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.TEACHER_SESSION_SECRET ?? "";
}

async function digest(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", textEncoder.encode(value)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, textEncoder.encode(value)),
  );

  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [cookieName, ...cookieValueParts] = part.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValueParts.join("="));
    }
  }
  return null;
}

async function verifySessionToken(token: string | null) {
  if (!token) return false;

  const [version, expiresAtText, providedSignature, ...extra] = token.split(".");
  if (
    version !== SESSION_VERSION ||
    extra.length > 0 ||
    !providedSignature ||
    !/^\d+$/.test(expiresAtText)
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedSignature = await sign(`${version}.${expiresAtText}`);
  return Boolean(expectedSignature) && safeEqual(providedSignature, expectedSignature);
}

export async function verifyTeacherPassword(candidate: unknown) {
  const expectedPassword = getTeacherPassword();
  if (typeof candidate !== "string" || !expectedPassword) return false;

  const [candidateDigest, expectedDigest] = await Promise.all([
    digest(candidate),
    digest(expectedPassword),
  ]);
  return safeEqual(candidateDigest, expectedDigest);
}

export async function createEditorSessionCookie(isSecure: boolean) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const signature = await sign(payload);
  if (!signature) throw new Error("TEACHER_SESSION_SECRET 설정이 필요합니다.");

  return [
    `${SESSION_COOKIE}=${encodeURIComponent(`${payload}.${signature}`)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearEditorSessionCookie(isSecure: boolean) {
  return [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function isEditorRequest(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
}

export async function isEditorSignedIn() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value ?? null);
}
