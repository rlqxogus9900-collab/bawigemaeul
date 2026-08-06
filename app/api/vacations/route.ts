import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);
  const form = await request.formData();
  const startDate = String(form.get("start_date") || "");
  const endDate = String(form.get("end_date") || "");
  const reason = String(form.get("reason") || "").trim();
  const memo = String(form.get("memo") || "").trim();
  if (!startDate || !endDate || !reason || endDate < startDate) {
    return NextResponse.redirect(new URL("/vacation?error=invalid", request.url), 303);
  }
  const db = getSupabaseAdmin();
  const { error } = await db.from("member_vacations").insert({
    member_id: user.id, start_date: startDate, end_date: endDate, reason, memo: memo || null
  });
  if (error) return NextResponse.redirect(new URL("/vacation?error=save", request.url), 303);

  const { data: staff } = await db.from("members").select("id").eq("role", "staff").eq("is_active", true);
  if (staff?.length) {
    await db.from("notifications").insert(staff.map(row => ({
      member_id: row.id,
      type: "system",
      title: "🏖️ 새 휴가 신청",
      message: `${user.nickname}님이 ${startDate} ~ ${endDate} 휴가를 신청했습니다. 사유: ${reason}`,
      link: "/admin/vacations"
    })));
  }
  return NextResponse.redirect(new URL("/vacation?saved=1", request.url), 303);
}
