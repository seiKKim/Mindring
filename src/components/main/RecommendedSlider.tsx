// components/main/RecommendedSlider.tsx
'use client';

import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

// Import CSS module
import styles from './RecommendedSlider.module.css';

interface ContentCard {
  id: string;
  keyword: string;
  title: string;
  progress?: number; // undefined = 학습하기, 0-99 = 학습중, 100 = 학습완료
  color: 'c_yellow' | 'c_violet' | 'c_purple' | 'c_blue' | 'c_teal';
}

const RECOMMENDED_CONTENT: ContentCard[] = [
  {
    id: '1',
    keyword: '주의력',
    title: '낱말 연결 게임',
    color: 'c_yellow',
  },
  {
    id: '2',
    keyword: '언어능력',
    title: '속담 완성하기',
    progress: 90,
    color: 'c_violet',
  },
  {
    id: '3',
    keyword: '시공간능력',
    title: '다른 그림 찾기',
    progress: 20,
    color: 'c_purple',
  },
  {
    id: '4',
    keyword: '기억력',
    title: '단어 짝 맞추기',
    progress: 100,
    color: 'c_blue',
  },
  {
    id: '5',
    keyword: '지남력',
    title: '인물 맞추기',
    progress: 60,
    color: 'c_teal',
  },
];

export default function RecommendedSlider() {
  const swiperRef = useRef<SwiperType>();
  const [isPlaying, setIsPlaying] = useState(true);

  const handlePlayPause = () => {
    if (swiperRef.current) {
      if (isPlaying) {
        swiperRef.current.autoplay.stop();
      } else {
        swiperRef.current.autoplay.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getStatusText = (progress?: number) => {
    if (progress === undefined) return '학습하기';
    if (progress === 100) return '학습완료';
    return '학습중';
  };

  return (
    <section className="sec01">
      <div className={styles['recommended-content']}>
        {/* Top Header */}
        <div className={`${styles.top} row_f font_clipart`}>
          <div className="row_f">
            <p className={styles.titleT}>오늘의 추천 인지 콘텐츠</p>
            <div className={`${styles.naviBtn} row_f`}>
              {/* Previous Button */}
              <div
                className="button-prev row_f"
                onClick={() => swiperRef.current?.slidePrev()}
                role="button"
                tabIndex={0}
                aria-label="이전 슬라이드"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000000"
                >
                  <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" />
                </svg>
              </div>

              {/* Next Button */}
              <div
                className="button-next row_f"
                onClick={() => swiperRef.current?.slideNext()}
                role="button"
                tabIndex={0}
                aria-label="다음 슬라이드"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000000"
                >
                  <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
                </svg>
              </div>

              {/* Play/Pause Button */}
              <div
                className="row_f"
                id="play-pause-btn"
                onClick={handlePlayPause}
                role="button"
                tabIndex={0}
                aria-label={isPlaying ? '자동 재생 일시정지' : '자동 재생 시작'}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#000000"
                  >
                    <path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#000000"
                  >
                    <path d="M400-280v-400l200 200-200 200Z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* More Button */}
          <div className={`${styles.moreBtn} row_f`}>
            <p>더보기</p>
            <div className="row_f">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#820FB4"
              >
                <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Swiper Container */}
        <div className={styles['swiper-container']}>
          <div className={styles.swiper}>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              slidesPerView={1.5}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2.1,
                },
                1024: {
                  slidesPerView: 3.1,
                },
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
            >
              {RECOMMENDED_CONTENT.map((card) => (
                <SwiperSlide key={card.id}>
                  <div className={`swiper-slide col_f ${card.color}`}>
                    <span className={`card_keyword font_goormsans`}>
                      {card.keyword}
                    </span>
                    <p className={`card_title font_clipart`}>{card.title}</p>
                    <div className="status">
                      {card.progress === undefined ? (
                        <div className={`learnBtn row_f font_clipart`}>
                          <p>학습하기</p>
                        </div>
                      ) : (
                        <div
                          className="progress-wrapper"
                          style={
                            {
                              '--progress': `${(card.progress / 100) * 360}deg`,
                            } as React.CSSProperties
                          }
                        >
                          <div className="progress-ring"></div>
                          <p className={`progress-text font_clipart`}>
                            {getStatusText(card.progress)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
