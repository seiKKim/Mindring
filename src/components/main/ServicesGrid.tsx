// components/main/ServicesGrid.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../../app/main.module.css";

interface ServiceBox {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  big?: boolean;
  variant?: "default" | "yellow";
}

const SERVICES: ServiceBox[] = [
  {
    id: "1",
    title: "AI 기억퍼즐",
    subtitle: "맞춤 퍼즐로\n쉬운 기억력 훈련",
    image: "/img/content_img01.png",
    href: "/puzzle-home",
  },
  {
    id: "2",
    title: "AI 자서전",
    subtitle: "AI가 도와주는\n나만의 삶 기록",
    image: "/img/content_img02.png",
    href: "/services/lifebook",
  },
  {
    id: "3",
    title: "인지 콘텐츠",
    subtitle: "즐겁게 두뇌를 깨우는\n다양한 인지 활동",
    image: "/img/content_img03.png",
    href: "/services/cognitive",
  },
  {
    id: "5",
    title: "스마트 워크북",
    subtitle: "누구나 쉽게 등록하고\n공유하는 맞춤 워크북",
    image: "/img/content_img05.png",
    href: "/services/workbook",
  },
  {
    id: "8",
    title: "마음색칠",
    subtitle: "색으로 마음을 표현하는\n디지털 색칠 활동",
    image: "/img/icon_4.png",
    href: "/services/coloring",
  },
  {
    id: "6",
    title: "스마트 교육",
    subtitle: "인지 커리큘럼부터\n영상현장 교육까지",
    image: "/img/content_img06.png",
    href: "/services/academy",
  },
  {
    id: "4",
    title: "스마트 인지관리",
    subtitle: "스스로 체크하는\n뇌건강정서 건강 관리",
    image: "/img/content_img04.png",
    href: "/services/smart-cognitive",
  },
  {
    id: "7",
    title: "사회공헌",
    subtitle: "그레이트 시니어 네트워크를\n소개합니다",
    image: "/img/content_img07.png",
    href: "/services/social",
    variant: "yellow",
  },
];

import { useRouter } from "next/navigation";
import { useModalContext } from "../ui/modal-provider";

interface ServicesGridProps {
  isLoggedIn?: boolean;
}

export default function ServicesGrid({ isLoggedIn }: ServicesGridProps) {
  const router = useRouter();
  const { confirm } = useModalContext();

  const handleServiceClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      confirm.warning(
        "로그인 필요",
        "로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?",
        () => router.push("/login"),
        { confirmText: "이동", cancelText: "취소" },
      );
    }
  };

  return (
    <section className="sec02">
      <div className={styles.sec02Content}>
        {SERVICES.map((service) => (
          <Link
            key={service.id}
            href={service.href}
            onClick={(e) => handleServiceClick(e)}
            className={`${styles.box} col_f ${service.big ? styles.big : ""} ${
              service.variant === "yellow" ? styles.yellow : ""
            }`}
          >
            <p className={`${styles.titleT} font_clipart`}>{service.title}</p>
            <p className={styles.subT}>
              {service.subtitle.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < service.subtitle.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <Image
              src={service.image}
              alt={service.title}
              width={200}
              height={200}
              className={styles.abs}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
