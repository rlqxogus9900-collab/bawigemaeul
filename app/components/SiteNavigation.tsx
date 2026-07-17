"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type User = { nickname: string; role: "member" | "staff" } | null;
type BoardCategory = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  subcategories: { id: string; name: string }[];
};

type FixedGroup = {
  id: string;
  name: string;
  icon: string;
  items: [string, string, string][];
};

const fixedGroups: FixedGroup[] = [
  {
    id: "clan",
    name: "클랜",
    icon: "🦀",
    items: [
      ["/", "⌂", "홈"],
      ["/updates", "🆕", "업데이트"],
      ["/rules", "📜", "클랜 규칙"],
      ["/schedule", "📅", "일정"],
      ["/hall-of-fame", "🏆", "명예의 전당"]
    ]
  },
  {
    id: "match",
    name: "내전",
    icon: "⚔",
    items: [
      ["/reference", "☷", "내전 참고 명단"],
      ["/normal-match", "⚔", "일반 내전"],
      ["/auction", "📡", "실시간 경매"],
      ["/stats", "▥", "정기내전 통계"],
      ["/coin", "◉", "코인토스"]
    ]
  },
  {
    id: "game",
    name: "게임 정보",
    icon: "◆",
    items: [["/guides", "◆", "챔피언 공략"]]
  },
  {
    id: "support",
    name: "클랜 운영",
    icon: "📮",
    items: [["/whistle", "📮", "바위게 신문고"]]
  }
];

const staffItems = [
  ["/admin/roster", "👥", "명단"],
  ["/admin/reference", "☷", "내전 참고 명단 관리"],
  ["/admin/members", "♙", "명단 설정"],
  ["/admin/activity", "▣", "활동 관리"],
  ["/admin/regular-match", "🗳", "정기내전 모집 관리"],
  ["/admin/polls", "🗳", "정기내전 투표 관리"],
  ["/admin/auction", "🔨", "경매 관리"],
  ["/admin/tournaments", "🏆", "대회·내전 기록"],
  ["/admin/match-records", "📝", "정기내전 상세 기록"],
  ["/admin/boards", "🗂", "게시판·메뉴 관리"],
  ["/admin/notices", "✍", "공지 관리"],
  ["/admin/rules", "📜", "규칙 관리"],
  ["/admin/schedule", "📅", "일정 관리"],
  ["/admin/whistle", "📮", "신문고 관리"],
  ["/admin/home", "🏠", "홈페이지 관리"],
  ["/admin/sponsors", "💖", "후원 관리"],
  ["/admin/settings", "⚙", "관리자 설정"]
];

export default function SiteNavigation({
  user,
  boardCategories
}: {
  user: User;
  boardCategories: BoardCategory[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentBoard = searchParams.get("board");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const initialGroups: Record<string, boolean> = {};
  fixedGroups.forEach(group => {
    initialGroups[`fixed-${group.id}`] = true;
  });
  boardCategories.forEach(category => {
    initialGroups[`board-${category.id}`] = true;
  });

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialGroups);
  const [adminOpen, setAdminOpen] = useState(true);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, currentBoard]);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  function toggleGroup(id: string) {
    setOpenGroups(current => ({ ...current, [id]: !current[id] }));
  }

  function startNavigation(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    boardId?: string
  ) {
    const samePage = boardId
      ? pathname === "/boards" && currentBoard === boardId
      : active(href);

    if (samePage) {
      event.preventDefault();
      setNavigating(false);
      setMobileOpen(false);
      return;
    }

    setNavigating(true);
    setMobileOpen(false);
  }

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setMobileOpen(true)}>☰</button>

      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {navigating && <div className="route-progress" aria-hidden="true" />}

      <aside className={`sidebar cafe-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand">
          <Link
            href="/"
            className="brand-home-link"
            onClick={event => startNavigation(event, "/")}
            aria-label="바위게마을 홈으로 이동"
          >
            <img src="/assets/crab-logo.jpg" alt="바위게마을" />
            <div>
              <h1>바위게마을</h1>
              <small>BAWIGEMAEUL · ONLINE</small>
            </div>
          </Link>

          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        <nav className="sidebar-nav">
          <div className="cafe-menu-section">
            <div className="cafe-section-title">바위게마을</div>

            {fixedGroups.map(group => {
              const groupKey = `fixed-${group.id}`;

              return (
                <div className="cafe-board-group" key={group.id}>
                  <button
                    type="button"
                    className="cafe-board-group-title"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <span><i>{group.icon}</i>{group.name}</span>
                    <em>{openGroups[groupKey] ? "▼" : "▲"}</em>
                  </button>

                  {openGroups[groupKey] && (
                    <div className="cafe-board-submenu">
                      {group.items.map(([href, icon, label]) => (
                        <Link
                          key={href}
                          href={href}
                          className={active(href) ? "active" : ""}
                          onClick={event => startNavigation(event, href)}
                        >
                          <span>{icon}</span><b>{label}</b>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {boardCategories.length > 0 && (
            <div className="cafe-menu-section">
              <div className="cafe-section-title">게시판</div>

              {boardCategories.map(category => {
                const groupKey = `board-${category.id}`;

                return (
                  <div className="cafe-board-group" key={category.id}>
                    <button
                      type="button"
                      className="cafe-board-group-title"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <span><i>{category.icon}</i>{category.name}</span>
                      <em>{openGroups[groupKey] ? "▼" : "▲"}</em>
                    </button>

                    {openGroups[groupKey] && (
                      <div className="cafe-board-submenu">
                        {category.subcategories.map(subcategory => (
                          <Link
                            key={subcategory.id}
                            href={`/boards?board=${subcategory.id}`}
                            className={
                              pathname === "/boards" && currentBoard === subcategory.id
                                ? "active"
                                : ""
                            }
                            onClick={event =>
                              startNavigation(
                                event,
                                `/boards?board=${subcategory.id}`,
                                subcategory.id
                              )
                            }
                          >
                            <span>└</span><b>{subcategory.name}</b>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {user?.role === "staff" && (
            <div className="cafe-menu-section">
              <button
                className="admin-menu-toggle cafe-admin-toggle"
                onClick={() => setAdminOpen(value => !value)}
              >
                <span>관리자 메뉴</span><em>{adminOpen ? "▼" : "▲"}</em>
              </button>

              {adminOpen && (
                <div className="admin-nav-group">
                  {staffItems.map(([href, icon, label], index) => (
                    <Link
                      key={`${href}-${index}`}
                      href={href}
                      className={active(href) ? "active" : ""}
                      onClick={event => startNavigation(event, href)}
                    >
                      <span>{icon}</span><b>{label}</b>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="side-bottom">
          <img src="/assets/crab-logo.jpg" alt="" />
          <b>함께하면 더 즐겁다!</b>
          <small>© 2026 바위게마을</small>
        </div>
      </aside>
    </>
  );
}
