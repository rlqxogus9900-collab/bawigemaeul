import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="HALL OF FAME" title="명예의 전당" description="대회 우승팀과 우승 클랜원을 기록합니다." icon="🏆" admin={false} />;
}
