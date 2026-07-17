import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="신문고 관리" description="익명 신고 내용을 확인하고 답변합니다." icon="📮" admin={true} />;
}
