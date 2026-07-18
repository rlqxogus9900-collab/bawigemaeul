"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type PostMode = "normal" | "poll";
type PollMode = "general" | "regular_match";
type Meridiem = "AM" | "PM";

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  meridiem: Meridiem;
  hour: number;
  minute: number;
  directTime: boolean;
  directHour: string;
  directMinute: string;
};

function getKoreaNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false
  }).formatToParts(new Date());

  const read = (type: string) =>
    Number(parts.find(part => part.type === type)?.value || 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day")
  };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function to24Hour(meridiem: Meridiem, hour: number) {
  if (meridiem === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function toDateValue(parts: DateTimeParts) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function normalizedDirectTime(parts: DateTimeParts) {
  const hour = Math.min(23, Math.max(0, Number(parts.directHour || 0)));
  const minute = Math.min(59, Math.max(0, Number(parts.directMinute || 0)));
  return { hour, minute };
}

function toTimeValue(parts: DateTimeParts) {
  const pad = (value: number) => String(value).padStart(2, "0");

  if (parts.directTime) {
    const direct = normalizedDirectTime(parts);
    return `${pad(direct.hour)}:${pad(direct.minute)}`;
  }

  return `${pad(to24Hour(parts.meridiem, parts.hour))}:${pad(parts.minute)}`;
}

function formatKorean(parts: DateTimeParts) {
  if (parts.directTime) {
    const direct = normalizedDirectTime(parts);
    const meridiem = direct.hour < 12 ? "오전" : "오후";
    const hour12 = direct.hour % 12 || 12;

    return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${meridiem} ${hour12}시 ${String(direct.minute).padStart(2, "0")}분`;
  }

  return `${parts.year}년 ${parts.month}월 ${parts.day}일 ${
    parts.meridiem === "AM" ? "오전" : "오후"
  } ${parts.hour}시 ${String(parts.minute).padStart(2, "0")}분`;
}

function DateTimeSelect({
  title,
  value,
  onChange
}: {
  title: string;
  value: DateTimeParts;
  onChange: (next: DateTimeParts) => void;
}) {
  const maxDay = daysInMonth(value.year, value.month);

  function patch(next: Partial<DateTimeParts>) {
    const merged = { ...value, ...next };
    const nextMaxDay = daysInMonth(merged.year, merged.month);

    if (merged.day > nextMaxDay) {
      merged.day = nextMaxDay;
    }

    onChange(merged);
  }

  const currentYear = getKoreaNow().year;
  const years = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <section className="datetime-select-block">
      <h3>{title}</h3>

      <div className="datetime-select-grid">
        <label>
          <span>연도</span>
          <select
            value={value.year}
            onChange={event => patch({ year: Number(event.target.value) })}
          >
            {years.map(year => (
              <option value={year} key={year}>
                {year}년
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>월</span>
          <select
            value={value.month}
            onChange={event => patch({ month: Number(event.target.value) })}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
              <option value={month} key={month}>
                {month}월
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>일</span>
          <select
            value={value.day}
            onChange={event => patch({ day: Number(event.target.value) })}
          >
            {Array.from({ length: maxDay }, (_, index) => index + 1).map(day => (
              <option value={day} key={day}>
                {day}일
              </option>
            ))}
          </select>
        </label>

        {!value.directTime && (
          <>
            <label>
              <span>오전/오후</span>
              <select
                value={value.meridiem}
                onChange={event => patch({ meridiem: event.target.value as Meridiem })}
              >
                <option value="AM">오전</option>
                <option value="PM">오후</option>
              </select>
            </label>

            <label>
              <span>시</span>
              <select
                value={value.hour}
                onChange={event => patch({ hour: Number(event.target.value) })}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(hour => (
                  <option value={hour} key={hour}>
                    {hour}시
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>분</span>
              <select
                value={value.minute}
                onChange={event => patch({ minute: Number(event.target.value) })}
              >
                {[0, 10, 20, 30, 40, 50].map(minute => (
                  <option value={minute} key={minute}>
                    {String(minute).padStart(2, "0")}분
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {value.directTime && (
          <>
            <label>
              <span>시(0~23)</span>
              <input
                type="number"
                min="0"
                max="23"
                inputMode="numeric"
                value={value.directHour}
                onChange={event =>
                  patch({
                    directHour: event.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 2)
                  })
                }
                placeholder="21"
              />
            </label>

            <label>
              <span>분(0~59)</span>
              <input
                type="number"
                min="0"
                max="59"
                inputMode="numeric"
                value={value.directMinute}
                onChange={event =>
                  patch({
                    directMinute: event.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 2)
                  })
                }
                placeholder="07"
              />
            </label>
          </>
        )}
      </div>

      <label className="datetime-direct-toggle">
        <input
          type="checkbox"
          checked={value.directTime}
          onChange={event => patch({ directTime: event.target.checked })}
        />
        시간을 직접 입력
        <small>직접 입력 시 24시간 형식으로 시·분을 자유롭게 적을 수 있습니다.</small>
      </label>

      <div className="datetime-select-preview">{formatKorean(value)}</div>
    </section>
  );
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
  const koreaNow = useMemo(() => getKoreaNow(), []);
  const defaultYear = koreaNow.year;
  const defaultMonth = koreaNow.month;
  const defaultDay = koreaNow.day;

  const [postMode, setPostMode] = useState<PostMode>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [pollMode, setPollMode] = useState<PollMode>("general");
  const [options, setOptions] = useState(["선택지 1", "선택지 2"]);

  const [match, setMatch] = useState<DateTimeParts>({
    year: defaultYear,
    month: defaultMonth,
    day: defaultDay,
    meridiem: "PM",
    hour: 9,
    minute: 0,
    directTime: false,
    directHour: "21",
    directMinute: "00"
  });

  const [deadline, setDeadline] = useState<DateTimeParts>({
    year: defaultYear,
    month: defaultMonth,
    day: defaultDay,
    meridiem: "PM",
    hour: 8,
    minute: 0,
    directTime: false,
    directHour: "20",
    directMinute: "00"
  });

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitting) {
      event.preventDefault();
      return;
    }
    setSubmitting(true);
  }

  return (
    <form className="board-editor-form" action="/api/boards/posts" method="post" onSubmit={handleSubmit}>
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
        <section className="regular-poll-editor datetime-poll-editor">
          <div className="regular-poll-info">
            <b>정기내전 일정</b>
            <p>각 칸을 눌러 목록에서 선택하세요.</p>
          </div>

          <DateTimeSelect
            title="내전 일정"
            value={match}
            onChange={setMatch}
          />

          <DateTimeSelect
            title="투표 마감"
            value={deadline}
            onChange={setDeadline}
          />

          <input type="hidden" name="match_date" value={toDateValue(match)} />
          <input type="hidden" name="match_time" value={toTimeValue(match)} />
          <input type="hidden" name="deadline_date" value={toDateValue(deadline)} />
          <input type="hidden" name="deadline_time" value={toTimeValue(deadline)} />
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
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? "등록 중..." : (postMode === "poll" ? "투표 글 등록" : "게시글 등록")}
        </button>
      </div>
    </form>
  );
}
