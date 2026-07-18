"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
  imageName?: string;
};

type DataDragonChampion = {
  id: string;
  name: string;
  tags: string[];
  image: { full: string };
};

const FALLBACK_PATCH = "26.14";
const FALLBACK_DDRAGON_VERSION = "16.14.1";
const DDRAGON_VERSIONS = "https://ddragon.leagueoflegends.com/api/versions.json";

const builds: ChampionBuild[] = [
  { id:"aatrox", champion:"아트록스", englishName:"Aatrox", role:"탑", tier:"대중픽", patch:FALLBACK_PATCH, spells:["점멸","텔레포트"], runes:["정복자","승전보","전설: 가속","최후의 저항","재생의 바람","소생"], startItems:["도란의 방패","체력 물약"], coreItems:["월식","갈라진 하늘","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["스테락의 도전","수호 천사","정령의 형상"], skillOrder:"Q → E → W", combo:"W → Q1 → E+Q2 → 평타 → Q3", tips:["Q 끝자락을 맞히는 것이 핵심입니다.","궁극기는 교전 시작 직전에 사용하세요.","상대 조합에 따라 방어 신발을 빠르게 올리세요."] },
  { id:"darius", champion:"다리우스", englishName:"Darius", role:"탑", tier:"대중픽", patch:FALLBACK_PATCH, spells:["점멸","유체화"], runes:["정복자","승전보","전설: 민첩함","최후의 저항","뼈 방패","불굴의 의지"], startItems:["도란의 방패","체력 물약"], coreItems:["삼위일체","스테락의 도전","망자의 갑옷"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["대자연의 힘","가시 갑옷","죽음의 무도"], skillOrder:"Q → E → W", combo:"E → 평타 → W → Q → 평타 → R", tips:["5스택 전에는 궁극기를 아끼세요.","Q 바깥날 적중으로 체력을 회복하세요.","유체화로 한타 진입 거리를 확보하세요."] },
  { id:"leesin", champion:"리 신", englishName:"LeeSin", role:"정글", tier:"인기 1티어", patch:FALLBACK_PATCH, spells:["점멸","강타"], runes:["정복자","승전보","전설: 민첩함","최후의 저항","돌발 일격","보물 사냥꾼"], startItems:["새끼 화염발톱","체력 물약"], coreItems:["월식","칠흑의 양날 도끼","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","맬모셔스의 아귀","스테락의 도전"], skillOrder:"Q → W → E", combo:"Q → Q → 와드 W → R", tips:["초반 갱킹과 카정으로 주도권을 잡으세요.","Q 2타는 잃은 체력 비례 피해입니다.","한타에서는 무리한 인섹보다 아군 딜러 보호도 좋습니다."] },
  { id:"vi", champion:"바이", englishName:"Vi", role:"정글", tier:"입문 추천", patch:FALLBACK_PATCH, spells:["점멸","강타"], runes:["집중 공격","승전보","전설: 민첩함","최후의 일격","돌발 일격","보물 사냥꾼"], startItems:["새끼 화염발톱","체력 물약"], coreItems:["월식","칠흑의 양날 도끼","스테락의 도전"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","죽음의 무도","가시 갑옷"], skillOrder:"Q → E → W", combo:"Q → 평타 → E → R → 평타 → E", tips:["궁극기로 핵심 딜러를 확정적으로 묶으세요.","Q는 시야 밖에서 충전하면 적중률이 높습니다.","아군이 따라올 수 있는 거리인지 먼저 확인하세요."] },
  { id:"ahri", champion:"아리", englishName:"Ahri", role:"미드", tier:"인기 1티어", patch:FALLBACK_PATCH, spells:["점멸","점화"], runes:["감전","피의 맛","사냥의 증표","궁극의 사냥꾼","마나순환 팔찌","깨달음"], startItems:["도란의 반지","체력 물약"], coreItems:["루덴의 동반자","그림자불꽃","라바돈의 죽음모자"], boots:"마법사의 신발", situationalItems:["존야의 모래시계","밴시의 장막","공허의 지팡이"], skillOrder:"Q → W → E", combo:"R → E → Q → W → R", tips:["궁극기로 매혹 각을 좁히세요.","6레벨 이후 라인을 밀고 로밍하세요.","궁극기 한 번은 도주용으로 남기세요."] },
  { id:"syndra", champion:"신드라", englishName:"Syndra", role:"미드", tier:"대중픽", patch:FALLBACK_PATCH, spells:["점멸","텔레포트"], runes:["선제공격","마법의 신발","비스킷 배달","우주적 통찰력","마나순환 팔찌","깨달음"], startItems:["도란의 반지","체력 물약"], coreItems:["루덴의 동반자","그림자불꽃","라바돈의 죽음모자"], boots:"마법사의 신발", situationalItems:["존야의 모래시계","공허의 지팡이","밴시의 장막"], skillOrder:"Q → W → E", combo:"Q → E → W → Q → R", tips:["Q 구체를 미리 깔고 E로 기절시키세요.","패시브 스택을 안정적으로 쌓으세요.","궁극기 전 구체 개수가 많을수록 강합니다."] },
  { id:"kaisa", champion:"카이사", englishName:"Kaisa", role:"원딜", tier:"인기 1티어", patch:FALLBACK_PATCH, spells:["점멸","회복"], runes:["치명적 속도","침착","전설: 민첩함","최후의 일격","마법의 신발","비스킷 배달"], startItems:["도란의 검","체력 물약"], coreItems:["크라켄 학살자","구인수의 격노검","내셔의 이빨"], boots:"광전사의 군화", situationalItems:["존야의 모래시계","수호 천사","도미닉 경의 인사"], skillOrder:"Q → E → W", combo:"평타 → Q → W → R → E", tips:["고립 Q를 맞히도록 미니언을 정리하세요.","궁극기는 생존과 거리 조절에 우선 사용하세요.","진화 타이밍을 기준으로 귀환 아이템을 맞추세요."] },
  { id:"jinx", champion:"징크스", englishName:"Jinx", role:"원딜", tier:"입문 추천", patch:FALLBACK_PATCH, spells:["점멸","방어막"], runes:["치명적 속도","침착","전설: 민첩함","최후의 일격","마법의 신발","비스킷 배달"], startItems:["도란의 검","체력 물약"], coreItems:["크라켄 학살자","루난의 허리케인","무한의 대검"], boots:"광전사의 군화", situationalItems:["도미닉 경의 인사","피바라기","수호 천사"], skillOrder:"Q → W → E", combo:"W → E → 대포 평타 → R", tips:["처치 관여 후 패시브로 한타를 이어가세요.","대포 모드는 필요한 순간에만 사용하세요.","최대 사거리를 유지하며 앞라인부터 공격하세요."] },
  { id:"ezreal", champion:"이즈리얼", englishName:"Ezreal", role:"원딜", tier:"대중픽", patch:FALLBACK_PATCH, spells:["점멸","방어막"], runes:["집중 공격","침착","전설: 가속","최후의 일격","마나순환 팔찌","깨달음"], startItems:["도란의 검","체력 물약"], coreItems:["삼위일체","무라마나","쇼진의 창"], boots:"명석함의 아이오니아 장화", situationalItems:["세릴다의 원한","얼어붙은 심장","맬모셔스의 아귀"], skillOrder:"Q → E → W", combo:"W → E → 평타 → Q", tips:["Q 적중으로 스킬 재사용 시간을 줄이세요.","비전 이동은 공격보다 생존용으로 아끼세요.","평타를 섞어야 딜 손실이 적습니다."] },
  { id:"nautilus", champion:"노틸러스", englishName:"Nautilus", role:"서폿", tier:"입문 추천", patch:FALLBACK_PATCH, spells:["점멸","점화"], runes:["여진","보호막 강타","뼈 방패","불굴의 의지","마공점","쾌속 접근"], startItems:["세계 지도집","체력 물약"], coreItems:["천상의 이의","강철의 솔라리 펜던트","기사의 맹세"], boots:"기동력의 장화 / 판금 장화", situationalItems:["지크의 융합","가시 갑옷","미카엘의 축복"], skillOrder:"Q → W → E", combo:"Q → 평타 → W → E → R", tips:["그랩이 없어도 평타 속박으로 시작할 수 있습니다.","궁극기는 뒤쪽 딜러에게 사용하세요.","벽 그랩으로 이동할 수 있습니다."] },
  { id:"thresh", champion:"쓰레쉬", englishName:"Thresh", role:"서폿", tier:"대중픽", patch:FALLBACK_PATCH, spells:["점멸","점화"], runes:["여진","생명의 샘","뼈 방패","불굴의 의지","비스킷 배달","우주적 통찰력"], startItems:["세계 지도집","체력 물약"], coreItems:["천상의 이의","강철의 솔라리 펜던트","기사의 맹세"], boots:"기동력의 장화", situationalItems:["구원","미카엘의 축복","지크의 융합"], skillOrder:"Q → E → W", combo:"E → Q → Q → R", tips:["E로 밀거나 당긴 뒤 Q를 맞히세요.","랜턴을 아군 이동 경로에 미리 놓으세요.","무리한 진입보다 시야 장악이 우선입니다."] }
];


const JUNGLE_IDS = new Set(["Amumu","Belveth","Briar","Diana","Ekko","Elise","Evelynn","Fiddlesticks","Graves","Hecarim","Ivern","JarvanIV","Karthus","Kayn","Khazix","Kindred","LeeSin","Lillia","MasterYi","Nidalee","Nocturne","Nunu","Rammus","RekSai","Rengar","Sejuani","Shaco","Shyvana","Skarner","Taliyah","Udyr","Vi","Viego","Volibear","Warwick","MonkeyKing","XinZhao","Zac"]);
const SUPPORT_IDS = new Set(["Alistar","Bard","Blitzcrank","Braum","Janna","Karma","Leona","Lulu","Lux","Milio","Morgana","Nami","Nautilus","Pyke","Rakan","Rell","Renata","Senna","Seraphine","Sona","Soraka","TahmKench","Taric","Thresh","Yuumi","Zilean","Zyra"]);
const ADC_IDS = new Set(["Aphelios","Ashe","Caitlyn","Corki","Draven","Ezreal","Jhin","Jinx","Kaisa","Kalista","KogMaw","Lucian","MissFortune","Nilah","Samira","Sivir","Smolder","Tristana","Twitch","Varus","Vayne","Xayah","Yunara","Zeri"]);
const MID_IDS = new Set(["Ahri","Akali","Akshan","Anivia","Annie","AurelionSol","Aurora","Azir","Cassiopeia","Fizz","Galio","Hwei","Kassadin","Katarina","Leblanc","Lissandra","Malzahar","Mel","Neeko","Orianna","Ryze","Swain","Sylas","Syndra","Talon","TwistedFate","Veigar","Velkoz","Vex","Viktor","Vladimir","Xerath","Yasuo","Yone","Zed","Ziggs","Zoe"]);

function inferRole(champion: DataDragonChampion): Role {
  if (JUNGLE_IDS.has(champion.id)) return "정글";
  if (SUPPORT_IDS.has(champion.id) || champion.tags.includes("Support")) return "서폿";
  if (ADC_IDS.has(champion.id)) return "원딜";
  if (MID_IDS.has(champion.id) || champion.tags.includes("Mage") || champion.tags.includes("Assassin")) return "미드";
  return "탑";
}

function createFallbackBuild(champion: DataDragonChampion, patch = FALLBACK_PATCH, forcedRole?: Role): ChampionBuild {
  const role = forcedRole ?? inferRole(champion);
  const isAp = champion.tags.includes("Mage");
  const byRole: Record<Role, Omit<ChampionBuild,"id"|"champion"|"englishName"|"imageName"|"role"|"patch"|"tier">> = {
    "탑": { spells:["점멸","텔레포트"], runes:["정복자","승전보","전설: 가속","최후의 저항","재생의 바람","불굴의 의지"], startItems:["도란의 방패","체력 물약"], coreItems: isAp ? ["균열 생성기","리안드리의 고통","존야의 모래시계"] : ["갈라진 하늘","스테락의 도전","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","정령의 형상","가시 갑옷"], skillOrder:"주력기 → 보조기 → 유틸기", combo:"주력 스킬 적중 → 평타 연계 → 궁극기", tips:["상대 조합에 맞춰 방어 신발을 선택하세요.","첫 핵심 아이템 완성 타이밍에 교전을 노리세요.","정확한 패치별 빌드는 Riot API 연동 후 자동 갱신됩니다."] },
    "정글": { spells:["점멸","강타"], runes:["정복자","승전보","전설: 민첩함","최후의 일격","돌발 일격","보물 사냥꾼"], startItems:["정글 동료","체력 물약"], coreItems: isAp ? ["리안드리의 고통","그림자불꽃","존야의 모래시계"] : ["월식","칠흑의 양날 도끼","죽음의 무도"], boots:"판금 장화 / 헤르메스의 발걸음", situationalItems:["수호 천사","스테락의 도전","대자연의 힘"], skillOrder:"주력기 → 이동기 → 보조기", combo:"진입기 → 주력기 → 평타 → 궁극기", tips:["첫 바위게와 오브젝트 타이밍을 우선 확인하세요.","아군 라인 주도권이 있는 쪽으로 동선을 잡으세요.","정확한 패치별 빌드는 Riot API 연동 후 자동 갱신됩니다."] },
    "미드": { spells:["점멸","텔레포트 / 점화"], runes:[isAp?"신비로운 유성":"감전","마나순환 팔찌","깨달음","주문 작열","비스킷 배달","우주적 통찰력"], startItems:[isAp?"도란의 반지":"도란의 검","체력 물약"], coreItems: isAp ? ["루덴의 동반자","그림자불꽃","라바돈의 죽음모자"] : ["월식","요우무의 유령검","세릴다의 원한"], boots:isAp?"마법사의 신발":"명석함의 아이오니아 장화", situationalItems:["존야의 모래시계","밴시의 장막","수호 천사"], skillOrder:"주력기 → 견제기 → 이동/방어기", combo:"CC 또는 견제기 → 주력기 → 궁극기", tips:["라인을 밀고 시야와 로밍 주도권을 잡으세요.","상대 핵심 스킬이 빠진 뒤 진입하세요.","정확한 패치별 빌드는 Riot API 연동 후 자동 갱신됩니다."] },
    "원딜": { spells:["점멸","방어막 / 회복"], runes:["치명적 속도","침착","전설: 민첩함","최후의 일격","마법의 신발","비스킷 배달"], startItems:["도란의 검","체력 물약"], coreItems:["크라켄 학살자","무한의 대검","도미닉 경의 인사"], boots:"광전사의 군화", situationalItems:["피바라기","수호 천사","헤르메스의 시미터"], skillOrder:"주력 딜 스킬 → 생존기 → 보조기", combo:"평타 → 주력기 → 평타 → 궁극기", tips:["한타에서는 최대 사거리를 유지하며 앞라인부터 공격하세요.","생존기는 상대 진입 스킬을 확인한 뒤 사용하세요.","정확한 패치별 빌드는 Riot API 연동 후 자동 갱신됩니다."] },
    "서폿": { spells:["점멸","점화 / 탈진"], runes:["여진 / 수호자","생명의 샘","뼈 방패","불굴의 의지","비스킷 배달","우주적 통찰력"], startItems:["세계 지도집","체력 물약"], coreItems:["강철의 솔라리 펜던트","기사의 맹세","구원"], boots:"기동력의 장화 / 명석함의 아이오니아 장화", situationalItems:["미카엘의 축복","지크의 융합","가시 갑옷"], skillOrder:"CC기 → 보호기 → 보조기", combo:"CC기 → 평타/보조기 → 궁극기", tips:["라인보다 시야와 아군 딜러 보호를 우선하세요.","오브젝트 1분 전부터 시야를 정리하세요.","정확한 패치별 빌드는 Riot API 연동 후 자동 갱신됩니다."] }
  };
  return { id:champion.id.toLowerCase(), champion:champion.name, englishName:champion.id, imageName:champion.image.full, role, tier:"전체 챔피언 기본형", patch:FALLBACK_PATCH, ...byRole[role] };
}

function availableRoles(champion: DataDragonChampion): Role[] {
  const result = new Set<Role>();
  const primary = inferRole(champion);
  result.add(primary);
  if (champion.tags.includes("Tank") || champion.tags.includes("Fighter")) result.add("탑");
  if (JUNGLE_IDS.has(champion.id)) result.add("정글");
  if (champion.tags.includes("Mage") || champion.tags.includes("Assassin")) result.add("미드");
  if (champion.tags.includes("Marksman")) result.add("원딜");
  if (champion.tags.includes("Support") || SUPPORT_IDS.has(champion.id)) result.add("서폿");
  return Array.from(result);
}

function buildForRole(champion: DataDragonChampion, role: Role, patch: string): ChampionBuild {
  return { ...createFallbackBuild(champion, patch, role), tier: "포지션별 대중 추천" };
}

const roles = ["전체", "탑", "정글", "미드", "원딜", "서폿"] as const;
const POPULAR_CHAMPION_IDS = ["Kaisa","Ahri","LeeSin","Jinx","Ezreal","Thresh","Aatrox","Darius","Nautilus","Vi"];
const FAVORITES_KEY = "bawigemaeul-guide-favorites";
const RECENT_KEY = "bawigemaeul-guide-recent";

export default function GuidesClient() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("전체");
  const [allBuilds, setAllBuilds] = useState<ChampionBuild[]>(builds);
  const [championMap, setChampionMap] = useState<Record<string, DataDragonChampion>>({});
  const [selected, setSelected] = useState<ChampionBuild>(builds[0]);
  const [selectedRole, setSelectedRole] = useState<Role>(builds[0].role);
  const [ddragonVersion, setDdragonVersion] = useState(FALLBACK_DDRAGON_VERSION);
  const [patch, setPatch] = useState(FALLBACK_PATCH);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const championImageBase = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion`;

  useEffect(() => {
    let active = true;
    async function loadChampions() {
      try {
        const versionsResponse = await fetch(DDRAGON_VERSIONS);
        const versions: string[] = versionsResponse.ok ? await versionsResponse.json() : [FALLBACK_DDRAGON_VERSION];
        const latestVersion = versions[0] || FALLBACK_DDRAGON_VERSION;
        const patchLabel = latestVersion.split(".").slice(0, 2).join(".");
        const dataUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/ko_KR/champion.json`;
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error("champion data load failed");
        const payload: { data: Record<string, DataDragonChampion> } = await response.json();
        if (!active) return;

        const detailed = new Map(builds.map(build => [build.englishName, build]));
        const merged = Object.values(payload.data)
          .map(champion => {
            const saved = detailed.get(champion.id);
            return saved
              ? { ...saved, champion: champion.name, imageName: champion.image.full, patch: patchLabel }
              : createFallbackBuild(champion, patchLabel);
          })
          .sort((a,b) => a.champion.localeCompare(b.champion, "ko"));

        setDdragonVersion(latestVersion);
        setPatch(patchLabel);
        setChampionMap(payload.data);
        setAllBuilds(merged);
        setSelected(current => merged.find(item => item.englishName === current.englishName) ?? merged[0]);
      } catch {
        setAllBuilds(builds);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadChampions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      const savedRecent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(savedFavorites)) setFavorites(savedFavorites);
      if (Array.isArray(savedRecent)) setRecent(savedRecent);
    } catch {
      setFavorites([]);
      setRecent([]);
    }
  }, []);

  const popularBuilds = useMemo(() => {
    const rank = new Map(POPULAR_CHAMPION_IDS.map((id, index) => [id, index]));
    return allBuilds
      .filter(build => rank.has(build.englishName))
      .sort((a, b) => (rank.get(a.englishName) ?? 99) - (rank.get(b.englishName) ?? 99))
      .slice(0, 10);
  }, [allBuilds]);

  const recentBuilds = useMemo(() => recent
    .map(id => allBuilds.find(build => build.englishName === id))
    .filter((build): build is ChampionBuild => Boolean(build))
    .slice(0, 6), [allBuilds, recent]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return allBuilds.filter(build => {
      const champion = championMap[build.englishName];
      const championRoles = champion ? availableRoles(champion) : [build.role];
      return (role === "전체" || championRoles.includes(role)) && (!showFavoritesOnly || favorites.includes(build.englishName)) && (!keyword || `${build.champion} ${build.englishName}`.toLowerCase().includes(keyword));
    });
  }, [allBuilds, championMap, favorites, query, role, showFavoritesOnly]);

  const selectableRoles = useMemo(() => {
    const champion = championMap[selected.englishName];
    return champion ? availableRoles(champion) : [selected.role];
  }, [championMap, selected.englishName, selected.role]);

  function selectChampion(build: ChampionBuild) {
    setSelected(build);
    setSelectedRole(build.role);
    setRecent(current => {
      const next = [build.englishName, ...current.filter(id => id !== build.englishName)].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
    requestAnimationFrame(() => document.getElementById("selected-build")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function toggleFavorite(id: string) {
    setFavorites(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function selectRandomChampion() {
    const pool = filtered.length ? filtered : allBuilds;
    const build = pool[Math.floor(Math.random() * pool.length)];
    if (build) selectChampion(build);
  }

  function changeSelectedRole(nextRole: Role) {
    setSelectedRole(nextRole);
    const champion = championMap[selected.englishName];
    if (!champion) {
      setSelected(current => ({ ...current, role: nextRole }));
      return;
    }
    const detailed = builds.find(build => build.englishName === champion.id && build.role === nextRole);
    setSelected(detailed ? { ...detailed, champion: champion.name, imageName: champion.image.full, patch } : buildForRole(champion, nextRole, patch));
  }

  return (
    <div className="guides-shell champion-build-shell">
      <section className="guides-hero">
        <div><span>POPULAR BUILDS</span><h1>챔피언 빌드</h1><p>챔피언과 포지션을 고르면 현재 패치 기준으로 바로 쓰기 쉬운 대중 빌드를 보여줍니다.</p></div>
        <div className="guides-hero-badge"><b>{loading ? "…" : allBuilds.length}</b><small>PATCH {patch}</small></div>
      </section>

      <section className="card guides-toolbar">
        <div className="guides-role-tabs">{roles.map(item => <button key={item} type="button" className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
        <div className="guides-search-row">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="챔피언 이름 검색" />
          <button type="button" className={showFavoritesOnly ? "active" : ""} onClick={() => setShowFavoritesOnly(value => !value)}>★ 즐겨찾기</button>
          <button type="button" onClick={selectRandomChampion}>🎲 무작위 추천</button>
        </div>
      </section>

      <section className="guide-quick-sections">
        <article className="card guide-quick-card">
          <div className="guides-section-head"><div><span>POPULAR TOP 10</span><h2>인기 챔피언</h2></div><small>대중적으로 많이 찾는 챔피언</small></div>
          <div className="guide-mini-list">{popularBuilds.map((build, index) => <button key={build.id} type="button" onClick={() => selectChampion(build)}><b>{index + 1}</b><Image src={`${championImageBase}/${build.imageName ?? `${build.englishName}.png`}`} alt={build.champion} width={42} height={42} unoptimized /><span>{build.champion}</span></button>)}</div>
        </article>
        <article className="card guide-quick-card">
          <div className="guides-section-head"><div><span>RECENTLY VIEWED</span><h2>최근 본 챔피언</h2></div><small>최대 6명 저장</small></div>
          {recentBuilds.length ? <div className="guide-mini-list recent">{recentBuilds.map(build => <button key={build.id} type="button" onClick={() => selectChampion(build)}><Image src={`${championImageBase}/${build.imageName ?? `${build.englishName}.png`}`} alt={build.champion} width={42} height={42} unoptimized /><span>{build.champion}</span></button>)}</div> : <p className="guide-recent-empty">챔피언을 선택하면 최근 목록에 저장됩니다.</p>}
        </article>
      </section>

      <section className="champion-picker-section">
        <div className="guides-section-head"><div><span>CHAMPION SELECT</span><h2>챔피언 선택</h2></div><small>{filtered.length}명 표시</small></div>
        <div className="champion-portrait-grid">
          {filtered.map(build => (
            <button key={build.id} type="button" className={`champion-portrait-card ${selected.id === build.id ? "selected" : ""}`} onClick={() => selectChampion(build)}>
              <div className="champion-image-wrap"><Image src={`${championImageBase}/${build.imageName ?? `${build.englishName}.png`}`} alt={build.champion} width={96} height={96} unoptimized /></div>
              <strong>{build.champion}</strong><span>{build.role}</span>
            </button>
          ))}
          {!filtered.length && <div className="card guides-empty">조건에 맞는 챔피언이 없습니다.</div>}
        </div>
      </section>

      <section id="selected-build" className="card popular-build-detail">
        <header className="popular-build-head">
          <div className="popular-build-champion"><Image src={`${championImageBase}/${selected.imageName ?? `${selected.englishName}.png`}`} alt={selected.champion} width={118} height={118} unoptimized /></div>
          <div className="popular-build-title"><span>{selectedRole} · PATCH {patch}</span><h2>{selected.champion}</h2><p><b>현재 가장 많이 사용하는 빌드</b></p></div>
          <div className="popular-build-actions">
            <button type="button" className={favorites.includes(selected.englishName) ? "favorite active" : "favorite"} onClick={() => toggleFavorite(selected.englishName)}>{favorites.includes(selected.englishName) ? "★ 즐겨찾기됨" : "☆ 즐겨찾기"}</button>
            <div className="popular-build-status"><strong>POPULAR</strong><small>대중 추천</small></div>
          </div>
        </header>

        <div className="selected-role-tabs" aria-label="포지션 선택">
          {selectableRoles.map(item => <button type="button" key={item} className={selectedRole === item ? "active" : ""} onClick={() => changeSelectedRole(item)}>{item}</button>)}
        </div>

        <div className="build-data-note">
          <span>패치 자동 감지</span><b>{patch}</b><p>챔피언 목록과 패치는 Data Dragon에서 자동 갱신됩니다. 승률·픽률 집계는 프로덕션 데이터 연동 후 표시됩니다.</p>
        </div>

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

      <section className="card guides-notice"><span>AUTO PATCH</span><div><h2>챔피언과 패치는 자동으로 최신화</h2><p>전체 챔피언과 최신 패치를 자동으로 불러오고, 챔피언별 선택 가능한 포지션을 나눠 빌드를 표시합니다.</p></div></section>
    </div>
  );
}
