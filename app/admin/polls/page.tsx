import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PollAdminPage() {
  await requireStaff();
  redirect("/admin/regular-match");
}
