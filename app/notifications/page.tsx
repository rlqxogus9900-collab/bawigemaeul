import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const icons: Record<string, string> = {
  notice: "📢",
  poll: "🗳",
  comment: "💬",
  system: "🔔"
};

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { data: notifications } = await getSupabaseAdmin()
    .from("notifications")
    .select("id,type,title,message,link,is_read,created_at")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <section className="notification-page-hero">
        <div>
          <span>NOTIFICATIONS</span>
          <h1>전체 알림</h1>
          <p>최근 알림을 최대 100개까지 확인합니다.</p>
        </div>

        <form action="/api/notifications/read-all" method="post">
          <input type="hidden" name="redirect" value="/notifications" />
          <button className="button" type="submit">전체 읽음</button>
        </form>
      </section>

      <section className="card notification-page-list">
        {(notifications || []).map(item => (
          <article className={item.is_read ? "read" : "unread"} key={item.id}>
            <i>{icons[item.type] || "🔔"}</i>
            <div>
              <div className="notification-page-title">
                <b>{item.title}</b>
                {!item.is_read && <span>NEW</span>}
              </div>
              {item.message && <p>{item.message}</p>}
              <time>
                {new Date(item.created_at).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                  hour12: false
                })}
              </time>
            </div>
            {item.link ? (
              <form action={`/api/notifications/${item.id}/open`} method="post">
                <input type="hidden" name="link" value={item.link} />
                <button type="submit">보기 →</button>
              </form>
            ) : (
              <form action={`/api/notifications/${item.id}/read`} method="post">
                <input type="hidden" name="redirect" value="/notifications" />
                <button type="submit">읽음</button>
              </form>
            )}
          </article>
        ))}

        {!notifications?.length && (
          <div className="notification-page-empty">
            <span>🔔</span>
            <b>아직 받은 알림이 없습니다.</b>
          </div>
        )}
      </section>

      <div className="notification-page-back">
        <Link href="/">홈으로 돌아가기</Link>
      </div>
    </>
  );
}
