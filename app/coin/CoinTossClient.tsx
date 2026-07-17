"use client";

import { useEffect, useRef, useState } from "react";

const SPIN_DURATION = 1800;

type CoinSide = "smile" | "cry";

const sideLabel: Record<CoinSide, string> = {
  smile: "웃는 바위게",
  cry: "우는 바위게"
};

export default function CoinTossClient() {
  const [result, setResult] = useState<CoinSide | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState<CoinSide[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function tossCoin() {
    if (spinning) return;

    const next: CoinSide = Math.random() < 0.5 ? "smile" : "cry";
    const extraTurns = 8 + Math.floor(Math.random() * 4);
    const landing = next === "smile" ? 0 : 180;

    setSpinning(true);
    setResult(null);
    setRotation(current => current + extraTurns * 360 + landing);

    timeoutRef.current = setTimeout(() => {
      setResult(next);
      setHistory(current => [next, ...current].slice(0, 10));
      setSpinning(false);
    }, SPIN_DURATION);
  }

  function resetHistory() {
    if (spinning) return;
    setHistory([]);
    setResult(null);
  }

  return (
    <div className="coin-page-shell">
      <section className="coin-hero">
        <div>
          <span>SCUTTLE COIN TOSS</span>
          <h1>바위게 코인토스</h1>
          <p>웃는 바위게와 우는 바위게 중 하나를 무작위로 결정합니다.</p>
        </div>
        <div className="coin-hero-badge">50 : 50</div>
      </section>

      <section className="coin-layout">
        <article className="card coin-stage-card">
          <div className="coin-side-guide" aria-label="코인 앞뒤 안내">
            <div>
              <img src="/assets/coin-smile.png" alt="웃는 바위게" />
              <b>앞면</b>
              <span>웃는 바위게</span>
            </div>
            <div>
              <img src="/assets/coin-cry.png" alt="우는 바위게" />
              <b>뒷면</b>
              <span>우는 바위게</span>
            </div>
          </div>

          <div className="coin-stage" aria-live="polite">
            <div
              className={`scuttle-coin${spinning ? " is-spinning" : ""}`}
              style={{ transform: `rotateY(${rotation}deg)` }}
            >
              <div className="scuttle-coin-face coin-front">
                <img src="/assets/coin-smile.png" alt="웃는 바위게 면" />
              </div>
              <div className="scuttle-coin-face coin-back">
                <img src="/assets/coin-cry.png" alt="우는 바위게 면" />
              </div>
            </div>
          </div>

          <div className={`coin-result${result ? ` result-${result}` : ""}`}>
            {spinning ? (
              <><small>COIN TOSS</small><strong>바위게가 회전 중...</strong></>
            ) : result ? (
              <><small>RESULT</small><strong>{sideLabel[result]} 당첨!</strong></>
            ) : (
              <><small>READY</small><strong>코인을 던져주세요</strong></>
            )}
          </div>

          <button className="coin-toss-button" type="button" onClick={tossCoin} disabled={spinning}>
            {spinning ? "결과 확인 중..." : "코인 던지기"}
          </button>
        </article>

        <aside className="card coin-history-card">
          <div className="dashboard-head">
            <div>
              <span>RECENT RESULTS</span>
              <h2>최근 결과</h2>
            </div>
            <button type="button" className="coin-reset-button" onClick={resetHistory} disabled={!history.length || spinning}>
              초기화
            </button>
          </div>

          <div className="coin-history-list">
            {history.map((side, index) => (
              <div key={`${side}-${index}`} className={`coin-history-item history-${side}`}>
                <span>{index + 1}</span>
                <img src={`/assets/coin-${side === "smile" ? "smile" : "cry"}.png`} alt="" />
                <div>
                  <b>{sideLabel[side]}</b>
                  <small>{side === "smile" ? "앞면" : "뒷면"}</small>
                </div>
              </div>
            ))}

            {!history.length && (
              <div className="coin-history-empty">아직 코인토스 결과가 없습니다.</div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
