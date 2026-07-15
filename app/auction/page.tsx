import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="LIVE AUCTION" title="실시간 경매" description="기존 경매 프로그램을 다중 접속 실시간 방식으로 이식합니다." icon="📡" admin={false} />;
}
