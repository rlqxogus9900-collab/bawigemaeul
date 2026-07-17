import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="일정 관리" description="정기내전과 대회 일정을 등록하고 수정합니다." icon="📅" admin={true} />;
}
