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
  Info,
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
    let color: "green" | "blue" | "yellow" | "red";
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
            뇌 건강 체크리스트
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                <Brain className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                뇌 건강 생활습관 점검
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
                식단, 운동, 수면 등 뇌 건강에 필수적인
                <br />
                생활 습관을 점검하고 개선점을 찾아보세요.
              </p>
            </div>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-bold text-purple-900">검사 안내</h3>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>총 10개의 문항으로 구성되어 있습니다.</li>
                    <li>약 3분 정도 소요됩니다.</li>
                    <li>솔직하게 답변해주시면 정확한 분석이 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("checklist")}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-purple-200"
            >
              점검 시작하기
            </button>
          </motion.div>
        )}

        {step === "checklist" && (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-purple-600">
                  {currentItemIndex + 1} / {checklistItems.length}
                </span>
                <span className="text-gray-500">
                  {Math.round(currentProgress)}% 완료
                </span>
              </div>
              <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentItemIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full text-xs font-bold text-purple-700 mb-6">
                  {categoryIcons[checklistItems[currentItemIndex].category] &&
                    React.createElement(
                      categoryIcons[checklistItems[currentItemIndex].category],
                      { className: "w-3 h-3" }
                    )}
                  {checklistItems[currentItemIndex].category}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
                  {checklistItems[currentItemIndex].question}
                </h2>
                <p className="text-gray-500 mb-10 text-sm">
                  {checklistItems[currentItemIndex].description}
                </p>

                <div className="space-y-3">
                  {checklistItems[currentItemIndex].options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 rounded-xl border-2 font-medium text-lg transition-all flex items-center justify-between group ${
                        answers[checklistItems[currentItemIndex].id] ===
                        option.value
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-100 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50/50"
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

            <div className="flex justify-between pt-4">
              <button
                onClick={handlePrev}
                disabled={currentItemIndex === 0}
                className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                이전
              </button>
            </div>
          </div>
        )}

        {step === "result" &&
          (() => {
            const result = calculateResult();

            const levelConfig = {
              excellent: {
                bg: "bg-green-50",
                text: "text-green-700",
                border: "border-green-200",
                badgeBg: "bg-green-100",
              },
              good: {
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-200",
                badgeBg: "bg-blue-100",
              },
              fair: {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                border: "border-yellow-200",
                badgeBg: "bg-yellow-100",
              },
              poor: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                badgeBg: "bg-red-100",
              },
            }[result.level];

            return (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-2">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
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
                      현재 뇌 건강 상태
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold border ${levelConfig.badgeBg} ${levelConfig.text} ${levelConfig.border}`}
                    >
                      {result.level === "excellent" && (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      {result.level === "poor" && (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {result.message}
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Visual Score Meter */}
                    <div className="mb-10">
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase">
                        <span>Poor</span>
                        <span>Fair</span>
                        <span>Good</span>
                        <span>Excellent</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="flex-1 bg-red-400"></div>
                        <div className="flex-1 bg-yellow-400"></div>
                        <div className="flex-1 bg-blue-400"></div>
                        <div className="flex-1 bg-green-400"></div>
                      </div>

                      {/* Indicator */}
                      <div className="relative mt-2 h-8">
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, result.percentage)
                            )}%`,
                          }}
                        >
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-800 rotate-180 mb-1"></div>
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap px-2 py-1 bg-gray-800 text-white rounded-md text-xs">
                            {result.totalScore}점
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-gray-50 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {result.totalScore}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          총점
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          (50점 만점)
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {result.averageScore}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          평균 점수
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                      전문가 조언
                    </h3>
                    <div className="space-y-4">
                      {result.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100"
                        >
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mt-0.5 shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Status Indicators */}
                  <div className="px-8 pb-4">
                    {isSaving && (
                      <div className="flex items-center justify-center gap-2 text-gray-500 bg-gray-100 py-3 rounded-xl">
                        <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span>
                        <span className="text-sm">결과 리포트 저장 중...</span>
                      </div>
                    )}
                    {!isSaving && !saveError && (
                      <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">
                          저장되었습니다
                        </span>
                      </div>
                    )}
                    {saveError && (
                      <div className="text-center text-sm text-red-500 py-2">
                        {saveError}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row gap-3 justify-center bg-white border-t border-gray-100">
                    <button
                      onClick={() => {
                        setStep("intro");
                        setAnswers({});
                        setCurrentItemIndex(0);
                      }}
                      className="px-6 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    >
                      다시 검사하기
                    </button>
                    <button
                      onClick={() => router.push("/services/contact")}
                      className="px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
                    >
                      전문가 상담 예약
                    </button>
                    <button
                      onClick={() => router.push("/services/smart-cognitive")}
                      className="px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg w-full sm:w-auto"
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
