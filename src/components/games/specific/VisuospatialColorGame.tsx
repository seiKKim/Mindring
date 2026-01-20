"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ArrowLeft, RotateCcw, Trophy, Clock, Target } from "lucide-react";
import { useRouter } from "next/navigation";

interface VisuospatialColorGameProps {
  gameId?: string;
}

// Level Configuration
const LEVEL_CONFIG = {
  1: { rows: 2, cols: 2, targetScore: 3, diff: 0.3 }, // 2x2, Very easy
  2: { rows: 2, cols: 2, targetScore: 3, diff: 0.2 }, // 2x2, Easy
  3: { rows: 3, cols: 3, targetScore: 4, diff: 0.15 }, // 3x3, Moderate
  4: { rows: 3, cols: 3, targetScore: 4, diff: 0.12 }, // 3x3, Slightly harder
  5: { rows: 4, cols: 4, targetScore: 5, diff: 0.1 }, // 4x4, Hard (for seniors)
};

export function VisuospatialColorGame({}: VisuospatialColorGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">(
    "intro"
  );
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [baseColor, setBaseColor] = useState("");
  const [targetColor, setTargetColor] = useState("");

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

  const generateRound = (currentLevel: number) => {
    // @ts-expect-error - indexing config
    const config = LEVEL_CONFIG[currentLevel];
    const totalCells = config.rows * config.cols;

    // Pick random index
    const newTarget = Math.floor(Math.random() * totalCells);
    setTargetIndex(newTarget);

    // Generate Base Color (random HSL)
    const h = Math.floor(Math.random() * 360);
    const s = 60 + Math.floor(Math.random() * 40); // 60-100%
    const l = 40 + Math.floor(Math.random() * 40); // 40-80%
    setBaseColor(`hsl(${h}, ${s}%, ${l}%)`);

    // Generate Target Color (Same Hue, Shift Lightness)
    // Make sure we shift enough but within bounds
    // We alternate shift direction to make it harder to guess
    const shift = Math.random() > 0.5 ? 1 : -1;
    let newL = l + shift * (config.diff * 100);

    // Clamp lightness
    if (newL > 95) newL = l - config.diff * 100;
    if (newL < 20) newL = l + config.diff * 100;

    setTargetColor(`hsl(${h}, ${s}%, ${newL}%)`);
  };

  const startGame = (selectedLevel: number) => {
    // @ts-expect-error - loose type
    setLevel(selectedLevel);
    setScore(0);
    setTime(0);
    setGameState("playing");
    generateRound(selectedLevel);
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== "playing") return;

    if (index === targetIndex) {
      // Correct!
      const nextScore = score + 1;
      setScore(nextScore);

      // Check Level Completion
      // @ts-expect-error - indexing
      if (nextScore >= LEVEL_CONFIG[level].targetScore) {
        setTimeout(() => setGameState("result"), 500);
      } else {
        generateRound(level);
      }
    } else {
      // Wrong click logic (optional: shake effect or time penalty)
      // For now, no penalty, just ignore
    }
  };

  // --- Render ---

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full max-w-5xl mx-auto p-4">
        {/* Navigation */}
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
                색상 구분
                <br />
                <span className="text-indigo-600">테스트</span>
              </h1>
              <p className="text-xl text-gray-500">
                여러 가지 블록 중에서
                <br />
                색이 다른 하나를 찾아보세요.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
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
                    다른 색 찾기
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    나열된 블록 중에서 혼자만 색이 다른 블록을 찾으세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">
                    클릭하여 선택
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    정답이라고 생각되는 블록을 클릭하세요.
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
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-indigo-500"></div>

          <div className="mb-8 flex justify-center bg-yellow-50 w-32 h-32 rounded-full items-center mx-auto">
            <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-sm" />
          </div>

          <h2 className="text-4xl font-black text-gray-900 mb-3">목표 달성!</h2>
          <p className="text-gray-500 mb-12 text-lg">
            뛰어난 색상 구분 능력을 가지고 계시네요.
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
              onClick={() => setGameState("intro")}
              className="px-8 py-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> 목록으로
            </button>
            <button
              onClick={() => {
                startGame(level);
              }}
              className="px-10 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-xl shadow-gray-200 flex items-center gap-2 transition-all hover:translate-y-[-2px]"
            >
              <RotateCcw className="w-5 h-5" /> 다시 하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // playing
  // @ts-expect-error - config indexing
  const config = LEVEL_CONFIG[level];
  const gridTemplateColumns = `repeat(${config.cols}, 1fr)`;

  return (
    <div className="min-h-[700px] bg-white flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <button
            onClick={() => setGameState("intro")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>그만하기</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="bg-indigo-50 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 uppercase">
                Level
              </span>
              <span className="font-black text-indigo-700">{level}</span>
            </div>
            <div className="bg-green-50 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xs font-bold text-green-500 uppercase">
                Score
              </span>
              <span className="font-black text-green-700">
                {score} / {config.targetScore}
              </span>
              <div className="flex gap-0.5 ml-1">
                {Array.from({ length: config.targetScore }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < score ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-mono text-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{time}s</span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Grid Area */}
        <div className="flex justify-center items-center h-[500px]">
          <div
            className="w-full max-w-[500px] aspect-square rounded-2xl p-4 bg-gray-50 border border-gray-200 grid gap-3"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: config.rows * config.cols }).map(
              (_, index) => (
                <motion.button
                  key={index}
                  className={`w-full h-full rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden`}
                  style={{
                    backgroundColor:
                      index === targetIndex ? targetColor : baseColor,
                  }}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBlockClick(index)}
                >
                  {/* Optional texture or gradient to make it look nicer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                </motion.button>
              )
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 mt-8 text-sm animate-pulse">
          색이 다른 블록 하나를 찾아보세요!
        </p>
      </div>
    </div>
  );
}
