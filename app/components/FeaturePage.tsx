import Link from "next/link";

export default function FeaturePage({
  eyebrow, title, description, icon, admin = false
}: {
  eyebrow: string; title: string; description: string; icon: string; admin?: boolean;
}) {
  return (
    <section className="feature-page">
      <div className="feature-title">
        <div className="feature-icon">{icon}</div>
        <div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      </div>
      <div className="feature-empty">
        <b>{admin ? "온라인 관리 기능 이식 준비 완료" : "V6.2.8 기능 이식 준비 완료"}</b>
        <p>기존 오프라인 프로그램의 기능과 흐름을 유지하면서 Supabase DB 기반으로 연결합니다.</p>
        <Link className="card-button" href="/">홈으로 돌아가기</Link>
      </div>
    </section>
  );
}
