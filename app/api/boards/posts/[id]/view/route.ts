import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const VIEW_COOKIE_SECONDS = 30 * 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  const cookieStore = await cookies();
  const cookieName = `bawi_view_${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const { data: post } = await db
    .from("board_posts")
    .select("id,view_count")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ message: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  let count = Number(post.view_count || 0);
  const alreadyViewed = cookieStore.get(cookieName)?.value === "1";

  if (!alreadyViewed) {
    count += 1;
    await db.from("board_posts").update({ view_count: count }).eq("id", id);
  }

  const response = NextResponse.json({ count, counted: !alreadyViewed });
  if (!alreadyViewed) {
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: VIEW_COOKIE_SECONDS
    });
  }
  return response;
}
