import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import PlayerStatManager from "./PlayerStatManager";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const [{ data: members }, { data: stats }] = await Promise.all([
    db.from("members").select("id,nickname").eq("is_active", true).order("nickname"),
    db.from("regular_match_player_stats").select("id,member_id,line,kills,deaths,assists,is_win,played_at").order("played_at", { ascending: false }).limit(300)
  ]);
  const memberMap = new Map((members || []).map((m: any) => [m.id, m.nickname]));
  const records = (stats || []).map((x: any) => ({ ...x, nickname: memberMap.get(x.member_id) || "탈퇴/삭제된 클랜원" }));
  return <PlayerStatManager members={(members || []) as never[]} records={records as never[]} />;
}
