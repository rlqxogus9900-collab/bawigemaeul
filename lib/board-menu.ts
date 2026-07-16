import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type CachedBoardCategory = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_visible: boolean;
  access_level: string;
  board_subcategories: {
    id: string;
    category_id: string;
    name: string;
    sort_order: number;
    is_visible: boolean;
    access_level: string;
  }[];
};

export const getCachedBoardMenu = unstable_cache(
  async (): Promise<CachedBoardCategory[]> => {
    const { data } = await getSupabaseAdmin()
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
          sort_order,
          is_visible,
          access_level
        )
      `)
      .order("sort_order", { ascending: true });

    return (data || []) as CachedBoardCategory[];
  },
  ["board-sidebar-menu-v1"],
  {
    revalidate: 300,
    tags: ["board-menu"]
  }
);
