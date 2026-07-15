import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="COMMUNITY" title="게시판" description="운영진이 만든 자유·질문 게시판을 이용합니다." icon="💬" admin={false} />;
}
