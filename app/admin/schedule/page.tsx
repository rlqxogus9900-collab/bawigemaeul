import Link from 'next/link';
import {requireStaff} from '@/lib/session';
import {getSupabaseAdmin} from '@/lib/supabase-admin';
import ScheduleManager from './ScheduleManager';
export const dynamic='force-dynamic';
export default async function Page(){await requireStaff();const {data}=await getSupabaseAdmin().from('regular_match_events').select('id,title,match_at,vote_deadline,status').order('match_at',{ascending:false}).limit(30);return <div className="admin-functional-page"><section className="card"><div className="dashboard-head"><div><span>STAFF ONLY</span><h1>일정 관리</h1><p className="muted">정기내전 모집 일정과 투표를 바로 관리합니다.</p></div></div><div className="admin-shortcuts"><Link className="button primary" href="/admin/regular-match">일정·모집 만들기</Link><Link className="button" href="/admin/polls">참가 투표 관리</Link><Link className="button" href="/schedule">클랜원 일정 화면</Link></div></section><section className="card"><div className="dashboard-head"><div><span>SCHEDULES</span><h2>등록 일정</h2></div></div><ScheduleManager events={(data||[]) as any}/></section></div>}
