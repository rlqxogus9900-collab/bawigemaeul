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

  return <PollAdminClient polls={(polls || []) as never[]} />;
}
