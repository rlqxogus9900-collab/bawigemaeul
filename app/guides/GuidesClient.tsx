"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Role = "탑" | "정글" | "미드" | "원딜" | "서폿";
type ChampionBuild = {
  id: string;
  champion: string;
  englishName: string;
  role: Role;
  tier: string;
  patch: string;
  spells: string[];
  runes: string[];
  startItems: string[];
  coreItems: string[];
  boots: string;
  situationalItems: string[];
  skillOrder: string;
  combo: string;
  tips: string[];
};

const PATCH = "26.14";
const DDRAGON = "https://ddragon.leagueoflegends.com/cdn/16.14.1/img/champion";

const builds: ChampionBuild[] = [
  { id:"aatrox", champion:"아트록스", englishName:"Aatrox", role:"탑", tier:"대중픽", patch:PATCH, spells:["점멸","텔레포트"], runes:["정복자","승전보","전설: 가속","최후의 저항","재생의 바람","소생"], startItems:["도란의 방패","체력 물약"], coreItems:["월식","갈라진 하늘","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["스테락의 도전","수호 천사","정령의 형상"], skillOrder:"Q → E → W", combo:"W → Q1 → E+Q2 → 평타 → Q3", tips:["Q 끝자락을 맞히는 것이 핵심입니다.","궁극기는 교전 시작 직전에 사용하세요.","상대 조합에 따라 방어 신발을 빠르게 올리세요."] },
  { id:"darius", champion:"다리우스", englishName:"Darius", role:"탑", tier:"대중픽", patch:PATCH, spells:["점멸","유체화"], runes:["정복자","승전보","전설: 민첩함","최후의 저항","뼈 방패","불굴의 의지"], startItems:["도란의 방패","체력 물약"], coreItems:["삼위일체","스테락의 도전","망자의 갑옷"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["대자연의 힘","가시 갑옷","죽음의 무도"], skillOrder:"Q → E → W", combo:"E → 평타 → W → Q → 평타 → R", tips:["5스택 전에는 궁극기를 아끼세요.","Q 바깥날 적중으로 체력을 회복하세요.","유체화로 한타 진입 거리를 확보하세요."] },
  { id:"leesin", champion:"리 신", englishName:"LeeSin", role:"정글", tier:"인기 1티어", patch:PATCH, spells:["점멸","강타"], runes:["정복자","승전보","전설: 민첩함","최후의 저항","돌발 일격","보물 사냥꾼"], startItems:["새끼 화염발톱","체력 물약"], coreItems:["월식","칠흑의 양날 도끼","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","맬모셔스의 아귀","스테락의 도전"], skillOrder:"Q → W → E", combo:"Q → Q → 와드 W → R", tips:["초반 갱킹과 카정으로 주도권을 잡으세요.","Q 2타는 잃은 체력 비례 피해입니다.","한타에서는 무리한 인섹보다 아군 딜러 보호도 좋습니다."] },
  { id:"vi", champion:"바이", englishName:"Vi", role:"정글", tier:"입문 추천", patch:PATCH, spells:["점멸","강타"], runes:["집중 공격","승전보","전설: 민첩함","최후의 일격","돌발 일격","보물 사냥꾼"], startItems:["새끼 화염발톱","체력 물약"], coreItems:["월식","칠흑의 양날 도끼","스테락의 도전"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","죽음의 무도","가시 갑옷"], skillOrder:"Q → E → W", combo:"Q → 평타 → E → R → 평타 → E", tips:["궁극기로 핵심 딜러를 확정적으로 묶으세요.","Q는 시야 밖에서 충전하면 적중률이 높습니다.","아군이 따라올 수 있는 거리인지 먼저 확인하세요."] },
  { id:"ahri", champion:"아리", englishName:"Ahri", role:"미드", tier:"인기 1티어", patch:PATCH, spells:["점멸","점화"], runes:["감전","피의 맛","사냥의 증표","궁극의 사냥꾼","마나순환 팔찌","깨달음"], startItems:["도란의 반지","체력 물약"], coreItems:["루덴의 동반자","그림자불꽃","라바돈의 죽음모자"], boots:"마법사의 신발", situationalItems:["존야의 모래시계","밴시의 장막","공허의 지팡이"], skillOrder:"Q → W → E", combo:"R → E → Q → W → R", tips:["궁극기로 매혹 각을 좁히세요.","6레벨 이후 라인을 밀고 로밍하세요.","궁극기 한 번은 도주용으로 남기세요."] },
  { id:"syndra", champion:"신드라", englishName:"Syndra", role:"미드", tier:"대중픽", patch:PATCH, spells:["점멸","텔레포트"], runes:["선제공격","마법의 신발","비스킷 배달","우주적 통찰력","마나순환 팔찌","깨달음"], startItems:["도란의 반지","체력 물약"], coreItems:["루덴의 동반자","그림자불꽃","라바돈의 죽음모자"], boots:"마법사의 신발", situationalItems:["존야의 모래시계","공허의 지팡이","밴시의 장막"], skillOrder:"Q → W → E", combo:"Q → E → W → Q → R", tips:["Q 구체를 미리 깔고 E로 기절시키세요.","패시브 스택을 안정적으로 쌓으세요.","궁극기 전 구체 개수가 많을수록 강합니다."] },
  { id:"kaisa", champion:"카이사", englishName:"Kaisa", role:"원딜", tier:"인기 1티어", patch:PATCH, spells:["점멸","회복"], runes:["치명적 속도","침착","전설: 민첩함","최후의 일격","마법의 신발","비스킷 배달"], startItems:["도란의 검","체력 물약"], coreItems:["크라켄 학살자","구인수의 격노검","내셔의 이빨"], boots:"광전사의 군화", situationalItems:["존야의 모래시계","수호 천사","도미닉 경의 인사"], skillOrder:"Q → E → W", combo:"평타 → Q → W → R → E", tips:["고립 Q를 맞히도록 미니언을 정리하세요.","궁극기는 생존과 거리 조절에 우선 사용하세요.","진화 타이밍을 기준으로 귀환 아이템을 맞추세요."] },
  { id:"jinx", champion:"징크스", englishName:"Jinx", role:"원딜", tier:"입문 추천", patch:PATCH, spells:["점멸","방어막"], runes:["치명적 속도","침착","전설: 민첩함","최후의 일격","마법의 신발","비스킷 배달"], startItems:["도란의 검","체력 물약"], coreItems:["크라켄 학살자","루난의 허리케인","무한의 대검"], boots:"광전사의 군화", situationalItems:["도미닉 경의 인사","피바라기","수호 천사"], skillOrder:"Q → W → E", combo:"W → E → 대포 평타 → R", tips:["처치 관여 후 패시브로 한타를 이어가세요.","대포 모드는 필요한 순간에만 사용하세요.","최대 사거리를 유지하며 앞라인부터 공격하세요."] },
  { id:"ezreal", champion:"이즈리얼", englishName:"Ezreal", role:"원딜", tier:"대중픽", patch:PATCH, spells:["점멸","방어막"], runes:["집중 공격","침착","전설: 가속","최후의 일격","마나순환 팔찌","깨달음"], startItems:["도란의 검","체력 물약"], coreItems:["삼위일체","무라마나","쇼진의 창"], boots:"명석함의 아이오니아 장화", situationalItems:["세릴다의 원한","얼어붙은 심장","맬모셔스의 아귀"], skillOrder:"Q → E → W", combo:"W → E → 평타 → Q", tips:["Q 적중으로 스킬 재사용 시간을 줄이세요.","비전 이동은 공격보다 생존용으로 아끼세요.","평타를 섞어야 딜 손실이 적습니다."] },
  { id:"nautilus", champion:"노틸러스", englishName:"Nautilus", role:"서폿", tier:"입문 추천", patch:PATCH, spells:["점멸","점화"], runes:["여진","보호막 강타","뼈 방패","불굴의 의지","마공점","쾌속 접근"], startItems:["세계 지도집","체력 물약"], coreItems:["천상의 이의","강철의 솔라리 펜던트","기사의 맹세"], boots:"기동력의 장화 / 판금 장화", situationalItems:["지크의 융합","가시 갑옷","미카엘의 축복"], skillOrder:"Q → W → E", combo:"Q → 평타 → W → E → R", tips:["그랩이 없어도 평타 속박으로 시작할 수 있습니다.","궁극기는 뒤쪽 딜러에게 사용하세요.","벽 그랩으로 이동할 수 있습니다."] },
  { id:"thresh", champion:"쓰레쉬", englishName:"Thresh", role:"서폿", tier:"대중픽", patch:PATCH, spells:["점멸","점화"], runes:["여진","생명의 샘","뼈 방패","불굴의 의지","비스킷 배달","우주적 통찰력"], startItems:["세계 지도집","체력 물약"], coreItems:["천상의 이의","강철의 솔라리 펜던트","기사의 맹세"], boots:"기동력의 장화", situationalItems:["구원","미카엘의 축복","지크의 융합"], skillOrder:"Q → E → W", combo:"E → Q → Q → R", tips:["E로 밀거나 당긴 뒤 Q를 맞히세요.","랜턴을 아군 이동 경로에 미리 놓으세요.","무리한 진입보다 시야 장악이 우선입니다."] }
];

const roles = ["전체", "탑", "정글", "미드", "원딜", "서폿"] as const;

export default function GuidesClient() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("전체");
  const [selected, setSelected] = useState<ChampionBuild>(builds[0]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return builds.filter(build => (role === "전체" || build.role === role) && (!keyword || `${build.champion} ${build.englishName}`.toLowerCase().includes(keyword)));
  }, [query, role]);

  return (
    <div className="guides-shell champion-build-shell">
      <section className="guides-hero">
        <div><span>POPULAR BUILDS</span><h1>챔피언 빌드</h1><p>챔피언을 누르면 가장 대중적으로 사용하는 룬·아이템·스킬 빌드를 바로 확인할 수 있습니다.</p></div>
        <div className="guides-hero-badge"><b>{builds.length}</b><small>챔피언</small></div>
      </section>

      <section className="card guides-toolbar">
        <div className="guides-role-tabs">{roles.map(item => <button key={item} type="button" className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
        <div className="guides-search-row"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="챔피언 이름 검색" /></div>
      </section>

      <section className="champion-picker-section">
        <div className="guides-section-head"><div><span>CHAMPION SELECT</span><h2>챔피언 선택</h2></div><small>{filtered.length}명 표시</small></div>
        <div className="champion-portrait-grid">
          {filtered.map(build => (
            <button key={build.id} type="button" className={`champion-portrait-card ${selected.id === build.id ? "selected" : ""}`} onClick={() => setSelected(build)}>
              <div className="champion-image-wrap"><Image src={`${DDRAGON}/${build.englishName}.png`} alt={build.champion} width={96} height={96} unoptimized /></div>
              <strong>{build.champion}</strong><span>{build.role}</span>
            </button>
          ))}
          {!filtered.length && <div className="card guides-empty">조건에 맞는 챔피언이 없습니다.</div>}
        </div>
      </section>

      <section className="card popular-build-detail">
        <header className="popular-build-head">
          <div className="popular-build-champion"><Image src={`${DDRAGON}/${selected.englishName}.png`} alt={selected.champion} width={118} height={118} unoptimized /></div>
          <div><span>{selected.role} · PATCH {selected.patch}</span><h2>{selected.champion}</h2><p><b>{selected.tier}</b> 기준 대중적인 기본 빌드</p></div>
        </header>

        <div className="popular-build-grid">
          <article><h3>소환사 주문</h3><div className="build-chip-row">{selected.spells.map(item => <span key={item}>{item}</span>)}</div></article>
          <article><h3>추천 룬</h3><div className="build-chip-row rune-row">{selected.runes.map((item,index) => <span key={item} className={index===0 ? "primary" : ""}>{item}</span>)}</div></article>
          <article><h3>시작 아이템</h3><div className="build-item-list">{selected.startItems.map(item => <span key={item}>{item}</span>)}</div></article>
          <article><h3>핵심 아이템 순서</h3><ol className="build-core-list">{selected.coreItems.map((item,index) => <li key={item}><b>{index+1}</b><span>{item}</span>{index < selected.coreItems.length-1 && <em>›</em>}</li>)}</ol></article>
          <article><h3>신발</h3><div className="build-single-value">{selected.boots}</div></article>
          <article><h3>상황별 아이템</h3><div className="build-chip-row muted">{selected.situationalItems.map(item => <span key={item}>{item}</span>)}</div></article>
        </div>

        <div className="popular-build-bottom">
          <div className="guide-skill-order"><span>스킬 선마</span><strong>{selected.skillOrder}</strong></div>
          <div className="guide-skill-order combo"><span>기본 콤보</span><strong>{selected.combo}</strong></div>
        </div>
        <div className="guide-detail-block build-tips"><b>간단 핵심 팁</b><ul>{selected.tips.map(item => <li key={item}>{item}</li>)}</ul></div>
      </section>

      <section className="card guides-notice"><span>POPULAR STANDARD</span><div><h2>복잡한 공략 대신 바로 쓰는 빌드</h2><p>현재는 대표 인기 챔피언의 대중적인 기본 빌드를 제공하며, Riot API 연결 후 전체 챔피언과 패치별 통계를 자동 갱신할 예정입니다.</p></div></section>
    </div>
  );
}
