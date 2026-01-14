// 학습콘텐츠 게이지 기능
document.querySelectorAll(".progress-wrapper").forEach(el => {
  const percent = Number(el.dataset.progress) || 0;
  const safe = Math.min(Math.max(percent, 0), 100);
  el.style.setProperty("--progress", `${safe * 3.6}deg`);
});


// 슬라이드 재생 및 멈춤 기능
const playPauseBtn = document.getElementById('play-pause-btn');

const pauseSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000">
    <path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/>
  </svg>
`;

const playSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000">
    <path d="M400-280v-400l200 200-200 200Z"/>
  </svg>
`;

let isPlaying = true; // 초기 재생 중 상태

playPauseBtn.addEventListener('click', () => {
  if (isPlaying) {
    swiper.autoplay.stop();
    playPauseBtn.innerHTML = playSVG;
  } else {
    swiper.autoplay.start();
    playPauseBtn.innerHTML = pauseSVG;
  }
  isPlaying = !isPlaying;
});