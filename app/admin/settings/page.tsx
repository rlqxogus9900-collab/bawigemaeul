import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="관리자 설정" description="활동 판정 기간과 홈페이지 운영 설정을 관리합니다." icon="⚙" admin={true} />;
}
