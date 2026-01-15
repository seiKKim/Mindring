"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { WorkbookRegistrationModal } from "./WorkbookRegistrationModal";

// --- Mock Data ---

type Workbook = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  fileUrl: string; // Using a placeholder for now
  createdAt: string;
};

// --- Page Component ---

export default function SmartWorkbookPage() {
  // State
  // State
  const [activeCategory, setActiveCategory] = useState("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/workbook-menu");
        if (res.ok) {
          const data = (await res.json()) as {
            name: string;
            visible: boolean;
            order: number;
          }[];
          const visibleCats = data
            .filter((d) => d.visible)
            .sort((a, b) => a.order - b.order)
            .map((d) => d.name);
          // Set "전체" first, then others, filtering out duplicates if "전체" exists in API
          setCategories(["전체", ...visibleCats.filter((c) => c !== "전체")]);
        }
      } catch (e) {
        console.error("Failed to fetch categories:", e);
      }
    };
    fetchCategories();
  }, []);

  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch Workbooks
  useEffect(() => {
    const fetchWorkbooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "8",
          category: activeCategory,
          sort: sortBy,
          q: searchQuery,
        });
        const res = await fetch(`/api/workbook?${params}`);
        if (res.ok) {
          const data = await res.json();
          setWorkbooks(data.items);
          setTotalItems(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch workbooks:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchWorkbooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, currentPage, sortBy, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    setSearchQuery(""); // Optional: clear search on category change
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            스마트 워크북
          </h1>

          {/* Search Bar & Register Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-full border-2 border-purple-400 pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-colors shadow-sm text-base"
                aria-label="워크북 검색"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 transition-colors"
                title="검색"
                aria-label="검색"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-sm whitespace-nowrap"
            >
              워크북 등록하기
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Category Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2 px-2">
            <span className="font-bold text-lg">{activeCategory}</span>
            {activeCategory !== "전체" && (
              <div className="text-gray-400 bg-gray-100 rounded-full px-2 py-1">
                <span className="text-xs">Selected</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-black ring-1 ring-black bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-black" : "text-gray-600"
                    }`}
                  >
                    {cat}
                  </span>
                  {isActive && (
                    <div className="bg-black rounded-full p-0.5">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {!isActive && (
                    <div className="bg-gray-200 rounded-full p-0.5 w-4 h-4 flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b-2 border-teal-500">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeCategory}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              총 <span className="text-pink-500 font-bold">{totalItems}</span>
              건의 활동 자료가 검색되었습니다.
            </p>
          </div>

          <select
            className="px-4 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "latest" | "popular")}
            aria-label="정렬 기준 선택"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {/* Grid */}
        {workbooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workbooks.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-teal-50 p-4 flex items-center justify-center overflow-hidden">
                  {/* In real app, use next/image with actual URL */}
                  <div className="relative w-full h-full shadow-md transform group-hover:scale-105 transition-transform duration-300 bg-white flex flex-col items-center justify-center text-center p-2">
                    {/* Placeholder styling to mimic the design */}
                    <div className="text-2xl font-extrabold text-teal-400 leading-tight mb-2">
                      {item.title.split(" ")[0]}
                      <br />
                      <span className="text-teal-600">
                        {item.title.split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                    <Image
                      src="/img/mindring_logo_h.png" // Fallback logo usage just for decoration
                      alt=""
                      width={60}
                      height={20}
                      className="opacity-20 absolute bottom-2"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 text-center">
                  <p className="text-gray-500 text-sm mb-1">{item.title}</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <button
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                      title="미리보기"
                    >
                      <span>미리보기</span>
                      <Search className="w-3 h-3" />
                    </button>
                    <a
                      href={item.fileUrl}
                      download={`${item.title}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                      title="다운로드"
                    >
                      <span>다운로드</span>
                      <Download className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">등록된 워크북이 없습니다.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="이전 페이지"
              aria-label="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (p > 5 && p !== totalPages && Math.abs(p - currentPage) > 2)
                return null;

              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-10 h-10 rounded-full font-bold transition-colors ${
                    currentPage === p
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-current={currentPage === p ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="다음 페이지"
              aria-label="다음 페이지"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </main>

      {/* Registration Modal */}
      <WorkbookRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
