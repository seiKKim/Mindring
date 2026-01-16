"use client";

import React, { useState, useEffect } from "react";
import {
  Smile,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Star,
  Heart,
  Home,
  Users,
  DollarSign,
  Activity,
  ArrowLeft,
  Calendar,
  User,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  category: string;
  question: string;
  icon: React.ComponentType<{ className?: string }>;
}

const questions: Question[] = [
  {
    id: 1,
    category: "전반적 만족도",
    question: "전반적으로 현재 생활에 얼마나 만족하십니까?",
    icon: Star,
  },
  {
    id: 2,
    category: "가족 관계",
    question: "가족과의 관계에 얼마나 만족하십니까?",
    icon: Heart,
  },
  {
    id: 3,
    category: "주거 환경",
    question: "현재 거주 환경에 얼마나 만족하십니까?",
    icon: Home,
  },
  {
    id: 4,
    category: "사회적 관계",
    question: "친구나 이웃과의 관계에 얼마나 만족하십니까?",
    icon: Users,
  },
  {
    id: 5,
    category: "경제 상태",
    question: "현재 경제 상태에 얼마나 만족하십니까?",
    icon: DollarSign,
  },
  {
    id: 6,
    category: "건강 상태",
    question: "현재 건강 상태에 얼마나 만족하십니까?",
    icon: Activity,
  },
  {
    id: 7,
    category: "여가 활동",
    question: "여가 시간 활용에 얼마나 만족하십니까?",
    icon: Star,
  },
  {
    id: 8,
    category: "자아 존중감",
    question: "자신에 대한 평가에 얼마나 만족하십니까?",
    icon: Heart,
  },
  {
    id: 9,
    category: "미래 전망",
    question: "앞으로의 생활 전망에 얼마나 만족하십니까?",
    icon: Star,
  },
  {
    id: 10,
    category: "일상생활",
    question: "일상생활 수행 능력에 얼마나 만족하십니까?",
    icon: Activity,
  },
];

const satisfactionLevels = [
  { value: 1, label: "매우 불만족", score: 1 },
  { value: 2, label: "불만족", score: 2 },
  { value: 3, label: "보통", score: 3 },
  { value: 4, label: "만족", score: 4 },
  { value: 5, label: "매우 만족", score: 5 },
];

export default function LifeSatisfactionPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "info" | "questions" | "result">(
    "intro"
  );
  const [userInfo, setUserInfo] = useState({
    age: "",
    gender: "" as "male" | "female" | "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{ [key: number]: number | null }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnswer = (score: number) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: score });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setStep("result");
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const calculateResult = () => {
    const scores = Object.values(answers).filter(
      (a): a is number => a !== null
    );
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;
    const maxScore = questions.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    let level: "very_low" | "low" | "moderate" | "high" | "very_high";
    let message: string;
    let description: string;
    let color: "red" | "orange" | "yellow" | "blue" | "green";
    let recommendations: string[];

    if (averageScore >= 4.5) {
      level = "very_high";
      message = "매우 높은 생활만족도";
      description = "현재 생활에 대해 매우 만족하고 긍정적인 상태입니다.";
      color = "green";
      recommendations = [
        "현재 생활 패턴을 지속적으로 유지하세요.",
        "긍정적인 마음가짐을 계속 유지하세요.",
        "가족과 친구들과의 관계를 더욱 돈독히 하세요.",
        "건강한 생활습관을 유지하세요.",
      ];
    } else if (averageScore >= 3.5) {
      level = "high";
      message = "높은 생활만족도";
      description = "현재 생활에 대해 대체로 만족하는 상태입니다.";
      color = "blue";
      recommendations = [
        "만족도가 낮은 영역에 집중하여 개선하세요.",
        "긍정적인 경험을 더 많이 만들어보세요.",
        "사회적 관계를 더욱 활발히 유지하세요.",
        "건강 관리와 여가 활동을 즐기세요.",
      ];
    } else if (averageScore >= 2.5) {
      level = "moderate";
      message = "보통 수준의 생활만족도";
      description = "현재 생활에 대해 보통 수준의 만족도를 보이고 있습니다.";
      color = "yellow";
      recommendations = [
        "만족도가 낮은 영역을 파악하고 개선 방안을 모색하세요.",
        "새로운 취미나 활동을 시작해보세요.",
        "가족이나 친구들과의 대화를 늘리세요.",
        "건강한 식단과 규칙적인 운동을 시작하세요.",
        "전문가의 상담을 고려해보세요.",
      ];
    } else if (averageScore >= 1.5) {
      level = "low";
      message = "낮은 생활만족도";
      description = "현재 생활에 대해 불만족스러운 상태입니다.";
      color = "orange";
      recommendations = [
        "불만족스러운 영역을 구체적으로 파악하세요.",
        "가족이나 신뢰할 수 있는 사람과 대화를 나누세요.",
        "작은 목표를 세우고 하나씩 달성해보세요.",
        "전문 상담사나 정신건강 전문의의 도움을 받으세요.",
        "새로운 활동이나 취미를 찾아보세요.",
      ];
    } else {
      level = "very_low";
      message = "매우 낮은 생활만족도";
      description = "현재 생활에 대해 매우 불만족스러운 상태입니다.";
      color = "red";
      recommendations = [
        "가능한 빨리 전문 상담사나 정신건강 전문의와 상담하세요.",
        "가족이나 신뢰할 수 있는 사람에게 도움을 요청하세요.",
        "작은 변화부터 시작하여 긍정적인 경험을 만들어보세요.",
        "일상생활에서 즐거움을 느낄 수 있는 활동을 찾아보세요.",
        "규칙적인 생활 패턴을 유지하고 충분한 휴식을 취하세요.",
        "혼자 모든 것을 감당하려 하지 말고 주변의 도움을 받으세요.",
      ];
    }

    // 카테고리별 점수 계산
    const categoryScores: {
      [key: string]: { total: number; count: number };
    } = {};
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer !== null) {
        if (!categoryScores[q.category]) {
          categoryScores[q.category] = { total: 0, count: 0 };
        }
        categoryScores[q.category].total += answer;
        categoryScores[q.category].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryScores).map(
      ([category, data]) => ({
        category,
        average: data.count > 0 ? data.total / data.count : 0,
      })
    );

    return {
      totalScore,
      maxScore,
      averageScore: Math.round(averageScore * 10) / 10,
      percentage,
      level,
      message,
      description,
      color,
      recommendations,
      categoryAverages,
    };
  };

  useEffect(() => {
    if (step === "result") {
      const result = calculateResult();
      setIsSaving(true);
      setSaveError(null);

      saveAssessment({
        assessmentType: "life_satisfaction",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
        categoryScores: result.categoryAverages,
      }).then(({ success, error }) => {
        setIsSaving(false);
        if (!success) {
          setSaveError(error || "검사 결과 저장에 실패했습니다.");
        }
      });
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center relative">
          <button
            onClick={() => router.push("/services/smart-cognitive")}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            생활만족도 척도 (LSS)
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20 mt-8">
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 text-center"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-4">
                <Smile className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                생활만족도 평가
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
                현재 전반적인 생활에 대한
                <br />
                만족도를 종합적으로 확인해보세요.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-bold text-orange-900">검사 안내</h3>
                  <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                    <li>총 10개의 문항으로 구성되어 있습니다.</li>
                    <li>약 5분 정도 소요됩니다.</li>
                    <li>현재 생활에 대한 솔직한 느낌을 선택해주세요.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-orange-200"
            >
              검사 시작하기
            </button>
          </motion.div>
        )}

        {step === "info" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              기본 정보 입력
            </h2>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="age"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                >
                  <User className="w-4 h-4" /> 연령
                </label>
                <input
                  id="age"
                  type="number"
                  value={userInfo.age}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, age: e.target.value })
                  }
                  placeholder="연령을 입력하세요 (예: 70)"
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-lg"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <User className="w-4 h-4" /> 성별
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setUserInfo({ ...userInfo, gender: "male" })}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                      userInfo.gender === "male"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    남성
                  </button>
                  <button
                    onClick={() =>
                      setUserInfo({ ...userInfo, gender: "female" })
                    }
                    className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                      userInfo.gender === "female"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    여성
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3"
                >
                  <Calendar className="w-4 h-4" /> 실시일
                </label>
                <input
                  id="date"
                  type="date"
                  value={userInfo.date}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, date: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-lg"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setStep("intro")}
                className="flex-1 py-4 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              >
                이전
              </button>
              <button
                onClick={() => setStep("questions")}
                disabled={!userInfo.age || !userInfo.gender}
                className="flex-[2] py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                다음
              </button>
            </div>
          </motion.div>
        )}

        {step === "questions" && (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-orange-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-gray-500">
                  {Math.round(progress)}% 완료
                </span>
              </div>
              <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10"
              >
                <div className="text-center mb-8">
                  <div className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold mb-4">
                    {questions[currentQuestionIndex].category}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                    {questions[currentQuestionIndex].question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {satisfactionLevels
                    .slice()
                    .reverse()
                    .map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                          answers[questions[currentQuestionIndex].id] ===
                          option.value
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md"
                            : "border-gray-100 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/30"
                        }`}
                      >
                        <span
                          className={`font-bold text-lg ${
                            answers[questions[currentQuestionIndex].id] ===
                            option.value
                              ? "text-orange-700"
                              : "text-gray-900"
                          }`}
                        >
                          {option.label}
                        </span>
                        {answers[questions[currentQuestionIndex].id] ===
                          option.value && (
                          <CheckCircle2 className="w-6 h-6 text-orange-600" />
                        )}
                      </button>
                    ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={
                  answers[questions[currentQuestionIndex].id] === undefined ||
                  answers[questions[currentQuestionIndex].id] === null
                }
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {currentQuestionIndex === questions.length - 1
                  ? "결과 확인"
                  : "다음"}
              </button>
            </div>
          </div>
        )}

        {step === "result" &&
          (() => {
            const result = calculateResult();

            const theme = {
              green: {
                bg: "bg-green-50",
                text: "text-green-700",
                badge: "bg-green-100 text-green-700 border-green-200",
                icon: "text-green-600",
              },
              blue: {
                bg: "bg-blue-50",
                text: "text-blue-700",
                badge: "bg-blue-100 text-blue-700 border-blue-200",
                icon: "text-blue-600",
              },
              yellow: {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
                icon: "text-yellow-600",
              },
              orange: {
                bg: "bg-orange-50",
                text: "text-orange-700",
                badge: "bg-orange-100 text-orange-700 border-orange-200",
                icon: "text-orange-600",
              },
              red: {
                bg: "bg-red-50",
                text: "text-red-700",
                badge: "bg-red-100 text-red-700 border-red-200",
                icon: "text-red-600",
              },
            }[result.color];

            return (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-2">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    검사 결과 리포트
                  </h2>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      DATE: {new Date().toLocaleDateString()}
                    </p>
                    <div className="text-sm font-medium text-gray-500 mb-4">
                      생활만족도 수준
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold border ${theme.badge}`}
                    >
                      <Smile className="w-5 h-5" />
                      {result.message}
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-xl text-gray-800 leading-relaxed font-medium text-center mb-10">
                      {result.description}
                    </p>

                    {/* Visual Score Meter (0-50 Scale) */}
                    <div className="mb-12">
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase">
                        <span>Low</span>
                        <span>Moderate</span>
                        <span>High</span>
                        <span>Very High</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {/* 0-1.5 (Low), 1.5-2.5 (Low), 2.5-3.5 (Mod), 3.5-4.5 (High), 4.5+ (V.High) */}
                        {/* Simplified: 5 equal segments of 10 points each */}
                        <div className="flex-[20] bg-red-400"></div>{" "}
                        {/* 10-25 */}
                        <div className="flex-[10] bg-orange-400"></div>{" "}
                        {/* 25-35 */}
                        <div className="flex-[10] bg-yellow-400"></div>{" "}
                        {/* 35-45 */}
                        <div className="flex-[10] bg-green-400"></div>{" "}
                        {/* 45-50 */}
                      </div>

                      {/* Indicator */}
                      <div className="relative mt-2 h-6">
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, (result.totalScore / 50) * 100)
                            )}%`,
                          }}
                        >
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-800 rotate-180 mb-1"></div>
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap px-2 py-1 bg-gray-800 text-white rounded-md text-xs">
                            {result.totalScore}점
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-6 px-1">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        영역별 만족도
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.categoryAverages.map((cat, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                          >
                            <span className="text-gray-600 font-medium text-sm">
                              {cat.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500"
                                  style={{
                                    width: `${(cat.average / 5) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-gray-900 w-8 text-right">
                                {cat.average.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-orange-50 rounded-2xl">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-600" />
                        맞춤 권장사항
                      </h3>
                      <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 bg-white p-3 rounded-xl border border-orange-100"
                          >
                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs mt-0.5 shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-gray-700 text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save Status Indicators */}
                  <div className="px-8 pb-4 bg-white">
                    {isSaving && (
                      <div className="flex items-center justify-center gap-2 text-gray-500 mt-4">
                        <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                        <span className="text-sm">결과 저장 중...</span>
                      </div>
                    )}
                    {saveError && (
                      <p className="text-center text-sm text-red-500 mt-4">
                        {saveError}
                      </p>
                    )}
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row gap-3 justify-center bg-white border-t border-gray-100">
                    <button
                      onClick={() => {
                        setStep("intro");
                        setAnswers({});
                        setCurrentQuestionIndex(0);
                        setUserInfo({
                          age: "",
                          gender: "",
                          date: new Date().toISOString().split("T")[0],
                        });
                      }}
                      className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    >
                      다시 검사하기
                    </button>
                    <button
                      onClick={() => router.push("/services/smart-cognitive")}
                      className="px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg w-full sm:w-auto"
                    >
                      목록으로 이동
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
