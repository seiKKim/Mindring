"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Phone,
  ArrowLeft,
  Calendar,
  User,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { lsnsQuestions, likertScaleOptions } from "./data/questions";
import { calculateLSNSResult } from "./utils/resultCalculator";
import { saveAssessment } from "@/lib/save-assessment";
import { motion, AnimatePresence } from "framer-motion";

export default function SocialNetworkPage() {
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
    const questionId = lsnsQuestions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: score });
  };

  const handleNext = () => {
    if (answers[lsnsQuestions[currentQuestionIndex].id] !== null) {
      if (currentQuestionIndex < lsnsQuestions.length - 1) {
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

  const saveAssessmentResult = async (
    result: ReturnType<typeof calculateLSNSResult>
  ) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await saveAssessment({
        assessmentType: "social_network",
        age: userInfo.age ? parseInt(userInfo.age) : null,
        gender: userInfo.gender || null,
        testDate: userInfo.date || new Date().toISOString(),
        answers: answers,
        totalScore: result.totalScore,
        percentage: Math.round((result.totalScore / result.maxScore) * 100),
        riskLevel: result.level,
        interpretation: result.levelLabel,
        message: result.message,
        description: result.description,
        recommendations: result.recommendations,
        categoryScores: result.categoryScores,
      });

      if (!response.success) {
        throw new Error(response.error || "검사 결과 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save assessment:", error);
      setSaveError(
        "검사 결과 저장에 실패했습니다. 결과는 화면에서 확인하실 수 있습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (step === "result") {
      const result = calculateLSNSResult(answers);
      saveAssessmentResult(result);
    }
  }, [step]);

  const progress = ((currentQuestionIndex + 1) / lsnsQuestions.length) * 100;

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
            사회적 관계망 척도 (LSNS-6)
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
              <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-100 rounded-full mb-4">
                <Users className="w-12 h-12 text-teal-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                사회적 지지 체계 점검
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-lg mx-auto">
                가족 및 친구와의 관계 빈도와
                <br />
                사회적 지지 수준을 평가해보세요.
              </p>
            </div>

            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100 text-left">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-bold text-teal-900">검사 안내</h3>
                  <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                    <li>총 6개의 문항으로 구성되어 있습니다.</li>
                    <li>약 3분 정도 소요됩니다.</li>
                    <li>솔직하게 답변해주시면 정확한 분석이 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("info")}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-teal-200"
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
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none transition-all text-lg"
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
                        ? "border-teal-500 bg-teal-50 text-teal-700"
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
                        ? "border-teal-500 bg-teal-50 text-teal-700"
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
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none transition-all text-lg"
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
                <span className="text-teal-600">
                  {currentQuestionIndex + 1} / {lsnsQuestions.length}
                </span>
                <span className="text-gray-500">
                  {Math.round(progress)}% 완료
                </span>
              </div>
              <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-600"
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
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
              >
                <div className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold mb-4">
                  {lsnsQuestions[currentQuestionIndex].category}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-snug">
                  {lsnsQuestions[currentQuestionIndex].question}
                </h2>

                <div className="space-y-3">
                  {likertScaleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                        answers[lsnsQuestions[currentQuestionIndex].id] ===
                        option.value
                          ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md"
                          : "border-gray-100 bg-white text-gray-600 hover:border-teal-200 hover:bg-teal-50/30"
                      }`}
                    >
                      <div>
                        <span
                          className={`block font-bold text-lg ${
                            answers[lsnsQuestions[currentQuestionIndex].id] ===
                            option.value
                              ? "text-teal-700"
                              : "text-gray-900"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span
                          className={`text-sm ${
                            answers[lsnsQuestions[currentQuestionIndex].id] ===
                            option.value
                              ? "text-teal-600"
                              : "text-gray-400"
                          }`}
                        >
                          {option.description}
                        </span>
                      </div>
                      {answers[lsnsQuestions[currentQuestionIndex].id] ===
                        option.value && (
                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
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
            </div>
          </div>
        )}

        {step === "result" &&
          (() => {
            const result = calculateLSNSResult(answers);

            // Theme mapping based on color from calculator
            const theme = {
              green: {
                bg: "bg-green-50",
                text: "text-green-700",
                badge: "bg-green-100 text-green-700 border-green-200",
                icon: "text-green-600",
              },
              yellow: {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
                icon: "text-yellow-600",
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
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-2">
                    <TrendingUp className="w-8 h-8 text-teal-600" />
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
                      사회적 지지 수준
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold border ${theme.badge}`}
                    >
                      {result.color === "green" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {result.levelLabel}
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-xl text-gray-800 leading-relaxed font-medium text-center mb-10">
                      {result.description}
                    </p>

                    {/* Visual Score Meter (0-30 Scale) */}
                    <div className="mb-12">
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase">
                        <span>High Risk (0-5)</span>
                        <span>Moderate (6-11)</span>
                        <span>Low Risk (12+)</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {/* 
                            High (0-5): 6/31 -> ~19%
                            Mod (6-11): 6/31 -> ~19%
                            Low (12-30): 19/31 -> ~62%
                         */}
                        <div className="flex-[19] bg-red-400"></div>
                        <div className="flex-[19] bg-yellow-400"></div>
                        <div className="flex-[62] bg-green-400"></div>
                      </div>

                      {/* Indicator */}
                      <div className="relative mt-2 h-6">
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, (result.totalScore / 30) * 100)
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
                        <span>6</span>
                        <span>12</span>
                        <span>30</span>
                      </div>
                    </div>

                    {result.categoryScores && (
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-teal-50 p-4 rounded-2xl text-center border border-teal-100">
                          <p className="text-teal-700 font-bold mb-1">
                            가족 관계
                          </p>
                          <p className="text-3xl font-black text-gray-900">
                            {result.categoryScores.family}
                          </p>
                        </div>
                        <div className="bg-teal-50 p-4 rounded-2xl text-center border border-teal-100">
                          <p className="text-teal-700 font-bold mb-1">
                            친구 관계
                          </p>
                          <p className="text-3xl font-black text-gray-900">
                            {result.categoryScores.friends}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-6 bg-gray-50 rounded-2xl">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                        맞춤 권장사항
                      </h3>
                      <div className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-200"
                          >
                            <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs mt-0.5 shrink-0">
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
