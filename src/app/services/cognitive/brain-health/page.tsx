"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Activity,
  Moon,
  Book,
  Users,
  Smile,
  Stethoscope,
  XCircle,
  Shield,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem {
  id: number;
  category: string;
  question: string;
  description: string;
  options: {
    value: "always" | "often" | "sometimes" | "rarely" | "never";
    label: string;
    score: number;
  }[];
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    category: "식단",
    question: "균형 잡힌 식단을 유지하고 있나요?",
    description:
      "과일, 채소, 통곡물, 건강한 지방, 단백질을 포함한 다양한 영양소를 섭취하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 2,
    category: "운동",
    question: "규칙적인 운동을 하고 있나요?",
    description:
      "주 3~5회, 30분 이상의 유산소 운동이나 근력 운동을 하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 3,
    category: "수면",
    question: "충분한 수면을 취하고 있나요?",
    description: "하루 7~9시간의 양질의 수면을 취하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 4,
    category: "정신적 활동",
    question: "정신적 자극 활동에 참여하고 있나요?",
    description:
      "독서, 퍼즐, 악기 연주, 새로운 기술 학습 등 뇌를 자극하는 활동을 하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 5,
    category: "사회적 교류",
    question: "사회적 교류를 유지하고 있나요?",
    description:
      "가족, 친구들과의 정기적인 만남과 대화를 통해 사회적 관계를 유지하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 6,
    category: "스트레스 관리",
    question: "스트레스를 효과적으로 관리하고 있나요?",
    description:
      "명상, 요가, 심호흡, 취미 활동 등을 통해 스트레스를 관리하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 7,
    category: "건강 검진",
    question: "정기적인 건강 검진을 받고 있나요?",
    description:
      "혈압, 혈당, 콜레스테롤 등 뇌 건강에 영향을 미치는 지표를 정기적으로 확인하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 8,
    category: "금연 및 절주",
    question: "흡연을 피하고 음주를 적당히 하고 있나요?",
    description:
      "흡연을 하지 않고, 알코올 섭취를 적당한 수준으로 제한하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 9,
    category: "뇌 손상 예방",
    question: "뇌 손상을 예방하는 습관을 가지고 있나요?",
    description:
      "안전벨트 착용, 보호 장비 사용 등 사고로 인한 뇌 손상을 예방하는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
  {
    id: 10,
    category: "긍정적 태도",
    question: "긍정적인 태도와 마음가짐을 유지하고 있나요?",
    description:
      "긍정적인 사고방식과 감사하는 마음을 통해 정신 건강을 증진시키는지 평가합니다.",
    options: [
      { value: "always", label: "항상", score: 5 },
      { value: "often", label: "자주", score: 4 },
      { value: "sometimes", label: "가끔", score: 3 },
      { value: "rarely", label: "거의 안함", score: 2 },
      { value: "never", label: "전혀 안함", score: 1 },
    ],
  },
];

const categoryIcons: {
  [key: string]: React.ComponentType<{ className?: string }>;
} = {
  식단: Heart,
  운동: Activity,
  수면: Moon,
  "정신적 활동": Book,
  "사회적 교류": Users,
  "스트레스 관리": Smile,
  "건강 검진": Stethoscope,
  "금연 및 절주": XCircle,
  "뇌 손상 예방": Shield,
  "긍정적 태도": Sparkles,
};

export default function BrainHealthChecklistPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "checklist" | "result">("intro");
  const [answers, setAnswers] = useState<{
    [key: number]: "always" | "often" | "sometimes" | "rarely" | "never" | null;
  }>({});
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnswer = (
    answer: "always" | "often" | "sometimes" | "rarely" | "never"
  ) => {
    const itemId = checklistItems[currentItemIndex].id;
    setAnswers({ ...answers, [itemId]: answer });
  };

  const handleNext = () => {
    if (answers[checklistItems[currentItemIndex].id]) {
      if (currentItemIndex < checklistItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      } else {
        setStep("result");
      }
    }
  };

  const handlePrev = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const currentProgress =
    ((currentItemIndex + 1) / checklistItems.length) * 100;

  // 결과 계산
  const calculateResult = () => {
    const totalScore = checklistItems.reduce((sum, item) => {
      const answer = answers[item.id];
      if (!answer) return sum;
      const option = item.options.find((opt) => opt.value === answer);
      return sum + (option?.score || 0);
    }, 0);

    const maxScore = checklistItems.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const averageScore = totalScore / checklistItems.length;

    let level: "excellent" | "good" | "fair" | "poor";
    let message: string;
    let color: string;
    let recommendations: string[];

    if (averageScore >= 4.5) {
      level = "excellent";
      message = "뇌 건강 상태가 매우 양호합니다!";
      color = "green";
      recommendations = [
        "현재 생활습관을 지속적으로 유지하세요.",
        "다양한 정신적 활동을 통해 뇌를 더욱 자극하세요.",
        "정기적인 건강 검진을 통해 현재 상태를 모니터링하세요.",
      ];
    } else if (averageScore >= 3.5) {
      level = "good";
      message = "뇌 건강 상태가 양호합니다.";
      color = "blue";
      recommendations = [
        "일부 영역에서 개선의 여지가 있습니다.",
        "점수가 낮은 항목에 집중하여 개선하세요.",
        "규칙적인 운동과 건강한 식단을 더욱 강화하세요.",
      ];
    } else if (averageScore >= 2.5) {
      level = "fair";
      message = "뇌 건강을 위해 개선이 필요합니다.";
      color = "yellow";
      recommendations = [
        "점수가 낮은 항목들을 우선적으로 개선하세요.",
        "규칙적인 운동과 건강한 식단을 시작하세요.",
        "충분한 수면과 스트레스 관리를 위해 노력하세요.",
        "정기적인 건강 검진을 받으시기 바랍니다.",
      ];
    } else {
      level = "poor";
      message = "뇌 건강을 위해 즉시 개선이 필요합니다.";
      color = "red";
      recommendations = [
        "의료진과 상담하여 건강 상태를 점검하세요.",
        "규칙적인 운동과 건강한 식단을 즉시 시작하세요.",
        "충분한 수면을 확보하고 스트레스를 관리하세요.",
        "정기적인 건강 검진을 받으시기 바랍니다.",
        "금연 및 절주를 실천하세요.",
      ];
    }

    // 카테고리별 점수 계산
    const categoryScores: { [key: string]: { total: number; count: number } } =
      {};
    checklistItems.forEach((item) => {
      const answer = answers[item.id];
      if (answer) {
        const option = item.options.find((opt) => opt.value === answer);
        if (!categoryScores[item.category]) {
          categoryScores[item.category] = { total: 0, count: 0 };
        }
        categoryScores[item.category].total += option?.score || 0;
        categoryScores[item.category].count += 1;
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
      percentage,
      averageScore: Math.round(averageScore * 10) / 10,
      level,
      message,
      color,
      recommendations,
      categoryAverages,
    };
  };

  // 결과 단계로 이동할 때 자동 저장
  useEffect(() => {
    if (step === "result") {
      const result = calculateResult();
      setIsSaving(true);
      setSaveError(null);

      saveAssessment({
        assessmentType: "brain_health",
        testDate: new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        averageScore: result.averageScore,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.message,
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
      {/* 1. Header & Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-6">
        <button
          onClick={() => router.push("/services/smart-cognitive")}
          className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>스마트 인지관리로 돌아가기</span>
        </button>

        <div className="text-center space-y-4 mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-bold">
            <Brain className="w-4 h-4" />
            <span>뇌 건강 체크리스트</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            나의 뇌 건강 습관,
            <br />
            얼마나 잘 지키고 계신가요?
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            간단한 체크리스트를 통해 뇌 건강을 위한 생활 습관을 점검해보세요.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-10 text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  총 10개의 질문
                </h2>
                <p className="text-gray-500">
                  식단, 운동, 수면 등 뇌 건강에 영향을 미치는
                  <br />
                  다양한 생활 습관을 평가합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-700">식단 관리</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-700">신체 활동</span>
                </div>
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium text-gray-700">수면 패턴</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smile className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium text-gray-700">
                    스트레스 관리
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep("checklist")}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-purple-200"
              >
                시작하기
              </button>
            </div>
          </motion.div>
        )}

        {step === "checklist" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>질문 {currentItemIndex + 1}</span>
              <span>{checklistItems.length}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentItemIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 mb-6">
                  {categoryIcons[checklistItems[currentItemIndex].category] &&
                    React.createElement(
                      categoryIcons[checklistItems[currentItemIndex].category],
                      { className: "w-3 h-3" }
                    )}
                  {checklistItems[currentItemIndex].category}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {checklistItems[currentItemIndex].question}
                </h2>
                <p className="text-gray-500 mb-10">
                  {checklistItems[currentItemIndex].description}
                </p>

                <div className="grid gap-3">
                  {checklistItems[currentItemIndex].options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 rounded-xl border-2 font-medium text-lg transition-all flex items-center justify-between group ${
                        answers[checklistItems[currentItemIndex].id] ===
                        option.value
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-100 bg-white text-gray-700 hover:border-purple-200 hover:bg-gray-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {answers[checklistItems[currentItemIndex].id] ===
                        option.value && (
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={currentItemIndex === 0}
                className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[checklistItems[currentItemIndex].id]}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {currentItemIndex === checklistItems.length - 1
                  ? "결과 확인"
                  : "다음"}
              </button>
            </div>
          </div>
        )}

        {step === "result" &&
          (() => {
            const result = calculateResult();
            const levelColors = {
              excellent: {
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-200",
                icon: "text-green-600",
              },
              good: {
                bg: "bg-blue-100",
                text: "text-blue-700",
                border: "border-blue-200",
                icon: "text-blue-600",
              },
              fair: {
                bg: "bg-yellow-100",
                text: "text-yellow-700",
                border: "border-yellow-200",
                icon: "text-yellow-600",
              },
              poor: {
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-200",
                icon: "text-red-600",
              },
            };
            const theme = levelColors[result.level];

            return (
              <div className="space-y-8">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-10 text-center border-b border-gray-100">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 ${theme.bg} rounded-full mb-6`}
                    >
                      <Activity className={`w-10 h-10 ${theme.icon}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {result.message}
                    </h2>
                    <div className="flex justify-center gap-2 items-end mt-4">
                      <span className="text-6xl font-black text-gray-900">
                        {result.totalScore}
                      </span>
                      <span className="text-xl text-gray-400 mb-2">
                        / {result.maxScore}점
                      </span>
                    </div>
                  </div>

                  <div className="p-8 bg-gray-50">
                    <h3 className="font-bold text-gray-900 mb-4">
                      맞춤형 조언
                    </h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100"
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Status Indicators */}
                  <div className="px-8 pb-8 bg-gray-50">
                    {isSaving && (
                      <p className="text-center text-sm text-gray-500">
                        결과 저장 중...
                      </p>
                    )}
                    {saveError && (
                      <p className="text-center text-sm text-red-500">
                        {saveError}
                      </p>
                    )}
                  </div>

                  <div className="p-4 flex gap-3 justify-center bg-gray-50">
                    <button
                      onClick={() => {
                        setStep("intro");
                        setAnswers({});
                        setCurrentItemIndex(0);
                      }}
                      className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                      다시 검사하기
                    </button>
                    <button
                      onClick={() => router.push("/services/smart-cognitive")}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                      목록으로
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
