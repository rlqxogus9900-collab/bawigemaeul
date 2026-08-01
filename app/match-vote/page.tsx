import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MatchVoteClient from "./MatchVoteClient";

export const dynamic = "force-dynamic";

export default async function MatchVotePage() {
  const user = await getSession();
  const db = getSupabaseAdmin();

  const { data: events } = await db
    .from("regular_match_events")
    .select("id,title,description,match_at,vote_deadline,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const eventIds = (events || []).map(event => event.id);
  const { data: votes } = eventIds.length
    ? await db
        .from("regular_match_votes")
        .select("event_id,member_id,member_nickname,choice")
        .in("event_id", eventIds)
    : { data: [] };

  const memberIds = Array.from(new Set((votes || []).map(vote => vote.member_id).filter(Boolean)));
  const { data: memberProfiles } = memberIds.length
    ? await db
        .from("members")
        .select("id,nickname,match_tier,main_line,sub_line,reference_note")
        .in("id", memberIds)
    : { data: [] };

  return (
    <MatchVoteClient
      events={(events || []) as never[]}
      votes={(votes || []) as never[]}
      currentUserId={user?.id || null}
      isStaff={user?.role === "staff"}
      memberProfiles={(memberProfiles || []) as never[]}
    />
  );
}
