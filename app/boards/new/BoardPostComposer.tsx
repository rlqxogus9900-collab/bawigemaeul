"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PostMode = "normal" | "poll";
type PollMode = "general" | "regular_match";

function formatPreview(date: string, time: string) {
  if (!date || !time) return "미정";

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const target = new Date(year, month - 1, day, hour, minute);

  return target.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
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
  const [matchTime, setMatchTime] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  const isRegularBoard = useMemo(
    () => boardName.includes("정기") || boardName.includes("내전"),
    [boardName]
  );

  function updateOption(index: number, value: string) {
    setOptions(current =>
      current.map((item, itemIndex) =>
        itemIndex === index ? value : item
      )
    );
  }

  function addOption() {
    if (options.length >= 10) return;
    setOptions(current => [
      ...current,
      `선택지 ${current.length + 1}`
    ]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(current =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  return (
    <form className="board-editor-form" action="/api/boards/posts" method="post">
      <input type="hidden" name="subcategory_id" value={boardId} />
      <input type="hidden" name="post_type" value={postMode} />
      <input type="hidden" name="poll_type" value={pollMode} />
      <input
        type="hidden"
        name="poll_options_json"
        value={JSON.stringify(options)}
      />

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
        <input
          name="title"
          maxLength={120}
          required
          placeholder="게시글 제목"
        />
      </label>

      <label>
        내용
        <textarea
          name="content"
          rows={12}
          required
          placeholder="내용을 입력하세요."
        />
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
                onChange={event =>
                  updateOption(index, event.target.value)
                }
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
        <section className="regular-poll-editor regular-poll-editor-direct">
          <div className="regular-poll-info">
            <b>정기내전 일정</b>
            <p>원하는 날짜와 시간을 직접 입력하세요.</p>
          </div>

          <div className="regular-direct-time-grid">
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

            <label>
              내전 시작 시간
              <input
                type="time"
                name="match_time"
                value={matchTime}
                onChange={event => setMatchTime(event.target.value)}
                required
              />
            </label>

            <label>
              투표 마감 날짜
              <input
                type="date"
                name="deadline_date"
                value={deadlineDate}
                onChange={event => setDeadlineDate(event.target.value)}
                required
              />
            </label>

            <label>
              투표 마감 시간
              <input
                type="time"
                name="deadline_time"
                value={deadlineTime}
                onChange={event => setDeadlineTime(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="regular-time-preview">
            <div>
              <span>내전 일정</span>
              <b>{formatPreview(matchDate, matchTime)}</b>
            </div>
            <div>
              <span>투표 마감</span>
              <b>{formatPreview(deadlineDate, deadlineTime)}</b>
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
