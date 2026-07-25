"use client";
import { useState } from "react";

type Member = { id: string; nickname: string };
type RecordRow = { id: string; member_id: string; line: string; kills: number; deaths: number; assists: number; is_win: boolean; played_at: string; nickname: string };

export default function PlayerStatManager({ members, records }: { members: Member[]; records: RecordRow[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/player-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      memberId: f.get("memberId"), line: f.get("line"), kills: Number(f.get("kills")), deaths: Number(f.get("deaths")), assists: Number(f.get("assists")), isWin: f.get("isWin") === "win", playedAt: f.get("playedAt")
    }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || "저장 실패"); setBusy(false); return; }
    location.reload();
  }
  async function remove(id: string) {
    if (!confirm("이 개인 기록을 삭제할까요?")) return;
    const r = await fetch(`/api/admin/player-stats/${id}`, { method: "DELETE" });
    if (r.ok) location.reload(); else setMsg("삭제 실패");
  }
  return <div className="admin-functional-page">
    <section className="card"><div className="dashboard-head"><div><span>STAFF ONLY</span><h1>대회·내전 개인 기록</h1><p className="muted">여기에 입력한 기록이 정기내전 통계의 KDA·승률·라인별 기록에 반영됩니다.</p></div></div>
      <form className="player-stat-create-grid" onSubmit={add}>
        <select name="memberId" required defaultValue=""><option value="" disabled>클랜원 선택</option>{members.map(m => <option key={m.id} value={m.id}>{m.nickname}</option>)}</select>
        <select name="line" required defaultValue=""><option value="" disabled>라인 선택</option>{["탑","정글","미드","원딜","서폿"].map(x => <option key={x}>{x}</option>)}</select>
        <input name="kills" type="number" min="0" defaultValue="0" placeholder="킬" required />
        <input name="deaths" type="number" min="0" defaultValue="0" placeholder="데스" required />
        <input name="assists" type="number" min="0" defaultValue="0" placeholder="어시" required />
        <select name="isWin" defaultValue="win"><option value="win">승리</option><option value="loss">패배</option></select>
        <input name="playedAt" type="datetime-local" />
        <button className="button primary" disabled={busy}>{busy ? "저장 중..." : "개인 기록 저장"}</button>
      </form>{msg && <p className="form-error">{msg}</p>}
    </section>
    <section className="card"><div className="dashboard-head"><div><span>PLAYER RECORDS</span><h2>등록 기록 {records.length}건</h2></div></div>
      <div className="record-admin-list">{records.map(x => <article key={x.id}><div><b>{x.nickname} · {x.line} · {x.kills}/{x.deaths}/{x.assists}</b><span>{x.is_win ? "승리" : "패배"} · {new Date(x.played_at).toLocaleString("ko-KR")}</span></div><button className="button danger" onClick={() => remove(x.id)}>삭제</button></article>)}{!records.length && <p className="empty-copy">등록된 개인 기록이 없습니다.</p>}</div>
    </section>
  </div>;
}
