"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
type Side="smile"|"cry";
type History={side:Side;at:string};
export default function CoinTossClient(){
 const [side,setSide]=useState<Side>("smile"); const [spinning,setSpinning]=useState(false); const [history,setHistory]=useState<History[]>([]);
 useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem("bawi-coin-history")||"[]"))}catch{}},[]);
 function toss(){if(spinning)return;setSpinning(true);const next:Side=Math.random()<.5?"smile":"cry";setTimeout(()=>{setSide(next);setSpinning(false);const h=[{side:next,at:new Date().toISOString()},...history].slice(0,10);setHistory(h);localStorage.setItem("bawi-coin-history",JSON.stringify(h));},1400)}
 function clear(){setHistory([]);localStorage.removeItem("bawi-coin-history")}
 return <div className="coin-page-grid"><section className="card coin-main-card"><div className="page-head"><div><span>COIN TOSS</span><h1>코인토스</h1><p className="muted">웃는 바위게와 우는 바위게로 팀을 정합니다.</p></div></div><div className={`bawi-coin ${side==="cry"?"show-back":""} ${spinning?"spinning":""}`}><div className="coin-face coin-front"><b>앞면 · 웃음</b><Image src="/assets/coin-smile.png" alt="웃는 바위게" width={260} height={260}/></div><div className="coin-face coin-back"><b>뒷면 · 울음</b><Image src="/assets/coin-cry.png" alt="우는 바위게" width={260} height={260}/></div></div><div className="coin-result"><strong>{spinning?"회전 중...":side==="smile"?"😊 앞면 · 웃는 바위게":"😭 뒷면 · 우는 바위게"}</strong></div><button className="button primary coin-toss-button" onClick={toss} disabled={spinning}>{spinning?"돌리는 중":"코인 던지기"}</button></section><aside className="card"><div className="dashboard-head"><div><span>RECENT 10</span><h2>최근 결과</h2></div><button className="button" onClick={clear}>초기화</button></div><div className="coin-history">{history.map((h,i)=><div key={h.at+i}><span>{h.side==="smile"?"😊 앞면":"😭 뒷면"}</span><time>{new Date(h.at).toLocaleString("ko-KR")}</time></div>)}{!history.length&&<p className="muted">아직 결과가 없습니다.</p>}</div></aside></div>
}
