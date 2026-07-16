import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import RegularMatchManager from "./RegularMatchManager";

export const dynamic = "force-dynamic";

export default async function RegularMatchAdminPage() {
  await requireStaff();
  const db = getSupabaseAdmin();

  const [
    { data: events },
    { data: members },
    { data: votes },
    { data: captains }
  ] = await Promise.all([
    db
      .from("regular_match_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("members")
      .select("id,nickname,riot_id,match_tier,main_line,is_active")
      .eq("is_active", true)
      .order("nickname", { ascending: true }),
    db
      .from("regular_match_votes")
      .select("event_id,member_id,member_nickname,choice"),
    db
      .from("regular_match_captains")
      .select("event_id,member_id,member_nickname,team_name")
  ]);

  return (
    <RegularMatchManager
      events={(events || []) as never[]}
      members={(members || []) as never[]}
      votes={(votes || []) as never[]}
      captains={(captains || []) as never[]}
    />
  );
}
