// components/main/Footer.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.content} row_f`}>
        {/* Logo */}
        <div className={styles.logoBox}>
          <Image
            src="/img/mindring_logo_f.png"
            alt="Mindring logo"
            width={140}
            height={47}
          />
        </div>

        {/* Text Content */}
        <div className={`${styles.textBox} row_f`}>
          <div className="col_f">
            {/* Terms */}
            <ul className={`${styles.terms} row_f`}>
              <li>
                <Link href="/privacy">개인정보처리방침</Link>
              </li>
              <li>
                <Link href="/terms">이용약관</Link>
              </li>
              <li>
                <Link href="/partnership">제휴문의</Link>
              </li>
            </ul>

            {/* Company Info */}
            <div className={styles.info}>
              <p>
                경기도 고양시 일산동구 중앙로 1036 4층
                (고양중장년기술창업센터, 1-1층)
              </p>
              <p>
                대표자 : 서현숙 | 사업자등록번호 : 255-37-01508 |
                통신판매신고번호 : 제2025-고양일산동-0921호
              </p>
            </div>

            {/* Copyright */}
            <p className={styles.copyright}>
              Copyright ⓒ 2025.MINDRA INC. All rights reserved.
            </p>
          </div>

          {/* Social Media */}
          <div className={`${styles.sns} row_f`}>
            <Link href="#" className="row_f">
              <Image
                src="/img/icon_instagram.png"
                alt="Instagram"
                width={20}
                height={20}
              />
            </Link>
            <Link href="#" className="row_f">
              <Image
                src="/img/icon_blog.png"
                alt="Blog"
                width={20}
                height={20}
              />
            </Link>
            <Link href="#" className="row_f">
              <Image
                src="/img/icon_youtube.png"
                alt="YouTube"
                width={20}
                height={20}
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
