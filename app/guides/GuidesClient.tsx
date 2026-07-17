"use client";

import { useEffect, useMemo, useState } from "react";

type Guide = {
  id: string;
  champion: string;
  role: "탑" | "정글" | "미드" | "원딜" | "서폿";
  patch: string;
  difficulty: "입문" | "보통" | "숙련";
  title: string;
  summary: string;
  author: string;
  recommended: boolean;
  views: number;
  likes: number;
  spells: string[];
  runes: string[];
  coreItems: string[];
  situationalItems: string[];
  skillOrder: string;
  tips: string[];
};

const guides: Guide[] = [
  {
    id: "kaisa-adc",
    champion: "카이사",
    role: "원딜",
    patch: "26.14",
    difficulty: "보통",
    title: "안정적인 크라켄 카이사",
    summary: "라인전 안정성과 중후반 캐리력을 모두 챙기는 대중적인 카이사 공략입니다.",
    author: "바위게 운영진",
    recommended: true,
    views: 1248,
    likes: 87,
    spells: ["점멸", "회복"],
    runes: ["치명적 속도", "침착", "전설: 민첩함", "최후의 일격", "마법의 신발", "비스킷 배달"],
    coreItems: ["크라켄 학살자", "구인수의 격노검", "내셔의 이빨"],
    situationalItems: ["존야의 모래시계", "수호 천사", "도미닉 경의 인사"],
    skillOrder: "Q → E → W 선마",
    tips: ["Q가 한 대상에게 최대한 많이 적중하도록 미니언 수를 정리하세요.", "궁극기는 진입기보다 생존과 거리 조절 용도로 먼저 생각하세요.", "진화 타이밍 직전에는 무리한 교전보다 귀환 아이템 구성을 우선하세요."]
  },
  {
    id: "ahri-mid",
    champion: "아리",
    role: "미드",
    patch: "26.14",
    difficulty: "입문",
    title: "로밍 중심 만년서리 아리",
    summary: "안전한 라인전 이후 빠른 합류로 사이드와 오브젝트를 풀어가는 공략입니다.",
    author: "바위게 운영진",
    recommended: true,
    views: 932,
    likes: 65,
    spells: ["점멸", "점화"],
    runes: ["감전", "피의 맛", "사냥의 증표", "궁극의 사냥꾼", "마나순환 팔찌", "깨달음"],
    coreItems: ["루덴의 동반자", "그림자불꽃", "라바돈의 죽음모자"],
    situationalItems: ["존야의 모래시계", "밴시의 장막", "공허의 지팡이"],
    skillOrder: "Q → W → E 선마",
    tips: ["매혹을 먼저 쓰기보다 궁극기로 각을 좁힌 뒤 사용하면 적중률이 높습니다.", "6레벨 이후 라인을 빠르게 밀고 정글과 함께 움직이세요.", "궁극기 한 번은 반드시 도주용으로 남겨두는 습관이 좋습니다."]
  },
  {
    id: "vi-jungle",
    champion: "바이",
    role: "정글",
    patch: "26.14",
    difficulty: "입문",
    title: "확정 이니시 바이 정글",
    summary: "복잡한 판단 없이 핵심 딜러를 묶고 한타를 시작하기 좋은 정글 공략입니다.",
    author: "내전 연구소",
    recommended: false,
    views: 771,
    likes: 49,
    spells: ["점멸", "강타"],
    runes: ["정복자", "승전보", "전설: 민첩함", "최후의 저항", "돌발 일격", "보물 사냥꾼"],
    coreItems: ["월식", "칠흑의 양날 도끼", "스테락의 도전"],
    situationalItems: ["수호 천사", "죽음의 무도", "가시 갑옷"],
    skillOrder: "Q → E → W 선마",
    tips: ["Q를 끝까지 충전하기보다 시야 밖에서 짧게 사용해 적중시키는 것이 안전합니다.", "궁극기 사용 전 아군이 따라올 수 있는 거리인지 확인하세요.", "초반에는 풀캠프보다 라인 상태가 좋은 곳을 빠르게 찌르는 운영이 강합니다."]
  },
  {
    id: "ornn-top",
    champion: "오른",
    role: "탑",
    patch: "26.14",
    difficulty: "보통",
    title: "한타를 여는 오른",
    summary: "라인 유지력과 후반 아이템 강화로 팀 전체의 체급을 높이는 탑 공략입니다.",
    author: "내전 연구소",
    recommended: false,
    views: 604,
    likes: 44,
    spells: ["점멸", "텔레포트"],
    runes: ["착취의 손아귀", "철거", "사전 준비", "과잉성장", "비스킷 배달", "쾌속 접근"],
    coreItems: ["태양불꽃 방패", "해신 작쇼", "가시 갑옷"],
    situationalItems: ["대자연의 힘", "란두인의 예언", "강철의 솔라리 펜던트"],
    skillOrder: "W → Q → E 선마",
    tips: ["Q 기둥이 생기는 시간을 계산해 E 연계를 준비하세요.", "궁극기 2타는 이동 불가 상태에서도 끊길 수 있으니 상대 CC를 확인하세요.", "13레벨 이후 아군 핵심 딜러의 아이템을 우선 강화하세요."]
  },
  {
    id: "nautilus-support",
    champion: "노틸러스",
    role: "서폿",
    patch: "26.14",
    difficulty: "입문",
    title: "확실한 선공권 노틸러스",
    summary: "그랩과 확정 궁극기로 내전에서 쉽게 교전을 열 수 있는 서포터 공략입니다.",
    author: "바위게 운영진",
    recommended: true,
    views: 855,
    likes: 72,
    spells: ["점멸", "점화"],
    runes: ["여진", "보호막 강타", "뼈 방패", "불굴의 의지", "마공점", "쾌속 접근"],
    coreItems: ["천상의 이의", "강철의 솔라리 펜던트", "기사의 맹세"],
    situationalItems: ["지크의 융합", "가시 갑옷", "미카엘의 축복"],
    skillOrder: "Q → W → E 선마",
    tips: ["벽에 닻을 맞히면 이동기로도 활용할 수 있습니다.", "그랩이 빗나가도 평타 속박으로 먼저 진입할 수 있습니다.", "궁극기는 가장 뒤의 딜러를 지정해 이동 경로의 적까지 띄우는 각을 보세요."]
  },
  {
    id: "jinx-adc",
    champion: "징크스",
    role: "원딜",
    patch: "26.14",
    difficulty: "입문",
    title: "한타 리셋형 징크스",
    summary: "안전하게 성장한 뒤 한 번의 처치 관여로 한타를 휩쓰는 원딜 공략입니다.",
    author: "내전 연구소",
    recommended: false,
    views: 719,
    likes: 52,
    spells: ["점멸", "방어막"],
    runes: ["치명적 속도", "침착", "전설: 민첩함", "최후의 일격", "마법의 신발", "비스킷 배달"],
    coreItems: ["크라켄 학살자", "루난의 허리케인", "무한의 대검"],
    situationalItems: ["도미닉 경의 인사", "수호 천사", "피바라기"],
    skillOrder: "Q → W → E 선마",
    tips: ["대포 모드는 사거리와 광역 피해가 필요할 때만 사용해 마나를 관리하세요.", "한타 시작 전에는 최대 사거리에서 포킹하며 패시브 발동을 기다리세요.", "궁극기는 마무리뿐 아니라 반대편 오브젝트 확인에도 활용할 수 있습니다."]
  }
];

const roles = ["전체", "탑", "정글", "미드", "원딜", "서폿"] as const;

export default function GuidesClient() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("전체");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [selected, setSelected] = useState<Guide | null>(guides[0]);
  const [liked, setLiked] = useState<string[]>([]);

  useEffect(() => {
    try {
      setLiked(JSON.parse(localStorage.getItem("bawi-guide-likes") || "[]"));
    } catch {
      setLiked([]);
    }
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return guides.filter(guide => {
      const roleOk = role === "전체" || guide.role === role;
      const recommendedOk = !recommendedOnly || guide.recommended;
      const text = `${guide.champion} ${guide.title} ${guide.summary} ${guide.author}`.toLowerCase();
      return roleOk && recommendedOk && (!keyword || text.includes(keyword));
    });
  }, [query, role, recommendedOnly]);

  const toggleLike = (id: string) => {
    const next = liked.includes(id) ? liked.filter(item => item !== id) : [...liked, id];
    setLiked(next);
    localStorage.setItem("bawi-guide-likes", JSON.stringify(next));
  };

  return (
    <div className="guides-shell">
      <section className="guides-hero">
        <div>
          <span>CHAMPION GUIDES</span>
          <h1>챔피언 공략</h1>
          <p>내전에서 바로 사용할 수 있는 룬, 아이템, 스킬 순서와 핵심 팁을 확인하세요.</p>
        </div>
        <div className="guides-hero-badge"><b>{guides.length}</b><small>등록 공략</small></div>
      </section>

      <section className="card guides-toolbar">
        <div className="guides-role-tabs">
          {roles.map(item => <button key={item} type="button" className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}
        </div>
        <div className="guides-search-row">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="챔피언·공략 제목 검색" />
          <button type="button" className={recommendedOnly ? "active" : ""} onClick={() => setRecommendedOnly(value => !value)}>★ 운영진 추천</button>
        </div>
      </section>

      <section className="guides-layout">
        <div className="guides-list">
          <div className="guides-section-head"><div><span>GUIDE LIST</span><h2>공략 목록</h2></div><small>{filtered.length}개 표시</small></div>
          <div className="guides-card-grid">
            {filtered.map(guide => {
              const isLiked = liked.includes(guide.id);
              return (
                <article key={guide.id} className={`card guide-card ${selected?.id === guide.id ? "selected" : ""}`}>
                  <button className="guide-card-main" type="button" onClick={() => setSelected(guide)}>
                    <div className="guide-champion-mark">{guide.champion.slice(0, 1)}</div>
                    <div className="guide-card-copy">
                      <div className="guide-card-tags"><span>{guide.role}</span><span>패치 {guide.patch}</span>{guide.recommended && <b>운영진 추천</b>}</div>
                      <h3>{guide.champion} · {guide.title}</h3>
                      <p>{guide.summary}</p>
                      <small>{guide.author} · 난이도 {guide.difficulty}</small>
                    </div>
                  </button>
                  <div className="guide-card-stats"><span>👁 {guide.views.toLocaleString("ko-KR")}</span><button type="button" className={isLiked ? "liked" : ""} onClick={() => toggleLike(guide.id)}>♥ {guide.likes + (isLiked ? 1 : 0)}</button></div>
                </article>
              );
            })}
            {!filtered.length && <div className="card guides-empty">조건에 맞는 공략이 없습니다.</div>}
          </div>
        </div>

        <aside className="card guide-detail-card">
          {selected ? (
            <>
              <div className="guide-detail-head">
                <div className="guide-detail-mark">{selected.champion.slice(0, 1)}</div>
                <div><span>{selected.role} · PATCH {selected.patch}</span><h2>{selected.champion}</h2><p>{selected.title}</p></div>
              </div>
              <div className="guide-detail-block"><b>소환사 주문</b><div className="guide-pill-row">{selected.spells.map(item => <span key={item}>{item}</span>)}</div></div>
              <div className="guide-detail-block"><b>핵심 룬</b><div className="guide-pill-row">{selected.runes.map(item => <span key={item}>{item}</span>)}</div></div>
              <div className="guide-detail-block"><b>핵심 아이템</b><ol>{selected.coreItems.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></div>
              <div className="guide-detail-block"><b>상황별 아이템</b><div className="guide-pill-row muted">{selected.situationalItems.map(item => <span key={item}>{item}</span>)}</div></div>
              <div className="guide-skill-order"><span>스킬 순서</span><strong>{selected.skillOrder}</strong></div>
              <div className="guide-detail-block"><b>플레이 핵심</b><ul>{selected.tips.map(item => <li key={item}>{item}</li>)}</ul></div>
              <button type="button" className={`button guide-like-button ${liked.includes(selected.id) ? "liked" : ""}`} onClick={() => toggleLike(selected.id)}>{liked.includes(selected.id) ? "♥ 추천 취소" : "♡ 이 공략 추천"}</button>
            </>
          ) : <div className="guides-empty">왼쪽에서 공략을 선택하세요.</div>}
        </aside>
      </section>

      <section className="card guides-notice">
        <span>RIOT API READY</span>
        <div><h2>자동 추천 빌드 연동 준비</h2><p>현재는 운영진 검수 공략을 제공하며, Riot API 연결 후 패치별 챔피언 데이터와 추천 빌드를 자동 갱신할 예정입니다.</p></div>
      </section>
    </div>
  );
}
