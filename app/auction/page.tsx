import Link from "next/link";
import SpectatorAuctionClient from "./SpectatorAuctionClient";

export const dynamic = "force-dynamic";

export default function AuctionPage() {
  return (
    <>
      <section className="auction-link-hero">
        <div>
          <span>LIVE AUCTION</span>
          <h1>실시간 경매</h1>
          <p>방송 화면과 같은 구성으로 경매 진행 상황을 실시간으로 관전합니다.</p>
        </div>
        <div className="auction-hero-actions">
          <Link className="button" href="/auction/captain">팀장 전용 입찰</Link>
          <Link className="button secondary" href="/auction/broadcast" target="_blank">방송 화면 열기</Link>
        </div>
      </section>
      <SpectatorAuctionClient />
    </>
  );
}
