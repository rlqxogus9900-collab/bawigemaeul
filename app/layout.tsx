import SponsorNickname from "@/app/components/SponsorNickname";
import "./globals.css";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getCachedBoardMenu } from "@/lib/board-menu";
import SiteNavigation from "@/app/components/SiteNavigation";
import NotificationCenter from "@/app/components/NotificationCenter";
import { SITE_VERSION } from "@/lib/site-version";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata = {
  title: "바위게마을",
  description: "리그 오브 레전드 클랜 운영 플랫폼"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, rawBoardCategories, requestHeaders] = await Promise.all([
    getSession(),
    getCachedBoardMenu(),
    headers()
  ]);

  const pathname = requestHeaders.get("x-bawi-pathname") || "/";
  const publicPage = pathname === "/login" || pathname === "/signup";
  if (!publicPage && !user) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  // 운영진이 비밀번호를 초기화한 계정은 기존 로그인 세션이 남아 있어도
  // 다음 요청부터 반드시 새 비밀번호 설정 화면으로 보냅니다.
  if (user?.must_change_password && pathname !== "/change-password" && pathname !== "/api/auth/change-password" && pathname !== "/api/auth/logout") {
    redirect("/change-password");
  }

  const canSee = (accessLevel: string | null) =>
    accessLevel !== "staff" || user?.role === "staff";

  const communityNames = new Set(["자유게시판", "질문게시판", "공략게시판", "밸런스게임"]);
  const boardCategories = rawBoardCategories
    .filter(category => category.is_visible !== false && canSee(category.access_level))
    .map(category => {
      const visible = [...(category.board_subcategories || [])]
        .filter(sub => sub.is_visible !== false && canSee(sub.access_level))
        .sort((a, b) => a.sort_order - b.sort_order);
      const community = visible.filter(sub => communityNames.has(sub.name));
      const rest = visible.filter(sub => !communityNames.has(sub.name));
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        sort_order: category.sort_order,
        subcategories: [
          ...(community.length ? [{ id: "community", name: "커뮤니티" }] : []),
          ...rest.map(sub => ({ id: sub.id, name: sub.name }))
        ]
      };
    })
    .filter(category => category.subcategories.length > 0);

  const eventSubcategory = rawBoardCategories
    .flatMap(category => category.board_subcategories || [])
    .find(subcategory => subcategory.is_visible !== false && /이벤트/.test(subcategory.name));
  const eventHref = eventSubcategory ? `/boards?board=${eventSubcategory.id}` : "/boards";

  return (
    <html lang="ko">
      <body>
        <SiteNavigation
          user={user ? { nickname: user.nickname, role: user.role } : null}
          boardCategories={boardCategories}
          eventHref={eventHref}
        />

        <div className="online-shell">
          <header className="topbar">
            <div className="topbar-title">
              <b>바위게마을</b>
              <small>바위게마을 공식 클랜 페이지</small>
            </div>

            <div className="topbar-account">
              {user ? (
                <>
                  <NotificationCenter />
                  <span className={`account-pill ${user.role}`}>
                    <SponsorNickname nickname={user.nickname} /> / {user.role === "staff" ? "운영진" : "클랜원"}
                  </span>
                  <Link className="top-button" href="/change-password" prefetch>
                    비밀번호 변경
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="top-button outline">로그아웃</button>
                  </form>
                </>
              ) : (
                <Link className="top-button gold" href="/login" prefetch>
                  클랜원 로그인
                </Link>
              )}
            </div>
          </header>

          <main className="main-content">{children}</main>

          <footer className="site-footer">
            <div><b>BAWIGEMAEUL</b><span>Since 2026</span></div>
            <small>Created for 바위게마을 · Online Beta {SITE_VERSION}</small>
          </footer>
        </div>
      </body>
    </html>
  );
}
