import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import SettingsManager from "./SettingsManager";

export const dynamic = "force-dynamic";

const defaults = {
  activity_days: 7,
  notice_notifications: true,
  regular_match_notifications: true,
  event_notifications: true,
  homepage_popup: true
};

export default async function Page(){
  await requireStaff();
  const { data } = await getSupabaseAdmin().from("site_settings").select("settings").eq("id","main").maybeSingle();
  return <SettingsManager initial={{...defaults,...((data?.settings as object)||{})}}/>;
}
