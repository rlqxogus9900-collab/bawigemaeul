import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const form = await request.formData();
  const direction = String(form.get("direction") || "");
  const db = getSupabaseAdmin();

  const { data: categories } = await db
    .from("board_categories")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const list = categories || [];
  const index = list.findIndex(item => item.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index >= 0 && targetIndex >= 0 && targetIndex < list.length) {
    const current = list[index];
    const target = list[targetIndex];

    await Promise.all([
      db.from("board_categories").update({ sort_order: target.sort_order }).eq("id", current.id),
      db.from("board_categories").update({ sort_order: current.sort_order }).eq("id", target.id)
    ]);
  }

  revalidateTag("board-menu", "max");
  revalidatePath("/boards");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
