"use client";

import { useState } from "react";

type Settings = {
  activity_days: number;
  notice_notifications: boolean;
  regular_match_notifications: boolean;
  event_notifications: boolean;
  homepage_popup: boolean;
};

export default function SettingsManager({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    const result = await response.json().catch(() => null);
    setMessage(response.ok ? "설정을 저장했습니다." : result?.message || "설정 저장에 실패했습니다.");
  }

  const toggle = (key: keyof Settings) =>
    setSettings(current => ({ ...current, [key]: !current[key] }));

  return (
    <div className="admin-functional-page">
      <section className="card">
        <div className="dashboard-head">
          <div><span>STAFF ONLY</span><h1>관리자 설정</h1><p className="muted">활동 판정과 중요 알림을 실제로 설정합니다.</p></div>
        </div>
      </section>

      <section className="card settings-live-card">
        <div className="dashboard-head"><div><span>ACTIVITY</span><h2>활동 판정 설정</h2></div></div>
        <label className="settings-number-row">
          <div><b>활동 인정 기간</b><span>최근 클랜 게임이 이 기간 안이면 활동으로 판정합니다.</span></div>
          <div><input type="number" min="1" max="90" value={settings.activity_days} onChange={e=>setSettings({...settings,activity_days:Number(e.target.value)})}/><em>일</em></div>
        </label>
      </section>

      <section className="card settings-live-card">
        <div className="dashboard-head"><div><span>NOTIFICATIONS</span><h2>전체 알림 설정</h2></div></div>
        {([
          ["notice_notifications", "공지사항 알림", "운영진이 공지를 작성하면 전체 클랜원에게 알림"],
          ["regular_match_notifications", "정기내전 투표 알림", "정기내전 참가 투표 작성 시 전체 알림"],
          ["event_notifications", "이벤트 알림", "이벤트 게시글 작성 시 전체 알림"],
          ["homepage_popup", "홈페이지 큰 팝업", "읽지 않은 중요 알림을 홈페이지 접속 시 크게 표시"]
        ] as const).map(([key,title,desc])=><button type="button" className="settings-toggle-row" key={key} onClick={()=>toggle(key)}>
          <div><b>{title}</b><span>{desc}</span></div><i className={settings[key]?"on":""}>{settings[key]?"ON":"OFF"}</i>
        </button>)}
      </section>

      <section className="card settings-save-bar">
        <div>{message && <p className={message.includes("실패")?"form-error":"settings-success"}>{message}</p>}</div>
        <button className="button primary" onClick={save} disabled={saving}>{saving?"저장 중...":"설정 저장"}</button>
      </section>
    </div>
  );
}
