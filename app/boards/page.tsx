import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BoardBrowser from "./BoardBrowser";

export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 15;

export default async function BoardsPage({
  searchParams
}: {
  searchParams: Promise<{ board?: string; q?: string; page?: string; sort?: string }>
}) {
  const user = await getSession();
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const query = String(params.q || "").trim().slice(0, 50);
  const requestedPage = Math.max(1, Number.parseInt(String(params.page || "1"), 10) || 1);
  const sort = ["latest", "popular", "views", "comments"].includes(String(params.sort))
    ? String(params.sort)
    : "latest";

  const canSee = (level: string | null) =>
    level !== "staff" || user?.role === "staff";

  const { data: categories } = await db
    .from("board_categories")
    .select(`
      id,name,icon,sort_order,is_visible,access_level,
      board_subcategories (
        id,category_id,name,description,sort_order,is_visible,access_level
      )
    `)
    .order("sort_order", { ascending: true });

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

  let totalCount = 0;
  let posts: unknown[] = [];
  let currentPage = requestedPage;

  if (selectedBoardId) {
    const safeQuery = query.replace(/[,%]/g, " ").trim();
    let countQuery = db
      .from("board_posts")
      .select("id", { count: "exact", head: true })
      .eq("subcategory_id", selectedBoardId);

    if (safeQuery) {
      countQuery = countQuery.or(
        `title.ilike.%${safeQuery}%,author_nickname.ilike.%${safeQuery}%`
      );
    }

    const { count } = await countQuery;
    totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));
    currentPage = Math.min(requestedPage, totalPages);
    const from = (currentPage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    let postsQuery = db
      .from("board_posts")
      .select("id,title,author_member_id,author_nickname,is_pinned,view_count,comment_count,like_count,post_type,created_at,subcategory_id")
      .eq("subcategory_id", selectedBoardId)
      .order("is_pinned", { ascending: false });

    if (sort === "popular") {
      postsQuery = postsQuery
        .order("like_count", { ascending: false })
        .order("comment_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort === "views") {
      postsQuery = postsQuery
        .order("view_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort === "comments") {
      postsQuery = postsQuery
        .order("comment_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      postsQuery = postsQuery.order("created_at", { ascending: false });
    }

    postsQuery = postsQuery.range(from, to);

    if (safeQuery) {
      postsQuery = postsQuery.or(
        `title.ilike.%${safeQuery}%,author_nickname.ilike.%${safeQuery}%`
      );
    }

    const result = await postsQuery;
    posts = result.data || [];
  }

  return (
    <BoardBrowser
      categories={normalized as never[]}
      posts={posts as never[]}
      selectedBoardId={selectedBoardId}
      query={query}
      canWrite={Boolean(user)}
      isStaff={user?.role === "staff"}
      currentPage={currentPage}
      totalCount={totalCount}
      postsPerPage={POSTS_PER_PAGE}
      sort={sort}
    />
  );
}
