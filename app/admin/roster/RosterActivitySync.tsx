"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function RosterActivitySync() {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState("명단에 들어오면 Riot API 활동 집계를 자동 실행합니다.");

  async function sync() {
    if (state === "syncing") return;
    setState("syncing");
    setMessage("Riot API에서 클랜원 최근 활동을 확인 중입니다...");
    try {
      const response = await fetch("/api/admin/members/sync-activity", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "집계 실패");
      setState("done");
      setMessage(`집계 완료 · 정상 ${data.synced}명 · Riot ID 미등록 ${data.missing}명 · 실패 ${data.failed}명`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "활동 집계에 실패했습니다.");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void sync();
  }, []);

  return (
    <div className={`roster-sync-box ${state}`}>
      <div>
        <b>{state === "syncing" ? "자동 집계 중" : state === "done" ? "자동 집계 완료" : state === "error" ? "자동 집계 오류" : "Riot API 자동 집계"}</b>
        <span>{message}</span>
      </div>
      <button type="button" onClick={sync} disabled={state === "syncing"}>{state === "syncing" ? "확인 중..." : "지금 다시 집계"}</button>
    </div>
  );
}
