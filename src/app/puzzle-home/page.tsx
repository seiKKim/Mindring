// 홈페이지 컴포넌트 - CSS 모듈 적용
// puzzle-home/page.tsx

"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import styles from "../homepage.module.css";
import { useUser } from "@/contexts/UserContext";
import {
  Sparkles,
  User,
  Trophy,
  Target,
  Search,
  RefreshCw,
  Palette,
  Puzzle,
  AlertTriangle,
  Play,
  Check,
} from "lucide-react";

/** ---------------- Types ---------------- */
interface PuzzleImage {
  id: string;
  category: "color" | "gray";
  url: string;
  difficulty: number[];
}

interface ApiResponse {
  success: boolean;
  data: PuzzleImage[];
  total: number;
  filters?: {
    category: string | null;
    difficulty: number | null;
  };
}

interface RankingItem {
  userId: string;
  userName: string;
  score: number;
  rank: number;
}

interface RankingsApiResponse {
  success: boolean;
  rankings: RankingItem[];
}

/** ---------------- Constants ---------------- */
const DIFFICULTIES: Array<{ pieces: number; label: string; color: string }> = [
  { pieces: 0, label: "전체", color: "bg-gray-100" },
  { pieces: 4, label: "1단계", color: "bg-green-100 text-green-800" },
  { pieces: 9, label: "2단계", color: "bg-blue-100 text-blue-800" },
  { pieces: 16, label: "3단계", color: "bg-orange-100 text-orange-800" },
  { pieces: 36, label: "4단계", color: "bg-red-100 text-red-800" },
];

/** ---------------- Utils ---------------- */
// 클라이언트 사이드에서 배열을 랜덤하게 섞는 함수
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 추천 퍼즐을 선별하는 함수
function getRecommendedPuzzles(
  puzzles: PuzzleImage[],
  count: number = 4
): PuzzleImage[] {
  const shuffled = shuffleArray(puzzles);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const [categoryType, setCategoryType] = useState<"color" | "gray">("color");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0);
  const [puzzleImages, setPuzzleImages] = useState<PuzzleImage[]>([]);
  const [recommendedPuzzles, setRecommendedPuzzles] = useState<PuzzleImage[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationSeed, setRecommendationSeed] = useState(0); // 추천 퍼즐 갱신용
  const { user, loading: userLoading } = useUser();
  const [userRanking, setUserRanking] = useState<{
    bestRank: number | null;
    bestScore: number | null;
    totalCompleted: number;
  } | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  // 디버깅: 사용자 정보 확인 (제거됨)

  /** API에서 퍼즐 데이터 가져오기 */
  const fetchPuzzles = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("category", categoryType);
      if (selectedDifficulty > 0) {
        params.append("difficulty", String(selectedDifficulty));
      }

      const res = await fetch(`/api/puzzles?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: ApiResponse = await res.json();

      if (result.success) {
        setPuzzleImages(result.data);
      } else {
        setError("퍼즐 데이터를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      // 빠르게 탭/필터를 바꿀 때 이전 요청은 취소됨(정상)
      if ((err as Error).name !== "AbortError") {
        console.error("API 호출 오류:", err);
        setError("네트워크 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  /** 추천 퍼즐 업데이트 */
  const updateRecommendations = () => {
    if (puzzleImages.length > 0) {
      const recommended = getRecommendedPuzzles(puzzleImages);
      setRecommendedPuzzles(recommended);
    }
  };

  /** 추천 퍼즐 새로고침 */
  const refreshRecommendations = () => {
    setRecommendationSeed(Date.now());
    updateRecommendations();
  };

  /** 마운트/필터 변경 시 데이터 가져오기 (요청 취소 포함) */
  useEffect(() => {
    const ac = new AbortController();
    fetchPuzzles(ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryType, selectedDifficulty]);

  /** 퍼즐 데이터가 변경될 때 추천 퍼즐 업데이트 */
  useEffect(() => {
    updateRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleImages, recommendationSeed]);

  /** 카테고리 변경 */
  const handleCategoryChange = (newCategory: "color" | "gray") => {
    setCategoryType(newCategory);
    setSelectedDifficulty(0); // 난이도 초기화
  };

  /** 컴포넌트 마운트 시 초기 추천 시드 설정 */
  useEffect(() => {
    setRecommendationSeed(Date.now());
  }, []);

  // 사용자 랭킹 정보 가져오기
  useEffect(() => {
    if (!user) {
      setUserRanking(null);
      return;
    }

    const fetchUserRanking = async () => {
      try {
        setRankingLoading(true);

        // 전체 랭킹에서 사용자의 최고 순위 찾기
        const rankingsResponse = await fetch(
          "/api/puzzles/rankings?limit=1000&type=global",
          {
            credentials: "include",
          }
        );

        if (rankingsResponse.ok) {
          const rankingsData =
            (await rankingsResponse.json()) as RankingsApiResponse;
          if (rankingsData.success && rankingsData.rankings) {
            // 사용자의 최고 순위 찾기
            const userRankings = rankingsData.rankings.filter(
              (r) => r.userId === user.userId
            );

            if (userRankings.length > 0) {
              const bestRank = Math.min(...userRankings.map((r) => r.rank));
              const bestScore = Math.max(...userRankings.map((r) => r.score));
              setUserRanking({
                bestRank,
                bestScore,
                totalCompleted: userRankings.length,
              });
            } else {
              setUserRanking({
                bestRank: null,
                bestScore: null,
                totalCompleted: 0,
              });
            }
          }
        }

        // 개인 기록도 가져와서 완료 수 확인
        const recordsResponse = await fetch("/api/puzzles/records", {
          credentials: "include",
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          if (recordsData.success && recordsData.records) {
            setUserRanking((prev) =>
              prev
                ? {
                    ...prev,
                    totalCompleted: recordsData.records.length,
                  }
                : {
                    bestRank: null,
                    bestScore: null,
                    totalCompleted: recordsData.records.length,
                  }
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch user ranking:", err);
      } finally {
        setRankingLoading(false);
      }
    };

    fetchUserRanking();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {userLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <span>로딩 중...</span>
                </div>
              ) : user ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#333",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <User className="w-4 h-4 text-gray-700" />
                  <span style={{ color: "#1f2937" }}>
                    {user.name || user.email || "사용자"}
                  </span>
                </div>
              ) : null}
              {user && rankingLoading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#333",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  <span>랭킹 로딩 중...</span>
                </div>
              )}
              {user &&
                !rankingLoading &&
                userRanking &&
                userRanking.bestRank && (
                  <Link
                    href="/puzzle-home/rankings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                      borderRadius: "8px",
                      color: "#333",
                      fontSize: "14px",
                      fontWeight: "600",
                      textDecoration: "none",
                      border: "1px solid rgba(255, 215, 0, 0.3)",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 215, 0, 0.3)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 215, 0, 0.2)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span style={{ color: "#1f2937" }}>
                      {userRanking.bestRank}위
                    </span>
                    {userRanking.bestScore && (
                      <span
                        style={{
                          color: "#666",
                          fontSize: "12px",
                          marginLeft: "4px",
                        }}
                      >
                        (최고 {userRanking.bestScore.toLocaleString()}점)
                      </span>
                    )}
                  </Link>
                )}
              {user &&
                !rankingLoading &&
                userRanking &&
                !userRanking.bestRank &&
                userRanking.totalCompleted > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      color: "#333",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    <Target className="w-4 h-4 text-blue-500" />
                    <span style={{ color: "#1f2937" }}>
                      완료: {userRanking.totalCompleted}개
                    </span>
                  </div>
                )}
              <Link
                href="/puzzle-home/rankings"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#333",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.9)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Trophy className="w-4 h-4 text-yellow-500" /> 랭킹
              </Link>
              <Link
                href="/"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  color: "#333",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Removed */}

      {/* Recommended Puzzles Section */}
      <section className={styles.recommendedSection}>
        <div className={styles.recommendedContainer}>
          <div className={styles.recommendedHeader}>
            <div className={styles.recommendedHeaderLeft}>
              <div className={styles.recommendedHeaderTitle}>
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <h3 className={styles.recommendedHeaderTitleText}>
                  오늘의 추천 퍼즐
                </h3>
              </div>
              <div className={styles.recommendedBadge}>매일 새로운 추천</div>
            </div>
            <button
              onClick={refreshRecommendations}
              disabled={loading || recommendedPuzzles.length === 0}
              className={styles.recommendedRefreshButton}
              title="새로운 추천 퍼즐 보기"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              새로운 추천
            </button>
          </div>

          {/* 추천 퍼즐 로딩 */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>추천 퍼즐을 준비중...</span>
            </div>
          )}

          {/* 추천 퍼즐 그리드 */}
          {!loading && recommendedPuzzles.length > 0 && (
            <div className={styles.recommendedGrid}>
              {recommendedPuzzles.map((puzzle, index) => (
                <div
                  key={`rec-${puzzle.id}-${recommendationSeed}`}
                  className={styles.recommendedCard}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className={styles.recommendedImageContainer}>
                    <img
                      src={puzzle.url}
                      alt={`추천 퍼즐 #${puzzle.id}`}
                      className={styles.recommendedImage}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = `https://via.placeholder.com/300x300/cccccc/666666?text=퍼즐+${puzzle.id}`;
                      }}
                    />
                    {/* 추천 배지 */}
                    <div className={styles.recommendedBadgeContainer}>
                      <Sparkles className="w-3 h-3 text-yellow-500 mr-1" /> 추천
                    </div>
                    {/* 순위 배지 */}
                    <div className={styles.rankBadge}>#{index + 1}</div>
                    {/* 호버 오버레이 */}
                    <div className={styles.hoverOverlay}>
                      <Link
                        href={`/puzzle?image=${encodeURIComponent(
                          puzzle.url
                        )}&id=${puzzle.id}&difficulty=16`}
                        className={styles.hoverButton}
                      >
                        <Play className="w-5 h-5 mr-1" /> 플레이
                      </Link>
                    </div>
                  </div>
                  <div className={styles.recommendedCardContent}>
                    <h4 className={styles.recommendedCardTitle}>
                      퍼즐 #{puzzle.id}
                    </h4>
                    <div className={styles.recommendedDifficultyTags}>
                      {puzzle.difficulty
                        .slice(0, 2)
                        .map((pieces, diffIndex) => (
                          <Link
                            key={pieces}
                            href={`/puzzle?image=${encodeURIComponent(
                              puzzle.url
                            )}&id=${puzzle.id}&difficulty=${pieces}`}
                            className={`${styles.difficultyTag} ${
                              diffIndex === 0
                                ? styles.difficultyTagGreen
                                : styles.difficultyTagBlue
                            }`}
                          >
                            {pieces}조각
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && recommendedPuzzles.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎭</div>
              <p className={styles.emptyMessage}>
                추천할 퍼즐을 준비중입니다...
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Type Filter Section (Gradient) */}
      <section className={styles.typeFilterSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterButtons}>
            <button
              onClick={() => handleCategoryChange("color")}
              className={`${styles.categoryButton} ${
                categoryType === "color"
                  ? styles.categoryButtonActive
                  : styles.categoryButtonInactive
              }`}
            >
              {categoryType === "color" && (
                <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center mr-2">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              컬러머즐
            </button>
            <button
              onClick={() => handleCategoryChange("gray")}
              className={`${styles.categoryButton} ${
                categoryType === "gray"
                  ? styles.categoryButtonActive
                  : styles.categoryButtonInactive
              }`}
            >
              흑백머즐
            </button>
          </div>
        </div>
      </section>

      {/* Difficulty Filter Section (Dark) */}
      <section className={styles.difficultyFilterSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.difficultyButtons}>
            <span className="flex items-center text-sm font-bold mr-4">
              <AlertTriangle className="w-4 h-4 mr-1 text-white opacity-70" />
              난이도 선택
            </span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.pieces}
                onClick={() => setSelectedDifficulty(diff.pieces)}
                className={`${styles.difficultyButton} ${
                  selectedDifficulty === diff.pieces
                    ? styles.difficultyButtonActive
                    : ""
                }`}
              >
                {diff.label}
                {diff.pieces > 0 && `(${diff.pieces}조각)`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Puzzle Gallery */}
      <section className={styles.gallerySection}>
        <div className={styles.galleryContainer}>
          <div className={styles.galleryHeader}>
            <h3 className={styles.galleryTitle}>
              {categoryType === "color" ? (
                <Palette className="w-6 h-6 text-orange-500 mr-2" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-800 mr-2" />
              )}
              {categoryType === "color" ? "컬러" : "흑백"} 퍼즐 갤러리
              {!loading && ` (${puzzleImages.length}개)`}
            </h3>
            <div className={styles.galleryFilter}>
              {selectedDifficulty !== 0 &&
                `${
                  DIFFICULTIES.find((d) => d.pieces === selectedDifficulty)
                    ?.label
                } 선택됨`}
            </div>
          </div>

          {/* 로딩 */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <span className={styles.loadingText}>퍼즐 로딩 중...</span>
            </div>
          )}

          {/* 오류 */}
          {error && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <h4 className={styles.errorTitle}>오류가 발생했습니다</h4>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={() => fetchPuzzles()}
                className={styles.errorButton}
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 그리드 */}
          {!loading && !error && (
            <div className={styles.galleryGrid}>
              {puzzleImages.map((puzzle, index) => (
                <div
                  key={`${puzzle.id}`}
                  className={styles.galleryCard}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className={styles.galleryImageContainer}>
                    <img
                      src={puzzle.url}
                      alt={`퍼즐 #${puzzle.id} 썸네일`}
                      className={styles.galleryImage}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = `https://via.placeholder.com/400x400/cccccc/666666?text=퍼즐+${puzzle.id}`;
                      }}
                    />
                  </div>
                  <div className={styles.galleryCardContent}>
                    <h4 className={styles.galleryCardTitle}>
                      퍼즐 #{puzzle.id}
                    </h4>
                    <div className={styles.galleryDifficultyTags}>
                      {puzzle.difficulty.map((pieces, diffIndex) => (
                        <Link
                          key={pieces}
                          href={`/puzzle?image=${encodeURIComponent(
                            puzzle.url
                          )}&id=${puzzle.id}&difficulty=${pieces}`}
                          className={`${styles.galleryDifficultyTag} ${
                            diffIndex === 0
                              ? styles.galleryDifficultyTagGreen
                              : diffIndex === 1
                              ? styles.galleryDifficultyTagBlue
                              : diffIndex === 2
                              ? styles.galleryDifficultyTagOrange
                              : styles.galleryDifficultyTagRed
                          }`}
                        >
                          {pieces}조각
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={`/puzzle?image=${encodeURIComponent(
                        puzzle.url
                      )}&id=${puzzle.id}&difficulty=16`}
                      className={`${styles.galleryPlayButton} ${
                        categoryType === "color"
                          ? styles.galleryPlayButtonColor
                          : styles.galleryPlayButtonGray
                      }`}
                    >
                      <Puzzle className="w-4 h-4 mr-2" /> 퍼즐 시작하기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 검색 결과 없음 */}
          {!loading && !error && puzzleImages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search className="w-12 h-12 text-gray-300" />
              </div>
              <h4 className={styles.emptyTitle}>해당 조건의 퍼즐이 없습니다</h4>
              <p className={styles.emptyMessage}>
                다른 난이도를 선택하거나 퍼즐 타입을 변경해보세요.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
