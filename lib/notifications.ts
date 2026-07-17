import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type NotificationType = "notice" | "poll" | "comment" | "system";

export async function notifyAllActiveMembers(input: {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  excludeMemberId?: string;
}) {
  const db = getSupabaseAdmin();
  let query = db
    .from("members")
    .select("id")
    .eq("is_active", true);

  if (input.excludeMemberId) {
    query = query.neq("id", input.excludeMemberId);
  }

  const { data: members } = await query;
  if (!members?.length) return;

  const rows = members.map(member => ({
    member_id: member.id,
    type: input.type,
    title: input.title.slice(0, 120),
    message: (input.message || "").slice(0, 300),
    link: input.link || null
  }));

  await db.from("notifications").insert(rows);
}

export async function notifyMember(input: {
  memberId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) {
  await getSupabaseAdmin().from("notifications").insert({
    member_id: input.memberId,
    type: input.type,
    title: input.title.slice(0, 120),
    message: (input.message || "").slice(0, 300),
    link: input.link || null
  });
}
