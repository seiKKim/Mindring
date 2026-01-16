"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle,
  PlayCircle,
} from "lucide-react";
import { AlertModal } from "@/components/ui/alert-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

type UserCourse = {
  enrollmentId: string;
  courseId: string;
  progress: number;
  status: "LEARNING" | "COMPLETED";
  lastAccessedAt: string;
  academyCourse: {
    title: string;
    thumbnail: string | null;
    instructor: string | null;
  };
};

function MyPageContent() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "learning" ? "learning" : "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "learning") {
      setActiveTab("learning");
    } else {
      setActiveTab("profile");
    }
  }, [searchParams]);

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [loading, setLoading] = useState(true);
  const [socialInfo, setSocialInfo] = useState<{
    provider: string;
    id: string;
  } | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);

  // Verification states for UI feedback
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.email) {
            setEmail(data.user.email);
          }
          if (data.user.socialAccounts && data.user.socialAccounts.length > 0) {
            // Assuming displaying the first linked account for now
            const acc = data.user.socialAccounts[0];
            setSocialInfo({ provider: acc.provider, id: acc.providerUserId });
          }
        }
      })
      .catch((err) => console.error("Failed to fetch user info", err))
      .finally(() => setLoading(false));

    fetch("/api/my-courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.userCourses) {
          setUserCourses(data.userCourses);
        }
      })
      .catch((err) => console.error("Failed to fetch user courses", err));
  }, []);

  // Alert Modal State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleEmailCheck = () => {
    // Mock email duplicate check
    if (!email) {
      showAlert("warning", "필수 입력", "이메일을 입력해주세요.");
      return;
    }
    if (email === "test@example.com") {
      showAlert("error", "중복된 이메일", "이미 사용 중인 이메일입니다.");
    } else {
      showAlert("success", "사용 가능", "사용 가능한 이메일입니다.");
    }
  };

  const handleSendVerification = () => {
    // Mock sending SMS
    if (!phoneNumber) {
      showAlert("warning", "필수 입력", "휴대폰 번호를 입력해주세요.");
      return;
    }
    showAlert("info", "인증번호 발송", "인증번호가 발송되었습니다.");
  };

  const handleVerifyCode = () => {
    // Mock code verification
    if (verificationCode === "123456") {
      setIsPhoneVerified(true);
      showAlert("success", "인증 완료", "인증되었습니다.");
    } else {
      showAlert("error", "인증 실패", "인증번호가 올바르지 않습니다.");
    }
  };

  const handleSave = () => {
    let hasError = false;

    // Password Validation
    if (password.length < 8) {
      setPasswordError("8자 이상, 영문/숫자 각각 1자 이상 포함");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      hasError = true;
    } else {
      setPasswordConfirmError("");
    }

    if (!hasError) {
      showAlert("success", "저장 완료", "회원정보가 저장되었습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-20 px-4">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-black mb-4">회원정보 수정</h1>
        <p className="text-gray-600 text-sm">
          외부로부터 고객님의 정보를 안전하게 보호하기 위해 개인정보를 다시 한
          번 확인합니다.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-4xl"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profile">회원정보 수정</TabsTrigger>
          <TabsTrigger value="learning">나의 강의실</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="w-full border border-gray-200 rounded-lg p-0 bg-white shadow-sm">
            <div className="flex flex-col">
              {/* Header Row */}
              <div className="border-b border-gray-200 px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full border-2 border-pink-700 bg-white"></div>
                  <h2 className="text-lg font-bold text-gray-900">
                    회원정보 수정
                  </h2>
                </div>
              </div>

              {/* Form Rows */}
              <div className="divide-y divide-gray-100">
                {/* Auth Method */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-700">
                      인증방법 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          authMethod === "email"
                            ? "border-pink-600"
                            : "border-gray-300"
                        }`}
                      >
                        {authMethod === "email" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="authMethod"
                        value="email"
                        checked={authMethod === "email"}
                        onChange={() => setAuthMethod("email")}
                        className="hidden"
                      />
                      <span className="text-sm font-medium text-gray-600">
                        이메일
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          authMethod === "phone"
                            ? "border-pink-600"
                            : "border-gray-300"
                        }`}
                      >
                        {authMethod === "phone" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="authMethod"
                        value="phone"
                        checked={authMethod === "phone"}
                        onChange={() => setAuthMethod("phone")}
                        className="hidden"
                      />
                      <span className="text-sm font-bold text-gray-900 border border-pink-600 px-4 py-1.5 rounded bg-white">
                        휴대폰번호
                      </span>
                    </label>
                  </div>
                </div>

                {/* SNS Connection */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-700">
                      SNS 연동 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4 flex items-center gap-2">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : socialInfo ? (
                      <>
                        {socialInfo.provider === "kakao" && (
                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-amber-900 fill-current" />
                          </div>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          {socialInfo.id}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        연동된 SNS 계정이 없습니다.
                      </span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-700">
                      이메일 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4 flex items-center gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="max-w-md h-12"
                    />
                    <Button
                      variant="outline"
                      className="h-12 px-6 text-gray-600 border-gray-300 hover:bg-gray-50 font-medium"
                      onClick={handleEmailCheck}
                    >
                      중복확인
                    </Button>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-700">
                      비밀번호 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4 flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-3">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="max-w-md h-12"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <AlertCircle className="w-4 h-4 text-pink-600" />
                        <span>8자 이상, 영문/숫자 각각 1자 이상 포함</span>
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-600 mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password Confirm */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-center">
                    <span className="text-sm font-bold text-gray-700">
                      비밀번호 확인 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4">
                    <Input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="max-w-md h-12"
                    />
                    {passwordConfirmError && (
                      <p className="text-xs text-red-600 mt-1">
                        {passwordConfirmError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-gray-50 px-8 py-4 flex items-start pt-6">
                    <span className="text-sm font-bold text-gray-700">
                      휴대폰 번호 <span className="text-pink-600">*</span>
                    </span>
                  </div>
                  <div className="flex-1 px-8 py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="tel"
                        placeholder="01012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="max-w-md h-12"
                      />
                      <Button
                        variant="outline"
                        className="h-12 px-4 text-gray-600 border-gray-300 hover:bg-gray-50 text-sm font-medium w-32"
                        onClick={handleSendVerification}
                      >
                        인증번호 전송
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="max-w-md h-12"
                        disabled={isPhoneVerified}
                      />
                      <Button
                        variant="outline"
                        className="h-12 px-4 text-gray-600 border-gray-300 hover:bg-gray-50 text-sm font-medium w-32"
                        onClick={handleVerifyCode}
                        disabled={isPhoneVerified}
                      >
                        {isPhoneVerified ? "확인완료" : "인증번호 확인"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-12 flex gap-4 justify-center">
            <Button
              variant="outline"
              className="w-48 h-12 text-gray-600 border-gray-300 hover:bg-gray-50 font-medium text-base"
            >
              취소
            </Button>
            <Button
              className="w-48 h-12 bg-black text-white hover:bg-gray-800 font-bold text-base"
              onClick={handleSave}
            >
              저장
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  수강 중인 강좌
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userCourses.filter((c) => c.status === "LEARNING").length}개
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  완료한 강좌
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userCourses.filter((c) => c.status === "COMPLETED").length}개
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                내 강좌 리스트
              </h3>
            </div>
            {userCourses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                수강 중인 강좌가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {userCourses.map((course) => (
                  <div
                    key={course.enrollmentId}
                    className="p-6 flex flex-col sm:flex-row gap-6 items-start"
                  >
                    {course.academyCourse.thumbnail && (
                      <div className="w-full sm:w-48 aspect-video relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* Using img for simplicity if Next Image needs config */}
                        <img
                          src={course.academyCourse.thumbnail}
                          alt={course.academyCourse.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">
                            {course.academyCourse.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {course.academyCourse.instructor}
                          </p>
                        </div>
                        {course.status === "COMPLETED" && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            수료
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">진도율</span>
                          <span className="font-bold text-pink-600">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          최근 학습:{" "}
                          {new Date(course.lastAccessedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Button className="w-full sm:w-auto gap-2 bg-pink-600 hover:bg-pink-700">
                        <PlayCircle className="w-4 h-4" />
                        이어학습
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
      />
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <MyPageContent />
    </Suspense>
  );
}
