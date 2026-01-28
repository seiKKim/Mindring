// components/main/Header.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import styles from "./Header.module.css";
import { useModalContext } from "../ui/modal-provider";

interface HeaderProps {
  user?: {
    name: string;
    image?: string;
    isAdmin?: boolean;
  } | null;
}

export default function Header({ user: initialUser }: HeaderProps) {
  const [user, setUser] = React.useState(initialUser);
  const [imgSrc, setImgSrc] = React.useState("/img/icon_user_default.png");
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const router = useRouter();
  const { confirm } = useModalContext();

  React.useEffect(() => {
    // 표준 transform 사용 (Safari 호환)
    document.body.style.transform = `scale(${zoomLevel / 100})`;
    document.body.style.transformOrigin = "top left";
    document.body.style.width = `${10000 / zoomLevel}%`;
  }, [zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 80));
  };

  const handleRestrictedClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      confirm.warning(
        "로그인 필요",
        "로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?",
        () => router.push("/login"),
        { confirmText: "이동", cancelText: "취소" },
      );
    }
  };

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    window.location.href = "/api/auth/logout";
  };

  React.useEffect(() => {
    if (user?.image) {
      setImgSrc(user.image);
    } else {
      setImgSrc("/img/icon_user_default.png");
    }
  }, [user]);

  React.useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        })
        .catch((err) => console.error("Failed to fetch user:", err));
    }
  }, [initialUser]);

  return (
    <header>
      {/* Top Header */}
      <div className={styles.topH}>
        <div className={`row_f font_goormsans`}>
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                type="button"
              >
                로그아웃
              </button>
              <Link href="/mypage">마이페이지</Link>
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </>
          )}
          <div className={`${styles.screenSet} row_f`}>
            <p>화면크기</p>
            <button
              onClick={handleZoomIn}
              className={styles.zoomBtn}
              aria-label="화면 확대"
              type="button"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={handleZoomOut}
              className={styles.zoomBtn}
              aria-label="화면 축소"
              type="button"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Header */}
      <div className={`${styles.botH} row_f`}>
        {/* Logo */}
        <div className={styles.logoBox}>
          <Link href="/">
            <Image
              src="/img/mindring_logo_h.png"
              alt="Mindring logo"
              width={120}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav>
          <ul className={`${styles.depth01} row_f font-clipart`}>
            <li>
              <Link href="/puzzle-home" onClick={handleRestrictedClick}>
                <p>AI기억퍼즐</p>
              </Link>
            </li>
            <li>
              <Link href="/services/lifebook" onClick={handleRestrictedClick}>
                <p>AI자서전</p>
              </Link>
            </li>
            <li>
              <Link href="/services/cognitive" onClick={handleRestrictedClick}>
                <p>인지콘텐츠</p>
              </Link>
            </li>
            <li>
              <Link href="/services/workbook" onClick={handleRestrictedClick}>
                <p>스마트워크북</p>
              </Link>
            </li>
            <li>
              <Link href="/services/coloring" onClick={handleRestrictedClick}>
                <p>마음색칠</p>
              </Link>
            </li>
            <li>
              <Link href="/services/academy" onClick={handleRestrictedClick}>
                <p>스마트교육</p>
              </Link>
              <ul className={`${styles.depth02} font-clipart`}>
                <li>
                  <Link
                    href="/services/academy?tab=curriculum"
                    onClick={handleRestrictedClick}
                  >
                    <p>인지 커리큘럼</p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/academy?tab=video"
                    onClick={handleRestrictedClick}
                  >
                    <p>인지교육 영상</p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services/academy?tab=field"
                    onClick={handleRestrictedClick}
                  >
                    <p>교육현장</p>
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <Link
                href="/services/smart-cognitive"
                onClick={handleRestrictedClick}
              >
                <p>스마트인지관리</p>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Menu */}
        <div className={`${styles.userMenu} row_f`}>
          {user ? (
            <>
              <div className={`${styles.user} row_f`}>
                <div className={styles.imgBox}>
                  <Image
                    src={imgSrc}
                    alt="user profile"
                    width={24}
                    height={24}
                    onError={() => setImgSrc("/img/icon_user_default.png")}
                  />
                </div>
                <p>
                  <span>{user.name}</span> 님 안녕하세요.
                </p>
              </div>
              {user.isAdmin && (
                <Link
                  href="/admin/workbook"
                  className={`${styles.myCourse} row_f`}
                  style={{ marginRight: "10px", backgroundColor: "#4f46e5" }}
                >
                  <p style={{ color: "#fff" }}>관리자</p>
                </Link>
              )}
              <Link
                href="/mypage?tab=learning"
                className={`${styles.myCourse} row_f`}
              >
                <Image
                  src="/img/graph_disk.png"
                  alt="course icon"
                  width={18}
                  height={18}
                />
                <p>학습현황</p>
              </Link>
            </>
          ) : (
            <>
              <div className={`${styles.login} row_f`}>
                <Image
                  src="/img/icon_login.png"
                  alt="login icon"
                  width={24}
                  height={24}
                />
                <Link href="/login">로그인</Link>
              </div>
              <div className={styles.signup}>
                <Link href="/signup">회원가입</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
