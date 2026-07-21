"use client";

import { useMemo, useState } from "react";
import SponsorNickname from "@/app/components/SponsorNickname";

type Member = {
  id: string;
  nickname: string;
  riot_id: string | null;
  match_tier: number | null;
  average_tier: string | null;
  current_tier: string | null;
  main_line: string | null;
  sub_line: string | null;
};

type AssignedMember = { member: Member; role: string; fit: number };
type TeamResult = { teamA: AssignedMember[]; teamB: AssignedMember[]; score: number; tierDiff: number };

const ROMAN = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"];
const ROLES = ["탑", "정글", "미드", "원딜", "서폿"];

function normalizedLine(value: string | null) {
  const line = String(value || "").trim().toLowerCase();
  if (["top", "탑"].includes(line)) return "탑";
  if (["jg", "jungle", "정글"].includes(line)) return "정글";
  if (["mid", "미드"].includes(line)) return "미드";
  if (["adc", "원딜", "바텀", "bottom"].includes(line)) return "원딜";
  if (["sup", "support", "서폿", "서포터"].includes(line)) return "서폿";
  return "미정";
}

function tierPower(member: Member) {
  const tier = Number(member.match_tier);
  return Number.isInteger(tier) && tier >= 1 && tier <= 5 ? 6 - tier : 2.5;
}

function roleFit(member: Member, role: string) {
  const main = normalizedLine(member.main_line);
  const sub = normalizedLine(member.sub_line);
  if (main === role) return 0;
  if (sub === role) return 2;
  if (main === "미정" && sub === "미정") return 7;
  return 10;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const result: T[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutations(rest)) result.push([item, ...tail]);
  });
  return result;
}

const ROLE_PERMUTATIONS = permutations(ROLES);

function assignTeamRoles(team: Member[]) {
  let bestScore = Infinity;
  let bestRoles = ROLES;
  for (const roles of ROLE_PERMUTATIONS) {
    let score = 0;
    for (let i = 0; i < team.length; i += 1) score += roleFit(team[i], roles[i]);
    if (score < bestScore) {
      bestScore = score;
      bestRoles = roles;
    }
  }
  return {
    score: bestScore,
    assigned: team.map((member, index) => ({ member, role: bestRoles[index], fit: roleFit(member, bestRoles[index]) })),
  };
}

function combinations(values: number[], size: number, start = 0, picked: number[] = [], output: number[][] = []) {
  if (picked.length === size) {
    output.push([...picked]);
    return output;
  }
  for (let i = start; i <= values.length - (size - picked.length); i += 1) {
    picked.push(values[i]);
    combinations(values, size, i + 1, picked, output);
    picked.pop();
  }
  return output;
}

function buildCandidates(players: Member[]) {
  const indexes = players.map((_, index) => index);
  const candidates: TeamResult[] = [];
  // 첫 선수를 A팀에 고정해 A/B 뒤집기 중복을 제거합니다.
  for (const selected of combinations(indexes.slice(1), 4)) {
    const aIndexes = new Set([0, ...selected]);
    const teamA = players.filter((_, index) => aIndexes.has(index));
    const teamB = players.filter((_, index) => !aIndexes.has(index));
    const powerA = teamA.reduce((sum, member) => sum + tierPower(member), 0);
    const powerB = teamB.reduce((sum, member) => sum + tierPower(member), 0);
    const tierDiff = Math.abs(powerA - powerB);
    const assignedA = assignTeamRoles(teamA);
    const assignedB = assignTeamRoles(teamB);
    const rolePenalty = assignedA.score + assignedB.score;
    candidates.push({ teamA: assignedA.assigned, teamB: assignedB.assigned, tierDiff, score: tierDiff * 28 + rolePenalty * 4 });
  }
  return candidates.sort((a, b) => a.score - b.score || a.tierDiff - b.tierDiff);
}

function memberTier(member: Member) {
  return member.match_tier ? `${ROMAN[member.match_tier]}티어` : "티어 미정";
}

export default function NormalMatchBalancer({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member[]>([]);
  const [result, setResult] = useState<TeamResult | null>(null);
  const [mixIndex, setMixIndex] = useState(0);
  const [error, setError] = useState("");

  const memberMap = useMemo(() => new Map(members.map(member => [member.nickname.toLowerCase(), member])), [members]);
  const available = useMemo(() => members.filter(member => !selected.some(item => item.id === member.id)), [members, selected]);

  function addMember() {
    const value = query.trim();
    if (!value) return;
    const member = memberMap.get(value.toLowerCase()) || members.find(item => item.riot_id?.toLowerCase() === value.toLowerCase());
    if (!member) {
      setError("클랜원 명단에서 닉네임을 찾을 수 없습니다.");
      return;
    }
    if (selected.some(item => item.id === member.id)) {
      setError("이미 추가된 클랜원입니다.");
      return;
    }
    if (selected.length >= 10) {
      setError("일반 내전 참가자는 10명까지 추가할 수 있습니다.");
      return;
    }
    setSelected(current => [...current, member]);
    setQuery("");
    setError("");
    setResult(null);
    setMixIndex(0);
  }

  function removeMember(id: string) {
    setSelected(current => current.filter(member => member.id !== id));
    setResult(null);
    setMixIndex(0);
  }

  function balance(remix = false) {
    if (selected.length !== 10) {
      setError("참가자 10명을 모두 추가한 뒤 팀을 짜주세요.");
      return;
    }
    const candidates = buildCandidates(selected);
    const goodCandidates = candidates.filter(candidate => candidate.score <= candidates[0].score + 12).slice(0, 12);
    const nextIndex = remix ? (mixIndex + 1) % Math.max(1, goodCandidates.length) : 0;
    const chosen = goodCandidates[nextIndex] || candidates[0];
    setMixIndex(nextIndex);
    setResult(chosen);
    setError("");
  }

  return (
    <div className="normal-match-layout">
      <section className="card normal-match-builder">
        <div className="normal-match-section-head">
          <div><span>PARTICIPANTS</span><h2>참가자 명단</h2><p>닉네임을 입력하거나 목록에서 선택하세요.</p></div>
          <strong>{selected.length}<small>/10명</small></strong>
        </div>

        <div className="normal-match-add-row">
          <input
            list="normal-match-member-list"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addMember(); } }}
            placeholder="클랜원 닉네임 검색"
          />
          <datalist id="normal-match-member-list">
            {available.map(member => <option key={member.id} value={member.nickname}>{member.main_line || "미정"} / {member.sub_line || "미정"}</option>)}
          </datalist>
          <button className="button primary" onClick={addMember} type="button">명단에 추가</button>
        </div>
        {error && <p className="normal-match-error">{error}</p>}

        <div className="normal-match-player-grid">
          {selected.map((member, index) => (
            <article key={member.id}>
              <b>{index + 1}</b>
              <div>
                <strong><SponsorNickname nickname={member.nickname} /></strong>
                <span>{memberTier(member)} · 주 {member.main_line || "미정"} · 부 {member.sub_line || "미정"}</span>
              </div>
              <button type="button" onClick={() => removeMember(member.id)} aria-label={`${member.nickname} 제거`}>×</button>
            </article>
          ))}
          {!selected.length && <div className="normal-match-empty">아직 추가된 참가자가 없습니다.</div>}
        </div>

        <div className="normal-match-actions">
          <button className="button primary" type="button" onClick={() => balance(false)} disabled={selected.length !== 10}>⚖️ 밸런스 팀 만들기</button>
          <button className="button" type="button" onClick={() => { setSelected([]); setResult(null); setError(""); setMixIndex(0); }}>전체 초기화</button>
        </div>
      </section>

      <section className="normal-match-teams">
        {!result ? (
          <div className="card normal-match-result-empty"><span>5 VS 5</span><h2>팀 배정 대기 중</h2><p>참가자 10명을 추가하면 밸런스 팀을 만들 수 있습니다.</p></div>
        ) : (
          <>
            <div className="normal-match-result-head">
              <div><span>BALANCED TEAM</span><h2>자동 팀 배정 결과</h2><p>내전티어와 주·부라인을 함께 반영했습니다.</p></div>
              <button className="button" type="button" onClick={() => balance(true)}>↻ 다시 짜기</button>
            </div>
            <div className="normal-match-team-columns">
              <TeamCard title="A팀" members={result.teamA} />
              <div className="normal-match-versus">VS</div>
              <TeamCard title="B팀" members={result.teamB} />
            </div>
            <div className="normal-match-balance-note">팀 전력 차이 <b>{result.tierDiff.toFixed(1)}</b> · 같은 수준의 조합 안에서 다시 짜기가 가능합니다.</div>
          </>
        )}
      </section>
    </div>
  );
}

function TeamCard({ title, members }: { title: string; members: AssignedMember[] }) {
  const sorted = [...members].sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
  return (
    <article className="card normal-match-team-card">
      <header><span>{title}</span><strong>{members.reduce((sum, item) => sum + tierPower(item.member), 0).toFixed(1)}</strong></header>
      <div>
        {sorted.map(({ member, role, fit }) => (
          <div className="normal-match-team-member" key={member.id}>
            <span className="normal-match-line-badge">{role}</span>
            <strong><SponsorNickname nickname={member.nickname} /></strong>
            <small>{memberTier(member)} · 주 {member.main_line || "미정"} · 부 {member.sub_line || "미정"}</small>
            {fit >= 7 && <em className="normal-match-role-warning">⚠ 자동 배정</em>}
            {fit === 2 && <em className="normal-match-role-sub">부라인</em>}
          </div>
        ))}
      </div>
    </article>
  );
}
