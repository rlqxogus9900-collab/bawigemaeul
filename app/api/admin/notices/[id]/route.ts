import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureStaff();
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();

  if (String(form.get("_action") || "") === "delete") {
    await db.from("notices").delete().eq("id", id);
  } else {
    await db.from("notices").update({
      title: String(form.get("title") || "").trim(),
      content: String(form.get("content") || "").trim(),
      is_pinned: form.get("is_pinned") === "on"
    }).eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  return NextResponse.redirect(new URL("/admin/notices", request.url), 303);
}
