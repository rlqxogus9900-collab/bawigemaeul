"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type User = { nickname: string; role: "member" | "staff" } | null;

const publicItems = [
  ["/", "⌂", "홈"], ["/reference", "☷", "내전 참고 명단"],
  ["/normal-match", "⚔", "일반 내전"], ["/auction", "📡", "실시간 경매"],
  ["/stats", "▥", "정기내전 통계"], ["/coin", "◉", "코인토스"],
  ["/guides", "◆", "챔피언 공략"], ["/notices", "📢", "클랜 공지"],
  ["/rules", "📜", "클랜 규칙"], ["/boards", "💬", "게시판"],
  ["/schedule", "📅", "일정"], ["/whistle", "📮", "바위게 신문고"],
  ["/hall-of-fame", "🏆", "명예의 전당"]
];

const staffItems = [
  ["/admin/members", "♙", "클랜원 명단"], ["/admin/activity", "▣", "활동 관리"],
  ["/admin/auction", "🔨", "경매 관리"], ["/admin/tournaments", "🏆", "대회·내전 기록"],
  ["/admin/match-records", "📝", "정기내전 상세 기록"], ["/admin/boards", "🗂", "게시판 관리"],
  ["/admin/notices", "✍", "공지 관리"], ["/admin/rules", "📜", "규칙 관리"],
  ["/admin/schedule", "📅", "일정 관리"], ["/admin/whistle", "📮", "신문고 관리"],
  ["/admin/members", "👥", "계정·권한 관리"], ["/admin/home", "🏠", "홈페이지 관리"],
  ["/admin/settings", "⚙", "관리자 설정"]
];

export default function SiteNavigation({ user }: { user: User }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);
  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setMobileOpen(true)}>☰</button>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <img src="/assets/crab-logo.jpg" alt="바위게마을" />
          <div><h1>바위게마을</h1><small>BAWIGEMAEUL · ONLINE</small></div>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>×</button>
        </div>
        <nav className="sidebar-nav">
          {publicItems.map(([href, icon, label]) => (
            <Link key={href} href={href} className={active(href) ? "active" : ""} onClick={() => setMobileOpen(false)}>
              <span>{icon}</span><b>{label}</b>
            </Link>
          ))}
          {user?.role === "staff" && (
            <>
              <button className="admin-menu-toggle" onClick={() => setAdminOpen(v => !v)}>
                관리자 메뉴 <span>{adminOpen ? "▴" : "▾"}</span>
              </button>
              {adminOpen && <div className="admin-nav-group">
                {staffItems.map(([href, icon, label], index) => (
                  <Link key={`${href}-${index}`} href={href} className={active(href) ? "active" : ""} onClick={() => setMobileOpen(false)}>
                    <span>{icon}</span><b>{label}</b>
                  </Link>
                ))}
              </div>}
            </>
          )}
        </nav>
        <div className="side-bottom">
          <img src="/assets/crab-logo.jpg" alt="" /><b>함께하면 더 즐겁다!</b><small>© 2026 바위게마을</small>
        </div>
      </aside>
    </>
  );
}
