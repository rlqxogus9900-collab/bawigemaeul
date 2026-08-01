import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";
export default async function SignupApprovalsPage(){
  await requireStaff(); const db=getSupabaseAdmin();
  const {data:rows}=await db.from("members").select("id,nickname,riot_id,current_tier,match_tier,main_line,sub_line,notes,approval_status,created_at,rejection_reason").in("approval_status",["pending","rejected"]).order("created_at",{ascending:false});
  return <section className="card"><div className="member-page-head"><div><span>STAFF ONLY</span><h1>가입 승인 관리</h1><p className="muted">클랜원이 직접 신청한 정보를 확인하고 승인합니다.</p></div></div>
    <div style={{display:"grid",gap:14,marginTop:20}}>{(rows||[]).map(m=><article className="card" key={m.id} style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}><div><h3 style={{margin:"0 0 8px"}}>{m.nickname} <small className="muted">{m.riot_id}</small></h3><p className="muted" style={{margin:0}}>현재티어 {m.current_tier||"미정"} · 내전티어 {m.match_tier||"미정"} · 주 {m.main_line||"미정"} · 부 {m.sub_line||"미정"}</p><p style={{marginBottom:0}}>참고사항: {m.notes||"없음"}</p>{m.approval_status==="rejected"&&<p className="error">반려 사유: {m.rejection_reason||"없음"}</p>}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><form action={`/api/admin/signup-approvals/${m.id}/approve`} method="post"><button className="button primary">승인</button></form><form className="form" action={`/api/admin/signup-approvals/${m.id}/reject`} method="post" style={{display:"flex",gap:8}}><input name="reason" placeholder="반려 사유" required/><button className="button danger">반려</button></form></div></div>
    </article>)}{!rows?.length&&<div className="muted">승인 대기 신청이 없습니다.</div>}</div>
  </section>
}
