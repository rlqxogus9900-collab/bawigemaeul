"use client";

import { useMemo, useState } from "react";

type Report = {
  id: string;
  category: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  display_name: string | null;
  image_url: string | null;
  status: string;
  staff_reply: string | null;
  created_at: string;
};

const categoryLabel: Record<string, string> = {
  suggestion: "건의",
  bug: "버그",
  report: "신고",
  other: "기타"
};
const statusLabel: Record<string, string> = {
  pending: "접수",
  reviewing: "처리중",
  completed: "완료"
};

export default function WhistleClient({ reports, loggedIn }: { reports: Report[]; loggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return reports.filter(report => {
      const categoryOk = category === "all" || report.category === category;
      const statusOk = status === "all" || report.status === status;
      const text = `${report.title} ${report.content} ${report.staff_reply || ""}`.toLowerCase();
      return categoryOk && statusOk && (!keyword || text.includes(keyword));
    });
  }, [reports, query, category, status]);

  const pending = reports.filter(item => item.status === "pending").length;
  const reviewing = reports.filter(item => item.status === "reviewing").length;
  const completed = reports.filter(item => item.status === "completed").length;

  return (
    <div className="whistle-shell">
      <section className="whistle-hero">
        <div>
          <span>SCUTTLE FEEDBACK BOX</span>
          <h1>바위게 신문고</h1>
          <p>건의, 버그, 신고 내용을 남겨주세요. 익명 작성 시 운영진만 작성자를 확인할 수 있습니다.</p>
        </div>
        <button className="button primary" type="button" onClick={() => setShowForm(value => !value)}>
          {showForm ? "작성 닫기" : "제보 작성"}
        </button>
      </section>

      {showForm && (
        <section className="card whistle-compose-card">
          <div className="dashboard-head"><div><span>NEW REPORT</span><h2>신문고 작성</h2></div></div>
          <form className="form whistle-form" action="/api/whistle" method="post">
            <div className="whistle-form-row">
              <label>분류<select name="category" defaultValue="suggestion"><option value="suggestion">건의</option><option value="bug">버그</option><option value="report">신고</option><option value="other">기타</option></select></label>
              <label>공개 방식<select name="is_anonymous" defaultValue="true"><option value="true">익명</option>{loggedIn && <option value="false">닉네임 공개</option>}</select></label>
            </div>
            <label>제목<input name="title" maxLength={80} placeholder="내용을 한 줄로 요약해주세요" required /></label>
            <label>내용<textarea name="content" rows={7} maxLength={2000} placeholder="운영진이 확인할 수 있도록 자세히 적어주세요" required /></label>
            <label>이미지 주소 <small>(선택)</small><input name="image_url" type="url" placeholder="https://... 이미지 링크" /></label>
            <div className="whistle-submit-row"><small>욕설·허위 신고는 처리되지 않을 수 있습니다.</small><button className="button primary">신문고 접수</button></div>
          </form>
        </section>
      )}

      <section className="whistle-summary-grid">
        <article className="card"><span>접수</span><strong>{pending}</strong><small>운영진 확인 전</small></article>
        <article className="card"><span>처리중</span><strong>{reviewing}</strong><small>답변 준비 중</small></article>
        <article className="card"><span>완료</span><strong>{completed}</strong><small>답변 완료</small></article>
      </section>

      <section className="card whistle-list-card">
        <div className="dashboard-head"><div><span>REPORT LIST</span><h2>신문고 목록</h2></div><small>{filtered.length}건 표시</small></div>
        <div className="whistle-filter-bar">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="제목·내용·답변 검색" />
          <select value={category} onChange={event => setCategory(event.target.value)}><option value="all">전체 분류</option><option value="suggestion">건의</option><option value="bug">버그</option><option value="report">신고</option><option value="other">기타</option></select>
          <select value={status} onChange={event => setStatus(event.target.value)}><option value="all">전체 상태</option><option value="pending">접수</option><option value="reviewing">처리중</option><option value="completed">완료</option></select>
        </div>

        <div className="whistle-report-list">
          {filtered.map(report => (
            <article key={report.id} className={`whistle-report status-${report.status}`}>
              <div className="whistle-report-head">
                <div><span className="whistle-category">{categoryLabel[report.category] || "기타"}</span><b>{report.title}</b></div>
                <span className="whistle-status">{statusLabel[report.status] || report.status}</span>
              </div>
              <p>{report.content}</p>
              {report.image_url && <a className="whistle-image-link" href={report.image_url} target="_blank" rel="noreferrer">첨부 이미지 보기 ↗</a>}
              <div className="whistle-meta"><span>{report.is_anonymous ? "익명" : (report.display_name || "클랜원")}</span><time>{new Date(report.created_at).toLocaleString("ko-KR")}</time></div>
              {report.staff_reply && <div className="whistle-reply"><b>운영진 답변</b><p>{report.staff_reply}</p></div>}
            </article>
          ))}
          {!filtered.length && <div className="whistle-empty">조건에 맞는 신문고가 없습니다.</div>}
        </div>
      </section>
    </div>
  );
}
