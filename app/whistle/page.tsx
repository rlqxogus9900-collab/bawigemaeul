import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import WhistleClient from "./WhistleClient";

export const dynamic = "force-dynamic";

export default async function WhistlePage() {
  const [user, result] = await Promise.all([
    getSession(),
    getSupabaseAdmin()
      .from("whistle_reports")
      .select("id,category,title,content,is_anonymous,display_name,image_url,status,staff_reply,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  return <WhistleClient reports={result.data || []} loggedIn={!!user} />;
}
