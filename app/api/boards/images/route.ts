import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "board-images";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "JPG, PNG, WEBP, GIF만 업로드할 수 있습니다." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "이미지는 8MB 이하여야 합니다." }, { status: 400 });

  const db = getSupabaseAdmin();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "이미지 저장소 업로드에 실패했습니다. 추가 SQL을 먼저 실행해주세요." }, { status: 500 });
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
