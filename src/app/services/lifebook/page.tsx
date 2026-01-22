// app/services/lifebook/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  BookOpen,
  PenTool,
  Sparkles,
  Camera,
  History,
  Heart,
} from "lucide-react";

export default function LifebookPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse opacity-50"></div>
            <Image
              src="/img/icon_2.png"
              alt="라이프북"
              fill
              className="object-contain relative z-10 p-2"
            />
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              당신의 삶, <span className="text-blue-600">한 권의 책</span>이
              되다
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              AI가 당신의 소중한 추억을 듣고, 정리하여
              <br className="hidden sm:block" />
              세상에 하나뿐인 자서전으로 만들어드립니다.
            </p>
          </div>
          <div className="pt-4">
            <Link
              href="/dashboard/create-work"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <BookOpen className="w-5 h-5" />
              나만의 라이프북 만들기
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              특별한 순간을 영원히
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              지나온 삶의 발자취를 아름답게 기록하세요. 라이프북이 도와드립니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI 인터뷰 & 글쓰기</h3>
              <p className="text-gray-500 leading-relaxed">
                전문 작가처럼 대화하듯 질의응답을 진행하면, AI가 당신의 이야기를
                아름다운 문장으로 다듬어줍니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">추억의 사진첩</h3>
              <p className="text-gray-500 leading-relaxed">
                빛바랜 옛 사진들을 디지털로 복원하고 이야기 옆에 나란히 담아
                감동을 더합니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                <History className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">시대별 연대기</h3>
              <p className="text-gray-500 leading-relaxed">
                유년기부터 현재까지, 당신의 역사를 연대기 순으로 깔끔하게
                정리하여 보여드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-8">
              <h2 className="text-3xl font-bold text-gray-900">
                가장 쉬운 <br />
                <span className="text-blue-600">자서전 만들기</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">주제 선택하기</h4>
                    <p className="text-gray-500">
                      원하는 주제를 선택하거나 AI가 제안하는 질문에 답해보세요.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">이야기 들려주기</h4>
                    <p className="text-gray-500">
                      친구에게 말하듯 편안하게 이야기하면 AI가 글로 옮깁니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">책으로 완성하기</h4>
                    <p className="text-gray-500">
                      작성된 글과 사진을 모아 한 권의 책으로 엮어냅니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-100 p-8 flex items-center justify-center">
                {/* Decorative Abstract Book Representation */}
                <div className="relative w-64 h-80 bg-white shadow-2xl rounded-r-2xl rounded-l-sm border-l-4 border-gray-200 transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                  <div className="absolute inset-0 p-8 flex flex-col">
                    <div className="w-full h-1/2 bg-blue-50 rounded-lg mb-4 flex items-center justify-center">
                      <Image
                        src="/img/icon_2.png"
                        width={60}
                        height={60}
                        alt="Book Icon"
                        className="opacity-80"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                    </div>
                    <div className="mt-auto self-end">
                      <Heart className="w-6 h-6 text-red-400 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">
            지금 시작하세요. <br />
            당신의 이야기는 <span className="text-blue-600">보석</span>입니다.
          </h2>
          <p className="text-gray-500 text-lg">
            가족에게 남기는 가장 소중한 선물, 라이프북으로 준비해보세요.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard/create-work"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white text-lg font-bold rounded-full hover:bg-gray-800 transition-all shadow-lg"
            >
              <PenTool className="w-5 h-5" />
              글쓰기 시작
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-full border border-gray-200 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
            >
              다른 서비스 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
