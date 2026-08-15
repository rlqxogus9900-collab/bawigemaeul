import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
const won=(n:number)=>`${Number(n||0).toLocaleString("ko-KR")}원`;
export default async function DonationsPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
 await requireStaff(); const params=await searchParams; const db=getSupabaseAdmin();
 const {data:rows,error}=await db.from("donation_ledger").select("*").order("occurred_on",{ascending:false}).order("created_at",{ascending:false});
 const list=rows||[]; const income=list.filter(x=>x.kind==="income").reduce((s,x)=>s+Number(x.amount||0),0); const expense=list.filter(x=>x.kind==="expense").reduce((s,x)=>s+Number(x.amount||0),0);
 return <><section className="card"><div className="page-head"><div><span>STAFF ONLY</span><h1>💰 후원금 관리</h1><p className="muted">후원금과 지출을 기록하면 잔여 금액이 자동 계산됩니다.</p></div></div>
 {params.saved&&<div className="flash">저장했습니다.</div>}{(params.error||error)&&<div className="error">저장/조회에 실패했습니다. SQL 적용 여부를 확인하세요.</div>}
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"18px 0"}}><div className="card"><span className="muted">총 후원금</span><h2>{won(income)}</h2></div><div className="card"><span className="muted">총 사용금액</span><h2>{won(expense)}</h2></div><div className="card"><span className="muted">현재 잔여금</span><h2>{won(income-expense)}</h2></div></div>
 <form action="/api/admin/donations" method="post" style={{display:"grid",gridTemplateColumns:"130px 1fr 160px 160px 1fr auto",gap:8,alignItems:"center"}}><select name="kind" defaultValue="income"><option value="income">후원 입금</option><option value="expense">지출</option></select><input name="title" placeholder="후원자 또는 사용처" required/><input name="amount" type="number" min="1" step="1" placeholder="금액" required/><input name="occurred_on" type="date" required/><input name="memo" placeholder="메모 (선택)"/><button className="button primary">내역 추가</button></form></section>
 <section className="card" style={{marginTop:14}}><h2>후원금 입출금 내역</h2><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>날짜</th><th>구분</th><th>후원자/사용처</th><th>금액</th><th>메모</th><th></th></tr></thead><tbody>{list.length?list.map(x=><tr key={x.id}><td>{x.occurred_on}</td><td>{x.kind==="income"?"후원":"지출"}</td><td>{x.title}</td><td>{x.kind==="expense"?"-":"+"}{won(Number(x.amount))}</td><td>{x.memo||"-"}</td><td><form action={`/api/admin/donations/${x.id}`} method="post"><button className="button danger">삭제</button></form></td></tr>):<tr><td colSpan={6} className="muted">등록된 후원/지출 내역이 없습니다.</td></tr>}</tbody></table></div></section></>;
}
