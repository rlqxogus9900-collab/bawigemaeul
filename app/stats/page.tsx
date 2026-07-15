import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="REGULAR MATCH" title="정기내전 통계" description="승률, KDA, 라인별 KDA, 모스트 챔피언과 평균 경매가를 확인합니다." icon="▥" admin={false} />;
}
