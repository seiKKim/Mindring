// components/main/ServicesGrid.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../app/main.module.css';

interface ServiceBox {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  big?: boolean;
}

const SERVICES: ServiceBox[] = [
  {
    id: '1',
    title: 'AI 기억퍼즐',
    subtitle: '맞춤 퍼즐로\n쉬운 기억력 훈련',
    image: '/img/content_img01.png',
    href: '/puzzle-home',
  },
  {
    id: '2',
    title: 'AI 자서전',
    subtitle: 'AI가 도와주는\n나만의 삶 기록',
    image: '/img/content_img02.png',
    href: '/services/lifebook',
  },
  {
    id: '3',
    title: '인지 콘텐츠',
    subtitle: '즐겁게 두뇌를 깨우는\n다양한 인지 활동',
    image: '/img/content_img03.png',
    href: '/services/cognitive',
  },
  {
    id: '4',
    title: '스마트 인지관리',
    subtitle: '스스로 체크하는\n뇌건강정서 건강 관리',
    image: '/img/content_img04.png',
    href: '/services/smart-cognitive',
  },
  {
    id: '5',
    title: '스마트 워크북',
    subtitle: '누구나 쉽게 등록하고\n공유하는 맞춤 워크북',
    image: '/img/content_img05.png',
    href: '/services/academy',
  },
  {
    id: '6',
    title: '스마트 교육',
    subtitle: '인지 커리큘럼부터\n영상현장 교육까지',
    image: '/img/content_img06.png',
    href: '/services/academy',
  },
  {
    id: '7',
    title: '사회공헌',
    subtitle: '그레이트 시니어 네트워크를\n소개합니다',
    image: '/img/content_img07.png',
    href: '/services/social',
    big: true,
  },
];

export default function ServicesGrid() {
  return (
    <section className="sec02">
      <div className={styles.sec02Content}>
        {SERVICES.map((service) => (
          <Link
            key={service.id}
            href={service.href}
            className={`${styles.box} col_f ${service.big ? styles.big : ''}`}
          >
            <p className={`${styles.titleT} font_clipart`}>{service.title}</p>
            <p className={styles.subT}>
              {service.subtitle.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < service.subtitle.split('\n').length - 1 && <br />}
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
