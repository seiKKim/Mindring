"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  calculateSelfTestResult,
  getRiskLevelLabel,
  getRiskLevelColorClass,
  getRiskLevelGradient,
} from "../utils/resultCalculator";

interface Question {
  id: number;
  text: string;
}

const questions: Question[] = [
  { id: 1, text: "오늘 날짜를 정확히 말씀하실 수 있나요?" },
  { id: 2, text: "오늘 요일을 정확히 말씀하실 수 있나요?" },
  { id: 3, text: "10년 전에 비해 기억력이 나빠졌다고 느끼시나요?" },
  { id: 4, text: "최근에 일어난 일을 기억하는 것이 어려우신가요?" },
  {
    id: 5,
    text: "물건을 두고 다니거나 어디에 두었는지 찾지 못하는 경우가 있나요?",
  },
  { id: 6, text: "가족이나 친구의 이름을 기억하지 못하는 경우가 있나요?" },
  { id: 7, text: "전화번호나 주소를 기억하는 것이 어려우신가요?" },
  { id: 8, text: "익숙한 장소에서 길을 잃는 경우가 있나요?" },
  { id: 9, text: "일상적인 일을 수행하는 것이 어려워지셨나요?" },
  { id: 10, text: "돈 계산이나 숫자 계산이 어려워지셨나요?" },
  { id: 11, text: "최근에 일어난 일을 기억하지 못하는 경우가 있나요?" },
  { id: 12, text: "반복적으로 같은 질문을 하시나요?" },
  { id: 13, text: "가족이나 친구와의 대화를 따라가기 어려우신가요?" },
  { id: 14, text: "전화번호나 집 주소를 기억하지 못하는 경우가 있나요?" },
];

const educationLevels = [
  "무학",
  "초등학교 졸업",
  "중학교 졸업",
  "고등학교 졸업",
  "전문대학 졸업",
  "대학교 졸업",
  "대학원 졸업 이상",
];

export default function SelfDementiaTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "questions" | "result">("info");
  const [userInfo, setUserInfo] = useState({
    birthYear: "",
    gender: "",
    education: "",
  });
  const [answers, setAnswers] = useState<{
    [key: number]: "yes" | "no" | null;
  }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.birthYear && userInfo.gender && userInfo.education) {
      setStep("questions");
    }
  };

  const handleAnswer = (answer: "yes" | "no") => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (answers[questions[currentQuestionIndex].id]) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // 모든 질문 완료
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
  const answeredCount = Object.values(answers).filter((a) => a !== null).length;

  // 생년 목록 생성 (1914~2024)
  const birthYears = Array.from(
    { length: 2024 - 1914 + 1 },
    (_, i) => 1914 + i
  ).reverse();

  // 검사 결과 저장 함수
  const saveAssessmentResult = async (
    result: ReturnType<typeof calculateSelfTestResult>
  ) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const currentYear = new Date().getFullYear();
      const age = userInfo.birthYear
        ? currentYear - parseInt(userInfo.birthYear)
        : null;

      const response = await fetch("/api/cognitive-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          assessmentType: "dementia_self",
          age: age,
          gender: userInfo.gender || null,
          testDate: new Date().toISOString(),
          answers: answers,
          totalScore: result.score,
          percentage: result.percentage,
          riskLevel: result.riskLevel,
          interpretation: getRiskLevelLabel(result.riskLevel),
          message: result.message,
          description: result.message,
          recommendations: result.recommendations,
          metadata: {
            birthYear: userInfo.birthYear,
            education: userInfo.education,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("검사 결과 저장에 실패했습니다.");
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

  // 결과 단계로 이동할 때 자동 저장
  useEffect(() => {
    if (step === "result") {
      const result = calculateSelfTestResult(answers);
      saveAssessmentResult(result);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center relative">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            본인 치매 검사
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Info Step */}
        {step === "info" && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                본인 치매 검사
              </h2>
              <p className="text-gray-500">
                정확한 검사를 위해 아래 정보를 입력해주세요.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">검사 안내</p>
                <p>
                  이 검사는 선별용 간이 검사이며, 정확한 진단을 대체하지
                  않습니다.
                </p>
              </div>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              {/* 생년월일 */}
              <div>
                <label
                  htmlFor="birth-year"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  생년월일
                </label>
                <select
                  id="birth-year"
                  value={userInfo.birthYear}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, birthYear: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                >
                  <option value="">생년을 선택하세요</option>
                  {birthYears.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  성별
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserInfo({ ...userInfo, gender: "male" })}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      userInfo.gender === "male"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    남성
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUserInfo({ ...userInfo, gender: "female" })
                    }
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      userInfo.gender === "female"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    여성
                  </button>
                </div>
              </div>

              {/* 교육수준 */}
              <div>
                <label
                  htmlFor="education-level"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  교육수준
                </label>
                <select
                  id="education-level"
                  value={userInfo.education}
                  onChange={(e) =>
                    setUserInfo({ ...userInfo, education: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                >
                  <option value="">교육수준을 선택하세요</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-8 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                검사 시작하기
              </button>
            </form>
          </div>
        )}

        {/* Questions Step */}
        {step === "questions" && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-blue-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-gray-500">
                  {Math.round(progress)}% 완료
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="text-center py-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
                {questions[currentQuestionIndex].text}
              </h2>
              <p className="text-gray-500">해당하는 버튼을 선택해주세요</p>
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer("yes")}
                className={`py-8 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  answers[questions[currentQuestionIndex].id] === "yes"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-md ring-1 ring-green-500"
                    : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-xl font-bold">예</span>
              </button>
              <button
                onClick={() => handleAnswer("no")}
                className={`py-8 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                  answers[questions[currentQuestionIndex].id] === "no"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-md ring-1 ring-red-500"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50"
                }`}
              >
                <XCircle className="h-8 w-8" />
                <span className="text-xl font-bold">아니오</span>
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-100">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500"
              >
                이전
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[questions[currentQuestionIndex].id]}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {currentQuestionIndex === questions.length - 1
                  ? "결과 보기"
                  : "다음"}
              </button>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === "result" &&
          (() => {
            const result = calculateSelfTestResult(answers);
            return (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    검사 결과 리포트
                  </h2>
                  <p className="text-gray-600">
                    입력하신 정보를 바탕으로 분석된 인지 기능 평가 결과입니다.
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                  {/* Result Header */}
                  <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      DATE: {new Date().toLocaleDateString()}
                    </p>
                    <div className="text-sm font-medium text-gray-500 mb-4">
                      현재 위험도 수준
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold border ${getRiskLevelColorClass(
                        result.riskLevel
                      )} bg-white shadow-sm`}
                    >
                      {result.riskLevel === "normal" && (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      {result.riskLevel !== "normal" && (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {getRiskLevelLabel(result.riskLevel)} 단계
                    </div>
                  </div>

                  <div className="p-8">
                    <p className="text-xl text-gray-800 leading-relaxed font-medium text-center mb-10">
                      {result.message}
                    </p>

                    {/* Visual Score Meter (0-14 Scale) */}
                    <div className="mb-12">
                      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase">
                        <span>Normal</span>
                        <span>Borderline</span>
                        <span>Risk</span>
                        <span>High Risk</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        {/* Segments: Normal(0-3), Border(4-6), Risk(7-9), High(10-14) */}
                        {/* Total 14 units. 
                                Normal: 4/15 (0,1,2,3) -> ~28%
                                Border: 3/15 (4,5,6) -> ~20%
                                Risk: 3/15 (7,8,9) -> ~20%
                                High: 5/15 (10-14) -> ~33%
                            */}
                        <div className="flex-[4] bg-green-400"></div>
                        <div className="flex-[3] bg-yellow-400"></div>
                        <div className="flex-[3] bg-orange-400"></div>
                        <div className="flex-[5] bg-red-400"></div>
                      </div>

                      {/* Indicator */}
                      <div className="relative mt-2 h-6">
                        <div
                          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                          style={{
                            left: `${Math.min(
                              100,
                              Math.max(0, (result.score / 14) * 100)
                            )}%`,
                          }}
                        >
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-800 rotate-180 mb-1"></div>
                          <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                            내 점수: {result.score}점
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-6 px-1">
                        <span>0</span>
                        <span className="pl-8">3</span>
                        <span>6</span>
                        <span className="pr-12">9</span>
                        <span>14</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                      <div className="p-5 bg-gray-50 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {result.score}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          예 답변 수
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          (총 14문항)
                        </div>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-2xl text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {result.percentage}%
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          위험도 비율
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          (환산 점수)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-lg text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    전문가 권장 사항
                  </h3>
                  <div className="space-y-4">
                    {result.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100"
                      >
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 font-medium leading-relaxed">
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Status & Actions */}
                <div className="space-y-6 pt-4">
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
                        검사 결과가 안전하게 저장되었습니다
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setStep("info");
                        setAnswers({});
                        setCurrentQuestionIndex(0);
                      }}
                      className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-lg"
                    >
                      다시 검사하기
                    </button>
                    <button
                      onClick={() => router.push("/services/contact")}
                      className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-lg shadow-md"
                    >
                      전문가 상담 예약
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => router.push("/services/smart-cognitive")}
                      className="text-gray-400 hover:text-gray-600 text-sm font-medium underline underline-offset-4"
                    >
                      스마트 인지관리 메인으로 돌아가기
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
