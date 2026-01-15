"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AssessmentItem {
  id: string;
  title: string;
  href: string;
  image: string;
  bgColor: string;
}

const assessments: AssessmentItem[] = [
  {
    id: "dementia",
    title: "온라인 치매 검사",
    href: "/services/cognitive/dementia",
    image: "/img/smart2.png",
    bgColor: "bg-blue-50",
  },
  {
    id: "brain-health",
    title: "뇌 건강 체크리스트",
    href: "/services/cognitive/brain-health",
    image: "/img/smart3.png",
    bgColor: "bg-purple-50",
  },
  {
    id: "depression",
    title: "노인 우울 척도",
    href: "/services/cognitive/depression",
    image: "/img/smart4.png",
    bgColor: "bg-[#BCAAA4]/20", // Custom brownish tone approximation
  },
  {
    id: "social-network",
    title: "사회적 관계망과 지지척도",
    href: "/services/cognitive/social-network",
    image: "/img/smart5.png",
    bgColor: "bg-sky-100",
  },
  {
    id: "life-satisfaction",
    title: "생활만족도 척도",
    href: "/services/cognitive/life-satisfaction",
    image: "/img/smart6.png",
    bgColor: "bg-orange-50",
  },
  {
    id: "death-anxiety",
    title: "죽음불안 척도",
    href: "/services/cognitive/death-anxiety",
    image: "/img/smart7.png",
    bgColor: "bg-gray-100",
  },
];

export default function SmartCognitivePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Header */}
        <h1 className="text-center text-3xl font-extrabold text-black mb-12 border-b border-cyan-400 pb-8 mx-auto max-w-[200px] md:max-w-none md:w-full md:border-b-0 md:pb-0">
          <span className="md:border-b-0">스마트 인지관리</span>
        </h1>

        {/* Mobile Header Line Fix - The mock has a full width cyan line under the header? 
            Actually it looks like a section divider. Let's stick to a clean layout.
        */}
        <div className="w-full h-px bg-cyan-200 mb-12 hidden md:block"></div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-8">
            나의 뇌와 마음, 지금은 어떤 상태일까요?
          </h2>

          <div className="w-px h-10 bg-gray-200 mx-auto mb-8"></div>

          <p className="text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed text-sm md:text-base break-keep">
            마인드링은 과학적 근거에 기반한 온라인 검사 도구를 통해 인지
            건강부터 정서적 안정, 사회적 관계와 생활 만족도까지 전반적인 뇌 건강
            지표를 <b>스스로 확인</b>할 수 있도록 돕습니다. 지금, 한 번의
            점검으로 나의 마음과 뇌 건강을 <b>살펴보세요.</b>
          </p>

          {/* Hero Image Area */}
          <div className="relative w-full max-w-6xl mx-auto aspect-[2.5/1] bg-[#F5F5F0] rounded-3xl overflow-hidden mb-8 flex items-end justify-center">
            <Image
              src="/img/smart1.png"
              alt="Family Illustration"
              fill
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Assessment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {assessments.map((item) => (
            <Link key={item.id} href={item.href} className="block group">
              <div className="rounded-2xl overflow-hidden bg-gray-50 hover:shadow-lg transition-all duration-300">
                {/* Image Area */}
                <div
                  className={`aspect-[16/10] relative ${item.bgColor} flex items-center justify-center`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                {/* Title Area */}
                <div className="py-6 px-4 text-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {item.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
