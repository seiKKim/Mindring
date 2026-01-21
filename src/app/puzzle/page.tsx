// app/puzzle/page.tsx
// CSS 모듈을 사용하도록 업데이트된 퍼즐 게임

"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import styles from "../puzzle.module.css";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  calculatePuzzleScore,
  formatTime,
  getDifficultyLabel,
} from "@/lib/puzzle-score";
import {
  Shuffle,
  Pause,
  Play,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronsRight,
  ChevronRight,
  Info,
  Image as ImageIcon,
} from "lucide-react";

// ---------------- Types ----------------
interface Tile {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  angle: number;
  locked: boolean;
  selected?: boolean;
  groupId: number;
}
interface Edges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
type Rect = { x: number; y: number; w: number; h: number };

interface PuzzleRanking {
  userId: string;
  score: number;
}

// ---------------- Utils ----------------
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const isEdge = (r: number, c: number, rows: number, cols: number) =>
  r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
const norm = (a: number) => ((a % 360) + 360) % 360;

type PointerCaptureTarget = Element & {
  setPointerCapture(pointerId: number): void;
};
function isPointerCaptureTarget(
  t: EventTarget | null,
): t is PointerCaptureTarget {
  return !!t && typeof (t as Element).setPointerCapture === "function";
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

function buildEdges(rows: number, cols: number, rng: () => number): Edges[][] {
  const edges: Edges[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })),
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const e = edges[r][c];
      if (r === 0) e.top = 0;
      else e.top = -edges[r - 1][c].bottom;

      if (c === 0) e.left = 0;
      else e.left = -edges[r][c - 1].right;

      if (c === cols - 1) e.right = 0;
      else e.right = Math.random() > 0.5 ? 1 : -1;

      if (r === rows - 1) e.bottom = 0;
      else e.bottom = Math.random() > 0.5 ? 1 : -1;
    }
  }
  return edges;
}

function buildPiecePath(
  w: number,
  h: number,
  e: Edges,
  knob = Math.min(w, h) * 0.22,
): string {
  const k = knob,
    cw = w / 2,
    ch = h / 2,
    c = k * 0.552;
  const top = (s: number) =>
    !s
      ? `L ${w} 0`
      : [
          `L ${cw - k} 0`,
          `C ${cw - k + c} 0 ${cw - c} ${-s * k} ${cw} ${-s * k}`,
          `C ${cw + c} ${-s * k} ${cw + k - c} 0 ${cw + k} 0`,
          `L ${w} 0`,
        ].join(" ");
  const right = (s: number) =>
    !s
      ? `L ${w} ${h}`
      : [
          `L ${w} ${ch - k}`,
          `C ${w} ${ch - k + c} ${w + s * k} ${ch - c} ${w + s * k} ${ch}`,
          `C ${w + s * k} ${ch + c} ${w} ${ch + k - c} ${w} ${ch + k}`,
          `L ${w} ${h}`,
        ].join(" ");
  const bottom = (s: number) =>
    !s
      ? `L 0 ${h}`
      : [
          `L ${cw + k} ${h}`,
          `C ${cw + k - c} ${h} ${cw + c} ${h + s * k} ${cw} ${h + s * k}`,
          `C ${cw - c} ${h + s * k} ${cw - k + c} ${h} ${cw - k} ${h}`,
          `L 0 ${h}`,
        ].join(" ");
  const left = (s: number) =>
    !s
      ? `Z`
      : [
          `L 0 ${ch + k}`,
          `C 0 ${ch + k - c} ${-s * k} ${ch + c} ${-s * k} ${ch}`,
          `C ${-s * k} ${ch - c} 0 ${ch - k + c} 0 ${ch - k}`,
          `Z`,
        ].join(" ");
  return [
    `M 0 0`,
    top(e.top),
    right(e.right),
    bottom(e.bottom),
    left(e.left),
  ].join(" ");
}

// ---------- Non-overlapping spawn positions ----------
function rectsOverlap(a: Rect, b: Rect, gap: number) {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}
function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function generateNonOverlappingSpawnPositions(
  outerW: number,
  outerH: number,
  play: Rect,
  tileW: number,
  tileH: number,
  count: number,
  rng: () => number,
) {
  const gapBase = Math.max(10, Math.round(Math.min(tileW, tileH) * 0.12));
  const bands: Rect[] = [
    { x: 0, y: 0, w: Math.max(0, play.x), h: outerH },
    {
      x: play.x + play.w,
      y: 0,
      w: Math.max(0, outerW - (play.x + play.w)),
      h: outerH,
    },
    { x: 0, y: 0, w: outerW, h: Math.max(0, play.y) },
    {
      x: 0,
      y: play.y + play.h,
      w: outerW,
      h: Math.max(0, outerH - (play.y + play.h)),
    },
  ];
  const candidates: Rect[] = [];
  for (const b of bands) {
    if (b.w <= 0 || b.h <= 0) continue;
    const stepX = tileW + gapBase,
      stepY = tileH + gapBase;
    for (let y = b.y; y <= b.y + b.h - tileH; y += stepY) {
      for (let x = b.x; x <= b.x + b.w - tileW; x += stepX) {
        candidates.push({ x, y, w: tileW, h: tileH });
      }
    }
  }
  shuffleInPlace(candidates, rng);
  const out: Rect[] = [];
  const trySelect = (rects: Rect[], gap: number) => {
    for (const r of rects) {
      if (out.length >= count) break;
      let ok = true;
      for (const c of out) {
        if (rectsOverlap(c, r, gap)) {
          ok = false;
          break;
        }
      }
      if (ok) out.push(r);
    }
  };
  trySelect(candidates, gapBase);
  let gap = gapBase;
  while (out.length < count && gap > 2) {
    gap = Math.floor(gap * 0.7);
    trySelect(candidates, gap);
  }
  let guard = 6000;
  while (out.length < count && guard-- > 0) {
    const x = Math.floor(rng() * (outerW - tileW));
    const y = Math.floor(rng() * (outerH - tileH));
    const r = { x, y, w: tileW, h: tileH };
    if (rectsOverlap(r, play, 0)) continue;
    let ok = true;
    for (const c of out) {
      if (rectsOverlap(c, r, 4)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(r);
  }
  return out.slice(0, count).map(({ x, y }) => ({ x, y }));
}

/* ===================== SFX: 웹오디오 효과음 훅 ===================== */
type SfxApi = {
  enabled: boolean;
  volume: number;
  setEnabled: (b: boolean) => void;
  setVolume: (n: number) => void;
  prime: () => void;
  click: () => void;
  snap: () => void;
  merge: () => void;
  rotate: () => void;
  shuffle: () => void;
  complete: () => void;
  error: () => void;
};
function useSfx(): SfxApi {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.6);

  const ensureCtx = async () => {
    if (!ctxRef.current) {
      const AC: typeof AudioContext | undefined =
        (
          window as Window &
            typeof globalThis & { webkitAudioContext?: typeof AudioContext }
        ).AudioContext ??
        (
          window as Window &
            typeof globalThis & { webkitAudioContext?: typeof AudioContext }
        ).webkitAudioContext;

      if (!AC) return null;
      const ctx: AudioContext = new AC();
      const g = ctx.createGain();
      g.gain.value = volume;
      g.connect(ctx.destination);
      ctxRef.current = ctx;
      gainRef.current = g;
    }

    // 비동기로 resume 처리
    if (ctxRef.current!.state === "suspended") {
      try {
        await ctxRef.current!.resume();
      } catch (error) {
        console.warn("AudioContext resume failed:", error);
        return null;
      }
    }

    return ctxRef.current;
  };

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // 음원 파일 로드
  useEffect(() => {
    // HTML Audio 엘리먼트 생성 및 미리 로드
    const audio = new Audio("/sounds/MP_3.mp3");
    audio.volume = volume;
    audio.preload = "auto";
    celebrationAudioRef.current = audio;

    return () => {
      if (celebrationAudioRef.current) {
        celebrationAudioRef.current.pause();
        celebrationAudioRef.current = null;
      }
    };
  }, []);

  // 볼륨 변경 시 오디오 볼륨도 업데이트
  useEffect(() => {
    if (celebrationAudioRef.current) {
      celebrationAudioRef.current.volume = volume;
    }
  }, [volume]);

  const env = (
    startTime: number,
    node: GainNode,
    dur: number,
    a = 0.005,
    r = 0.08,
    peak = 1,
  ) => {
    node.gain.cancelScheduledValues(startTime);
    node.gain.setValueAtTime(0.0001, startTime);
    node.gain.linearRampToValueAtTime(peak, startTime + a);

    // 시간이 음수가 되지 않도록 보정
    const endTime = Math.max(startTime + a + 0.001, startTime + dur - r);
    node.gain.exponentialRampToValueAtTime(0.0001, endTime);
  };
  const pluck = async (
    freq: number,
    dur = 0.15,
    type: OscillatorType = "sine",
    detune = 0,
  ) => {
    if (!enabled) return;
    const ctx = await ensureCtx();
    if (!ctx || ctx.state !== "running") {
      console.warn("AudioContext not ready for sound playback");
      return;
    }

    // 지속시간이 너무 짧으면 최소값으로 보정
    const safeDur = Math.max(0.01, dur);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(g);
    g.connect(gainRef.current!);
    const t = ctx.currentTime;
    env(t, g, safeDur, 0.01, 0.06, 0.9);
    osc.start(t);
    osc.stop(t + safeDur);
  };
  const woodTick = () => pluck(900, 0.07, "triangle");
  const softBell = () => {
    pluck(660, 0.12, "sine");
    pluck(990, 0.12, "sine", -5);
  };
  const woodMerge = () => {
    pluck(520, 0.12, "triangle");
    pluck(780, 0.12, "triangle", -8);
  };
  const rotateFx = () => pluck(420, 0.09, "square");
  const shuffleFx = () => {
    // 간단하고 자연스러운 셔플 사운드
    const cardShuffle = async () => {
      const ctx = await ensureCtx();
      if (!ctx || ctx.state !== "running") return;

      // 부드러운 카드 섞는 소리 (3단계)
      // 1단계: 시작
      setTimeout(() => pluck(150, 0.08, "triangle"), 0);

      // 2단계: 섞기 (6개의 연속음)
      for (let i = 0; i < 6; i++) {
        setTimeout(
          () => {
            const freq = 180 + Math.random() * 80; // 180-260Hz
            pluck(freq, 0.05, "triangle");
          },
          50 + i * 50,
        );
      }

      // 3단계: 마무리
      setTimeout(() => pluck(200, 0.1, "sine"), 350);
    };

    cardShuffle();
  };
  const errorFx = () => pluck(180, 0.18, "sawtooth");

  // 음원 파일 재생 함수
  const fanfare = () => {
    if (!enabled) return;

    if (celebrationAudioRef.current) {
      // 음원 파일이 있으면 파일 재생
      celebrationAudioRef.current.currentTime = 0;
      celebrationAudioRef.current.play().catch((err) => {
        console.warn("음원 재생 실패:", err);
        // 실패 시 폴백으로 기존 웹오디오 사운드 재생
        playWebAudioFanfare();
      });
    } else {
      // 음원 파일이 없으면 웹오디오 사운드 재생
      playWebAudioFanfare();
    }
  };

  // 기존 웹오디오 팬파레 (폴백용)
  const playWebAudioFanfare = () => {
    const grandStart = [131, 165, 196, 262, 330, 392, 523, 659, 784, 1047];
    grandStart.forEach((freq, i) => {
      setTimeout(() => {
        pluck(freq, 0.4, "sawtooth", 0);
        pluck(freq * 1.5, 0.35, "triangle", -5);
        pluck(freq / 2, 0.45, "sine", 8);
      }, i * 20);
    });

    setTimeout(() => {
      const chord1 = [262, 330, 392, 523, 659, 784, 1047, 1319];
      chord1.forEach((freq, i) => {
        setTimeout(() => {
          pluck(freq, 0.5, "sawtooth", 0);
          pluck(freq * 1.01, 0.45, "triangle", -8);
          pluck(freq * 2, 0.2, "sine", -15);
        }, i * 15);
      });

      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          pluck(2000 + Math.random() * 3000, 0.12, "sawtooth");
        }, Math.random() * 150);
      }
    }, 200);

    setTimeout(() => {
      const chord2 = [196, 247, 294, 392, 494, 587, 784, 988, 1175];
      chord2.forEach((freq, i) => {
        setTimeout(() => {
          pluck(freq, 0.55, "sawtooth", 0);
          pluck(freq * 1.005, 0.5, "triangle", -3);
          pluck(freq / 2, 0.6, "sine", 10);
          pluck(freq * 3, 0.15, "sine", -20);
        }, i * 18);
      });

      for (let i = 0; i < 35; i++) {
        setTimeout(() => {
          pluck(1500 + Math.random() * 4000, 0.1, "sine");
        }, Math.random() * 200);
      }
    }, 500);

    setTimeout(() => {
      const massiveChord = [
        65, 82, 98, 131, 165, 196, 220, 247, 262, 294, 330, 370, 392, 440, 494,
        523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1480, 1568,
      ];

      massiveChord.forEach((freq, i) => {
        setTimeout(() => {
          pluck(freq, 0.6, "sawtooth", 0);
          pluck(freq * 1.01, 0.55, "triangle", -5);
          if (i % 3 === 0) pluck(freq * 2, 0.3, "sine", -12);
          if (i % 5 === 0) pluck(freq / 2, 0.65, "sine", 15);
        }, i * 12);
      });

      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          pluck(
            1000 + Math.random() * 5000,
            0.08 + Math.random() * 0.05,
            "sine",
          );
        }, Math.random() * 300);
      }
    }, 900);

    setTimeout(() => {
      const ultimateChord = [
        44, 55, 66, 88, 110, 131, 147, 165, 196, 220, 247, 262, 294, 330, 370,
        392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319,
        1480, 1568, 1760, 1976, 2093, 2349, 2637,
      ];

      ultimateChord.forEach((freq, i) => {
        setTimeout(() => {
          pluck(freq, 0.8, "sawtooth", 0);
          pluck(freq * 1.008, 0.75, "triangle", -3);
          pluck(freq * 1.012, 0.7, "sine", -6);
          if (i % 2 === 0) pluck(freq * 2, 0.4, "sine", -10);
          if (i % 4 === 0) pluck(freq / 2, 0.85, "sine", 12);
        }, i * 8);
      });

      for (let i = 0; i < 80; i++) {
        setTimeout(() => {
          const sparkle = 800 + Math.random() * 6000;
          pluck(sparkle, 0.06 + Math.random() * 0.08, "sine");
        }, Math.random() * 500);
      }

      setTimeout(() => {
        [2093, 2349, 2637, 3136, 3520].forEach((freq, i) => {
          setTimeout(() => {
            pluck(freq, 1.0, "sine", 0);
            pluck(freq * 1.01, 0.9, "triangle", -8);
          }, i * 100);
        });
      }, 200);
    }, 1400);
  };

  const prime = async () => {
    const ctx = await ensureCtx();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (error) {
        console.warn("Failed to resume AudioContext:", error);
      }
    }
  };

  return {
    enabled,
    volume,
    setEnabled,
    setVolume,
    prime,
    click: woodTick,
    snap: softBell,
    merge: woodMerge,
    rotate: rotateFx,
    shuffle: shuffleFx,
    complete: fanfare,
    error: errorFx,
  };
}

// ---------------- Main Component ----------------
function PuzzleGameContent() {
  const searchParams = useSearchParams();
  const sfx = useSfx();

  useEffect(() => {
    const handler = () => sfx.prime();

    // 여러 이벤트에 대해 지속적으로 활성화
    const events = [
      "pointerdown",
      "click",
      "keydown",
      "touchstart",
      "mousemove",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handler, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handler, true);
      });
    };
  }, []);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [puzzleId, setPuzzleId] = useState<string>("");
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(4);

  const [bgOpacity, setBgOpacity] = useState(0.35);
  const [bgBlur, setBgBlur] = useState(true);
  const [showPieceShapes, setShowPieceShapes] = useState(true);

  const [snapTolerance, setSnapTolerance] = useState(40);
  const [boardScale, setBoardScale] = useState(1);
  const [showGuides, setShowGuides] = useState(true);

  const [edgesOnly, setEdgesOnly] = useState(false);
  const [rotationMode, setRotationMode] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);

  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [moves, setMoves] = useState(0); // 이동 횟수
  const [recordSaved, setRecordSaved] = useState(false); // 기록 저장 여부
  const [currentScore, setCurrentScore] = useState<number | null>(null); // 현재 점수
  const [currentRank, setCurrentRank] = useState<number | null>(null); // 현재 랭킹

  const { user } = useUser();

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [outerRect, setOuterRect] = useState({ w: 1100, h: 800 });

  const playSize = Math.min(
    720,
    Math.max(400, Math.floor(Math.min(outerRect.w, outerRect.h) * 0.75)),
  );
  const playW = playSize;
  const playH = playSize;
  const playX = Math.floor((outerRect.w - playW) / 2);
  const playY = Math.floor((outerRect.h - playH) / 2);
  const playRect: Rect = { x: playX, y: playY, w: playW, h: playH };

  // --------- 이미지 트랜스폼 (배경/조각 동일) ---------
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const imageTransform = useMemo(() => {
    if (!imageNaturalSize.width || !imageNaturalSize.height) {
      return {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        renderWidth: playW,
        renderHeight: playH,
      };
    }
    const containerAspect = playW / playH;
    const imageAspectRatio = imageNaturalSize.width / imageNaturalSize.height;
    let renderWidth: number,
      renderHeight: number,
      offsetX: number,
      offsetY: number;
    if (imageAspectRatio > containerAspect) {
      renderHeight = playH;
      renderWidth = playH * imageAspectRatio;
      offsetX = (playW - renderWidth) / 2;
      offsetY = 0;
    } else {
      renderWidth = playW;
      renderHeight = playW / imageAspectRatio;
      offsetX = 0;
      offsetY = (playH - renderHeight) / 2;
    }
    return {
      scale: renderWidth / imageNaturalSize.width,
      offsetX,
      offsetY,
      renderWidth,
      renderHeight,
    };
  }, [imageNaturalSize, playW, playH]);
  const { renderWidth, renderHeight, offsetX, offsetY } = imageTransform;

  const tileW = Math.floor(playW / cols);
  const tileH = Math.floor(playH / rows);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [dragging, setDragging] = useState<{
    ids: number[];
    anchor: { dx: number; dy: number }[];
  } | null>(null);

  const edgesGrid = useMemo(() => {
    const seed = hashString(`${imageUrl}|${rows}x${cols}`);
    const rng = mulberry32(seed);
    return buildEdges(rows, cols, rng);
  }, [imageUrl, rows, cols]);

  // 🔥 URL 파라미터에서 퍼즐 설정 로드
  useEffect(() => {
    const imageParam = searchParams.get("image");
    const idParam = searchParams.get("id");
    const difficultyParam = searchParams.get("difficulty");

    if (imageParam) {
      try {
        const decodedUrl = decodeURIComponent(imageParam);
        setImageUrl(decodedUrl);
        setImageLoaded(false);
      } catch {
        setImageUrl(imageParam);
      }
    }
    if (idParam) setPuzzleId(idParam);

    if (difficultyParam) {
      const pieces = parseInt(difficultyParam);
      if (!isNaN(pieces)) {
        switch (pieces) {
          case 4:
            setCols(2);
            setRows(2);
            break;
          case 9:
            setCols(3);
            setRows(3);
            break;
          case 16:
            setCols(4);
            setRows(4);
            break;
          case 36:
            setCols(6);
            setRows(6);
            break;
          case 49:
            setCols(7);
            setRows(7);
            break;
          default:
            break;
        }
      }
    }
  }, [searchParams]);

  // 파일 업로드 시 URL 파라미터 정보 초기화
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setPuzzleId("");
      setImageLoaded(false);

      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("image");
        newUrl.searchParams.delete("id");
        newUrl.searchParams.delete("difficulty");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  };

  // objectURL 정리
  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const clampIntoBoard = (x: number, y: number) => ({
    x: clamp(x, 0, outerRect.w - tileW),
    y: clamp(y, 0, outerRect.h - tileH),
  });

  const shuffle = () => {
    if (!imageUrl) return;
    const total = rows * cols;
    const seed = hashString(
      `spawn|${outerRect.w}x${outerRect.h}|${playX},${playY},${playW}x${playH}|${rows}x${cols}`,
    );
    const rng = mulberry32(seed);
    const spawns = generateNonOverlappingSpawnPositions(
      outerRect.w,
      outerRect.h,
      playRect,
      tileW,
      tileH,
      total,
      rng,
    );
    const init = range(rows).flatMap((r) =>
      range(cols).map((c) => {
        const id = r * cols + c;
        const pos = spawns[id] || {
          x: Math.random() * (outerRect.w - tileW),
          y: Math.random() * (outerRect.h - tileH),
        };
        const clamped = clampIntoBoard(pos.x, pos.y);
        const tile: Tile = {
          id,
          row: r,
          col: c,
          x: clamped.x,
          y: clamped.y,
          angle: 0,
          locked: false,
          groupId: id,
        };
        return tile;
      }),
    );
    setTiles(init);
    setElapsed(0);
    setMoves(0); // 이동 횟수 초기화
    setPaused(false);
    setRecordSaved(false); // 기록 저장 상태 초기화
    setCurrentScore(null); // 점수 초기화
    setCurrentRank(null); // 랭킹 초기화
    setDragging(null); // 드래그 상태 초기화
    setEdgesOnly(false); // 가장자리만 보기 해제
    sfx.shuffle();
  };

  // 보드 크기 트래킹
  useEffect(() => {
    const update = () => {
      if (!boardRef.current) return;
      const r = boardRef.current.getBoundingClientRect();
      // Scale을 고려하여 실제 사용 가능한 크기 계산
      const actualW = Math.round(r.width / boardScale);
      const actualH = Math.round(r.height / boardScale);
      setOuterRect({ w: actualW, h: actualH });
    };
    update();
    const ro = new ResizeObserver(update);
    if (boardRef.current) ro.observe(boardRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [boardScale]);

  // 이미지가 로드되면 자동으로 섞기
  useEffect(() => {
    if (imageUrl && imageLoaded) {
      shuffle();
    }
  }, [rows, cols, imageUrl, imageLoaded]);

  // 프리셋 이미지 목록
  const presets = [
    {
      label: "Vibrant Vibes",
      url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    },
    {
      label: "Mountains",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
    },
    {
      label: "City Night",
      url: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1600&auto=format&fit=crop",
    },
  ];

  // 랜덤 퍼즐 로드 함수
  const loadRandomPuzzle = () => {
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    setImageUrl(randomPreset.url);
    setPuzzleId("");
    setImageLoaded(false);
    setElapsed(0);
    setMoves(0); // 이동 횟수 초기화
    setRecordSaved(false); // 기록 저장 상태 초기화
    setCurrentScore(null); // 점수 초기화
    setCurrentRank(null); // 랭킹 초기화

    // 랜덤 난이도 선택 (2x2, 3x3, 4x4, 6x6 중 하나)
    const difficulties = [
      { cols: 2, rows: 2 },
      { cols: 3, rows: 3 },
      { cols: 4, rows: 4 },
      { cols: 6, rows: 6 },
    ];
    const randomDifficulty =
      difficulties[Math.floor(Math.random() * difficulties.length)];
    setCols(randomDifficulty.cols);
    setRows(randomDifficulty.rows);
  };

  // 기본 이미지 (쿼리에서 안 온 경우에만)
  useEffect(() => {
    if (!imageUrl && !searchParams.get("image")) {
      const fallback =
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop";
      setImageUrl(fallback);
    }
  }, [imageUrl, searchParams]);

  const solved = useMemo(
    () =>
      tiles.length > 0 &&
      tiles.length === rows * cols &&
      tiles.every((t) => t.locked),
    [tiles, rows, cols],
  );

  // 완료 사운드 1회 재생 및 기록 저장
  const prevSolvedRef = useRef(false);
  useEffect(() => {
    if (solved && !prevSolvedRef.current) {
      sfx.complete();

      // 기록 저장 (로그인한 사용자만)
      if (user && !recordSaved && puzzleId) {
        const difficulty = rows * cols;
        const completionTime = Math.floor(elapsed);
        const score = calculatePuzzleScore({
          difficulty,
          completionTime,
          moves,
        });

        setCurrentScore(score);

        // 기록 저장
        fetch("/api/puzzles/records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            puzzleId,
            difficulty,
            completionTime,
            moves,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setRecordSaved(true);
              // 랭킹 조회
              fetch(
                `/api/puzzles/rankings?puzzleId=${puzzleId}&difficulty=${difficulty}&limit=100`,
                {
                  credentials: "include",
                },
              )
                .then((res) => res.json())
                .then((rankData) => {
                  if (rankData.success) {
                    const myRank = rankData.rankings.findIndex(
                      (r: PuzzleRanking) =>
                        r.userId === user.userId && r.score === score,
                    );
                    if (myRank !== -1) {
                      setCurrentRank(myRank + 1);
                    }
                  }
                })
                .catch((err) => console.error("Failed to fetch ranking:", err));
            }
          })
          .catch((err) => {
            console.error("Failed to save record:", err);
          });
      }
    }
    prevSolvedRef.current = solved;
  }, [solved, user, recordSaved, puzzleId, rows, cols, elapsed, moves]);

  // 타이머
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      if (!paused && !solved) setElapsed((e) => e + (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, solved]);

  // 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "c") setCaptureMode((v) => !v);
      if (e.key === "p") setPaused((v) => !v);
      if (e.key === "r") shuffle();
      if (e.key === "g") setShowGuides((v) => !v);
      if (e.key === "s") setShowPieceShapes((v) => !v);
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && rotationMode) {
        e.preventDefault();
        rotateSelected(e.key === "ArrowRight" ? 90 : -90);
        sfx.rotate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotationMode]);

  // 선택/회전
  function toggleSelect(id: number) {
    setTiles((prev) => {
      const me = prev.find((t) => t.id === id);
      if (!me) return prev;
      const gid = me.groupId;
      const willSelect = !me.selected;
      return prev.map((t) =>
        t.groupId === gid ? { ...t, selected: willSelect } : t,
      );
    });
  }
  function rotateSelected(delta: number) {
    setTiles((prev) =>
      prev.map((t) =>
        t.selected && !t.locked
          ? { ...t, angle: (t.angle + delta + 360) % 360 }
          : t,
      ),
    );
  }

  // 전체 조립 체크
  function finalizeIfAssembled(next: Tile[]) {
    const total = rows * cols;
    const groups = new Map<number, Tile[]>();
    for (const t of next) {
      const arr = groups.get(t.groupId);
      if (arr) arr.push(t);
      else groups.set(t.groupId, [t]);
    }
    const tol = Math.max(25, Math.min(tileW, tileH) * 0.35);

    for (const group of Array.from(groups.values())) {
      if (group.length !== total) continue;
      const a0 = norm(group[0].angle);
      if (!group.every((t) => norm(t.angle) === a0)) continue;
      if (a0 !== 0) continue;

      const baseX = group[0].x - group[0].col * tileW;
      const baseY = group[0].y - group[0].row * tileH;
      const fitsGrid = group.every(
        (t) =>
          Math.abs(t.x - (baseX + t.col * tileW)) <= tol &&
          Math.abs(t.y - (baseY + t.row * tileH)) <= tol,
      );
      if (!fitsGrid) continue;

      const dx = playX - baseX;
      const dy = playY - baseY;
      const ids = new Set(group.map((t) => t.id));
      next = next.map((t) =>
        ids.has(t.id)
          ? {
              ...t,
              x: Math.round(t.x + dx),
              y: Math.round(t.y + dy),
              angle: 0,
              locked: true,
              selected: false,
            }
          : t,
      );
      break;
    }
    next = next.map((t) => {
      const c = clampIntoBoard(t.x, t.y);
      return { ...t, x: c.x, y: c.y };
    });
    return next;
  }

  // 포인터 핸들링
  const knob = Math.min(tileW, tileH) * 0.22;
  const pad = Math.round(knob + 6);

  const onPointerDown = (e: React.PointerEvent, id: number) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setTiles((prev) => {
      let next = prev;
      const t = next.find((x) => x.id === id);
      if (!t || t.locked) return next;

      if (captureMode)
        next = next.map((x) =>
          x.id === id ? { ...x, selected: !x.selected } : x,
        );
      else {
        const me = next.find((x) => x.id === id)!;
        const gid = me.groupId;
        next = next.map((x) => ({ ...x, selected: x.groupId === gid }));
      }

      const group = next.filter((x) => x.selected && !x.locked);
      const anchors = group.map((g) => ({
        dx: px - (g.x - pad),
        dy: py - (g.y - pad),
      }));
      setDragging({ ids: group.map((g) => g.id), anchor: anchors });

      const el = e.target;
      if (isPointerCaptureTarget(el)) el.setPointerCapture(e.pointerId);

      sfx.click();
      return next;
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setTiles((prev) => {
      const idSet = new Set(dragging.ids);
      return prev.map((t) => {
        if (!idSet.has(t.id) || t.locked) return t;
        const idx = dragging.ids.indexOf(t.id);
        const a = dragging.anchor[idx];

        const newLeft = clamp(px - a.dx, -pad, outerRect.w - (tileW + pad));
        const newTop = clamp(py - a.dy, -pad, outerRect.h - (tileH + pad));

        const baseX = clamp(newLeft + pad, 0, Math.max(0, outerRect.w - tileW));
        const baseY = clamp(newTop + pad, 0, Math.max(0, outerRect.h - tileH));

        const angleOk = t.angle % 360 === 0;
        const slotX = playX + t.col * tileW;
        const slotY = playY + t.row * tileH;
        const dx = Math.abs(baseX - slotX);
        const dy = Math.abs(baseY - slotY);
        const magnetRange = snapTolerance * 1.5;
        const within = angleOk && dx <= magnetRange && dy <= magnetRange;
        const strength = within
          ? Math.max(0, (magnetRange - Math.max(dx, dy)) / magnetRange)
          : 0;

        const pulledX = clamp(
          baseX + (slotX - baseX) * strength * 0.3,
          0,
          Math.max(0, outerRect.w - tileW),
        );
        const pulledY = clamp(
          baseY + (slotY - baseY) * strength * 0.3,
          0,
          Math.max(0, outerRect.h - tileH),
        );

        return { ...t, x: pulledX, y: pulledY };
      });
    });
  };

  const onPointerUp = () => {
    if (!dragging) return;
    const ids = dragging.ids;
    setDragging(null);

    setTiles((prev) => {
      let next = prev;
      let snappedAny = false;
      let mergedAny = false;

      // 1) 슬롯 스냅
      next = next.map((t) => {
        if (!ids.includes(t.id) || t.locked) return t;
        const slotX = playX + t.col * tileW;
        const slotY = playY + t.row * tileH;
        const dx = Math.abs(t.x - slotX);
        const dy = Math.abs(t.y - slotY);
        const angleOk = t.angle % 360 === 0;
        const shouldSnap =
          dx <= snapTolerance && dy <= snapTolerance && angleOk;
        if (!shouldSnap) return t;
        const cl = clampIntoBoard(slotX, slotY);
        snappedAny = true;
        return {
          ...t,
          x: cl.x,
          y: cl.y,
          angle: 0,
          locked: true,
          selected: false,
        };
      });

      // 2) 그룹 병합
      const idSet = new Set(ids);
      const getByRC = (r: number, c: number) =>
        next.find((tt) => tt.row === r && tt.col === c);
      const tryMergePair = (a: Tile, b: Tile, dir: "R" | "L" | "T" | "B") => {
        if (a.locked || b.locked) return false;
        if (a.angle % 360 !== b.angle % 360) return false;
        const eA = edgesGrid[a.row][a.col],
          eB = edgesGrid[b.row][b.col];
        const ok =
          (dir === "R" && eA.right === 1 && eB.left === -1) ||
          (dir === "L" && eA.left === -1 && eB.right === 1) ||
          (dir === "T" && eA.top === -1 && eB.bottom === 1) ||
          (dir === "B" && eA.bottom === 1 && eB.top === -1);
        if (!ok) return false;
        const expect =
          dir === "R"
            ? { dx: tileW, dy: 0 }
            : dir === "L"
              ? { dx: -tileW, dy: 0 }
              : dir === "T"
                ? { dx: 0, dy: -tileH }
                : { dx: 0, dy: tileH };
        const ddx = Math.abs(b.x - a.x - expect.dx);
        const ddy = Math.abs(b.y - a.y - expect.dy);
        const tol = Math.max(30, Math.min(tileW, tileH) * 0.35);
        if (ddx > tol || ddy > tol) return false;

        const from = b.groupId,
          to = a.groupId;
        const offsetX2 = a.x + expect.dx - b.x;
        const offsetY2 = a.y + expect.dy - b.y;
        next = next.map((t) =>
          t.groupId === from
            ? {
                ...t,
                groupId: to,
                x: t.x + offsetX2,
                y: t.y + offsetY2,
                angle: a.angle,
              }
            : t,
        );
        next = next.map((t) =>
          t.groupId === to ? { ...t, ...clampIntoBoard(t.x, t.y) } : t,
        );
        mergedAny = true;
        return true;
      };

      let merged = true;
      while (merged) {
        merged = false;
        for (const a of next) {
          if (!idSet.has(a.id)) continue;
          const rightN = getByRC(a.row, a.col + 1);
          const leftN = getByRC(a.row, a.col - 1);
          const topN = getByRC(a.row - 1, a.col);
          const bottomN = getByRC(a.row + 1, a.col);
          if (rightN && a.groupId !== rightN.groupId)
            merged = tryMergePair(a, rightN, "R") || merged;
          if (leftN && a.groupId !== leftN.groupId)
            merged = tryMergePair(a, leftN, "L") || merged;
          if (topN && a.groupId !== topN.groupId)
            merged = tryMergePair(a, topN, "T") || merged;
          if (bottomN && a.groupId !== bottomN.groupId)
            merged = tryMergePair(a, bottomN, "B") || merged;
        }
        const gids = new Set(
          next.filter((t) => idSet.has(t.id)).map((t) => t.groupId),
        );
        const expanded = next
          .filter((t) => gids.has(t.groupId))
          .map((t) => t.id);
        for (const i of expanded) idSet.add(i);
      }

      if (snappedAny) sfx.snap();
      else if (mergedAny) sfx.merge();

      // 타일이 실제로 이동했는지 확인 (위치가 변경되었는지)
      const moved = ids.some((id) => {
        const prevTile = prev.find((t) => t.id === id);
        const nextTile = next.find((t) => t.id === id);
        if (!prevTile || !nextTile || prevTile.locked) return false;
        const movedX = Math.abs(prevTile.x - nextTile.x) > 5; // 5px 이상 이동
        const movedY = Math.abs(prevTile.y - nextTile.y) > 5;
        return movedX || movedY;
      });

      // 이동 횟수 증가
      if (moved) {
        setMoves((prev) => prev + 1);
      }

      // 3) 전체 조립 확인
      next = finalizeIfAssembled(next);
      return next.sort((a, b) => Number(a.locked) - Number(b.locked));
    });
  };

  const onWheel = (e: React.WheelEvent, id: number) => {
    if (!rotationMode) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 90 : -90;
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id || (t.selected && !t.locked)
          ? { ...t, angle: (t.angle + delta + 360) % 360 }
          : t,
      ),
    );
    sfx.rotate();
  };
  const onTileClick = (id: number) => {
    if (rotationMode) {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === id || (t.selected && !t.locked)
            ? { ...t, angle: (t.angle + 90) % 360 }
            : t,
        ),
      );
      sfx.rotate();
    }
  };

  const piecePaths = useMemo(
    () =>
      range(rows).flatMap((r) =>
        range(cols).map((c) =>
          buildPiecePath(tileW, tileH, edgesGrid[r][c], knob),
        ),
      ),
    [rows, cols, tileW, tileH, edgesGrid, knob],
  );

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      {/* 4. Global Header & Contained Layout */}
      <div className="flex-1 flex flex-col w-full max-w-[1280px] mx-auto p-4 lg:p-8">
        {/* Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-4 border-teal-500/30">
            AI 기억퍼즐
          </h1>

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">퍼즐 #COLOR-16</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-pink-50 px-4 py-2 rounded-full border border-pink-100">
              <Info className="w-4 h-4 text-pink-500" />
              <span>
                홈페이지에서 선택한 이미지로 퍼즐을 즐기세요! 자석 효과로 조각이
                올바른 위치에 자동으로 끌려갑니다.
              </span>
            </div>
          </div>
        </div>

        {/* Game Container (Card) */}
        <main className="flex-1 flex flex-col lg:flex-row relative shadow-2xl rounded-[30px] overflow-hidden min-h-[700px]">
          {/* Background Static Image */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: "url('/img/puzzle_bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />
          {/* Background Blur Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backdropFilter: "blur(30px)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          {/* Left: Puzzle Play Area */}
          <div
            className={`flex-1 relative overflow-hidden flex items-center justify-center min-h-[600px] p-4 lg:p-10 z-10 transition-[padding] duration-300 ease-in-out ${
              !isSidebarOpen ? "lg:pr-[360px]" : ""
            }`}
          >
            {/* Background blurred ambiance */}

            {/* Actual Board */}
            <div
              className={styles.puzzleBoard}
              ref={boardRef}
              style={
                {
                  // Use playSize/scale to control size, but let flex container handle max bounds
                  width: "100%",
                  height: "100%",
                  // Ensure board doesn't overflow its container visually
                  maxWidth: "1200px",
                  maxHeight: "800px",
                  transform: `scale(${boardScale})`,
                  transformOrigin: "center center",
                  "--bg-opacity": bgOpacity,
                  "--bg-filter": bgBlur
                    ? "blur(2px) brightness(0.9) saturate(0.95)"
                    : "none",
                } as React.CSSProperties
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Play area background */}
              {imageUrl && (
                <div
                  className={styles.playArea}
                  style={{
                    left: playX,
                    top: playY,
                    width: playW,
                    height: playH,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="puzzle background"
                    style={{
                      position: "absolute",
                      left: offsetX,
                      top: offsetY,
                      width: renderWidth,
                      height: renderHeight,
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setImageNaturalSize({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                      setImageLoaded(true);
                      // Start timer if not already running effectively?
                      // Usually shuffle resets timer.
                    }}
                    onError={() => {
                      setImageLoaded(false);
                      sfx.error();
                    }}
                  />
                </div>
              )}

              {/* Puzzle Shape Guides */}
              {imageUrl && showPieceShapes && (
                <div
                  className={styles.shapeGuides}
                  style={{
                    left: playX,
                    top: playY,
                    width: playW,
                    height: playH,
                  }}
                >
                  <svg
                    width={playW}
                    height={playH}
                    viewBox={`0 0 ${playW} ${playH}`}
                    className="absolute inset-0"
                  >
                    {range(rows).flatMap((r) =>
                      range(cols).map((c) => {
                        const id = r * cols + c;
                        const tile = tiles.find((t) => t.id === id);
                        if (tile && tile.locked) return null;
                        const pathD = buildPiecePath(
                          tileW,
                          tileH,
                          edgesGrid[r][c],
                          knob,
                        );
                        const slotX = c * tileW;
                        const slotY = r * tileH;
                        const magnetRange = snapTolerance * 1.5;
                        const showMagnetZone =
                          tile &&
                          !tile.locked &&
                          tile.angle % 360 === 0 &&
                          Math.abs(tile.x - (playX + slotX)) <= magnetRange &&
                          Math.abs(tile.y - (playY + slotY)) <= magnetRange;
                        return (
                          <g key={`shape-guide-${id}`}>
                            {showMagnetZone && (
                              <rect
                                x={slotX - magnetRange / 4}
                                y={slotY - magnetRange / 4}
                                width={tileW + magnetRange / 2}
                                height={tileH + magnetRange / 2}
                                className={styles.magnetZone}
                              />
                            )}
                            <path
                              d={pathD}
                              transform={`translate(${slotX}, ${slotY})`}
                              className={`${styles.guidePath} ${
                                showMagnetZone ? styles.active : styles.inactive
                              }`}
                            />
                          </g>
                        );
                      }),
                    )}
                  </svg>
                </div>
              )}

              {/* Tiles */}
              {imageUrl &&
                imageLoaded &&
                tiles.map((t) => {
                  if (
                    edgesOnly &&
                    !isEdge(t.row, t.col, rows, cols) &&
                    !t.locked
                  )
                    return null;
                  const pathD = piecePaths[t.id];
                  const clipId = `clip-${rows}-${cols}-${t.id}`;

                  // 배경과 동일한 트랜스폼 적용
                  const imgX = offsetX - t.col * tileW;
                  const imgY = offsetY - t.row * tileH;

                  // Outline color
                  const stroke = t.locked
                    ? "rgba(0,0,0,0.1)" // locked tiles blend in
                    : t.selected
                      ? "#fff" // selected gets white highlight
                      : "rgba(255,255,255,0.4)"; // default tile border

                  return (
                    <div
                      key={t.id}
                      role="button"
                      className={`${styles.puzzleTile} ${
                        t.locked ? styles.locked : ""
                      }`}
                      style={{
                        left: t.x - pad,
                        top: t.y - pad,
                        width: tileW + pad * 2,
                        height: tileH + pad * 2,
                        zIndex: t.selected ? 100 : t.locked ? 1 : 10,
                        transition: t.selected ? "none" : "transform 0.2s",
                      }}
                      onPointerDown={(e) => onPointerDown(e, t.id)}
                      onWheel={(e) => onWheel(e, t.id)}
                      onClick={() =>
                        captureMode ? toggleSelect(t.id) : onTileClick(t.id)
                      }
                    >
                      <svg
                        width={tileW + pad * 2}
                        height={tileH + pad * 2}
                        viewBox={`${-pad} ${-pad} ${tileW + pad * 2} ${
                          tileH + pad * 2
                        }`}
                        style={{
                          pointerEvents: "none",
                          transform: `rotate(${t.angle}deg)`,
                          transformOrigin: "center",
                          filter: t.selected
                            ? "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
                            : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                        }}
                      >
                        <defs>
                          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                            <path d={pathD} />
                          </clipPath>
                        </defs>
                        <g clipPath={`url(#${clipId})`}>
                          <image
                            href={imageUrl}
                            x={imgX}
                            y={imgY}
                            width={renderWidth}
                            height={renderHeight}
                            preserveAspectRatio="none"
                          />
                        </g>
                        <path
                          d={pathD}
                          fill="none"
                          stroke={stroke}
                          strokeWidth={t.selected ? 2 : 1}
                        />
                      </svg>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right: Control Panel Sidebar */}
          <div
            className={`hidden lg:flex flex-col gap-5 relative z-20 transition-all duration-300 ease-in-out ${
              isSidebarOpen ? "w-[320px]" : "w-0"
            }`}
          >
            <div
              className="w-[320px] text-white p-6 flex flex-col gap-5 rounded-tl-[40px] rounded-bl-[40px] shadow-none transition-transform duration-300"
              style={{
                backgroundImage: "url('/img/puzzl_side.png')",
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                filter: "drop-shadow(-5px 0 15px rgba(0,0,0,0.15))",
                height: "100%",
              }}
            >
              {/* Collapse Handle (Visual Tab) */}
              <div
                className="absolute -left-[15px] top-[60px] w-[60px] h-[60px] flex items-center justify-center z-50 cursor-pointer hover:brightness-110 hover:scale-105 transition-all"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <div
                  className={`w-[58px] h-[58px] rounded-full flex items-center justify-center transform transition-transform duration-500 ${
                    isSidebarOpen ? "rotate-0" : "rotate-180"
                  }`}
                  style={{
                    backgroundImage: "url('/img/puzzl_button.png')",
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <ChevronsRight
                    className={`w-8 h-8 text-white ${isSidebarOpen ? "" : "rotate-180"}`}
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div className="w-full flex justify-center mt-6">
                <div className="relative w-[130px] aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-black/20 group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Target"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-white/50 text-xs">
                      No Image
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <div className="font-bold text-lg drop-shadow-sm tracking-tight text-white">
                  퍼즐 #{puzzleId || "COLOR-16"}
                </div>
              </div>

              {/* Difficulty Dropdown */}
              <div className="relative w-full px-2">
                <select
                  title="난이도 선택"
                  aria-label="난이도 선택"
                  value={`${cols}x${rows}`}
                  onChange={(e) => {
                    const [c, r] = e.target.value.split("x").map(Number);
                    setCols(c);
                    setRows(r);
                  }}
                  className="w-full appearance-none bg-white text-[#1a9388] font-extrabold text-lg py-3 px-4 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer text-center tracking-wider"
                >
                  <option value="2x2">2 X 2</option>
                  <option value="3x3">3 X 3</option>
                  <option value="4x4">4 X 4</option>
                  <option value="6x6">6 X 6</option>
                  <option value="9x9">9 X 9</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a9388]">
                  <ChevronLeft className="w-5 h-5 -rotate-90" />
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mt-2 justify-items-center">
                {/* Shuffle */}
                <button
                  onClick={shuffle}
                  className="flex flex-col items-center gap-2 group w-full"
                >
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-white/20 flex items-center justify-center bg-teal-800/40 group-hover:bg-teal-700/50 group-active:scale-95 transition-all shadow-inner backdrop-blur-sm">
                    <Shuffle className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-sm font-bold text-white/90">
                    퍼즐 섞기
                  </span>
                </button>

                {/* Pause */}
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="flex flex-col items-center gap-2 group w-full"
                >
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-white/20 flex items-center justify-center bg-teal-800/40 group-hover:bg-teal-700/50 group-active:scale-95 transition-all shadow-inner backdrop-blur-sm">
                    {paused ? (
                      <Play className="w-8 h-8 text-white ml-1 drop-shadow-sm" />
                    ) : (
                      <Pause className="w-8 h-8 text-white drop-shadow-sm" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white/90">
                    {paused ? "재개" : "일시정지"}
                  </span>
                </button>

                {/* Upload */}
                <label className="flex flex-col items-center gap-2 group w-full cursor-pointer">
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-white/20 flex items-center justify-center bg-teal-800/40 group-hover:bg-teal-700/50 group-active:scale-95 transition-all shadow-inner backdrop-blur-sm">
                    <ImageIcon className="w-8 h-8 text-white drop-shadow-sm" />
                  </div>
                  <span className="text-sm font-bold text-white/90 break-words text-center leading-tight">
                    이미지
                    <br />
                    업로드
                  </span>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Sound */}
                <button
                  onClick={() => sfx.setEnabled(!sfx.enabled)}
                  className="flex flex-col items-center gap-2 group w-full"
                >
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-white/20 flex items-center justify-center bg-teal-800/40 group-hover:bg-teal-700/50 group-active:scale-95 transition-all shadow-inner backdrop-blur-sm">
                    {sfx.enabled ? (
                      <Volume2 className="w-8 h-8 text-white drop-shadow-sm" />
                    ) : (
                      <VolumeX className="w-8 h-8 text-white drop-shadow-sm" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-white/90">
                    소리 {sfx.enabled ? "켜기" : "끄기"}
                  </span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="mt-auto mb-2 flex flex-col gap-1 px-4">
                <div className="flex items-center justify-between gap-3">
                  <ZoomOut
                    className="w-7 h-7 text-white cursor-pointer hover:scale-110 transition-transform"
                    strokeWidth={2}
                    onClick={() => setBoardScale((s) => Math.max(0.5, s - 0.1))}
                  />
                  <div className="flex-1 h-3 bg-white/30 rounded-full relative overflow-visible">
                    <div
                      className="h-full bg-white rounded-full relative"
                      style={{
                        width: `${((boardScale - 0.5) / 1) * 100}%`,
                      }}
                    />
                    {/* Thumb specifically */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md pointer-events-none"
                      style={{
                        left: `calc(${((boardScale - 0.5) / 1) * 100}% - 10px)`,
                      }}
                    />
                    <input
                      title="줌 조절"
                      aria-label="줌 조절"
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.01"
                      value={boardScale}
                      onChange={(e) => setBoardScale(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  <ZoomIn
                    className="w-7 h-7 text-white cursor-pointer hover:scale-110 transition-transform"
                    strokeWidth={2}
                    onClick={() => setBoardScale((s) => Math.min(1.5, s + 0.1))}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white font-medium px-1 mt-1">
                  <span>화면 작게</span>
                  <span>화면 크게</span>
                </div>
              </div>

              {/* Timer */}
              <div className="mt-auto pt-6 pb-4 text-center">
                <div className="text-5xl font-black text-white tracking-wider drop-shadow-lg font-[system-ui]">
                  {formatTime(elapsed || 30)}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Footer Button (Back) */}
      <div className="bg-white py-8 border-t border-gray-100 flex justify-center">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-black text-white px-12 py-3.5 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg text-sm tracking-wide"
        >
          목록으로
        </button>
      </div>

      {/* Completion Modal */}
      {solved && (
        <div className={styles.completionOverlay}>
          <div className={styles.completionBackdrop} />
          <div
            className={styles.completionPopup}
            style={{
              width: renderWidth,
              height: renderHeight,
              maxWidth: "none",
            }}
          >
            {/* Background Image Layer */}
            <div
              className={styles.completionBgImage}
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            {/* Gradient Overlay Layer */}
            <div className={styles.completionBgOverlay} />

            {/* Content Layer */}
            <div className={styles.completionContent}>
              <div className={styles.completionTitle}>퍼즐 완성</div>
              <div className={styles.completionSubtitle}>축하합니다!</div>

              <div className={styles.completionTime}>
                <span className={styles.completionTimeLabel}>
                  플레이 시간 :{" "}
                </span>
                <span className={styles.completionTimeValue}>
                  {formatTime(elapsed)}
                </span>
              </div>

              {/* Reset/Back Buttons */}
              <div className={styles.completionButtons}>
                <button
                  onClick={() => {
                    shuffle();
                  }}
                  className={`${styles.completionButton} ${styles.completionButtonPrimary}`}
                >
                  다시하기
                  <div className={styles.arrowIcon}>
                    <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </button>
                <button
                  onClick={() => (window.location.href = "/puzzle-home")}
                  className={`${styles.completionButton} ${styles.completionButtonSecondary}`}
                >
                  다른퍼즐
                  <div className={styles.arrowIcon}>
                    <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Component ----------------
export default function PuzzlePage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-gray-500">URL 파라미터 로딩 중…</div>
      }
    >
      <PuzzleGameContent />
    </Suspense>
  );
}
