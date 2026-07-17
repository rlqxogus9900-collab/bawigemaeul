import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getCachedBoardMenu } from "@/lib/board-menu";
import SiteNavigation from "@/app/components/SiteNavigation";

export const metadata = {
  title: "바위게마을",
  description: "리그 오브 레전드 클랜 운영 플랫폼"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, rawBoardCategories] = await Promise.all([
    getSession(),
    getCachedBoardMenu()
  ]);

  const canSee = (accessLevel: string | null) =>
    accessLevel !== "staff" || user?.role === "staff";

  const boardCategories = rawBoardCategories
    .filter(category => category.is_visible !== false && canSee(category.access_level))
    .map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      sort_order: category.sort_order,
      subcategories: [...(category.board_subcategories || [])]
        .filter(sub => sub.is_visible !== false && canSee(sub.access_level))
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(sub => ({ id: sub.id, name: sub.name }))
    }))
    .filter(category => category.subcategories.length > 0);

  return (
    <html lang="ko">
      <body>
        <SiteNavigation
          user={user ? { nickname: user.nickname, role: user.role } : null}
          boardCategories={boardCategories}
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
                  <span className={`account-pill ${user.role}`}>
                    {user.nickname} / {user.role === "staff" ? "운영진" : "클랜원"}
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
            <small>Created for 바위게마을 · Online Beta 1.3.7.9.1</small>
          </footer>
        </div>
      </body>
    </html>
  );
}
