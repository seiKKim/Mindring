"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

const assessments = [
  {
    id: "self",
    title: "본인 치매 검사",
    description: "직접 검사를 진행하여 본인의 인지 기능 상태를 확인합니다",
    href: "/services/cognitive/dementia/self",
    imgSrc: "/img/smart8.png",
  },
  {
    id: "family",
    title: "가족 치매 검사",
    description:
      "가족 구성원의 인지 기능을 대리로 평가하여 치매 위험도를 확인합니다",
    href: "/services/cognitive/dementia/family",
    imgSrc: "/img/smart9.png",
  },
];

export default function DementiaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header Title */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">
            온라인 치매 검사
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* 2. Hero Section */}
        <div className="text-center mb-12 space-y-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600">
            치매 위협, 조기에 발견하면 예방할 수 있습니다.
          </h2>

          <div className="w-px h-10 bg-gray-200 mx-auto" />

          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-sm md:text-base break-keep">
            본인 또는 가족의 인지 기능을 평가하여 치매 위험도를 확인할 수
            있습니다.
          </p>
        </div>

        {/* 3. Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {assessments.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col items-center text-center space-y-4 hover:opacity-90 transition-opacity"
            >
              <div className="w-full aspect-[16/10] relative rounded-xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                <Image
                  src={item.imgSrc}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
