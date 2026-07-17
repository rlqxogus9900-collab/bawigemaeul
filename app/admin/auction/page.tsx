import { requireStaff } from "@/lib/session";
import AuctionManagerClient from "./AuctionManagerClient";
import AuctionLiveClient from "@/app/auction/AuctionLiveClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireStaff();

  return (
    <>
      <section className="feature-page-hero">
        <span>STAFF ONLY</span>
        <h1>경매 관리</h1>
        <p>경매방 생성부터 선수 지명, 낙찰, 유찰, 종료까지 이곳에서 진행합니다.</p>
      </section>
      <AuctionManagerClient />
      <section className="auction-admin-control-title">
        <span>LIVE CONTROL</span>
        <h2>경매 진행 콘솔</h2>
      </section>
      <AuctionLiveClient
        currentUserId={user.id}
        currentNickname={user.nickname}
        isStaff
      />
    </>
  );
}
