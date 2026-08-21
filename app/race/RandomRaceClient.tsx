"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Racer = {
  id: number;
  label: string;
  accessory: string;
  accent: string;
};

type RaceState = Racer & {
  progress: number;
  rank: number | null;
};

const RACERS: Racer[] = [
  { id: 1, label: "왕관", accessory: "👑", accent: "A" },
  { id: 2, label: "선글라스", accessory: "😎", accent: "B" },
  { id: 3, label: "불꽃", accessory: "🔥", accent: "C" },
  { id: 4, label: "유령", accessory: "👻", accent: "D" },
  { id: 5, label: "광대", accessory: "🤡", accent: "E" },
  { id: 6, label: "졸린", accessory: "💤", accent: "F" },
  { id: 7, label: "마법사", accessory: "🪄", accent: "G" },
  { id: 8, label: "해적", accessory: "🏴‍☠️", accent: "H" },
  { id: 9, label: "로봇", accessory: "🤖", accent: "I" },
  { id: 10, label: "번개", accessory: "⚡", accent: "J" }
];

const MIN_RACERS = 2;
const MAX_RACERS = 10;
const RACE_MS = 7200;

function randomUnit() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] / 4294967296;
  }
  return Math.random();
}

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomUnit() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function RandomRaceClient() {
  const [count, setCount] = useState(6);
  const selected = useMemo(() => RACERS.slice(0, count), [count]);
  const [race, setRace] = useState<RaceState[]>(() => RACERS.slice(0, 6).map(r => ({ ...r, progress: 0, rank: null })));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (running) return;
    setRace(selected.map(r => ({ ...r, progress: 0, rank: null })));
    setFinished(false);
  }, [selected, running]);

  function startRace() {
    if (running) return;

    // 순위는 시작 시점에 모든 참가자에게 완전히 동일한 확률로 한 번만 추첨합니다.
    // 캐릭터 특징, 이전 경기 결과, 연승/연패 여부는 결과에 전혀 관여하지 않습니다.
    const order = shuffled(selected);
    const rankMap = new Map(order.map((racer, index) => [racer.id, index + 1]));
    const finishMap = new Map(order.map((racer, index) => [racer.id, RACE_MS + index * 240]));
    const maxFinishAt = RACE_MS + Math.max(0, order.length - 1) * 240;
    const phaseMap = new Map(selected.map(racer => [racer.id, randomUnit() * Math.PI * 2]));
    const wobbleMap = new Map(selected.map(racer => [racer.id, 0.7 + randomUnit() * 0.7]));

    setRunning(true);
    setFinished(false);
    setRace(selected.map(r => ({ ...r, progress: 0, rank: null })));
    const startedAt = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startedAt;

      setRace(current => current.map(racer => {
        const finishAt = finishMap.get(racer.id) ?? RACE_MS;
        const linear = Math.min(1, elapsed / finishAt);
        const phase = phaseMap.get(racer.id) ?? 0;
        const wobble = wobbleMap.get(racer.id) ?? 1;
        const surge = Math.sin(elapsed / (300 + racer.id * 13) + phase) * 2.2 * wobble;
        const stumble = Math.sin(elapsed / (145 + racer.id * 7) + phase * 1.7) * 0.9;
        const base = linear * 100;
        const progress = linear >= 1 ? 100 : Math.max(0, Math.min(99.2, base + surge + stumble));
        return {
          ...racer,
          progress,
          rank: progress >= 100 ? (rankMap.get(racer.id) ?? null) : null
        };
      }));

      // React 상태 업데이트는 비동기이므로 setRace 내부에서 종료 여부를 판정하면
      // 첫 프레임에 종료되는 문제가 생길 수 있습니다. 실제 경과 시간으로 종료를 판단합니다.
      if (elapsed < maxFinishAt) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setRace(current => current.map(racer => ({
          ...racer,
          progress: 100,
          rank: rankMap.get(racer.id) ?? racer.rank
        })));
        setRunning(false);
        setFinished(true);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }

  function resetRace() {
    if (running) return;
    setFinished(false);
    setRace(selected.map(r => ({ ...r, progress: 0, rank: null })));
  }

  const standings = finished
    ? [...race].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    : [];

  return (
    <div className="random-race-shell">
      <section className="race-hero">
        <div>
          <span>SCUTTLE RANDOM RACE</span>
          <h1>바위게 복불복 달리기</h1>
          <p>모든 바위게의 성능은 완전히 같습니다. 매 경기 순위만 독립적으로 무작위 추첨됩니다.</p>
        </div>
        <div className="race-fair-badge">PURE RANDOM</div>
      </section>

      <section className="card race-control-card">
        <div>
          <small>참가 수</small>
          <strong>{count}마리</strong>
        </div>
        <div className="race-count-control">
          <button type="button" onClick={() => setCount(v => Math.max(MIN_RACERS, v - 1))} disabled={running || count <= MIN_RACERS}>−</button>
          <span>{count}</span>
          <button type="button" onClick={() => setCount(v => Math.min(MAX_RACERS, v + 1))} disabled={running || count >= MAX_RACERS}>＋</button>
        </div>
        <div className="race-control-actions">
          <button type="button" className="race-reset" onClick={resetRace} disabled={running}>초기화</button>
          <button type="button" className="race-start" onClick={startRace} disabled={running}>{running ? "달리는 중..." : finished ? "다시 달리기" : "경기 시작"}</button>
        </div>
      </section>

      <section className="card race-track-card">
        <div className="race-track-head">
          <div><span>RACE TRACK</span><h2>{running ? "누가 먼저 들어올까?" : finished ? "경기 종료!" : "출발 준비"}</h2></div>
          <small>2~10마리 설정 가능 · 캐릭터별 능력치 없음</small>
        </div>

        <div className="race-track-list">
          {race.map((racer, index) => (
            <div className={`race-lane race-accent-${racer.accent}`} key={racer.id}>
              <div className="race-lane-label"><b>{index + 1}</b><span>{racer.accessory} {racer.label}</span></div>
              <div className="race-lane-road">
                <div className="race-road-lines" />
                <div className="race-finish-line"><span>FINISH</span></div>
                <div className={`race-crab${running ? " running" : ""}`} style={{ left: `calc(${racer.progress}% - ${racer.progress * 0.72}px)` }}>
                  <span className="race-accessory">{racer.accessory}</span>
                  <span className="race-crab-body">🦀</span>
                  {racer.rank && <em>{racer.rank}등</em>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {finished && (
        <section className="card race-result-card">
          <div className="race-track-head"><div><span>FINAL RESULT</span><h2>최종 순위</h2></div><small>다음 경기는 다시 완전 무작위</small></div>
          <div className="race-winner-banner">
            <span>🏆 WINNER</span>
            <strong>{standings[0]?.accessory} 🦀 {standings[0]?.label} 바위게</strong>
          </div>
          <div className="race-podium-list">
            {standings.map(racer => (
              <div key={racer.id} className={`race-result-row rank-${racer.rank}`}>
                <strong>{racer.rank === 1 ? "🥇" : racer.rank === 2 ? "🥈" : racer.rank === 3 ? "🥉" : `${racer.rank}위`}</strong>
                <span className="race-result-crab">{racer.accessory} 🦀</span>
                <div><b>{racer.label} 바위게</b><small>{racer.rank === 1 ? "우승!" : `${racer.rank}위 도착`}</small></div>
              </div>
            ))}
          </div>
          <div className="race-result-actions">
            <button type="button" className="race-start" onClick={startRace}>같은 인원으로 다시하기</button>
          </div>
        </section>
      )}
    </div>
  );
}
