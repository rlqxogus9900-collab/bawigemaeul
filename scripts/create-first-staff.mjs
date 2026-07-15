import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const [nickname, riotId] = process.argv.slice(2);
if (!nickname || !riotId) {
  console.error('사용법: node scripts/create-first-staff.mjs "바위게" "바위게#KR1"');
  process.exit(1);
}
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const password_hash=await bcrypt.hash("1234",12);
const {error}=await db.from("members").insert({nickname,riot_id:riotId,role:"staff",password_hash,must_change_password:true});
if(error){console.error(error);process.exit(1)}
console.log("운영진 계정 생성 완료. 초기 비밀번호: 1234");
