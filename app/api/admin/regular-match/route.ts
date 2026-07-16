import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const matchAt = String(form.get("match_at") || "");
  const voteDeadline = String(form.get("vote_deadline") || "");

  if (!title || !matchAt || !voteDeadline) {
    return NextResponse.json({ message: "제목과 일정을 입력해주세요." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("regular_match_events")
    .insert({
      title,
      description: description || null,
      match_at: new Date(matchAt).toISOString(),
      vote_deadline: new Date(voteDeadline).toISOString(),
      status: "open"
    });

  if (error) {
    return NextResponse.json({ message: "정기내전 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
