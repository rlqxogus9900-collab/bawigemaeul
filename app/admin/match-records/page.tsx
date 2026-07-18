import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MatchRecordManager from "./MatchRecordManager";
export const dynamic="force-dynamic";
export default async function Page(){await requireStaff();const {data}=await getSupabaseAdmin().from('regular_match_results').select('*').order('played_at',{ascending:false});return <MatchRecordManager records={(data||[]) as never[]}/>}
