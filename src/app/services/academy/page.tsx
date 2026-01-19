"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string;
  category: string;
  instructor?: string;
  courseUrl?: string;
  price: number | null;
  duration?: string;
  tags: string[];
  level?: string;
  popularScore: number;
};

type RawCourseData = {
  id?: string;
  courseId?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string;
  category?: string;
  instructor?: string;
  courseUrl?: string;
  price?: number | null;
  duration?: string;
  tags?: string[];
  level?: string;
  popularScore?: number;
};

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("curriculum"); // curriculum, video, field

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const coursesRes = await fetch("/api/admin/academy-courses?visible=true");

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        const coursesList = data.courses || [];

        const convertedCourses: Course[] = coursesList.map(
          (c: RawCourseData) => ({
            id: c.id || c.courseId || "",
            title: c.title || "",
            description: c.description,
            subtitle: c.subtitle,
            thumbnail: c.thumbnail,
            category: c.category || "",
            instructor: c.instructor,
            courseUrl: c.courseUrl,
            price: c.price ?? null,
            duration: c.duration,
            tags: Array.isArray(c.tags) ? c.tags : [],
            level: c.level,
            popularScore: c.popularScore || 0,
          })
        );

        setCourses(convertedCourses);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    let categoryName = "인지 커리큘럼";
    if (activeTab === "video") categoryName = "인지교육 영상";
    if (activeTab === "field") categoryName = "교육현장";

    return courses.filter((course) => course.category === categoryName);
  }, [courses, activeTab]);

  return (
    <div className="min-h-screen bg-white font-suit text-gray-900">
      {/* 1. Header & Tabs Area */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-10">
              스마트 교육
            </h1>

            {/* Tabs */}
            <div className="inline-flex items-center justify-center p-1 rounded-full border border-gray-200 bg-white">
              <button
                onClick={() => setActiveTab("curriculum")}
                className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === "curriculum"
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                인지 커리큘럼
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === "video"
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                인지교육 영상
              </button>
              <button
                onClick={() => setActiveTab("field")}
                className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === "field"
                    ? "bg-black text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                교육현장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Sub Header & Filters */}
          <div className="flex flex-col sm:flex-row items-end justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "curriculum" && "인지 커리큘럼"}
              {activeTab === "video" && "인지교육 영상"}
              {activeTab === "field" && "교육현장"}
            </h2>

            {/* Filter Stubs */}
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                접수일자순 <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                10개씩 보기 <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                정렬 변경 <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center text-gray-500">
                데이터를 불러오는 중입니다...
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="py-20 text-center text-gray-500 bg-gray-50 rounded-xl">
                등록된 과정이 없습니다.
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition-shadow duration-300 group"
                >
                  {/* Thumbnail Section */}
                  <div className="relative w-full md:w-[320px] aspect-video md:aspect-[4/3] lg:aspect-[16/10] bg-gray-100 shrink-0 overflow-hidden">
                    <Image
                      src={course.thumbnail || "/img/cover-fallback.png"}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-3 mb-6">
                        {course.description ||
                          course.subtitle ||
                          "프로그램 소개글이 들어갑니다. 프로그램 소개글이 들어갑니다."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                      <button className="flex-1 md:flex-none px-6 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                        커리큘럼 보기
                      </button>

                      {course.courseUrl ? (
                        <Link
                          href={course.courseUrl}
                          className="flex-1 md:flex-none px-8 py-3 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors text-center"
                        >
                          교육신청
                        </Link>
                      ) : (
                        <button className="flex-1 md:flex-none px-8 py-3 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">
                          교육신청
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Mock Item for Preview (Visible if empty/loading for design check) */}
            {/* This is just ensuring the structure looks right even with no data */}
          </div>
        </div>
      </main>
    </div>
  );
}
