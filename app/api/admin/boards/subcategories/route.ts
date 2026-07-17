import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const categoryId = String(form.get("category_id") || "");
  const name = String(form.get("name") || "").trim();
  const db = getSupabaseAdmin();

  if (!categoryId || !name) {
    return NextResponse.redirect(new URL("/admin/boards?error=1", request.url), 303);
  }

  const { data: lastSubcategory } = await db
    .from("board_subcategories")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await db.from("board_subcategories").insert({
    category_id: categoryId,
    name,
    description: String(form.get("description") || "").trim() || null,
    sort_order: Number(lastSubcategory?.sort_order || 0) + 10,
    access_level: form.get("access_level") === "staff" ? "staff" : "member",
    is_visible: form.get("is_visible") === "on"
  });

  revalidateTag("board-menu", "max");
  revalidatePath("/boards");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
