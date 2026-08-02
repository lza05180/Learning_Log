"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function TeacherLogin() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/editor-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "비밀번호를 확인하지 못했습니다.");
      }

      window.location.replace("/manage");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "비밀번호를 확인하지 못했습니다.",
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="manage-access-page">
      <section className="access-card teacher-login-card">
        <span className="access-symbol" aria-hidden="true">채</span>
        <p className="eyebrow">TEACHER ONLY</p>
        <h1>선생님 기록 관리</h1>
        <p>
          수업 기록을 작성하거나 수정하려면 선생님 비밀번호를 입력해주세요.
        </p>

        <form className="teacher-login-form" onSubmit={signIn}>
          <label htmlFor="teacher-password">선생님 비밀번호</label>
          <input
            id="teacher-password"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="비밀번호 입력"
            required
            autoFocus
          />
          <div className="login-feedback" aria-live="polite">
            {error && <p className="error-message">! {error}</p>}
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "확인 중…" : "기록 관리 열기"}
          </button>
        </form>

        <Link className="back-to-calendar" href="/">
          학습 기록표로 돌아가기
        </Link>
      </section>
    </main>
  );
}
