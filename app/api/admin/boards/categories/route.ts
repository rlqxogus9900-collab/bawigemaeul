import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const db = getSupabaseAdmin();

  if (!name) {
    return NextResponse.redirect(new URL("/admin/boards?error=1", request.url), 303);
  }

  const { data: lastCategory } = await db
    .from("board_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await db.from("board_categories").insert({
    name,
    icon: String(form.get("icon") || "💬").trim() || "💬",
    sort_order: Number(lastCategory?.sort_order || 0) + 10,
    access_level: form.get("access_level") === "staff" ? "staff" : "member",
    is_visible: form.get("is_visible") === "on"
  });

  revalidateTag("board-menu", "max");
  revalidatePath("/boards");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
