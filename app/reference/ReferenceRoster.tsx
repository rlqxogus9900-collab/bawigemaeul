"use client";

import { useMemo, useState } from "react";

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  reference_note: string | null;
  activity_status: string | null;
  is_active: boolean;
};

const lines = ["전체","탑","정글","미드","원딜","서폿"];

export default function ReferenceRoster({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("전체");
  const [tier, setTier] = useState("전체");
  const [sort, setSort] = useState("tier");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = members.filter(member => {
      const matchesSearch =
        !q ||
        member.nickname.toLowerCase().includes(q) ||
        member.riot_id.toLowerCase().includes(q) ||
        (member.reference_note || "").toLowerCase().includes(q);

      const matchesLine =
        line === "전체" ||
        member.main_line === line ||
        member.sub_line === line;

      const matchesTier =
        tier === "전체" ||
        String(member.match_tier || "") === tier;

      return matchesSearch && matchesLine && matchesTier;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "nickname") {
        return a.nickname.localeCompare(b.nickname, "ko");
      }
      if (sort === "line") {
        return (a.main_line || "").localeCompare(b.main_line || "", "ko");
      }
      return (a.match_tier || 99) - (b.match_tier || 99);
    });
  }, [members, search, line, tier, sort]);

  return (
    <>
      <section className="reference-toolbar reference-toolbar-v2">
        <div className="reference-search">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="닉네임, Riot ID 또는 참고사항 검색"
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

        <select value={tier} onChange={event => setTier(event.target.value)}>
          <option value="전체">전체 티어</option>
          <option value="1">1티어</option>
          <option value="2">2티어</option>
          <option value="3">3티어</option>
          <option value="4">4티어</option>
          <option value="5">5티어</option>
        </select>

        <select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="tier">내전 티어순</option>
          <option value="nickname">닉네임순</option>
          <option value="line">주라인순</option>
        </select>
      </section>

      <section className="reference-summary">
        <div><b>{visible.length}</b><span>현재 표시 인원</span></div>
        <div><b>{members.filter(member => member.match_tier === 1).length}</b><span>1티어</span></div>
        <div><b>{members.filter(member => member.match_tier === 3).length}</b><span>3티어</span></div>
        <div><b>{members.filter(member => member.match_tier === 5).length}</b><span>5티어</span></div>
      </section>

      <section className="reference-grid">
        {visible.map(member => (
          <article className="reference-member-card reference-member-card-v2" key={member.id}>
            <div className={`match-tier-emblem tier-${member.match_tier || 0}`}>
              <strong>{member.match_tier || "-"}</strong>
              <span>티어</span>
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
                <span className="match-tier-tag">{member.match_tier ? `${member.match_tier}티어` : "티어 미정"}</span>
                <span>주 {member.main_line || "미정"}</span>
                <span>부 {member.sub_line || "미정"}</span>
              </div>

              <div className="reference-note">
                <b>참고사항</b>
                <p>{member.reference_note || "등록된 참고사항이 없습니다."}</p>
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
