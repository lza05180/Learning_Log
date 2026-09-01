"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Performance = "매우 좋음" | "좋음" | "보통" | "미흡" | "매우 미흡";

type LessonRecord = {
  id?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  time: string;
  durationMinutes: number;
  progress: string;
  assignment: string;
  performance: Performance;
  comment: string;
};

const performanceOrder: Performance[] = ["매우 좋음", "좋음", "보통", "미흡", "매우 미흡"];
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const today = new Date();
const initialVisibleMonth = {
  year: today.getFullYear(),
  month: today.getMonth(),
};

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthRecords(
  records: Record<string, LessonRecord>,
  year: number,
  month: number,
) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return Object.values(records)
    .filter((record) => record.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatRecordDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${month}월 ${day}일 ${weekdays[date.getDay()]}요일`;
}

export default function Home() {
  const [lessonRecords, setLessonRecords] =
    useState<Record<string, LessonRecord>>({});
  const [visibleMonth, setVisibleMonth] = useState(initialVisibleMonth);
  const [selectedKey, setSelectedKey] = useState("");
  const [loadError, setLoadError] = useState("");

  const monthRecords = useMemo(
    () => getMonthRecords(lessonRecords, visibleMonth.year, visibleMonth.month),
    [lessonRecords, visibleMonth],
  );
  const selectedRecord = lessonRecords[selectedKey];
  const lessonNumber = selectedRecord
    ? monthRecords.findIndex((record) => record.date === selectedRecord.date) + 1
    : 0;
  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
  const firstDay = new Date(visibleMonth.year, visibleMonth.month, 1).getDay();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const totalHours = monthRecords.reduce(
    (sum, record) => sum + record.durationMinutes / 60,
    0,
  );
  const latestRecord = Object.values(lessonRecords)
    .sort((left, right) => left.date.localeCompare(right.date))
    .at(-1);

  useEffect(() => {
    let active = true;
    fetch("/api/lessons", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("기록을 불러오지 못했습니다.");
        return response.json() as Promise<{ lessons: LessonRecord[] }>;
      })
      .then(({ lessons }) => {
        if (!active) return;
        const nextRecords = Object.fromEntries(
          lessons.map((record) => [record.date, record]),
        );
        setLessonRecords(nextRecords);
        const visibleRecords = getMonthRecords(
          nextRecords,
          initialVisibleMonth.year,
          initialVisibleMonth.month,
        );
        setSelectedKey(visibleRecords.at(-1)?.date ?? "");
      })
      .catch(() => {
        setLoadError("수업 기록을 불러오지 못했습니다. 잠시 후 새로고침해주세요.");
      });

    return () => {
      active = false;
    };
  }, []);

  function moveMonth(direction: number) {
    const next = new Date(visibleMonth.year, visibleMonth.month + direction, 1);
    const nextMonth = { year: next.getFullYear(), month: next.getMonth() };
    const nextRecords = getMonthRecords(
      lessonRecords,
      nextMonth.year,
      nextMonth.month,
    );
    setVisibleMonth(nextMonth);
    setSelectedKey(nextRecords.at(-1)?.date ?? "");
  }

  function goToCurrentMonth() {
    const today = new Date();
    const nextMonth = { year: today.getFullYear(), month: today.getMonth() };
    const nextRecords = getMonthRecords(
      lessonRecords,
      nextMonth.year,
      nextMonth.month,
    );
    setVisibleMonth(nextMonth);
    setSelectedKey(nextRecords.at(-1)?.date ?? "");
  }

  function selectLesson(dateKey: string) {
    setSelectedKey(dateKey);
    window.setTimeout(() => {
      document.getElementById("lesson-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 0);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#calendar" aria-label="채윤이의 학습 기록표 홈">
          <span className="brand-mark" aria-hidden="true">채</span>
          <span>
            <strong>채윤이의 학습 기록표</strong>
            <small>매 수업의 성장을 차곡차곡 기록합니다</small>
          </span>
        </a>
        <div className="topbar-actions">
          <Link className="manage-link" href="/manage">선생님 기록하기</Link>
          <div className="viewer-chip">
            <span className="viewer-dot" aria-hidden="true" />
            보호자 열람용
          </div>
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">MONTHLY LEARNING NOTE</p>
          <h1 id="page-title">
            한 달의 배움을
            <br />
            <span className="highlight-title">한눈에 확인하세요.</span>
          </h1>
        </div>
        <p className="intro-copy">
          수업을 진행한 날짜는 노란색으로 표시됩니다.
          <br />
          노란색으로 표시된 날짜를 누르면 그날의 수업 기록을 확인할 수 있습니다.
        </p>
      </section>

      <section className="record-board" id="calendar">
        <div className="calendar-panel">
          {loadError && (
            <p className="calendar-error" role="alert">{loadError}</p>
          )}
          <div className="panel-heading">
            <div className="month-navigation">
              <button className="round-button" type="button" onClick={() => moveMonth(-1)} aria-label="이전 달 보기">←</button>
              <div className="month-label" aria-live="polite">
                <strong>{visibleMonth.month + 1}월</strong>
                <span>{visibleMonth.year}</span>
              </div>
              <button className="round-button" type="button" onClick={() => moveMonth(1)} aria-label="다음 달 보기">→</button>
            </div>
            <button className="today-button" type="button" onClick={goToCurrentMonth}>이번 달</button>
          </div>

          <div className="month-summary" aria-label="이달의 학습 요약">
            <div>
              <span>수업 횟수</span>
              <strong>{monthRecords.length}<small>회</small></strong>
            </div>
            <div>
              <span>총 학습 시간</span>
              <strong>{totalHours}<small>시간</small></strong>
            </div>
            <p><span className="legend-swatch" aria-hidden="true" />수업이 있는 날</p>
          </div>

          <div className="calendar" role="grid" aria-label={`${visibleMonth.year}년 ${visibleMonth.month + 1}월 학습 달력`}>
            <div className="weekday-row" role="row">
              {weekdays.map((weekday, index) => (
                <div className={`weekday ${index === 0 ? "sunday" : ""} ${index === 6 ? "saturday" : ""}`} role="columnheader" key={weekday}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className="calendar-grid">
              {calendarCells.map((day, index) => {
                if (!day) {
                  return <div className="date-cell is-empty" aria-hidden="true" key={`empty-${index}`} />;
                }
                const dateKey = toDateKey(visibleMonth.year, visibleMonth.month, day);
                const lesson = lessonRecords[dateKey];
                const isSelected = dateKey === selectedKey;
                const weekdayIndex = index % 7;

                return (
                  <div className={`date-cell ${lesson ? "has-lesson" : ""} ${isSelected ? "is-selected" : ""}`} role="gridcell" key={dateKey}>
                    {lesson ? (
                      <button
                        type="button"
                        onClick={() => selectLesson(dateKey)}
                        className="date-button"
                        aria-label={`${visibleMonth.month + 1}월 ${day}일 수업 기록 보기`}
                        aria-pressed={isSelected}
                      >
                        <span className="date-number">{day}</span>
                        <span className="lesson-label">수업</span>
                        <span className="lesson-time">{lesson.time.split(" – ")[0]}</span>
                      </button>
                    ) : (
                      <span className={`date-number plain ${weekdayIndex === 0 ? "sunday" : ""} ${weekdayIndex === 6 ? "saturday" : ""}`}>
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="detail-panel" id="lesson-detail" aria-live="polite">
          {selectedRecord ? (
            <>
              <div className="detail-top">
                <div>
                  <p className="detail-kicker">LESSON {String(lessonNumber).padStart(2, "0")}</p>
                  <h2>{formatRecordDate(selectedRecord.date)}</h2>
                </div>
                <span className="recorded-badge">기록 완료</span>
              </div>

              <dl className="lesson-meta">
                <div><dt>수업 시간</dt><dd>{selectedRecord.time}</dd></div>
              </dl>

              <section className="detail-section">
                <span className="section-number">01</span>
                <div><h3>학습 내용 및 진도</h3><p>{selectedRecord.progress}</p></div>
              </section>

              <section className="detail-section">
                <span className="section-number">02</span>
                <div><h3>과제</h3><p>{selectedRecord.assignment}</p></div>
              </section>

              <section className="detail-section performance-section">
                <span className="section-number">03</span>
                <div>
                  <h3>과제 수행도</h3>
                  <div className="performance-scale" aria-label={`과제 수행도: ${selectedRecord.performance}`}>
                    {performanceOrder.map((performance) => (
                      <span className={performance === selectedRecord.performance ? "is-active" : ""} key={performance}>
                        <i aria-hidden="true" />{performance}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="teacher-note">
                <div className="note-heading"><span aria-hidden="true">✦</span><h3>선생님 코멘트</h3></div>
                <p>{selectedRecord.comment}</p>
              </section>
            </>
          ) : (
            <div className="empty-detail">
              <span className="empty-symbol" aria-hidden="true">✦</span>
              <p className="detail-kicker">NO LESSON YET</p>
              <h2>아직 진행한 수업이 없습니다.</h2>
              <p>노란색으로 표시된 날짜를 눌러 상세 기록을 확인할 수 있습니다.</p>
            </div>
          )}
        </aside>
      </section>

      <footer>
        <p>채윤이의 꾸준한 성장을 함께 응원합니다.</p>
        <span>
          {latestRecord
            ? `마지막 기록 · ${formatRecordDate(latestRecord.date)}`
            : "아직 등록된 기록이 없습니다."}
        </span>
      </footer>
    </main>
  );
}
