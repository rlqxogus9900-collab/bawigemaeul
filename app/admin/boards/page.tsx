import FeaturePage from "@/app/components/FeaturePage";
import { requireStaff } from "@/lib/session";

export default async function Page() {
  await requireStaff();
  return <FeaturePage eyebrow="STAFF ONLY" title="게시판 관리" description="게시판 생성·삭제와 고정글 설정을 관리합니다." icon="🗂" admin={true} />;
}
