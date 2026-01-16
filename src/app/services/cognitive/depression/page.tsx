"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { saveAssessment } from "@/lib/save-assessment";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  question: string;
  positiveAnswer: "yes" | "no"; // 우울 증상에 해당하는 답변
}

const questions: Question[] = [
  { id: 1, question: "대체로 생활에 만족하십니까?", positiveAnswer: "no" },
  {
    id: 2,
    question: "최근에 활동이나 취미에 대한 관심이 줄어들었습니까?",
    positiveAnswer: "yes",
  },
  { id: 3, question: "생활이 비어있다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 4, question: "자주 지루하다고 느끼십니까?", positiveAnswer: "yes" },
  { id: 5, question: "대체로 기분이 좋으십니까?", positiveAnswer: "no" },
  {
    id: 6,
    question: "나쁜 일이 일어날 것 같아 두려우십니까?",
    positiveAnswer: "yes",
  },
  { id: 7, question: "대체로 행복하다고 느끼십니까?", positiveAnswer: "no" },
  { id: 8, question: "자주 무력감을 느끼십니까?", positiveAnswer: "yes" },
  {
    id: 9,
    question: "밖에 나가는 것보다 집에 있는 것을 선호하십니까?",
    positiveAnswer: "yes",
  },
  {
    id: 10,
    question: "기억력이 다른 사람들보다 나쁘다고 느끼십니까?",
    positiveAnswer: "yes",
  },
  {
    id: 11,
    question: "살아있다는 것이 좋다고 느끼십니까?",
    positiveAnswer: "no",
  },
  {
    id: 12,
    question: "현재 자신의 생활이 가치 없다고 느끼십니까?",
    positiveAnswer: "yes",
  },
  {
    id: 13,
    question: "현재 자신의 생활에 활력이 넘친다고 느끼십니까?",
    positiveAnswer: "no",
  },
  {
    id: 14,
    question: "현재 자신의 상황이 희망이 없다고 느끼십니까?",
    positiveAnswer: "yes",
  },
  {
    id: 15,
    question: "대체로 다른 사람들이 자신보다 더 잘 살고 있다고 느끼십니까?",
    positiveAnswer: "yes",
  },
];

export default function DepressionTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "info" | "questions" | "result">(
    "intro"
  );
  const [userInfo, setUserInfo] = useState({
    age: "",
    gender: "" as "male" | "female" | "",
    date: new Date().toISOString().split("T")[0],
  });
  const [answers, setAnswers] = useState<{
    [key: number]: "yes" | "no" | null;
  }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAnswer = (answer: "yes" | "no") => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id]) {
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

  const calculateResult = () => {
    let score = 0;
    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer === q.positiveAnswer) {
        score += 1;
      }
    });

    let level: "normal" | "mild" | "severe";
    let message: string;
    let description: string;
    let color: "green" | "yellow" | "red";
    let icon: React.ComponentType<{ className?: string }>;
    let recommendations: string[];

    if (score <= 5) {
      level = "normal";
      message = "정상 범위입니다";
      description = "현재 우울 증상이 거의 없거나 매우 경미한 상태입니다.";
      color = "green";
      icon = Smile;
      recommendations = [
        "현재 상태를 유지하기 위해 규칙적인 생활 패턴을 지속하세요.",
        "가족이나 친구들과의 교류를 유지하세요.",
        "건강한 식단과 충분한 수면을 취하세요.",
        "정기적으로 운동이나 취미 활동을 즐기세요.",
      ];
    } else if (score <= 9) {
      level = "mild";
      message = "가벼운 우울증이 의심됩니다";
      description =
        "경미한 우울 증상이 나타나고 있습니다. 주의 깊은 관찰과 관리가 필요합니다.";
      color = "yellow";
      icon = Meh;
      recommendations = [
        "가족이나 친구들과 대화를 나누고 감정을 공유하세요.",
        "규칙적인 운동과 충분한 수면을 취하세요.",
        "일상생활에서 즐거움을 느낄 수 있는 활동을 찾아보세요.",
        "증상이 지속되거나 악화되면 전문의 상담을 받으시기 바랍니다.",
        "스트레스를 관리하고 긍정적인 사고를 유지하세요.",
      ];
    } else {
      level = "severe";
      message = "심한 우울증이 의심됩니다";
      description =
        "우울 증상이 상당히 심각한 수준입니다. 전문적인 도움이 필요합니다.";
      color = "red";
      icon = Frown;
      recommendations = [
        "가능한 빨리 정신건강 전문의나 상담 전문가와 상담하시기 바랍니다.",
        "가족이나 신뢰할 수 있는 사람에게 도움을 요청하세요.",
        "자해나 자살 충동이 있다면 즉시 정신건강의학과나 응급실을 방문하세요.",
        "규칙적인 생활 패턴을 유지하고 충분한 휴식을 취하세요.",
        "혼자 모든 것을 감당하려 하지 말고 주변의 도움을 받으세요.",
        "치료를 받는 동안 가족의 지지와 이해가 중요합니다.",
      ];
    }

    return {
      score,
      maxScore: 15,
      percentage: Math.round((score / 15) * 100),
      level,
      message,
      description,
      color,
      icon,
      recommendations,
    };
  };

  useEffect(() => {
    if (step === "result") {
      const result = calculateResult();
      setIsSaving(true);
      setSaveError(null);

      saveAssessment({
        assessmentType: "depression",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.score,
        percentage: result.percentage,
        riskLevel: result.level,
        interpretation: result.message,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
      }).then(({ success, error }) => {
        setIsSaving(false);
        if (!success) {
          setSaveError(error || "검사 결과 저장에 실패했습니다.");
        }
      });
    }
  }, [step]);

  const currentProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

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
            노인 우울 척도 검사
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
              <div className="inline-flex items-center justify-center w-24 h-24 bg-pink-100 rounded-full mb-4">
                <Heart className="w-12 h-12 text-pink-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                마음 건강 체크
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
                우울 척도 검사(GDS-SF)를 통해
                <br />
                어르신의 정서적 건강 상태를 확인해보세요.
              </p>
            </div>

            <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100 text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-pink-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-bold text-pink-900">검사 안내</h3>
                  <ul className="text-sm text-pink-800 space-y-1 list-disc list-inside">
                    <li>총 15개의 문항으로 구성되어 있습니다.</li>
                    <li>약 5분 정도 소요됩니다.</li>
                    <li>지난 1주일 동안 느끼신 기분을 생각하며 답해주세요.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-pink-200"
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
                  title="연령 입력"
                  type="number"
                  value={userInfo.age}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, age: e.target.value })
                  }
                  placeholder="연령을 입력하세요 (예: 70)"
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 outline-none transition-all text-lg"
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
                        ? "border-pink-500 bg-pink-50 text-pink-700"
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
                        ? "border-pink-500 bg-pink-50 text-pink-700"
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
                  title="실시일 선택"
                  type="date"
                  value={userInfo.date}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, date: e.target.value })
                  }
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-50 outline-none transition-all text-lg"
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
                <span className="text-pink-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-gray-500">
                  {Math.round(currentProgress)}% 완료
                </span>
              </div>
              <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
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
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 text-pink-600 font-bold rounded-full mb-6 text-xl">
                  {currentQuestionIndex + 1}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {questions[currentQuestionIndex].question}
                </h2>
                <p className="text-gray-400 mb-10">
                  (지난 1주일 동안 느끼신 기분을 생각하며 답해주세요)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer("yes")}
                    className={`py-8 rounded-2xl border-2 font-bold text-xl transition-all flex flex-col items-center justify-center gap-2 ${
                      answers[questions[currentQuestionIndex].id] === "yes"
                        ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md ring-1 ring-pink-500"
                        : "border-gray-100 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-8 h-8 ${
                        answers[questions[currentQuestionIndex].id] === "yes"
                          ? "text-pink-600"
                          : "text-gray-300"
                      }`}
                    />
                    예
                  </button>
                  <button
                    onClick={() => handleAnswer("no")}
                    className={`py-8 rounded-2xl border-2 font-bold text-xl transition-all flex flex-col items-center justify-center gap-2 ${
                      answers[questions[currentQuestionIndex].id] === "no"
                        ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md ring-1 ring-pink-500"
                        : "border-gray-100 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-8 h-8 ${
                        answers[questions[currentQuestionIndex].id] === "no"
                          ? "text-pink-600"
                          : "text-gray-300"
                      }`}
                    />
                    아니오
                  </button>
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
            </div>
          </div>
        )}

        {step === "result" &&
          (() => {
            const result = calculateResult();
            const IconComponent = result.icon;

            const theme = {
              green: {
                bg: "bg-green-50",
                text: "text-green-700",
                iconBg: "bg-green-100",
                icon: "text-green-600",
                border: "border-green-200",
                badgeBg: "bg-green-100",
              },
              yellow: {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                iconBg: "bg-yellow-100",
                icon: "text-yellow-600",
                border: "border-yellow-200",
                badgeBg: "bg-yellow-100",
              },
              red: {
                bg: "bg-red-50",
                text: "text-red-700",
                iconBg: "bg-red-100",
                icon: "text-red-600",
                border: "border-red-200",
                badgeBg: "bg-red-100",
              },
            }[result.color];

            return (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-2">
                    <TrendingUp className="w-8 h-8 text-pink-600" />
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
                      현재 마음 건강 상태
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold border ${theme.badgeBg} ${theme.text} ${theme.border}`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {result.message}
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-xl text-gray-800 leading-relaxed font-medium text-center mb-10">
                      {result.description}
                    </p>

                    {/* Visual Score Meter (0-15 Scale) */}
                    <div className="mb-12">
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase">
                        <span>Normal (0-5)</span>
                        <span>Mild (6-9)</span>
                        <span>Severe (10-15)</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {/* 
                            Normal: 6/16 (0-5) -> 37.5%
                            Mild: 4/16 (6-9) -> 25%
                            Severe: 6/16 (10-15) -> 37.5%
                         */}
                        <div className="flex-[6] bg-green-400"></div>
                        <div className="flex-[4] bg-yellow-400"></div>
                        <div className="flex-[6] bg-red-400"></div>
                      </div>

                      {/* Indicator */}
                      <div className="relative mt-2 h-6">
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, (result.score / 15) * 100)
                            )}%`,
                          }}
                        >
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-800 rotate-180 mb-1"></div>
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap px-2 py-1 bg-gray-800 text-white rounded-md text-xs">
                            {result.score}점
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-6 px-1">
                        <span>0</span>
                        <span>5</span>
                        <span>9</span>
                        <span>15</span>
                      </div>
                    </div>

                    <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-pink-600" />
                        맞춤 권장사항
                      </h3>
                      <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 bg-white p-3 rounded-xl border border-pink-100/50"
                          >
                            <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs mt-0.5 shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-gray-700 text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-6 bg-yellow-50/50 border-t border-yellow-100 text-center">
                    <p className="text-xs text-yellow-700 leading-relaxed max-w-lg mx-auto">
                      ⚠️ 본 검사 결과는 의학적 진단이 아니며, 전문가의 진료를
                      대신할 수 없습니다.
                      <br />
                      정확한 진단을 위해서는 정신건강의학과 전문의와의 상담을
                      권장합니다.
                    </p>
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
