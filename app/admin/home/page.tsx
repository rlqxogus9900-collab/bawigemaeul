import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="홈페이지 관리" description="배너와 홈 카드의 제목·설명·버튼을 설정합니다." icon="🏠" admin={true} />;
}
