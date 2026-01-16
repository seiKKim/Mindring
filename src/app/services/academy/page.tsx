"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Search,
  ExternalLink,
  User,
  Clock,
  Star,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"new" | "popular" | "price">("new");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, coursesRes] = await Promise.all([
        fetch("/api/admin/academy-menu"),
        fetch("/api/admin/academy-courses?visible=true"),
      ]);

      // 카테고리 메뉴 처리
      if (menuRes.ok) {
        const menuData = (await menuRes.json()) as Array<{
          visible: boolean;
          order: number;
          name: string;
        }>;
        const visible = menuData
          .filter((d) => d.visible)
          .sort((a, b) => a.order - b.order);
        // "전체" 중복 제거 후 맨 앞에 추가
        const categoryNames = visible
          .map((v) => v.name)
          .filter((name) => name !== "전체");
        const names = ["전체", ...categoryNames];
        // 중복 제거 (Set 사용)
        const uniqueNames = Array.from(new Set(names));
        setCategories(uniqueNames);
      }

      // 강좌 데이터 처리
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

  const filtered = useMemo(() => {
    let filtered = courses;

    // 카테고리 필터
    if (category !== "전체") {
      filtered = filtered.filter((c) => c.category === category);
    }

    // 난이도 필터
    if (selectedLevel !== "all") {
      filtered = filtered.filter((c) => c.level === selectedLevel);
    }

    // 검색 필터
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "popular") return b.popularScore - a.popularScore;
      if (sortBy === "price") {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceA - priceB;
      }
      // new: 최신순
      return b.popularScore - a.popularScore;
    });

    return sorted;
  }, [courses, category, selectedLevel, query, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-200">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  허브 아카데미
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  전문적인 자격증 & 자기계발 과정
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-8">
            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" />
                카테고리
              </h2>
              <nav className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      category === c
                        ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {c}
                      {category === c && <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Level Filter */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">난이도</h2>
              <nav className="space-y-1">
                {[
                  { id: "all", label: "전체" },
                  { id: "초급", label: "초급" },
                  { id: "중급", label: "중급" },
                  { id: "고급", label: "고급" },
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedLevel === level.id
                        ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {level.label}
                      {selectedLevel === level.id && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <section className="flex-1 space-y-6">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="강좌명, 강사명으로 검색..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl transition-all outline-none font-medium text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-600">
                  <ArrowUpDown className="w-4 h-4" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "new" | "popular" | "price")
                    }
                    className="bg-transparent border-none focus:ring-0 cursor-pointer text-gray-900 font-bold p-0 pr-6"
                    aria-label="정렬 기준 선택"
                  >
                    <option value="new">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="price">가격순</option>
                  </select>
                </div>
                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                  총{" "}
                  <span className="text-amber-600 font-bold">
                    {filtered.length}
                  </span>
                  개
                </span>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full animate-pulse flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-amber-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  강좌를 불러오는 중입니다...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="min-h-[400px] bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-bold text-lg mb-1">
                  검색 결과가 없습니다
                </p>
                <p className="text-gray-500 text-sm">
                  다른 키워드나 필터를 적용해보세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course) => (
                  <article
                    key={course.id}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      <Image
                        src={course.thumbnail || "/img/cover-fallback.png"}
                        alt={course.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />

                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="flex flex-wrap gap-2">
                          {course.tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-700 shadow-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        {course.level && (
                          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm">
                            {course.level}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3 text-xs font-medium text-gray-500">
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md">
                          {course.category}
                        </span>
                        {course.popularScore > 0 && (
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {course.popularScore}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                        {course.title}
                      </h3>

                      {course.subtitle && (
                        <p className="text-sm text-gray-500 line-clamp-1 mb-4">
                          {course.subtitle}
                        </p>
                      )}

                      <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-4">
                          {course.instructor && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[80px]">
                                {course.instructor}
                              </span>
                            </div>
                          )}
                          {course.duration && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{course.duration}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="text-lg font-bold">
                            {!course.price ? (
                              <span className="text-green-600">무료</span>
                            ) : (
                              <span className="text-gray-900">
                                ₩{course.price.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {course.courseUrl ? (
                            <a
                              href={course.courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-amber-100"
                            >
                              수강하기
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-bold rounded-lg cursor-not-allowed"
                            >
                              준비중
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
