import Link from "next/link";
import { getSession } from "@/lib/session";
import AuctionLiveClient from "./AuctionLiveClient";

export const dynamic = "force-dynamic";

export default async function AuctionPage() {
  const user = await getSession();

  return (
    <>
      <section className="auction-link-hero">
        <div>
          <span>LIVE AUCTION</span>
          <h1>실시간 경매</h1>
          <p>운영진이 경매를 진행하고 지정된 팀장은 자기 팀으로 직접 입찰할 수 있습니다.</p>
        </div>
        <Link className="button secondary" href="/auction/broadcast" target="_blank">
          방송 화면 열기
        </Link>
      </section>

      <AuctionLiveClient
        currentUserId={user?.id || null}
        currentNickname={user?.nickname || null}
        isStaff={user?.role === "staff"}
      />
    </>
  );
}
