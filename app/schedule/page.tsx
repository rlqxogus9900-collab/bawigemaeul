import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="SCHEDULE" title="일정" description="정기내전과 대회 일정을 확인합니다." icon="📅" admin={false} />;
}
