import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await ensureStaff();
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();

  if (title && content) {
    await getSupabaseAdmin().from("notices").insert({
      title,
      content,
      is_pinned: form.get("is_pinned") === "on"
    });
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  return NextResponse.redirect(new URL("/admin/notices", request.url), 303);
}
