// lib/session.ts

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

const COOKIE = "dn.sid";
const SECRET = process.env.SESSION_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN; // 예: ".mindring.com"

// 빌드 시에만 기본값 허용, 프로덕션에서는 반드시 환경 변수 필요
if (!SECRET) {
  if (IS_PROD) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  } else {
    console.warn("⚠️ SESSION_SECRET not set, using development default. Do not use in production!");
  }
}

// 프로덕션에서는 환경 변수 필수, 개발 환경에서는 기본값 사용
const SESSION_SECRET: string = SECRET || "dev-secret-not-for-production-use-only-fallback";

/** HMAC 서명/검증 */
function sign(value: string) {
  const sig = createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string | undefined | null) {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const val = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expect = createHmac("sha256", SESSION_SECRET).update(val).digest("hex");
  try {
    // 상수 시간 비교
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? val : null;
  } catch {
    return null;
  }
}

/** 세션 발급
 * @param userId 사용자 ID
 * @param rememberMe "로그인 유지" 체크 여부. 
 *   - true: 30일(EXTENDED)
 *   - false: 7일(STANDARD)
 *   - 단, 실제 DB/Cookie 만료는 "1시간(idle)"으로 설정 후 지속 갱신(슬라이딩).
 *     최대 수명(MaxAge)는 createdAt 기준으로 7일/30일 제한.
 */
export async function issueSession(
  userId: string,
  rememberMe: boolean = false
) {
  // Persistence Type 설정 (uaFingerprint에 저장하여 스키마 변경 회피)
  // TYPE:STANDARD (7일) or TYPE:EXTENDED (30일)
  const persistenceType = rememberMe ? "TYPE:EXTENDED" : "TYPE:STANDARD";
  
  // 1시간 유휴 타임아웃 (Sliding Window 시작)
  // 사용자가 1시간 동안 활동이 없으면 만료됨.
  const idleTimeoutHours = 1; 
  const expiresAt = new Date(Date.now() + idleTimeoutHours * 3600 * 1000);

  const sessionId = randomBytes(12).toString("hex");

  await prisma.session.create({
    data: {
      sessionId,
      userId,
      expiresAt,
      uaFingerprint: persistenceType, // 스키마 변경 없이 타입 저장
    },
  });

  const isLocal = !IS_PROD; 
  const jar = await cookies();
  
  // 쿠키 수명은 "최대 수명"으로 설정 (브라우저는 닫아도 유지되도록)
  // 실제 유휴 만료는 서버(DB expiresAt)에서 검증.
  const maxAgeDays = rememberMe ? 30 : 7;
  const cookieExpires = new Date(Date.now() + maxAgeDays * 24 * 3600 * 1000); // 7일 or 30일

  jar.set({
    name: COOKIE,
    value: sign(sessionId),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    expires: cookieExpires,
    ...((COOKIE_DOMAIN && !isLocal) ? { domain: COOKIE_DOMAIN } : {}),
  });
}

/** 현재 세션 조회 (Sliding Expiration 적용) */
export async function getSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  
  if (!raw) return null;
  const sid = unsign(raw);
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { sessionId: sid },
  });
  
  if (!session) return null;
  if (session.revokedAt) return null;

  const now = new Date();

  // 1. Idle Timeout 검사 (DB expiresAt 기준)
  if (session.expiresAt < now) {
    console.log(`[SESSION] Expired due to idle: ${session.expiresAt}`);
    return null;
  }

  // 2. Absolute Max Age 검사 (createdAt 기준)
  // uaFingerprint에 저장된 타입 파싱
  const isExtended = session.uaFingerprint?.startsWith("TYPE:EXTENDED");
  const maxAgeDays = isExtended ? 30 : 7;
  const absoluteExpiry = new Date(session.createdAt.getTime() + maxAgeDays * 24 * 3600 * 1000);

  if (now > absoluteExpiry) {
    console.log(`[SESSION] Expired due to absolute max age: ${maxAgeDays} days`);
    return null;
  }

  // 3. Sliding Extension (1시간 연장)
  // 매번 DB 업데이트는 부하가 크므로, 만료가 30분 이내로 남았을 때만 연장
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  const shouldExtend = timeRemaining < 30 * 60 * 1000; // 30분 미만 남음

  if (shouldExtend) {
    // 다음 만료 시간: 현재 + 1시간
    let nextExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    
    // 단, 절대 수명을 초과할 수 없음
    if (nextExpiresAt > absoluteExpiry) {
      nextExpiresAt = absoluteExpiry;
    }

    // DB 업데이트 (Fire & Forget 추천하지만 안전하게 await)
    try {
      await prisma.session.update({
        where: { sessionId: session.sessionId },
        data: { expiresAt: nextExpiresAt },
      });
      // console.log(`[SESSION] Valid & Extended to ${nextExpiresAt}`);
    } catch (e) {
      console.error("[SESSION] Failed to extend session", e);
    }
  }

  return session;
}

/** 현재 로그인 사용자 조회 */
export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { userId: session.userId } });
}

// extendSession은 이제 getSession 내부에서 자동 처리되므로, 
// 명시적 호출이 필요하다면 기존 로직 유지하되 필요성 낮음.
// 호환성을 위해 남겨두거나 삭제 가능. 여기서는 유지하되 getSession 사용 유도.
export async function extendSession(hours = 1) {
  // getSession을 호출하면 자동으로 연장 로직이 수행됨.
  const session = await getSession();
  return !!session;
}

/** 세션 폐기(로그아웃) */
export async function revokeSession() {
  const jar = await cookies(); // await 추가
  const raw = jar.get(COOKIE)?.value;
  if (!raw) {
    // 쿠키만 제거 후 종료
    jar.set({ 
      name: COOKIE, 
      value: "", 
      path: "/", 
      expires: new Date(0),
      ...((COOKIE_DOMAIN && IS_PROD) ? { domain: COOKIE_DOMAIN } : {}),
    });
    return;
  }
  const sid = unsign(raw);
  // 쿠키는 항상 제거
  jar.set({ 
    name: COOKIE, 
    value: "", 
    path: "/", 
    expires: new Date(0),
    ...((COOKIE_DOMAIN && IS_PROD) ? { domain: COOKIE_DOMAIN } : {}),
  });
  if (!sid) return;

  try {
    await prisma.session.update({
      where: { sessionId: sid },
      data: { revokedAt: new Date() },
    });
  } catch {
    // 이미 지워졌거나 존재하지 않아도 무시
  }
}

/** 보호 라우트 가드: 없으면 로그인으로 리다이렉트 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?error=UNAUTHORIZED");
  }
  return user;
}
