import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { deleteMemberCompletely } from "@/lib/delete-member-completely";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireStaff();
  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json({ message: "본인 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: target } = await db
    .from("members")
    .select("id,nickname,riot_id,role")
    .eq("id", id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ message: "클랜원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (target.role === "staff") {
    const { count } = await db
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("role", "staff")
      .eq("is_active", true);
    if ((count || 0) <= 1) {
      return NextResponse.json({ message: "마지막 운영진 계정은 삭제할 수 없습니다." }, { status: 400 });
    }
  }

  const result = await deleteMemberCompletely(db, target);
  if (result.error) {
    return NextResponse.json(
      { message: `완전 삭제에 실패했습니다: ${result.error}` },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireStaff();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "수정할 정보를 확인하세요." }, { status: 400 });
  }

  const normalized = {
    nickname: String(body.nickname || "").trim(),
    riot_id: String(body.riot_id || "").trim(),
    current_tier: String(body.current_tier || "").trim() || null,
    highest_tier: String(body.highest_tier || "").trim() || null,
    average_tier: String(body.average_tier || "").trim() || null,
    match_tier: body.match_tier == null ? null : Number(body.match_tier),
    main_line: String(body.main_line || "미정"),
    sub_line: String(body.sub_line || "미정"),
    role: body.role === "staff" ? "staff" : "member",
    activity_status: body.activity_status === "active" ? "active" : "inactive",
    activity_excluded: Boolean(body.activity_excluded),
    is_active: Boolean(body.is_active),
    staff_note: String(body.staff_note || "").trim() || null
  };

  if (!normalized.nickname || !normalized.riot_id.includes("#")) {
    return NextResponse.json({ message: "닉네임과 Riot ID를 확인하세요." }, { status: 400 });
  }
  if (normalized.match_tier !== null && ![1, 2, 3, 4, 5].includes(normalized.match_tier)) {
    return NextResponse.json({ message: "내전티어는 1~5만 사용할 수 있습니다." }, { status: 400 });
  }
  if (currentUser.id === id && (normalized.role !== "staff" || !normalized.is_active)) {
    return NextResponse.json({ message: "본인 운영진 계정의 권한 또는 상태는 변경할 수 없습니다." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const [{ data: nicknameDup }, { data: riotDup }] = await Promise.all([
    db.from("members").select("id").eq("nickname", normalized.nickname).neq("id", id).limit(1),
    db.from("members").select("id").eq("riot_id", normalized.riot_id).neq("id", id).limit(1)
  ]);
  if (nicknameDup?.length) return NextResponse.json({ message: "이미 사용 중인 닉네임입니다." }, { status: 409 });
  if (riotDup?.length) return NextResponse.json({ message: "이미 등록된 Riot ID입니다." }, { status: 409 });

  const { data: updated, error } = await db
    .from("members")
    .update(normalized)
    .eq("id", id)
    .select("id,nickname,riot_id,current_tier,highest_tier,average_tier,match_tier,main_line,sub_line,role,activity_status,activity_excluded,is_active,staff_note")
    .maybeSingle();

  if (error) return NextResponse.json({ message: `저장 실패: ${error.message}` }, { status: 500 });
  if (!updated) return NextResponse.json({ message: "대상 회원을 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ ok: true, member: updated, savedAt: new Date().toISOString() });
}
