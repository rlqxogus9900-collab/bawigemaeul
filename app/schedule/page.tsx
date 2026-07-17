import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  match_at: string | null;
  vote_deadline: string | null;
  status: string | null;
  created_at: string;
};

function formatKoreanDate(value: string | null, withTime = true) {
  if (!value) return "일정 미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  }).format(new Date(value));
}

function dateKey(value: string | null) {
  if (!value) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

export default async function SchedulePage() {
  const user = await getSession();
  const db = getSupabaseAdmin();

  const { data: rawEvents } = await db
    .from("regular_match_events")
    .select("id,title,description,match_at,vote_deadline,status,created_at")
    .order("match_at", { ascending: true, nullsFirst: false })
    .limit(50);

  const events = (rawEvents || []) as ScheduleEvent[];
  const eventIds = events.map(event => event.id);

  const { data: votes } = eventIds.length
    ? await db
        .from("regular_match_votes")
        .select("event_id,choice")
        .in("event_id", eventIds)
    : { data: [] as { event_id: string; choice: string }[] };

  const now = Date.now();
  const upcoming = events.filter(event => !event.match_at || new Date(event.match_at).getTime() >= now);
  const past = events
    .filter(event => event.match_at && new Date(event.match_at).getTime() < now)
    .sort((a, b) => new Date(b.match_at || 0).getTime() - new Date(a.match_at || 0).getTime());

  const groupedUpcoming = upcoming.reduce<Record<string, ScheduleEvent[]>>((groups, event) => {
    const key = dateKey(event.match_at);
    groups[key] = [...(groups[key] || []), event];
    return groups;
  }, {});

  return (
    <div className="schedule-page-shell">
      <section className="schedule-hero">
        <div>
          <span>CLAN SCHEDULE</span>
          <h1>바위게마을 일정</h1>
          <p>정기내전 모집 일정과 투표 마감, 참가 현황을 한눈에 확인합니다.</p>
        </div>
        <div className="schedule-hero-actions">
          <Link className="button" href="/normal-match">정기내전 모집 보기</Link>
          {user?.role === "staff" && (
            <Link className="button primary" href="/admin/regular-match">일정 관리</Link>
          )}
        </div>
      </section>

      <section className="schedule-summary-grid">
        <article><span>다가오는 일정</span><strong>{upcoming.length}</strong><small>예정된 정기내전</small></article>
        <article><span>이번 주</span><strong>{upcoming.filter(event => {
          if (!event.match_at) return false;
          const diff = new Date(event.match_at).getTime() - now;
          return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        }).length}</strong><small>7일 이내 일정</small></article>
        <article><span>모집 중</span><strong>{upcoming.filter(event => {
          const deadlineOpen = !event.vote_deadline || new Date(event.vote_deadline).getTime() > now;
          return event.status === "open" && deadlineOpen;
        }).length}</strong><small>현재 참가 선택 가능</small></article>
      </section>

      <section className="schedule-layout">
        <div className="schedule-main-list">
          <div className="dashboard-head schedule-section-head">
            <div><span>UPCOMING</span><h2>다가오는 일정</h2></div>
          </div>

          {Object.entries(groupedUpcoming).map(([day, dayEvents]) => (
            <section className="schedule-day-group" key={day}>
              <h3>{day}</h3>
              <div className="schedule-event-stack">
                {dayEvents.map(event => {
                  const attending = (votes || []).filter(vote => vote.event_id === event.id && vote.choice === "attending").length;
                  const absent = (votes || []).filter(vote => vote.event_id === event.id && vote.choice === "absent").length;
                  const deadlineOpen = !event.vote_deadline || new Date(event.vote_deadline).getTime() > now;
                  const isOpen = event.status === "open" && deadlineOpen;

                  return (
                    <article className="card schedule-event-card" key={event.id}>
                      <div className="schedule-event-datebox">
                        <small>{event.match_at ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "short" }).format(new Date(event.match_at)) : "미정"}</small>
                        <strong>{event.match_at ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", day: "2-digit" }).format(new Date(event.match_at)) : "-"}</strong>
                      </div>
                      <div className="schedule-event-content">
                        <div className="schedule-event-title-row">
                          <div>
                            <span className={`schedule-status ${isOpen ? "open" : "closed"}`}>{isOpen ? "모집 중" : "모집 마감"}</span>
                            <h3>{event.title}</h3>
                          </div>
                          <b>{formatKoreanDate(event.match_at)}</b>
                        </div>
                        <p>{event.description || "정기내전 일정입니다. 참가 여부는 정기내전 모집에서 선택해주세요."}</p>
                        <div className="schedule-event-meta">
                          <span>참가 <b>{attending}명</b></span>
                          <span>불참 <b>{absent}명</b></span>
                          <span>투표 마감 <b>{formatKoreanDate(event.vote_deadline)}</b></span>
                        </div>
                        <div className="schedule-event-actions">
                          <Link className="button small" href="/normal-match">참가 현황 및 투표</Link>
                          {user?.role === "staff" && <Link className="button small outline" href="/admin/regular-match">수정·관리</Link>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {!upcoming.length && (
            <div className="card schedule-empty">등록된 예정 일정이 없습니다.</div>
          )}
        </div>

        <aside className="card schedule-past-panel">
          <div className="dashboard-head">
            <div><span>PAST EVENTS</span><h2>지난 일정</h2></div>
          </div>
          <div className="schedule-past-list">
            {past.slice(0, 8).map(event => (
              <div key={event.id}>
                <span>{formatKoreanDate(event.match_at, false)}</span>
                <b>{event.title}</b>
              </div>
            ))}
            {!past.length && <p>아직 지난 일정이 없습니다.</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
