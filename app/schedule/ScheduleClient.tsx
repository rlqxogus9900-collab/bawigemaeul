"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ScheduleType = "정기내전" | "대회" | "이벤트" | "공지";
type Attendance = "join" | "decline";

type ScheduleItem = {
  id: string;
  title: string;
  type: ScheduleType;
  startsAt: string;
  closesAt: string;
  location: string;
  description: string;
  capacity: number;
  attendees: string[];
  declined: string[];
  createdAt: string;
};

const STORAGE_KEY = "bawigemaeul:schedules:v1";
const TYPES: ScheduleType[] = ["정기내전", "대회", "이벤트", "공지"];

function readSchedules(): ScheduleItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSchedules(items: ScheduleItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("bawigemaeul:schedules-updated"));
}

function formatDate(value: string) {
  if (!value) return "일정 미정";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function toInputDateTime(date = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function sortSchedules(items: ScheduleItem[]) {
  return [...items].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export default function ScheduleClient({ admin = false }: { admin?: boolean }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [ready, setReady] = useState(false);
  const [nickname, setNickname] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "정기내전" as ScheduleType,
    startsAt: toInputDateTime(),
    closesAt: "",
    location: "디스코드",
    description: "",
    capacity: 10
  });

  useEffect(() => {
    const sync = () => setItems(sortSchedules(readSchedules()));
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("bawigemaeul:schedules-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("bawigemaeul:schedules-updated", sync);
    };
  }, []);

  const upcoming = useMemo(
    () => items.filter(item => new Date(item.startsAt).getTime() >= Date.now() - 60 * 60 * 1000),
    [items]
  );
  const past = useMemo(
    () => items.filter(item => new Date(item.startsAt).getTime() < Date.now() - 60 * 60 * 1000).reverse(),
    [items]
  );

  function save(next: ScheduleItem[]) {
    const sorted = sortSchedules(next);
    setItems(sorted);
    writeSchedules(sorted);
  }

  function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.startsAt) return;

    if (editingId) {
      save(items.map(item => item.id === editingId ? {
        ...item,
        ...form,
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        capacity: Math.max(0, Number(form.capacity) || 0)
      } : item));
    } else {
      save([...items, {
        id: crypto.randomUUID(),
        ...form,
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        capacity: Math.max(0, Number(form.capacity) || 0),
        attendees: [],
        declined: [],
        createdAt: new Date().toISOString()
      }]);
    }

    setEditingId(null);
    setForm({
      title: "",
      type: "정기내전",
      startsAt: toInputDateTime(),
      closesAt: "",
      location: "디스코드",
      description: "",
      capacity: 10
    });
  }

  function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      type: item.type,
      startsAt: item.startsAt,
      closesAt: item.closesAt,
      location: item.location,
      description: item.description,
      capacity: item.capacity
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    save(items.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function attend(id: string, choice: Attendance) {
    const name = nickname.trim();
    if (!name) {
      window.alert("참가자 닉네임을 먼저 입력해주세요.");
      return;
    }

    save(items.map(item => {
      if (item.id !== id) return item;
      const attendees = item.attendees.filter(value => value !== name);
      const declined = item.declined.filter(value => value !== name);
      if (choice === "join") attendees.push(name);
      if (choice === "decline") declined.push(name);
      return { ...item, attendees, declined };
    }));
  }

  function cancelAttendance(id: string) {
    const name = nickname.trim();
    if (!name) return;
    save(items.map(item => item.id === id ? {
      ...item,
      attendees: item.attendees.filter(value => value !== name),
      declined: item.declined.filter(value => value !== name)
    } : item));
  }

  return (
    <div className="schedule-page-shell">
      <section className="schedule-hero">
        <div>
          <span>{admin ? "STAFF SCHEDULE CONTROL" : "CLAN SCHEDULE"}</span>
          <h1>{admin ? "일정 관리" : "바위게마을 일정"}</h1>
          <p>{admin ? "정기내전·대회·이벤트 일정을 등록하고 수정합니다." : "다가오는 클랜 일정과 참가 현황을 확인합니다."}</p>
        </div>
        <div className="schedule-hero-count"><b>{upcoming.length}</b><small>예정 일정</small></div>
      </section>

      {admin ? (
        <section className="card schedule-admin-form-card">
          <div className="dashboard-head">
            <div><span>SCHEDULE EDITOR</span><h2>{editingId ? "일정 수정" : "새 일정 등록"}</h2></div>
            <Link href="/schedule" className="card-button">일반 화면 보기</Link>
          </div>
          <form className="schedule-form" onSubmit={submitSchedule}>
            <label className="schedule-field schedule-field-wide"><span>일정 제목</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="예: 7월 정기내전" required /></label>
            <label className="schedule-field"><span>종류</span><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ScheduleType })}>{TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
            <label className="schedule-field"><span>모집 인원</span><input type="number" min="0" max="100" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
            <label className="schedule-field"><span>시작 일시</span><input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} required /></label>
            <label className="schedule-field"><span>참가 마감</span><input type="datetime-local" value={form.closesAt} onChange={e => setForm({ ...form, closesAt: e.target.value })} /></label>
            <label className="schedule-field schedule-field-wide"><span>장소 / 채널</span><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="디스코드 또는 장소" /></label>
            <label className="schedule-field schedule-field-wide"><span>설명</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="준비사항이나 안내를 입력해주세요." rows={4} /></label>
            <div className="schedule-form-actions schedule-field-wide">
              <button type="submit" className="schedule-primary-button">{editingId ? "수정 저장" : "일정 등록"}</button>
              {editingId && <button type="button" className="schedule-secondary-button" onClick={() => setEditingId(null)}>수정 취소</button>}
            </div>
          </form>
        </section>
      ) : (
        <section className="card schedule-nickname-card">
          <div><small>ATTENDANCE NAME</small><b>참가자 닉네임</b><p>입력한 닉네임으로 참가·불참을 선택합니다.</p></div>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="롤 닉네임 입력" maxLength={24} />
        </section>
      )}

      {!ready ? (
        <div className="card schedule-empty">일정을 불러오는 중입니다.</div>
      ) : (
        <>
          <section className="schedule-list-section">
            <div className="schedule-section-title"><span>UPCOMING</span><h2>다가오는 일정</h2></div>
            <div className="schedule-card-grid">
              {upcoming.map(item => {
                const closed = Boolean(item.closesAt) && new Date(item.closesAt).getTime() <= Date.now();
                const full = item.capacity > 0 && item.attendees.length >= item.capacity;
                const myStatus = nickname.trim() && item.attendees.includes(nickname.trim()) ? "join" : nickname.trim() && item.declined.includes(nickname.trim()) ? "decline" : null;
                return (
                  <article key={item.id} className={`card schedule-card type-${item.type}`}>
                    <header>
                      <span className="schedule-type-badge">{item.type}</span>
                      <span className={`schedule-status-badge${closed ? " is-closed" : ""}`}>{closed ? "마감" : full ? "정원 마감" : "모집 중"}</span>
                    </header>
                    <h3>{item.title}</h3>
                    <div className="schedule-date-row"><b>{formatDate(item.startsAt)}</b><small>{item.location || "장소 미정"}</small></div>
                    {item.description && <p className="schedule-description">{item.description}</p>}
                    <div className="schedule-capacity"><span>참가 현황</span><b>{item.attendees.length}{item.capacity > 0 ? ` / ${item.capacity}` : "명"}</b></div>
                    <div className="schedule-progress"><i style={{ width: `${item.capacity > 0 ? Math.min(100, item.attendees.length / item.capacity * 100) : 0}%` }} /></div>
                    {item.attendees.length > 0 && <div className="schedule-member-list"><small>참가</small><p>{item.attendees.join(" · ")}</p></div>}
                    {admin ? (
                      <div className="schedule-card-actions"><button type="button" onClick={() => startEdit(item)}>수정</button><button type="button" className="danger" onClick={() => remove(item.id)}>삭제</button></div>
                    ) : (
                      <div className="schedule-card-actions attendance-actions">
                        <button type="button" className={myStatus === "join" ? "active" : ""} disabled={(closed || full) && myStatus !== "join"} onClick={() => attend(item.id, "join")}>참가</button>
                        <button type="button" className={myStatus === "decline" ? "active decline" : ""} disabled={closed && myStatus !== "decline"} onClick={() => attend(item.id, "decline")}>불참</button>
                        {myStatus && <button type="button" onClick={() => cancelAttendance(item.id)}>선택 취소</button>}
                      </div>
                    )}
                  </article>
                );
              })}
              {!upcoming.length && <div className="card schedule-empty">등록된 예정 일정이 없습니다.{admin ? " 위에서 새 일정을 등록해주세요." : " 운영진이 일정을 등록하면 여기에 표시됩니다."}</div>}
            </div>
          </section>

          {past.length > 0 && (
            <section className="schedule-list-section past-schedules">
              <div className="schedule-section-title"><span>PAST</span><h2>지난 일정</h2></div>
              <div className="schedule-past-list">{past.map(item => <div key={item.id} className="card"><span>{item.type}</span><b>{item.title}</b><small>{formatDate(item.startsAt)} · 참가 {item.attendees.length}명</small>{admin && <button type="button" onClick={() => remove(item.id)}>삭제</button>}</div>)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
