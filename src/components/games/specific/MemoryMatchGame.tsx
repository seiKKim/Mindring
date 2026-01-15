"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Trophy, Clock, Brain } from "lucide-react";
import { useRouter } from "next/navigation";

interface MemoryMatchGameProps {
  gameId?: string;
}

interface Card {
  id: string; // Emoji content
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string; // Unique ID for key
}

// Level Configuration
const LEVEL_CONFIG = {
  1: { pairs: 2, cols: 2, timeLimit: 60 }, // 4 cards (2x2)
  2: { pairs: 4, cols: 4, timeLimit: 50 }, // 8 cards (4x2)
  3: { pairs: 6, cols: 4, timeLimit: 40 }, // 12 cards (4x3)
  4: { pairs: 8, cols: 4, timeLimit: 30 }, // 16 cards (4x4)
  5: { pairs: 10, cols: 5, timeLimit: 20 }, // 20 cards (5x4)
};

const DEFAULT_EMOJIS = [
  "🍎",
  "🍊",
  "🍋",
  "🍌",
  "🍇",
  "🍓",
  "🍉",
  "🍒",
  "🍑",
  "🍍",
  "🥝",
  "🥥",
];

const shuffle = <T,>(arr: T[]): T[] => {
  return [...arr].sort(() => Math.random() - 0.5);
};

export function MemoryMatchGame({
  gameId = "memory-match",
}: MemoryMatchGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">(
    "intro"
  );
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [time, setTime] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedPairs, setCompletedPairs] = useState(0);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = (selectedLevel: number) => {
    // @ts-expect-error - Level is strictly 1-5 but types might be loose
    setLevel(selectedLevel);

    // @ts-expect-error - Indexing with generic number
    const config = LEVEL_CONFIG[selectedLevel];
    const gameEmojis = shuffle(DEFAULT_EMOJIS).slice(0, config.pairs);

    const initialCards: Card[] = [];
    gameEmojis.forEach((emoji) => {
      initialCards.push({
        id: emoji,
        isFlipped: false,
        isMatched: false,
        uniqueId: `${emoji}-1`,
      });
      initialCards.push({
        id: emoji,
        isFlipped: false,
        isMatched: false,
        uniqueId: `${emoji}-2`,
      });
    });

    setCards(shuffle(initialCards));
    setTime(0);
    setFlippedCards([]);
    setCompletedPairs(0);
    setIsProcessing(false);
    setGameState("playing");
  };

  const handleCardClick = (clickedCard: Card) => {
    if (
      isProcessing ||
      clickedCard.isMatched ||
      clickedCard.isFlipped ||
      gameState !== "playing"
    )
      return;

    // Flip the card
    const newCards = cards.map((c) =>
      c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);

      const [first, second] = newFlipped;

      if (first.id === second.id) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first.id ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
          setIsProcessing(false);
          setCompletedPairs((prev) => {
            const newVal = prev + 1;
            // Check win condition

            if (newVal === LEVEL_CONFIG[level].pairs) {
              setTimeout(() => setGameState("result"), 500);
            }
            return newVal;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const StopGame = () => {
    setGameState("intro");
  };

  // --- Render ---

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-5xl mx-auto p-4">
        {/* Navigation Header */}
        <div className="w-full mb-8 flex justify-start">
          <button
            onClick={() => router.push("/services/cognitive")}
            className="group flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium px-4 py-2 rounded-full hover:bg-gray-100"
          >
            <div className="bg-white border border-gray-200 rounded-full p-1.5 group-hover:border-indigo-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>게임 목록으로 돌아가기</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                회상카드
                <br />
                <span className="text-indigo-600">맞추기</span>
              </h1>
              <p className="text-xl text-gray-500">
                카드의 위치를 기억하고
                <br />
                같은 그림의 짝을 찾아보세요.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" />
                난이도 선택
              </h2>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <motion.button
                    key={lvl}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startGame(lvl)}
                    className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-white border-2 border-gray-100 text-gray-600 shadow-sm hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all group"
                  >
                    <span className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">
                      {lvl}
                    </span>
                    <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-500">
                      단계
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Guide */}
          <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden">
            {/* Decorative Circle */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

            <h3 className="text-lg font-bold text-gray-900 mb-6 relative z-10">
              게임 방법
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    카드 뒤집기
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    뒤집혀 있는 카드를 클릭해서 그림을 확인하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    기억하기
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    그림의 위치를 잘 기억해두세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    짝 맞추기
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    같은 그림의 카드를 연속으로 찾으면 성공입니다!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (gameState === "result") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 text-center p-12 relative"
        >
          {/* Confetti or decoration could go here */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-indigo-500"></div>

          <div className="mb-8 flex justify-center bg-yellow-50 w-32 h-32 rounded-full items-center mx-auto">
            <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-sm" />
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-3">
            훌륭합니다!
          </h2>
          <p className="text-gray-500 mb-12 text-lg">
            모든 카드의 짝을 성공적으로 맞췄습니다.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                난이도
              </p>
              <p className="text-3xl font-black text-gray-900">{level}단계</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                소요 시간
              </p>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <p className="text-3xl font-black text-gray-900">{time}초</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/services/cognitive")}
              className="px-8 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button
              onClick={() => setGameState("intro")}
              className="px-10 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-xl shadow-gray-200 flex items-center gap-2 transition-all hover:translate-y-[-2px]"
            >
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing Screen
  return (
    <div className="min-h-[700px] bg-white flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-4xl">
        {/* Game Controls Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <button
            onClick={() => router.push("/services/cognitive")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>나가기</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="bg-indigo-50 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 uppercase">
                Level
              </span>
              <span className="font-black text-indigo-700">{level}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-mono text-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{time}s</span>
            </div>
          </div>

          <button
            onClick={StopGame}
            className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
          >
            중단하기
          </button>
        </div>

        {/* Responsive Grid Container */}
        <div className="flex justify-center">
          <div
            className={`grid ${
              level === 1
                ? "grid-cols-2 max-w-sm"
                : level === 5
                ? "grid-cols-5 max-w-4xl"
                : "grid-cols-4 max-w-2xl"
            } gap-4 w-full`}
          >
            {cards.map((card) => (
              <motion.button
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="aspect-[3/4] perspective-1000 relative group cursor-pointer"
                disabled={card.isMatched}
              >
                <div
                  className={`w-full h-full transition-all duration-500 transform-style-3d relative rounded-2xl shadow-sm group-hover:shadow-md border border-gray-100 ${
                    card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform:
                      card.isFlipped || card.isMatched
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                  }}
                >
                  {/* Front (Card Back - Question Mark) */}
                  <div
                    className="absolute w-full h-full backface-hidden rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                      <span className="text-indigo-200 text-2xl font-black">
                        ?
                      </span>
                    </div>
                    {/* Pattern */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-indigo-100 to-transparent opacity-50 rounded-tl-full"></div>
                  </div>

                  {/* Back (Card Front - Emoji) */}
                  <div
                    className="absolute w-full h-full backface-hidden rounded-2xl bg-white border-2 border-indigo-500 flex items-center justify-center rotate-y-180 shadow-inner"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-4xl md:text-5xl select-none">
                      {card.isMatched || card.isFlipped ? card.id : ""}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
