"use client";

import { useEffect, useRef, useState } from "react";

const SPIN_DURATION = 1800;
const FACE_SWAP_INTERVAL = 110;
const ASSET_VERSION = "1.3.8.10";

type CoinSide = "smile" | "cry";

const sideLabel: Record<CoinSide, string> = {
  smile: "웃는 바위게",
  cry: "우는 바위게"
};

const sideImage: Record<CoinSide, string> = {
  smile: `/assets/coin-smile.png?v=${ASSET_VERSION}`,
  cry: `/assets/coin-cry.png?v=${ASSET_VERSION}`
};

export default function CoinTossClient() {
  const [result, setResult] = useState<CoinSide | null>(null);
  const [visibleSide, setVisibleSide] = useState<CoinSide>("smile");
  const [spinning, setSpinning] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState<CoinSide[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function tossCoin() {
    if (spinning) return;

    const next: CoinSide = Math.random() < 0.5 ? "smile" : "cry";

    setSpinning(true);
    setResult(null);
    setSpinCount(current => current + 1);

    // 브라우저의 3D 뒷면 렌더링에 의존하지 않고 회전 중 실제 이미지를
    // 웃는 면/우는 면으로 번갈아 교체해 두 면이 반드시 다르게 보이게 합니다.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setVisibleSide(current => (current === "smile" ? "cry" : "smile"));
    }, FACE_SWAP_INTERVAL);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setVisibleSide(next);
      setResult(next);
      setHistory(current => [next, ...current].slice(0, 10));
      setSpinning(false);
    }, SPIN_DURATION);
  }

  function resetHistory() {
    if (spinning) return;
    setHistory([]);
    setResult(null);
    setVisibleSide("smile");
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
              <img src={sideImage.smile} alt="웃는 바위게" />
              <b>앞면</b>
              <span>웃는 바위게</span>
            </div>
            <div>
              <img src={sideImage.cry} alt="우는 바위게" />
              <b>뒷면</b>
              <span>우는 바위게</span>
            </div>
          </div>

          <div className="coin-stage" aria-live="polite">
            <div
              key={spinCount}
              className={`scuttle-coin scuttle-coin-single${spinning ? " is-spinning" : ""}`}
            >
              <div className={`scuttle-coin-face coin-visible-face face-${visibleSide}`}>
                <img
                  src={sideImage[visibleSide]}
                  alt={visibleSide === "smile" ? "웃는 바위게 면" : "우는 바위게 면"}
                />
                <span className="coin-face-name">
                  {visibleSide === "smile" ? "웃는 면" : "우는 면"}
                </span>
              </div>
            </div>
          </div>

          <div className={`coin-result${result ? ` result-${result}` : ""}`}>
            {spinning ? (
              <><small>COIN TOSS</small><strong>웃는 면과 우는 면이 회전 중...</strong></>
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
                <img src={sideImage[side]} alt="" />
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
