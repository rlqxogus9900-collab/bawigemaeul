"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RiotResult = {
  account: { puuid: string; gameName: string; tagLine: string };
  summoner: { profileIconId?: number; summonerLevel?: number };
  matches: Array<{
    matchId: string;
    playedAt: number;
    duration: number;
    queueName: string;
    gameVersion: string;
    championName: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    kda: number;
    cs: number;
    csPerMinute: number;
    goldEarned: number;
    items: number[];
  }>;
  fetchedAt: string;
};

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}분 ${remain}초`;
}

function relativeDate(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  return new Date(timestamp).toLocaleDateString("ko-KR");
}

export default function RiotSearchClient() {
  const [riotId, setRiotId] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RiotResult | null>(null);
  const [ddragonVersion, setDdragonVersion] = useState("16.14.1");

  useEffect(() => {
    fetch("/api/riot/health", { cache: "no-store" })
      .then(response => response.json())
      .then(data => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));

    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(response => response.json())
      .then((versions: string[]) => versions[0] && setDdragonVersion(versions[0]))
      .catch(() => undefined);
  }, []);

  const summary = useMemo(() => {
    if (!result?.matches.length) return null;
    const wins = result.matches.filter(match => match.win).length;
    const avgKda = result.matches.reduce((sum, match) => sum + match.kda, 0) / result.matches.length;
    return { wins, losses: result.matches.length - wins, avgKda: avgKda.toFixed(2) };
  }, [result]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = riotId.trim();
    if (!value.includes("#")) {
      setError("닉네임#태그 형식으로 입력해주세요. 예: 바위게#KR1");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/riot/player?riotId=${encodeURIComponent(value)}&count=5`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "조회에 실패했습니다.");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="riot-page">
      <section className="riot-hero">
        <div>
          <span>RIOT API · LIVE DATA</span>
          <h1>롤 전적 실시간 조회</h1>
          <p>Riot ID로 계정 정보와 최근 경기 데이터를 Riot API에서 직접 불러옵니다.</p>
        </div>
        <div className={`riot-api-status ${configured ? "ready" : "not-ready"}`}>
          <i />
          {configured === null ? "연결 확인 중" : configured ? "API 키 연결됨" : "API 키 설정 필요"}
        </div>
      </section>

      <section className="riot-search-card">
        <form onSubmit={submit}>
          <label htmlFor="riot-id">Riot ID</label>
          <div className="riot-search-row">
            <input
              id="riot-id"
              value={riotId}
              onChange={event => setRiotId(event.target.value)}
              placeholder="닉네임#태그"
              autoComplete="off"
            />
            <button disabled={loading || configured === false}>
              {loading ? "조회 중..." : "전적 조회"}
            </button>
          </div>
          <small>예시: Hide on bush#KR1 · 개발용 API 키는 24시간마다 갱신해야 합니다.</small>
        </form>

        {configured === false && (
          <div className="riot-message warning">배포 환경 변수에 RIOT_API_KEY를 등록한 뒤 다시 배포해주세요.</div>
        )}
        {error && <div className="riot-message error">{error}</div>}
      </section>

      {result && (
        <>
          <section className="riot-profile-card">
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${Number(result.summoner.profileIconId || 0)}.png`}
              alt="프로필 아이콘"
            />
            <div className="riot-profile-main">
              <span>RIOT ACCOUNT</span>
              <h2>{result.account.gameName}<em>#{result.account.tagLine}</em></h2>
              <p>소환사 레벨 <b>{Number(result.summoner.summonerLevel || 0).toLocaleString()}</b></p>
            </div>
            {summary && (
              <div className="riot-summary-grid">
                <div><span>최근 {result.matches.length}게임</span><b>{summary.wins}승 {summary.losses}패</b></div>
                <div><span>평균 KDA</span><b>{summary.avgKda}</b></div>
                <div><span>갱신 시각</span><b>{new Date(result.fetchedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</b></div>
              </div>
            )}
          </section>

          <section className="riot-match-section">
            <div className="riot-section-head">
              <div><span>MATCH HISTORY</span><h2>최근 경기</h2></div>
              <small>Riot Match-V5 실시간 데이터</small>
            </div>

            <div className="riot-match-list">
              {result.matches.length ? result.matches.map(match => (
                <article key={match.matchId} className={match.win ? "win" : "lose"}>
                  <div className="riot-result-strip"><b>{match.win ? "승리" : "패배"}</b><span>{relativeDate(match.playedAt)}</span></div>
                  <img
                    className="riot-champion-icon"
                    src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${match.championName}.png`}
                    alt={match.championName}
                  />
                  <div className="riot-match-champion">
                    <strong>{match.championName}</strong>
                    <span>{match.queueName} · {durationLabel(match.duration)}</span>
                  </div>
                  <div className="riot-kda">
                    <b>{match.kills} / <em>{match.deaths}</em> / {match.assists}</b>
                    <span>KDA {match.kda}</span>
                  </div>
                  <div className="riot-cs"><b>CS {match.cs}</b><span>분당 {match.csPerMinute}</span></div>
                  <div className="riot-items">
                    {match.items.map((item, index) => (
                      <img key={`${match.matchId}-${item}-${index}`} src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/item/${item}.png`} alt="아이템" />
                    ))}
                  </div>
                </article>
              )) : <p className="empty-copy">최근 경기 데이터가 없습니다.</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
