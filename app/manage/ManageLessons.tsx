"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LessonRecord,
  Performance,
  performanceValues,
} from "../../lib/lesson";

type Draft = {
  date: string;
  startTime: string;
  endTime: string;
  progress: string;
  assignment: string;
  performance: Performance;
  comment: string;
};

function emptyDraft(): Draft {
  const today = new Date();
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    date,
    startTime: "18:00",
    endTime: "20:00",
    progress: "",
    assignment: "",
    performance: "보통",
    comment: "",
  };
}

function recordToDraft(record: LessonRecord): Draft {
  return {
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    progress: record.progress,
    assignment: record.assignment,
    performance: record.performance,
    comment: record.comment,
  };
}

function formatListDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}월 ${day}일 ${weekdays[date.getDay()]}요일`;
}

export default function ManageLessons() {
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/lessons", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "기록을 불러오지 못했습니다.");
        if (active) setRecords(payload.lessons);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
    setError("");
  }

  function selectRecord(record: LessonRecord) {
    setSelectedId(record.id);
    setDraft(recordToDraft(record));
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNewRecord() {
    setSelectedId(null);
    setDraft(emptyDraft());
    setNotice("");
    setError("");
  }

  async function lockTeacherMode() {
    await fetch("/api/editor-session", { method: "DELETE" });
    window.location.replace("/");
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        selectedId ? `/api/lessons/${selectedId}` : "/api/lessons",
        {
          method: selectedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const payload = await response.json();
      if (response.status === 401) {
        window.location.replace("/manage");
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "저장하지 못했습니다.");

      const saved = payload.lesson as LessonRecord;
      setRecords((current) => {
        const withoutSaved = current.filter((record) => record.id !== saved.id);
        return [...withoutSaved, saved];
      });
      setSelectedId(saved.id);
      setDraft(recordToDraft(saved));
      setNotice(selectedId ? "수업 기록을 수정했습니다." : "새 수업 기록을 저장했습니다.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord() {
    if (!selectedId) return;
    const confirmed = window.confirm(
      "이 수업 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.",
    );
    if (!confirmed) return;

    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/lessons/${selectedId}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (response.status === 401) {
        window.location.replace("/manage");
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "삭제하지 못했습니다.");
      setRecords((current) => current.filter((record) => record.id !== selectedId));
      startNewRecord();
      setNotice("수업 기록을 삭제했습니다.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "삭제하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="manage-shell">
      <header className="manage-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">채</span>
          <span>
            <strong>채윤이의 학습 기록표</strong>
            <small>선생님 기록 관리</small>
          </span>
        </Link>
        <div className="manage-account">
          <span>선생님 모드</span>
          <button type="button" onClick={lockTeacherMode}>잠그기</button>
        </div>
      </header>

      <section className="manage-intro">
        <div>
          <p className="eyebrow">TEACHER WORKSPACE</p>
          <h1>수업 기록하기</h1>
          <p>저장한 내용은 학부모님용 캘린더에 바로 반영됩니다.</p>
        </div>
        <div className="manage-intro-actions">
          <Link href="/" target="_blank" rel="noreferrer">학부모 화면 보기 ↗</Link>
          <button type="button" onClick={startNewRecord}>+ 새 기록</button>
        </div>
      </section>

      <section className="manage-board">
        <form className="lesson-form" onSubmit={saveRecord}>
          <div className="form-heading">
            <div>
              <p className="eyebrow">{selectedId ? "EDIT LESSON" : "NEW LESSON"}</p>
              <h2>{selectedId ? "수업 기록 수정" : "새 수업 기록"}</h2>
            </div>
            <span>{selectedId ? "기존 기록" : "새 기록"}</span>
          </div>

          <div className="form-grid three-columns">
            <label>
              <span>수업 날짜</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => updateDraft("date", event.target.value)}
                required
              />
            </label>
            <label>
              <span>시작 시간</span>
              <input
                type="time"
                value={draft.startTime}
                onChange={(event) => updateDraft("startTime", event.target.value)}
                required
              />
            </label>
            <label>
              <span>종료 시간</span>
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) => updateDraft("endTime", event.target.value)}
                required
              />
            </label>
          </div>

          <label className="wide-field">
            <span>학습 내용 및 진도 <b>필수</b></span>
            <textarea
              rows={4}
              value={draft.progress}
              onChange={(event) => updateDraft("progress", event.target.value)}
              placeholder="오늘 학습한 단원과 진도, 이해도를 기록해주세요."
              required
            />
          </label>

          <label className="wide-field">
            <span>과제</span>
            <textarea
              rows={3}
              value={draft.assignment}
              onChange={(event) => updateDraft("assignment", event.target.value)}
              placeholder="교재명, 페이지 또는 다음 시간까지 해야 할 과제를 입력해주세요."
            />
          </label>

          <fieldset className="performance-field">
            <legend>과제 수행도</legend>
            <div>
              {performanceValues.map((value) => (
                <button
                  type="button"
                  className={draft.performance === value ? "is-selected" : ""}
                  onClick={() => updateDraft("performance", value)}
                  aria-pressed={draft.performance === value}
                  key={value}
                >
                  <i aria-hidden="true" />
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="wide-field">
            <span>선생님 코멘트</span>
            <textarea
              rows={4}
              value={draft.comment}
              onChange={(event) => updateDraft("comment", event.target.value)}
              placeholder="학생의 변화, 잘한 점, 다음 수업 계획을 학부모님께 전해주세요."
            />
          </label>

          <div className="form-feedback" aria-live="polite">
            {notice && <p className="success-message">✓ {notice}</p>}
            {error && <p className="error-message">! {error}</p>}
          </div>

          <div className="form-actions">
            {selectedId && (
              <button
                className="delete-button"
                type="button"
                onClick={deleteRecord}
                disabled={saving}
              >
                기록 삭제
              </button>
            )}
            <button className="save-button" type="submit" disabled={saving}>
              {saving ? "저장 중…" : selectedId ? "수정 내용 저장" : "수업 기록 저장"}
            </button>
          </div>
        </form>

        <aside className="record-list-panel">
          <div className="record-list-heading">
            <div>
              <p className="eyebrow">LESSON HISTORY</p>
              <h2>저장된 기록</h2>
            </div>
            <strong>{records.length}<small>회</small></strong>
          </div>

          {loading ? (
            <p className="record-list-status">기록을 불러오는 중입니다…</p>
          ) : sortedRecords.length ? (
            <div className="record-list">
              {sortedRecords.map((record) => (
                <button
                  type="button"
                  className={selectedId === record.id ? "is-selected" : ""}
                  onClick={() => selectRecord(record)}
                  key={record.id}
                >
                  <span className="record-list-date">{formatListDate(record.date)}</span>
                  <strong>{record.progress}</strong>
                  <small>{record.time} · {record.performance}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="record-list-empty">
              <span aria-hidden="true">✦</span>
              <strong>아직 저장된 기록이 없습니다.</strong>
              <p>왼쪽 양식을 작성해 첫 수업 기록을 남겨보세요.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
