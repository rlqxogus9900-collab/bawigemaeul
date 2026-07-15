import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/session";
import SiteNavigation from "@/app/components/SiteNavigation";

export const metadata = {
  title: "바위게마을",
  description: "리그 오브 레전드 클랜 운영 플랫폼"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  return (
    <html lang="ko">
      <body>
        <SiteNavigation user={user ? { nickname: user.nickname, role: user.role } : null} />
        <div className="online-shell">
          <header className="topbar">
            <div className="topbar-title"><b>바위게마을</b><small>바위게마을 공식 클랜 페이지</small></div>
            <div className="topbar-account">
              {user ? (
                <>
                  <span className={`account-pill ${user.role}`}>{user.nickname} / {user.role === "staff" ? "운영진" : "클랜원"}</span>
                  <Link className="top-button" href="/change-password">비밀번호 변경</Link>
                  <form action="/api/auth/logout" method="post"><button className="top-button outline">로그아웃</button></form>
                </>
              ) : <Link className="top-button gold" href="/login">클랜원 로그인</Link>}
            </div>
          </header>
          <main className="main-content">{children}</main>
          <footer className="site-footer">
            <div><b>BAWIGEMAEUL</b><span>Since 2026</span></div>
            <small>Created for 바위게마을 · Online Beta 1.3.4</small>
          </footer>
        </div>
      </body>
    </html>
  );
}
