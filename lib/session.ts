import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "bawi_session";

export type SessionUser = {
  id: string;
  nickname: string;
  role: "member" | "staff";
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET은 32자 이상이어야 합니다.");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser, remember: boolean) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(remember ? "30d" : "12h")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      nickname: String(payload.nickname),
      role: payload.role === "staff" ? "staff" : "member"
    };
  } catch {
    return null;
  }
}

export async function requireStaff() {
  const user = await getSession();
  if (!user || user.role !== "staff") {
    throw new Error("운영진 권한이 필요합니다.");
  }
  return user;
}
