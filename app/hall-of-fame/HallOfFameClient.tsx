"use client";

import { useMemo, useState } from "react";

type HallRecord = {
  id: string;
  winner: string;
  playedAt: string;
  playedAtLabel: string;
  mvp: string;
  eventTitle: string;
  eventType: string;
  score: string;
  members: string[];
};

type Ranking = { name: string; wins: number; mvps: number };

function medal(index: number) {
  return ["🥇", "🥈", "🥉"][index] || "🏅";
}

export default function HallOfFameClient({
  records,
  rankings
}: {
  records: HallRecord[];
  rankings: Ranking[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("전체");

  const types = useMemo(
    () => ["전체", ...Array.from(new Set(records.map(record => record.eventType).filter(Boolean)))],
    [records]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter(record => {
      const typeMatches = type === "전체" || record.eventType === type;
      const searchTarget = [
        record.winner,
        record.mvp,
        record.eventTitle,
        record.eventType,
        ...record.members
      ]
        .join(" ")
        .toLowerCase();
      return typeMatches && (!keyword || searchTarget.includes(keyword));
    });
  }, [records, query, type]);

  const totalWins = records.length;
  const uniqueWinners = new Set(records.map(record => record.winner)).size;
  const mvpCount = records.filter(record => record.mvp).length;

  return (
    <>
      <section className="hall-summary-grid">
        <article className="card hall-summary-card">
          <span>전체 우승 기록</span>
          <strong>{totalWins}</strong>
          <small>등록된 경기 결과 기준</small>
        </article>
        <article className="card hall-summary-card">
          <span>우승 팀 수</span>
          <strong>{uniqueWinners}</strong>
          <small>중복 팀명 제외</small>
        </article>
        <article className="card hall-summary-card">
          <span>MVP 기록</span>
          <strong>{mvpCount}</strong>
          <small>MVP가 입력된 경기</small>
        </article>
      </section>

      <section className="hall-ranking-grid hall-podium-grid">
        {rankings.slice(0, 3).map((item, index) => (
          <article className={`hall-ranking-card hall-rank-${index + 1}`} key={item.name}>
            <span>{medal(index)}</span>
            <div>
              <small>{index + 1}위 · 누적 우승</small>
              <h2>{item.name}</h2>
              {item.mvps > 0 && <p>MVP {item.mvps}회</p>}
            </div>
            <strong>{item.wins}회</strong>
          </article>
        ))}

        {!rankings.length && (
          <div className="card hall-empty">아직 등록된 우승 기록이 없습니다.</div>
        )}
      </section>

      <section className="card hall-history-card">
        <div className="dashboard-head hall-history-head">
          <div>
            <span>WINNER HISTORY</span>
            <h2>역대 우승 기록</h2>
          </div>
          <small>{filtered.length}건 표시</small>
        </div>

        <div className="hall-filter-bar">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="팀명, MVP, 대회명, 멤버 검색"
            aria-label="명예의 전당 검색"
          />
          <select value={type} onChange={event => setType(event.target.value)}>
            {types.map(item => (
              <option value={item} key={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="hall-history-list hall-record-list">
          {filtered.map(record => (
            <article key={record.id}>
              <div className="hall-history-medal">🏆</div>
              <div className="hall-record-main">
                <small>{record.playedAtLabel} · {record.eventType}</small>
                <h3>{record.winner}</h3>
                <p>{record.eventTitle}{record.score ? ` · ${record.score}` : ""}</p>
                {!!record.members.length && (
                  <div className="hall-member-tags">
                    {record.members.map(member => <span key={member}>{member}</span>)}
                  </div>
                )}
              </div>
              <div className="hall-record-side">
                {record.mvp && <b>⭐ MVP<br />{record.mvp}</b>}
                <span>WINNER</span>
              </div>
            </article>
          ))}

          {!filtered.length && (
            <div className="hall-empty">검색 조건에 맞는 우승 기록이 없습니다.</div>
          )}
        </div>
      </section>
    </>
  );
}
