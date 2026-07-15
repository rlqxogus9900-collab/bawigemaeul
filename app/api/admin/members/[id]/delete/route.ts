import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireStaff();
  const { id } = await params;

  if (currentUser.id === id) {
    return NextResponse.redirect(new URL("/admin/members?error=self", request.url), 303);
  }

  await getSupabaseAdmin().from("members").delete().eq("id", id);
  return NextResponse.redirect(new URL("/admin/members?saved=1", request.url), 303);
}
