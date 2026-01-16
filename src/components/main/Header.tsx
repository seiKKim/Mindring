// components/main/Header.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

interface HeaderProps {
  user?: {
    name: string;
    image?: string;
    isAdmin?: boolean | number;
  } | null;
}

export default function Header({ user: initialUser }: HeaderProps) {
  const [user, setUser] = React.useState(initialUser);
  const [imgSrc, setImgSrc] = React.useState("/img/icon_user_default.png");

  React.useEffect(() => {
    if (user?.image) {
      setImgSrc(user.image);
    } else {
      setImgSrc("/img/icon_user_default.png");
    }
  }, [user]);

  React.useEffect(() => {
    // props로 받은 유저가 있으면 그것을 사용
    if (initialUser) {
      setUser(initialUser);
    } else {
      // props에 유저가 없으면 API로 확인 (클라이언트 사이드 체크)
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
              <a href="/api/auth/logout">로그아웃</a>
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
            <div>+</div>
            <div>-</div>
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
          <ul className={`${styles.depth01} row_f`}>
            <li>
              <Link href="/puzzle-home">
                <p>AI기억퍼즐</p>
              </Link>
            </li>
            <li>
              <Link href="/services/lifebook">
                <p>AI자서전</p>
              </Link>
            </li>
            <li>
              <Link href="/services/cognitive">
                <p>인지콘텐츠</p>
              </Link>
            </li>
            <li>
              <Link href="/services/workbook">
                <p>스마트워크북</p>
              </Link>
            </li>
            <li>
              <Link href="/services/academy">
                <p>스마트교육</p>
              </Link>
              <ul className={styles.depth02}>
                <li>
                  <p>인지 커리큘럼</p>
                </li>
                <li>
                  <p>인지교육 영상</p>
                </li>
                <li>
                  <p>교육현장</p>
                </li>
              </ul>
            </li>
            <li>
              <Link href="/services/smart-cognitive">
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
              {(user.isAdmin === true || user.isAdmin === 1) && (
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
