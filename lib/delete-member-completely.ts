import type { SupabaseClient } from "@supabase/supabase-js";

type TargetMember = {
  id: string;
  nickname: string;
  riot_id?: string | null;
  role?: string | null;
};

/**
 * 명단 제외를 계정 비활성화가 아닌 완전 삭제로 처리합니다.
 * 투표·알림·통계 등 회원에게 직접 귀속된 데이터는 제거하고,
 * 게시글/댓글처럼 기록 보존이 필요한 데이터는 FK의 ON DELETE SET NULL을 따릅니다.
 */
export async function deleteMemberCompletely(
  db: SupabaseClient,
  target: TargetMember
): Promise<{ error: string | null }> {
  const memberIdTables = [
    "notifications",
    "board_post_bookmarks",
    "board_post_likes",
    "board_poll_votes",
    "board_poll_abstentions",
    "regular_match_votes",
    "regular_match_captains",
    "regular_match_player_stats",
    "activity_exclusions"
  ];

  for (const table of memberIdTables) {
    // 일부 오래된 DB에는 특정 테이블이 없을 수 있으므로 없는 테이블 오류는 무시합니다.
    await db.from(table).delete().eq("member_id", target.id);
  }

  // 경매 참가/입찰 정보도 삭제해 재가입 시 이전 경매 상태가 붙지 않게 합니다.
  await db.from("auction_players").delete().eq("member_id", target.id);
  await db.from("auction_bids").delete().eq("bidder_member_id", target.id);
  await db.from("auction_teams").update({ captain_member_id: null }).eq("captain_member_id", target.id);

  // 본인이 생성자로 남은 참조는 삭제를 막지 않도록 비웁니다.
  await db.from("activity_exclusions").update({ created_by: null }).eq("created_by", target.id);
  await db.from("auction_rooms").update({ created_by: null }).eq("created_by", target.id);

  // 후원 아이콘은 닉네임 기반 데이터라 별도로 제거합니다.
  await db.from("sponsors").delete().eq("sponsor_nickname", target.nickname);
  await db.from("sponsors").delete().eq("display_name", target.nickname);

  const { error } = await db.from("members").delete().eq("id", target.id);
  return { error: error?.message || null };
}
