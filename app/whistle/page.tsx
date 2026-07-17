import FeaturePage from "@/app/components/FeaturePage";

export default async function Page() {
  return <FeaturePage eyebrow="ANONYMOUS REPORT" title="바위게 신문고" description="클랜원은 익명으로 작성하고 운영진만 작성자를 확인합니다." icon="📮" admin={false} />;
}
