import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="NORMAL MATCH" title="일반 내전" description="참가자 10명을 기준으로 팀을 구성하고 내전을 관리합니다." icon="⚔" admin={false} />;
}
