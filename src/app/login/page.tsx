// app/(public)/login/page.tsx

import Link from "next/link";
import Image from "next/image";
import LoginForm from "./Loginform"; // 대소문자 일치!
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - DigitalNote",
  description: "DigitalNote에 로그인하여 디지털 자서전과 인생그래프를 만들어보세요.",
};

type SP = Record<string, string | string[] | undefined>;
const firstString = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp = ((await searchParams) ?? {}) as SP;
  const error = firstString(sp?.error) ?? "";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full flex justify-center">
            <LoginForm initialError={error} />
          </div>
        </div>
      </main>
    </div>
  );
}
