"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Upload,
  Edit2,
  Trash2,
  Heart,
} from "lucide-react";
import { WorkbookRegistrationModal } from "./WorkbookRegistrationModal";
import { Modal } from "@/components/ui/modal";

// --- Mock Data ---

type Workbook = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  fileUrl: string;
  createdAt: string;
  likes: number;
};

// --- Page Component ---

export default function SmartWorkbookPage() {
  // State
  const [activeCategory, setActiveCategory] = useState("전체");
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkbook, setEditingWorkbook] = useState<Workbook | null>(null);

  // Like & Download State
  const [likedWorkbooks, setLikedWorkbooks] = useState<Set<string>>(new Set());
  const [isLikeModalOpen, setIsLikeModalOpen] = useState(false);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Load liked workbooks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("likedWorkbooks");
    if (saved) {
      setLikedWorkbooks(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleLike = async (id: string) => {
    const isLiked = likedWorkbooks.has(id);
    const newSet = new Set(likedWorkbooks);
    if (isLiked) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setLikedWorkbooks(newSet);
    localStorage.setItem("likedWorkbooks", JSON.stringify(Array.from(newSet)));

    // Optimistic UI update for count
    setWorkbooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, likes: w.likes + (isLiked ? -1 : 1) } : w
      )
    );

    try {
      await fetch(`/api/workbook/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: !isLiked }),
      });
    } catch (error) {
      console.error("Failed to update like:", error);
    }
  };

  const handleDownload = (e: React.MouseEvent, workbook: Workbook) => {
    if (!likedWorkbooks.has(workbook.id)) {
      e.preventDefault(); // Prevent default download link behavior
      setIsLikeModalOpen(true);
    }
  };

  const handlePreview = (e: React.MouseEvent, workbook: Workbook) => {
    e.preventDefault();
    // Append parameters to hide PDF toolbar
    // Note: #toolbar=0 works for Chrome/Edge PDF viewer.
    setPreviewUrl(workbook.fileUrl);
    setIsPreviewModalOpen(true);
  };

  const handleEdit = (workbook: Workbook) => {
    setEditingWorkbook(workbook);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 워크북을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/workbook/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다.");
        setWorkbooks((prev) => prev.filter((w) => w.id !== id));
        setTotalItems((prev) => prev - 1);
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete workbook:", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingWorkbook(null);
  };

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
        const res = await fetch(`/api/workbook?${params}`, {
          cache: "no-store",
        });
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

    const timer = setTimeout(() => {
      fetchWorkbooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, currentPage, sortBy, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    setSearchQuery("");
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
              onClick={() => {
                setEditingWorkbook(null);
                setIsModalOpen(true);
              }}
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
                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item.id);
                    }}
                    className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all"
                    title={
                      likedWorkbooks.has(item.id) ? "좋아요 취소" : "좋아요"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        likedWorkbooks.has(item.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

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
                      src="/img/mindring_logo_h.png"
                      alt=""
                      width={60}
                      height={20}
                      className="opacity-20 absolute bottom-2"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-3 text-sm text-gray-500">
                    <Heart className="w-3 h-3 fill-gray-300 text-gray-300" />{" "}
                    <span>{item.likes || 0}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => handlePreview(e, item)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors cursor-pointer"
                      title="미리보기"
                    >
                      <span>미리보기</span>
                      <Search className="w-3 h-3" />
                    </a>
                    <a
                      href={item.fileUrl}
                      download={`${item.title}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => handleDownload(e, item)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors cursor-pointer"
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
        onClose={handleModalClose}
        initialData={editingWorkbook}
      />

      {/* Like Restriction Modal */}
      <Modal
        isOpen={isLikeModalOpen}
        onClose={() => setIsLikeModalOpen(false)}
        showCloseButton={false}
        size="sm"
      >
        <div className="text-center py-6">
          <p className="text-lg font-bold mb-6 whitespace-pre-line">
            좋아요를 눌러주셔야
            <br />
            워크북 다운로드가 가능합니다.
          </p>
          <button
            onClick={() => setIsLikeModalOpen(false)}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            확인
          </button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="워크북 미리보기"
        size="4xl"
      >
        <div className="w-full h-[80vh] bg-gray-100 rounded-lg overflow-hidden relative">
          {previewUrl ? (
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title="Preview"
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">불러오는 중...</p>
            </div>
          )}
          {/* Overlay to prevent right click context menu widely */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </Modal>
    </div>
  );
}
