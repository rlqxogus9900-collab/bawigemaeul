import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function parseKoreanDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed) ? trimmed : `${trimmed}:00+09:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

  const parsedMatchAt = parseKoreanDateTime(matchAt);
  const parsedDeadline = parseKoreanDateTime(voteDeadline);
  if (!parsedMatchAt || !parsedDeadline) {
    return NextResponse.json({ message: "경기 시간 또는 투표 마감 시간을 확인해주세요." }, { status: 400 });
  }
  if (parsedDeadline.getTime() > parsedMatchAt.getTime()) {
    return NextResponse.json({ message: "투표 마감 시간은 경기 시작 시간보다 늦을 수 없습니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("regular_match_events")
    .insert({
      title,
      description: description || null,
      match_at: parsedMatchAt.toISOString(),
      vote_deadline: parsedDeadline.toISOString(),
      status: "open"
    });

  if (error) {
    return NextResponse.json({ message: "정기내전 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
