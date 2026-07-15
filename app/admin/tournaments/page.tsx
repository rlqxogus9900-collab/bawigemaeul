import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="대회·내전 기록" description="대회 결과와 우승팀을 관리합니다." icon="🏆" admin={true} />;
}
