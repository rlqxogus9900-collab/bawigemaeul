import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="CLAN ROSTER" title="내전 참고 명단" description="내전 참가자와 티어·라인 정보를 확인합니다." icon="☷" admin={false} />;
}
