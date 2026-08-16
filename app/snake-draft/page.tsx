import { getSession } from "@/lib/session";
import SnakeDraftClient from "./SnakeDraftClient";

export const dynamic = "force-dynamic";
export default async function SnakeDraftPage(){
  const user=await getSession();
  return <SnakeDraftClient isStaff={user?.role === "staff"} />;
}
