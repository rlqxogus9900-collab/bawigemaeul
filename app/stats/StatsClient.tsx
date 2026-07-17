"use client";

import { useMemo, useState } from "react";

type MemberStat = {
  id: string;
  nickname: string;
  riotId: string;
  mainLine: string;
  subLine: string;
  matchTier: number | null;
  soloTier: string;
  auctionCount: number;
  averagePrice: number | null;
  highestPrice: number | null;
};

type Props = {
  members: MemberStat[];
  totalMatches: number;
  auctionPlayerCount: number;
  overallAveragePrice: number | null;
};

const lines = ["전체", "탑", "정글", "미드", "원딜", "서폿"];

function formatNumber(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

function matchTierLabel(value: number | null) {
  if (!value) return "미정";
  return `내전 ${value}티어`;
}

export default function StatsClient({ members, totalMatches, auctionPlayerCount, overallAveragePrice }: Props) {
  const [line, setLine] = useState("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "price" | "count">("name");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = members.filter(member => {
      const lineMatches = line === "전체" || member.mainLine === line || member.subLine === line;
      const keywordMatches = !keyword || member.nickname.toLowerCase().includes(keyword) || member.riotId.toLowerCase().includes(keyword);
      return lineMatches && keywordMatches;
    });

    return [...result].sort((a, b) => {
      if (sort === "price") return (b.averagePrice ?? -1) - (a.averagePrice ?? -1);
      if (sort === "count") return b.auctionCount - a.auctionCount;
      return a.nickname.localeCompare(b.nickname, "ko");
    });
  }, [members, line, query, sort]);

  return (
    <div className="stats-page-shell">
      <section className="stats-hero">
        <div>
          <span>CLAN STATISTICS</span>
          <h1>바위게마을 통계</h1>
          <p>클랜원 라인 분포와 경매 기록, 정기내전 누적 현황을 확인합니다.</p>
        </div>
        <div className="stats-hero-mark">▥</div>
      </section>

      <section className="stats-summary-grid">
        <article><span>활성 클랜원</span><strong>{members.length}</strong><small>명단에 등록된 인원</small></article>
        <article><span>정기내전 결과</span><strong>{totalMatches}</strong><small>등록된 세트 결과</small></article>
        <article><span>경매 낙찰 기록</span><strong>{auctionPlayerCount}</strong><small>누적 낙찰 선수</small></article>
        <article><span>전체 평균 경매가</span><strong>{formatNumber(overallAveragePrice)}</strong><small>{overallAveragePrice === null ? "기록 없음" : "점"}</small></article>
      </section>

      <section className="card stats-toolbar-card">
        <div className="stats-line-tabs" aria-label="라인 필터">
          {lines.map(item => (
            <button key={item} type="button" className={line === item ? "active" : ""} onClick={() => setLine(item)}>{item}</button>
          ))}
        </div>
        <div className="stats-toolbar-actions">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="닉네임 또는 Riot ID 검색" />
          <select value={sort} onChange={event => setSort(event.target.value as "name" | "price" | "count")}>
            <option value="name">닉네임순</option>
            <option value="price">평균 경매가순</option>
            <option value="count">낙찰 횟수순</option>
          </select>
        </div>
      </section>

      <section className="stats-member-section">
        <div className="dashboard-head">
          <div><span>MEMBER RECORDS</span><h2>클랜원 기록</h2></div>
          <small>{filtered.length}명 표시</small>
        </div>

        <div className="stats-member-grid">
          {filtered.map(member => (
            <article className="card stats-member-card" key={member.id}>
              <div className="stats-member-head">
                <div>
                  <span>{member.mainLine || "미정"}</span>
                  <h3>{member.nickname}</h3>
                  <p>{member.riotId || "Riot ID 미등록"}</p>
                </div>
                <b>{matchTierLabel(member.matchTier)}</b>
              </div>

              <div className="stats-member-lines">
                <span>주라인 <b>{member.mainLine || "미정"}</b></span>
                <span>부라인 <b>{member.subLine || "미정"}</b></span>
                <span>롤 티어 <b>{member.soloTier || "미정"}</b></span>
              </div>

              <div className="stats-member-numbers">
                <div><small>평균 경매가</small><strong>{formatNumber(member.averagePrice)}</strong><em>{member.averagePrice === null ? "기록 없음" : "점"}</em></div>
                <div><small>최고 경매가</small><strong>{formatNumber(member.highestPrice)}</strong><em>{member.highestPrice === null ? "기록 없음" : "점"}</em></div>
                <div><small>낙찰 횟수</small><strong>{member.auctionCount}</strong><em>회</em></div>
              </div>

              <div className="stats-pending-row">
                <span>내전 승률</span><b>상세 기록 등록 후 표시</b>
                <span>내전 KDA</span><b>상세 기록 등록 후 표시</b>
              </div>
            </article>
          ))}
        </div>

        {!filtered.length && <div className="card stats-empty">조건에 맞는 클랜원이 없습니다.</div>}
      </section>

      <section className="card stats-guide-card">
        <div><span>RECORD GUIDE</span><h2>통계 반영 기준</h2></div>
        <p>경매가는 실시간 경매에서 낙찰 완료된 기록을 자동 집계합니다. 승률·KDA·모스트 챔피언은 정기내전 상세 기록 기능이 추가되면 이 페이지에 자동 연결됩니다.</p>
      </section>
    </div>
  );
}
