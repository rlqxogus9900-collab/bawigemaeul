import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureStaff();
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();

  if (String(form.get("_action") || "") === "delete") {
    await db.from("whistle_reports").delete().eq("id", id);
  } else {
    const rawStatus = String(form.get("status") || "pending");
    const status = ["pending", "reviewing", "completed"].includes(rawStatus) ? rawStatus : "pending";
    await db.from("whistle_reports").update({
      status,
      staff_reply: String(form.get("staff_reply") || "").trim() || null,
      answered_at: status === "completed" ? new Date().toISOString() : null
    }).eq("id", id);
  }

  revalidatePath("/whistle");
  revalidatePath("/admin");
  revalidatePath("/admin/whistle");
  return NextResponse.redirect(new URL("/admin/whistle", request.url), 303);
}
