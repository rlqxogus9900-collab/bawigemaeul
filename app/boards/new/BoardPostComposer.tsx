"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PostMode = "normal" | "poll";
type PollMode = "general" | "regular_match";
type DeadlinePreset = "30" | "60" | "120" | "custom";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatPreview(date: string, time: string) {
  if (!date || !time) return "미정";
  const target = new Date(`${date}T${time}:00`);
  if (Number.isNaN(target.getTime())) return "미정";
  return target.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function BoardPostComposer({
  boardId,
  boardName,
  isStaff
}: {
  boardId: string;
  boardName: string;
  isStaff: boolean;
}) {
  const [postMode, setPostMode] = useState<PostMode>("normal");
  const [pollMode, setPollMode] = useState<PollMode>("general");
  const [options, setOptions] = useState(["선택지 1", "선택지 2"]);
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("21:00");
  const [deadlinePreset, setDeadlinePreset] = useState<DeadlinePreset>("60");
  const [customDeadlineDate, setCustomDeadlineDate] = useState("");
  const [customDeadlineTime, setCustomDeadlineTime] = useState("");

  const isRegularBoard = useMemo(
    () => boardName.includes("정기") || boardName.includes("내전"),
    [boardName]
  );

  const deadlineValue = useMemo(() => {
    if (deadlinePreset === "custom") {
      return {
        date: customDeadlineDate,
        time: customDeadlineTime
      };
    }

    if (!matchDate || !matchTime) {
      return { date: "", time: "" };
    }

    const target = new Date(`${matchDate}T${matchTime}:00`);
    if (Number.isNaN(target.getTime())) return { date: "", time: "" };

    target.setMinutes(target.getMinutes() - Number(deadlinePreset));

    return {
      date: `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`,
      time: `${pad(target.getHours())}:${pad(target.getMinutes())}`
    };
  }, [
    matchDate,
    matchTime,
    deadlinePreset,
    customDeadlineDate,
    customDeadlineTime
  ]);

  function updateOption(index: number, value: string) {
    setOptions(current =>
      current.map((item, itemIndex) => itemIndex === index ? value : item)
    );
  }

  function addOption() {
    if (options.length >= 10) return;
    setOptions(current => [...current, `선택지 ${current.length + 1}`]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(current => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <form className="board-editor-form" action="/api/boards/posts" method="post">
      <input type="hidden" name="subcategory_id" value={boardId} />
      <input type="hidden" name="post_type" value={postMode} />
      <input type="hidden" name="poll_type" value={pollMode} />
      <input type="hidden" name="poll_options_json" value={JSON.stringify(options)} />

      <div className="post-type-picker">
        <button
          type="button"
          className={postMode === "normal" ? "active" : ""}
          onClick={() => setPostMode("normal")}
        >
          <span>📝</span>
          <b>일반 글</b>
          <small>기존 게시글</small>
        </button>

        <button
          type="button"
          className={postMode === "poll" ? "active" : ""}
          onClick={() => setPostMode("poll")}
        >
          <span>📊</span>
          <b>투표 글</b>
          <small>자유투표 또는 내전투표</small>
        </button>
      </div>

      {postMode === "poll" && (
        <div className="poll-type-picker">
          <label>
            <input
              type="radio"
              checked={pollMode === "general"}
              onChange={() => setPollMode("general")}
            />
            <span>
              <b>일반 투표</b>
              <small>밸런스게임·찬반·객관식</small>
            </span>
          </label>

          <label className={isRegularBoard ? "recommended" : ""}>
            <input
              type="radio"
              checked={pollMode === "regular_match"}
              onChange={() => setPollMode("regular_match")}
            />
            <span>
              <b>정기내전 투표</b>
              <small>참가·불참·미정 + 경매 연동</small>
            </span>
          </label>
        </div>
      )}

      <label>
        제목
        <input name="title" maxLength={120} required placeholder="게시글 제목" />
      </label>

      <label>
        내용
        <textarea name="content" rows={12} required placeholder="내용을 입력하세요." />
      </label>

      {postMode === "poll" && pollMode === "general" && (
        <section className="poll-option-editor">
          <div className="poll-option-head">
            <div>
              <b>투표 선택지</b>
              <small>2개부터 최대 10개</small>
            </div>
            <button className="button" type="button" onClick={addOption}>
              선택지 추가
            </button>
          </div>

          {options.map((option, index) => (
            <div className="poll-option-row" key={index}>
              <span>{index + 1}</span>
              <input
                value={option}
                onChange={event => updateOption(index, event.target.value)}
                maxLength={80}
                required
              />
              <button
                type="button"
                className="button danger"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
              >
                삭제
              </button>
            </div>
          ))}

          <label className="board-check">
            <input type="checkbox" name="allow_multiple" />
            여러 선택지 중복 선택 허용
          </label>
        </section>
      )}

      {postMode === "poll" && pollMode === "regular_match" && (
        <section className="regular-poll-editor regular-poll-editor-v3">
          <div className="regular-poll-info">
            <b>정기내전 일정</b>
            <p>날짜 한 번, 시작시간 한 번, 마감 간격 한 번만 고르면 됩니다.</p>
          </div>

          <div className="regular-schedule-simple-grid">
            <label>
              내전 날짜
              <input
                type="date"
                name="match_date"
                value={matchDate}
                onChange={event => setMatchDate(event.target.value)}
                required
              />
            </label>

            <div className="quick-time-block">
              <span>내전 시작 시간</span>
              <div className="quick-time-buttons">
                {["20:00", "21:00", "22:00"].map(time => (
                  <button
                    type="button"
                    key={time}
                    className={matchTime === time ? "active" : ""}
                    onClick={() => setMatchTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <input
                type="time"
                name="match_time"
                value={matchTime}
                onChange={event => setMatchTime(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="deadline-preset-block">
            <span>투표 마감</span>
            <div className="deadline-preset-buttons">
              {[
                ["30", "내전 30분 전"],
                ["60", "내전 1시간 전"],
                ["120", "내전 2시간 전"],
                ["custom", "직접 설정"]
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={deadlinePreset === value ? "active" : ""}
                  onClick={() => setDeadlinePreset(value as DeadlinePreset)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {deadlinePreset === "custom" && (
            <div className="regular-poll-date-grid-v3">
              <label>
                마감 날짜
                <input
                  type="date"
                  value={customDeadlineDate}
                  onChange={event => setCustomDeadlineDate(event.target.value)}
                  required
                />
              </label>
              <label>
                마감 시간
                <input
                  type="time"
                  value={customDeadlineTime}
                  onChange={event => setCustomDeadlineTime(event.target.value)}
                  required
                />
              </label>
            </div>
          )}

          <input type="hidden" name="deadline_date" value={deadlineValue.date} />
          <input type="hidden" name="deadline_time" value={deadlineValue.time} />

          <div className="regular-time-preview">
            <div>
              <span>내전</span>
              <b>{formatPreview(matchDate, matchTime)}</b>
            </div>
            <div>
              <span>투표 마감</span>
              <b>{formatPreview(deadlineValue.date, deadlineValue.time)}</b>
            </div>
          </div>
        </section>
      )}

      {isStaff && (
        <label className="board-check">
          <input type="checkbox" name="is_pinned" />
          상단 고정글로 등록
        </label>
      )}

      <div className="board-editor-actions">
        <Link className="button" href={`/boards?board=${boardId}`}>
          취소
        </Link>
        <button className="button primary">
          {postMode === "poll" ? "투표 글 등록" : "게시글 등록"}
        </button>
      </div>
    </form>
  );
}
