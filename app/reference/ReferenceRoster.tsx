"use client";

import { useMemo, useState } from "react";

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  average_tier: string | null;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  reference_note: string | null;
};

const lines = ["전체", "탑", "정글", "미드", "원딜", "서폿"];
const romanTier: Record<number, string> = { 1: "Ⅰ", 2: "Ⅱ", 3: "Ⅲ", 4: "Ⅳ", 5: "Ⅴ" };

export default function ReferenceRoster({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("전체");
  const [tier, setTier] = useState("전체");
  const [sort, setSort] = useState("match_tier");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = members.filter(member => {
      const matchesSearch =
        !q ||
        member.nickname.toLowerCase().includes(q) ||
        member.riot_id.toLowerCase().includes(q) ||
        (member.average_tier || "").toLowerCase().includes(q) ||
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
      if (sort === "nickname") return a.nickname.localeCompare(b.nickname, "ko");
      if (sort === "average_tier") return (a.average_tier || "").localeCompare(b.average_tier || "", "ko");
      if (sort === "line") return (a.main_line || "").localeCompare(b.main_line || "", "ko");
      return (a.match_tier || 99) - (b.match_tier || 99);
    });
  }, [members, search, line, tier, sort]);

  return (
    <>
      <section className="reference-toolbar reference-toolbar-v3">
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="닉네임, Riot ID, 평균티어 또는 참고사항 검색"
        />

        <div className="line-filter">
          {lines.map(item => (
            <button
              key={item}
              type="button"
              className={line === item ? "active" : ""}
              onClick={() => setLine(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <select value={tier} onChange={event => setTier(event.target.value)}>
          <option value="전체">전체 내전티어</option>
          <option value="1">Ⅰ티어</option>
          <option value="2">Ⅱ티어</option>
          <option value="3">Ⅲ티어</option>
          <option value="4">Ⅳ티어</option>
          <option value="5">Ⅴ티어</option>
        </select>

        <select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="match_tier">내전티어순</option>
          <option value="average_tier">평균티어순</option>
          <option value="nickname">닉네임순</option>
          <option value="line">주라인순</option>
        </select>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="reference-list-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>Riot ID</th>
                <th>평균티어</th>
                <th>내전티어</th>
                <th>주라인</th>
                <th>부라인</th>
                <th>참고사항</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(member => (
                <tr key={member.id}>
                  <td><b>{member.nickname}</b></td>
                  <td>{member.riot_id}</td>
                  <td>{member.average_tier || "미정"}</td>
                  <td>
                    <span className={`match-tier-table tier-${member.match_tier || 0}`}>
                      {member.match_tier ? `${romanTier[member.match_tier]}티어` : "미정"}
                    </span>
                  </td>
                  <td>{member.main_line || "미정"}</td>
                  <td>{member.sub_line || "미정"}</td>
                  <td className="reference-note-cell">{member.reference_note || "-"}</td>
                </tr>
              ))}
              {!visible.length && (
                <tr><td colSpan={7} className="muted">조건에 맞는 클랜원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
