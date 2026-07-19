"use client";

import SponsorNickname from "@/app/components/SponsorNickname";
import { useMemo, useState } from "react";

type LineStat = {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

type MemberStat = {
  id: string;
  nickname: string;
  matchTier: number | null;
  overall: LineStat;
  byLine: Record<string, LineStat>;
};

type Props = {
  members: MemberStat[];
};

const lines = ["전체", "탑", "정글", "미드", "원딜", "서폿"];
const romanTier: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };
const emptyStat: LineStat = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };

function formatKda(stat: LineStat) {
  if (!stat.games) return "-";
  if (stat.deaths === 0) return stat.kills + stat.assists > 0 ? "Perfect" : "0.00";
  return ((stat.kills + stat.assists) / stat.deaths).toFixed(2);
}

function formatWinRate(stat: LineStat) {
  if (!stat.games) return "-";
  return `${Math.round((stat.wins / stat.games) * 100)}%`;
}

export default function StatsClient({ members }: Props) {
  const [line, setLine] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return members
      .filter(member => !keyword || member.nickname.toLowerCase().includes(keyword))
      .sort((a, b) => a.nickname.localeCompare(b.nickname, "ko"));
  }, [members, query]);

  return (
    <div className="stats-page-shell simple-stats-shell">
      <section className="stats-hero">
        <div>
          <span>REGULAR MATCH STATISTICS</span>
          <h1>정기내전 통계</h1>
          <p>라인을 선택하면 해당 라인 기록만, 전체를 선택하면 모든 정기내전 기록을 표시합니다.</p>
        </div>
        <div className="stats-hero-mark">▥</div>
      </section>

      <section className="card stats-toolbar-card simple-stats-toolbar">
        <div className="stats-line-tabs" aria-label="라인 통계 선택">
          {lines.map(item => (
            <button key={item} type="button" className={line === item ? "active" : ""} onClick={() => setLine(item)}>{item}</button>
          ))}
        </div>
        <div className="stats-toolbar-actions">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="닉네임 검색" />
        </div>
      </section>

      <section className="card regular-stats-table-card">
        <div className="dashboard-head">
          <div><span>MEMBER RECORDS</span><h2>{line === "전체" ? "전체 기록" : `${line} 기록`}</h2></div>
          <small>{filtered.length}명</small>
        </div>
        <div className="table-scroll">
          <table className="regular-stats-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>내전티어</th>
                <th>KDA</th>
                <th>승률</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const stat = line === "전체" ? member.overall : (member.byLine[line] || emptyStat);
                return (
                  <tr key={member.id}>
                    <td><b><SponsorNickname nickname={member.nickname} /></b></td>
                    <td>
                      <span className={`roman-tier-badge tier-${member.matchTier || 0}`}>
                        {member.matchTier ? romanTier[member.matchTier] : "-"}
                      </span>
                    </td>
                    <td><strong>{formatKda(stat)}</strong>{stat.games > 0 && <small>{stat.games}경기</small>}</td>
                    <td><strong>{formatWinRate(stat)}</strong>{stat.games > 0 && <small>{stat.wins}승 {stat.games - stat.wins}패</small>}</td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={4} className="muted">조건에 맞는 클랜원이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
