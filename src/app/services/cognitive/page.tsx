"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  FolderOpen,
  Eye,
  MessageCircle,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// --- Types ---
type GameCategory =
  | "all"
  | "memory"
  | "attention"
  | "language"
  | "visuospatial"
  | "orientation";

interface GameData {
  id: string;
  title: string;
  category: GameCategory;
  description?: string;
}

interface CategoryItem {
  title: string;
  href: string;
}

interface CategoryCardData {
  id: GameCategory;
  title: string;
  icon: React.ReactNode;
  items: CategoryItem[];
}

// --- Data & Mappings ---

const gameRoutes: Record<string, string> = {
  "memory-1": "/services/cognitive/memory-match",
  "color-sequence": "/services/cognitive/color-sequence",
  "attention-1": "/services/cognitive/find-difference",
  "attention-2": "/services/cognitive/same-match",
  "attention-3": "/services/cognitive/word-search",
  "attention-4": "/services/cognitive/connect-words", // Assumed based on name
  "attention-5": "/services/cognitive/connect-numbers",
  "orientation-1": "/services/cognitive/person-quiz",
  "orientation-2": "/services/cognitive/time-quiz",
  "orientation-5": "/services/cognitive/emotion-game", // Assumed
  "language-1": "/services/cognitive/proverb",
  "language-2": "/services/cognitive/word-chain",
  "visuospatial-3": "/services/cognitive/visuospatial-3",
};

const ALL_GAMES: GameData[] = [
  // Memory
  { id: "memory-1", title: "회상카드 맞추기", category: "memory" },
  { id: "color-sequence", title: "색상 순서 기억하기", category: "memory" },
  { id: "memory-photo", title: "사진 기억하기", category: "memory" }, // Placeholder ID
  { id: "memory-pair", title: "단어 짝 맞추기", category: "memory" },
  { id: "memory-game", title: "기억 게임", category: "memory" },

  // Attention
  { id: "attention-1", title: "다른 그림 찾기", category: "attention" },
  { id: "attention-2", title: "같은 그림 터치하기", category: "attention" },
  { id: "attention-3", title: "단어 찾기 퍼즐", category: "attention" },
  { id: "attention-4", title: "낱말 연결 게임", category: "attention" },
  { id: "attention-5", title: "숫자 이어주기", category: "attention" },

  // Language
  { id: "language-1", title: "속담 완성하기", category: "language" },
  { id: "language-2", title: "끝말잇기", category: "language" },
  { id: "language-4", title: "이야기 완성하기", category: "language" },
  { id: "language-5", title: "단어연상퀴즈", category: "language" },
  { id: "language-order", title: "낱말 순서 맞추기", category: "language" },

  // Visuospatial
  { id: "visuospatial-3", title: "색상 구분 테스트", category: "visuospatial" },
  { id: "visuospatial-5", title: "조각 맞추기", category: "visuospatial" },
  { id: "visuospatial-path", title: "길 찾기", category: "visuospatial" },
  { id: "visuospatial-seq", title: "순서 맞추기", category: "visuospatial" },

  // Orientation
  { id: "orientation-1", title: "인물 맞추기", category: "orientation" },
  { id: "orientation-2", title: "날짜·시간 맞추기", category: "orientation" },
  { id: "orientation-5", title: "감정 표현 게임", category: "orientation" },
  {
    id: "orientation-hometown",
    title: "내 고향 퀴즈",
    category: "orientation",
  },
  { id: "orientation-old", title: "옛날 물건 맞추기", category: "orientation" },
];

// Helper to assign images based on index or category to simulate the variety in design
const getGameImage = (index: number) => {
  const images = [
    "/img/smart2.png",
    "/img/smart3.png",
    "/img/smart4.png",
    "/img/smart5.png",
    "/img/smart1.png", // reusing hero placeholder sometimes
  ];
  return images[index % images.length];
};

const categoryCards: CategoryCardData[] = [
  {
    id: "memory",
    title: "기억력 게임",
    icon: <FolderOpen className="w-6 h-6 text-yellow-500" />,
    items: ALL_GAMES.filter((g) => g.category === "memory").map((g) => ({
      title: g.title,
      href: gameRoutes[g.id] || "#",
    })),
  },
  {
    id: "attention",
    title: "주의력 게임",
    icon: <Eye className="w-6 h-6 text-blue-500" />,
    items: ALL_GAMES.filter((g) => g.category === "attention").map((g) => ({
      title: g.title,
      href: gameRoutes[g.id] || "#",
    })),
  },
  {
    id: "language",
    title: "언어능력 게임",
    icon: <MessageCircle className="w-6 h-6 text-orange-500" />,
    items: ALL_GAMES.filter((g) => g.category === "language").map((g) => ({
      title: g.title,
      href: gameRoutes[g.id] || "#",
    })),
  },
  {
    id: "visuospatial",
    title: "시공간능력 게임",
    icon: <MapPin className="w-6 h-6 text-purple-500" />,
    items: ALL_GAMES.filter((g) => g.category === "visuospatial").map((g) => ({
      title: g.title,
      href: gameRoutes[g.id] || "#",
    })),
  },
  {
    id: "orientation",
    title: "지남력 게임",
    icon: <User className="w-6 h-6 text-green-500" />,
    items: ALL_GAMES.filter((g) => g.category === "orientation").map((g) => ({
      title: g.title,
      href: gameRoutes[g.id] || "#",
    })),
  },
];

export default function CognitivePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter games based on search
  const filteredGames = ALL_GAMES.filter((game) =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);
  const currentGames = filteredGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to top of grid
  };

  const handleGameStart = (id: string) => {
    const route = gameRoutes[id];
    if (route) {
      router.push(route);
    } else {
      // Fallback or alert
      console.log("Route not found for", id);
    }
  };

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 1. Header & Search */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 text-center space-y-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          인지 콘텐츠
        </h1>

        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-6 pr-16 py-4 rounded-full border-2 border-purple-200 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-lg placeholder-gray-400"
          />
          <button
            aria-label="검색"
            title="검색"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. Category Cards Section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-full py-3 px-8 inline-flex items-center gap-2 shadow-sm border border-gray-100 mb-8 mx-auto table">
            <span className="font-bold text-gray-800">전체</span>
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  {card.icon}
                  <h3 className="font-bold text-gray-900">{card.title}</h3>
                </div>
                <ul className="space-y-2">
                  {card.items.slice(0, 5).map(
                    (
                      item,
                      idx // Show only first 5 in card
                    ) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
                      >
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                        <Link
                          href={item.href}
                          className="line-clamp-1 hover:underline text-left"
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Divider Line */}
        <div className="w-full h-px bg-gray-200 mb-12"></div>

        {currentGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentGames.map((game, idx) => {
              // Determine absolute index for consistent image assignment if needed,
              // but idx refers to current page.
              // Using game.id to hash or find original index would be stable.
              const gameIndex = ALL_GAMES.findIndex((g) => g.id === game.id);
              return (
                <div
                  key={game.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col"
                >
                  {/* Image Area */}
                  <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                    <Image
                      src={getGameImage(gameIndex)}
                      alt={game.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col items-center text-center flex-grow">
                    <h3 className="font-bold text-gray-900 text-lg mb-4">
                      {game.title}
                    </h3>
                    <button
                      onClick={() => handleGameStart(game.id)}
                      className="w-full py-3 bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-600 font-bold rounded-lg transition-colors mt-auto group/btn"
                    >
                      시작하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}

        {/* 4. Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-16">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="이전 페이지"
              title="이전 페이지"
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dynamic Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-full font-medium transition-colors flex items-center justify-center ${
                  currentPage === page
                    ? "bg-black text-white font-bold"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              aria-label="다음 페이지"
              title="다음 페이지"
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
