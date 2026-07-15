import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const nickname = String(form.get("nickname") || "").trim();
  const password = String(form.get("password") || "");
  const remember = form.get("remember") === "on";

  const db = getSupabaseAdmin();
  const { data: member } = await db.from("members").select("*").eq("nickname", nickname).eq("is_active", true).maybeSingle();
  if (!member || !(await verifyPassword(password, member.password_hash))) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  await createSession({ id: member.id, nickname: member.nickname, role: member.role }, remember);
  return NextResponse.redirect(new URL(member.must_change_password ? "/change-password" : "/", request.url), 303);
}
