import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="정기내전 상세 기록" description="세트 결과와 선수별 경기 기록을 관리합니다." icon="📝" admin={true} />;
}
