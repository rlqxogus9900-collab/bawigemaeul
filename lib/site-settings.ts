import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SiteSettings = {
  activity_days: number;
  notice_notifications: boolean;
  regular_match_notifications: boolean;
  event_notifications: boolean;
  homepage_popup: boolean;
};

export const defaultSiteSettings: SiteSettings = {
  activity_days: 7,
  notice_notifications: true,
  regular_match_notifications: true,
  event_notifications: true,
  homepage_popup: true
};

export async function getSiteSettings(): Promise<SiteSettings>{
  const { data, error } = await getSupabaseAdmin().from("site_settings").select("settings").eq("id","main").maybeSingle();
  if(error || !data?.settings) return defaultSiteSettings;
  return {...defaultSiteSettings,...(data.settings as Partial<SiteSettings>)};
}
