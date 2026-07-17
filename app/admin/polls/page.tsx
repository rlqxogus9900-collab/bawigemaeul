import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import PollAdminClient from "./PollAdminClient";

export const dynamic = "force-dynamic";

export default async function PollAdminPage() {
  await requireStaff();
  const db = getSupabaseAdmin();

  const { data: polls } = await db
    .from("board_polls")
    .select(`
      id,
      post_id,
      poll_type,
      status,
      match_at,
      vote_deadline,
      is_auction_source,
      board_posts (
        title,
        subcategory_id,
        author_nickname
      )
    `)
    .eq("poll_type", "regular_match")
    .order("created_at", { ascending: false });

  const pollIds = (polls || []).map(poll => poll.id);

  const { data: attendingOptions } = pollIds.length
    ? await db
        .from("board_poll_options")
        .select("id,poll_id")
        .in("poll_id", pollIds)
        .eq("label", "참가")
    : { data: [] };

  const attendingOptionIds = (attendingOptions || []).map(option => option.id);

  const { data: attendingVotes } = attendingOptionIds.length
    ? await db
        .from("board_poll_votes")
        .select("poll_id,option_id,member_id,member_nickname")
        .in("option_id", attendingOptionIds)
    : { data: [] };

  const { data: captains } = pollIds.length
    ? await db
        .from("board_poll_captains")
        .select("poll_id,member_id,member_nickname")
        .in("poll_id", pollIds)
    : { data: [] };

  return (
    <PollAdminClient
      polls={(polls || []) as never[]}
      attendingVotes={(attendingVotes || []) as never[]}
      captains={(captains || []) as never[]}
    />
  );
}
