import { requireStaff } from "@/lib/session";
import AuctionManagerClient from "./AuctionManagerClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireStaff();
  return (
    <>
      <section className="feature-page-hero">
        <span>STAFF ONLY</span>
        <h1>경매 관리</h1>
        <p>여기서 경매방을 만들면 실시간 경매와 방송 화면에 바로 표시됩니다.</p>
      </section>
      <AuctionManagerClient />
    </>
  );
}
