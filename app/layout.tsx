import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/session";
export const metadata={title:"바위게마을 Online Beta",description:"리그 오브 레전드 클랜 운영 플랫폼"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const user=await getSession();
 return <html lang="ko"><body><div className="shell"><aside className="sidebar"><div className="brand">🦀 바위게마을</div><nav className="nav">
 <Link href="/">홈</Link><Link href="/notices">클랜 공지</Link><Link href="/rules">클랜 규칙</Link>
 {user?.role==="staff"&&<div className="nav-title">운영진 메뉴</div>}
 {user?.role==="staff"&&<Link href="/admin/notices">공지 관리</Link>}
 {user?.role==="staff"&&<Link href="/admin/rules">규칙 관리</Link>}
 {user?.role==="staff"&&<Link href="/admin/members">클랜원 관리</Link>}
 {user?.role==="staff"&&<Link href="/admin/activity">활동 관리</Link>}
 </nav></aside><main className="main"><header className="topbar"><b>바위게마을 Online Beta 1.2.1</b><div className="actions">{user?<><span className="muted">{user.nickname} / {user.role==="staff"?"운영진":"클랜원"}</span><form action="/api/auth/logout" method="post"><button className="button">로그아웃</button></form></>:<><Link className="button" href="/setup">최초 운영진 설정</Link><Link className="button primary" href="/login">로그인</Link></>}</div></header>{children}</main></div></body></html>
}
