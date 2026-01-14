// app/(public)/login/LoginForm.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = { initialError?: string };

export default function LoginForm({ initialError = "" }: Props) {
  const searchParams = useSearchParams();
  const [isPending] = useTransition();

  // 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState<string>(initialError);

  useEffect(() => {
    if (initialError) setErr(initialError);
  }, [initialError]);

  const formValid = email && password && !isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!email || !password) {
      setErr("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      if (!res.ok) {
        const j = await safeJson(res);
        setErr(humanizeError(j?.error ?? "로그인에 실패했어요. 다시 시도해주세요."));
        return;
      }
      const returnUrl = searchParams.get("returnUrl");
      const redirectPath = returnUrl ? decodeURIComponent(returnUrl) : "/";
      
      // Force hard refresh to update server components with new cookie
      window.location.href = redirectPath;
    } catch {
      setErr("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* 제목 - 박스 밖 */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">로그인</h1>
        <p className="text-sm text-gray-600">
          마인드링 스마트인지지구 솔루션에 오신것을 환영합니다.
        </p>
      </div>

      {/* 로그인 카드 - 정사각형 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-[700px] min-h-[700px] flex flex-col px-10 py-8 sm:px-16 sm:py-12">
        {/* 에러 메시지 */}
        {err && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {err}
          </div>
        )}

        {/* 폼 */}
        <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          {/* 이메일주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="이메일을 입력해주세요."
              autoComplete="email"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="비밀번호를 입력해주세요."
              autoComplete="current-password"
            />
          </div>

          {/* 아이디 저장 체크박스 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
              아이디 저장
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={!formValid}
            className="w-full bg-black text-white py-3.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "로그인 중..." : "로그인"}
          </button>

          {/* 헬퍼 링크 */}
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
            <Link href="/find-id" className="hover:text-gray-900">
              아이디 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/reset-password" className="hover:text-gray-900">
              비밀번호 재설정
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/signup" className="hover:text-gray-900">
              회원가입
            </Link>
          </div>
        </form>

        {/* 구분선 */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-sm text-gray-600 font-medium">
              다른 방법으로 로그인
            </span>
          </div>
        </div>

        {/* 소셜 로그인 */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="/api/auth/kakao/start"
            aria-label="카카오로 로그인"
            className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors"
          >
            <span className="sr-only">카카오</span>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#000000">
              <path d="M12 3C6.5 3 2 6.58 2 11c0 2.95 2.05 5.5 5.05 6.95L5.5 21.5l4.5-2.95c.65.1 1.3.15 2 .15 5.5 0 10-3.58 10-8S17.5 3 12 3z"/>
            </svg>
          </a>
          <a
            href="/api/auth/naver/start"
            aria-label="네이버로 로그인"
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <span className="sr-only">네이버</span>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
          </a>
          <a
            href="/api/auth/google/start"
            aria-label="구글로 로그인"
            className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="sr-only">구글</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </a>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 bg-gray-50 rounded-lg px-4 py-4 space-y-2">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>로그인 시 이메일 주소를 업데이트하세요.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>이메일 확인은 이메일 찾기를 이용해주세요.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function humanizeError(codeOrMsg: string) {
  switch (codeOrMsg) {
    case "INVALID_CREDENTIALS":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "TOO_MANY_REQUESTS":
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    default:
      return codeOrMsg;
  }
}
