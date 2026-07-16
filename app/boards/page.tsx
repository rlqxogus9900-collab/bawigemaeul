import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BoardBrowser from "./BoardBrowser";

export const dynamic = "force-dynamic";

export default async function BoardsPage({
  searchParams
}: {
  searchParams: Promise<{ board?: string }>
}) {
  const user = await getSession();
  const params = await searchParams;
  const db = getSupabaseAdmin();

  const canSee = (level: string | null) =>
    level !== "staff" || user?.role === "staff";

  const [{ data: categories }, { data: posts }] = await Promise.all([
    db
      .from("board_categories")
      .select(`
        id,
        name,
        icon,
        sort_order,
        is_visible,
        access_level,
        board_subcategories (
          id,
          category_id,
          name,
          description,
          sort_order,
          is_visible,
          access_level
        )
      `)
      .order("sort_order", { ascending: true }),
    db
      .from("board_posts")
      .select("id,title,author_nickname,is_pinned,view_count,comment_count,created_at,subcategory_id")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  const normalized = (categories || [])
    .filter(category => category.is_visible !== false && canSee(category.access_level))
    .map(category => ({
      ...category,
      board_subcategories: [...(category.board_subcategories || [])]
        .filter(sub => sub.is_visible !== false && canSee(sub.access_level))
        .sort((a, b) => a.sort_order - b.sort_order)
    }))
    .filter(category => category.board_subcategories.length > 0);

  const validIds = new Set(
    normalized.flatMap(category => category.board_subcategories.map(sub => sub.id))
  );
  const selectedBoardId =
    params.board && validIds.has(params.board)
      ? params.board
      : normalized[0]?.board_subcategories?.[0]?.id || "";

  return (
    <BoardBrowser
      categories={normalized as never[]}
      posts={(posts || []) as never[]}
      selectedBoardId={selectedBoardId}
    />
  );
}
