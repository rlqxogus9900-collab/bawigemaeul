import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="경매 관리" description="경매 설정·선수 명단·낙찰·종료·방송 화면을 관리합니다." icon="🔨" admin={true} />;
}
