"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: "notice" | "poll" | "comment" | "system";
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const icons = {
  notice: "📢",
  poll: "🗳",
  comment: "💬",
  system: "🔔"
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function load() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) {
      setLoading(false);
      return;
    }
    const result = await response.json();
    setItems(result.notifications || []);
    setUnreadCount(result.unreadCount || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function readOne(item: NotificationItem) {
    if (!item.is_read) {
      setItems(current =>
        current.map(row => row.id === item.id ? { ...row, is_read: true } : row)
      );
      setUnreadCount(current => Math.max(0, current - 1));
      await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
    }
    setOpen(false);
  }

  async function readAll() {
    setItems(current => current.map(row => ({ ...row, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div className="notification-center" ref={wrapRef}>
      <button
        type="button"
        className={`notification-bell ${open ? "active" : ""}`}
        onClick={() => setOpen(value => !value)}
        aria-label="알림 열기"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <b>{unreadCount > 99 ? "99+" : unreadCount}</b>
        )}
      </button>

      {open && (
        <section className="notification-popover">
          <header>
            <div>
              <span>NOTIFICATIONS</span>
              <h2>알림</h2>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={readAll}>전체 읽음</button>
            )}
          </header>

          <div className="notification-list">
            {loading && <p className="notification-empty">알림을 불러오는 중...</p>}

            {!loading && items.map(item => {
              const content = (
                <>
                  <i>{icons[item.type] || "🔔"}</i>
                  <div>
                    <b>{item.title}</b>
                    {item.message && <p>{item.message}</p>}
                    <time>
                      {new Date(item.created_at).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        hour12: false
                      })}
                    </time>
                  </div>
                  {!item.is_read && <em aria-label="읽지 않음" />}
                </>
              );

              return item.link ? (
                <Link
                  href={item.link}
                  key={item.id}
                  className={item.is_read ? "read" : "unread"}
                  onClick={() => readOne(item)}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  key={item.id}
                  className={item.is_read ? "read" : "unread"}
                  onClick={() => readOne(item)}
                >
                  {content}
                </button>
              );
            })}

            {!loading && !items.length && (
              <p className="notification-empty">아직 받은 알림이 없습니다.</p>
            )}
          </div>

          <footer className="notification-popover-footer">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              전체 알림 보기 →
            </Link>
          </footer>
        </section>
      )}
    </div>
  );
}
