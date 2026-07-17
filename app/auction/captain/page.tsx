import { getSession } from "@/lib/session";
import CaptainAuctionClient from "./CaptainAuctionClient";

export const dynamic = "force-dynamic";

export default async function CaptainAuctionPage() {
  const user = await getSession();

  return (
    <>
      <section className="feature-page-hero">
        <span>CAPTAIN ONLY</span>
        <h1>실시간 경매 팀장 전용</h1>
        <p>지정된 팀장은 자기 팀으로만 입찰할 수 있습니다.</p>
      </section>
      <CaptainAuctionClient
        currentUserId={user?.id || null}
        currentNickname={user?.nickname || null}
        isStaff={user?.role === "staff"}
      />
    </>
  );
}
