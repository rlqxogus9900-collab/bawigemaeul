import { getSession } from "@/lib/session";
import AuctionLiveClient from "./AuctionLiveClient";

export const dynamic = "force-dynamic";

export default async function AuctionPage() {
  const user = await getSession();
  return (
    <>
      <section className="auction-link-hero">
        <div><span>LIVE AUCTION</span><h1>실시간 경매</h1><p>정기내전 투표 참가자와 팀장을 자동으로 불러와 실시간으로 진행합니다.</p></div>
      </section>
      <AuctionLiveClient isStaff={user?.role === "staff"} />
    </>
  );
}
