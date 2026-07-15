"use client";

import { useMemo, useState } from "react";

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  tier: string | null;
  main_line: string | null;
  sub_line: string | null;
  activity_status: string | null;
  is_active: boolean;
};

const tierOrder = [
  "챌린저","그랜드마스터","마스터","다이아몬드","에메랄드",
  "플래티넘","골드","실버","브론즈","아이언","언랭크"
];

const lines = ["전체","탑","정글","미드","원딜","서폿"];

function tierClass(tier: string | null) {
  const value = tier || "언랭크";
  if (value.includes("챌린저")) return "challenger";
  if (value.includes("그랜드마스터")) return "grandmaster";
  if (value.includes("마스터")) return "master";
  if (value.includes("다이아")) return "diamond";
  if (value.includes("에메랄드")) return "emerald";
  if (value.includes("플래티넘")) return "platinum";
  if (value.includes("골드")) return "gold";
  if (value.includes("실버")) return "silver";
  if (value.includes("브론즈")) return "bronze";
  if (value.includes("아이언")) return "iron";
  return "unranked";
}

export default function ReferenceRoster({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("전체");
  const [sort, setSort] = useState("tier");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = members.filter(member => {
      const matchesSearch =
        !q ||
        member.nickname.toLowerCase().includes(q) ||
        member.riot_id.toLowerCase().includes(q);

      const matchesLine =
        line === "전체" ||
        member.main_line === line ||
        member.sub_line === line;

      return matchesSearch && matchesLine;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "nickname") {
        return a.nickname.localeCompare(b.nickname, "ko");
      }

      if (sort === "line") {
        return (a.main_line || "").localeCompare(b.main_line || "", "ko");
      }

      const aTier = a.tier || "언랭크";
      const bTier = b.tier || "언랭크";
      const aBase = tierOrder.findIndex(tier => aTier.includes(tier));
      const bBase = tierOrder.findIndex(tier => bTier.includes(tier));
      return (aBase === -1 ? 999 : aBase) - (bBase === -1 ? 999 : bBase);
    });
  }, [members, search, line, sort]);

  return (
    <>
      <section className="reference-toolbar">
        <div className="reference-search">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="닉네임 또는 Riot ID 검색"
          />
        </div>

        <div className="line-filter">
          {lines.map(item => (
            <button
              key={item}
              className={line === item ? "active" : ""}
              onClick={() => setLine(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="tier">티어순</option>
          <option value="nickname">닉네임순</option>
          <option value="line">주라인순</option>
        </select>
      </section>

      <section className="reference-summary">
        <div><b>{visible.length}</b><span>현재 표시 인원</span></div>
        <div><b>{members.filter(member => member.activity_status === "active").length}</b><span>활동 인원</span></div>
        <div><b>{members.filter(member => member.main_line === "원딜").length}</b><span>원딜 주라인</span></div>
        <div><b>{members.filter(member => member.main_line === "정글").length}</b><span>정글 주라인</span></div>
      </section>

      <section className="reference-grid">
        {visible.map(member => (
          <article className="reference-member-card" key={member.id}>
            <div className={`tier-emblem ${tierClass(member.tier)}`}>
              <span>◆</span>
            </div>

            <div className="reference-member-main">
              <div className="reference-member-title">
                <h3>{member.nickname}</h3>
                <span className={member.activity_status === "active" ? "status-active" : "status-idle"}>
                  {member.activity_status === "active" ? "활동" : "비활동"}
                </span>
              </div>

              <p>{member.riot_id}</p>

              <div className="reference-tags">
                <span className={`tier-tag ${tierClass(member.tier)}`}>
                  {member.tier || "언랭크"}
                </span>
                <span>주 {member.main_line || "미정"}</span>
                <span>부 {member.sub_line || "미정"}</span>
              </div>
            </div>
          </article>
        ))}

        {!visible.length && (
          <div className="reference-empty">
            조건에 맞는 클랜원이 없습니다.
          </div>
        )}
      </section>
    </>
  );
}
