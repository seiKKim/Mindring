"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  RotateCcw,
  Download,
  Palette,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Eraser,
  Printer,
  ArrowLeft,
  Check,
  Search,
  PaintBucket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 색상 팔레트 (시니어 친화적인 밝고 명확한 색상)
const COLOR_PALETTE = [
  { name: "빨강", color: "#FF6B6B", hex: "#FF6B6B" },
  { name: "주황", color: "#FFA500", hex: "#FFA500" },
  { name: "노랑", color: "#FFD93D", hex: "#FFD93D" },
  { name: "연두", color: "#95E1D3", hex: "#95E1D3" },
  { name: "초록", color: "#6BCB77", hex: "#6BCB77" },
  { name: "하늘", color: "#4ECDC4", hex: "#4ECDC4" },
  { name: "파랑", color: "#4D96FF", hex: "#4D96FF" },
  { name: "남색", color: "#5B7DB8", hex: "#5B7DB8" },
  { name: "보라", color: "#9B59B6", hex: "#9B59B6" },
  { name: "분홍", color: "#FF9FF3", hex: "#FF9FF3" },
  { name: "갈색", color: "#8B4513", hex: "#8B4513" },
  { name: "검정", color: "#2C3E50", hex: "#2C3E50" },
];

// 도안 타입 정의
interface ColoringTemplate {
  id: string;
  name: string;
  groupId?: string;
  groupName?: string;
  original: string;
  outline: string;
  palette?: Array<{ name: string; hex: string }>;
}

interface ColoringGroup {
  id: string;
  name: string;
  description?: string;
}

export default function ColoringPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ColoringTemplate | null>(null);
  const [currentPalette, setCurrentPalette] =
    useState<Array<{ name: string; hex: string }>>(COLOR_PALETTE);
  const [adminPalette, setAdminPalette] = useState<
    Array<{ name: string; hex: string }>
  >([]); // 관리자가 지정한 색상만 따로 저장
  const [selectedColor, setSelectedColor] = useState<string>(
    COLOR_PALETTE[0].hex
  );
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [groups, setGroups] = useState<ColoringGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [outlineImage, setOutlineImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fillMode, setFillMode] = useState(true); // true: 영역 채우기, false: 브러시 모드
  const [isEraserMode, setIsEraserMode] = useState(false); // 지우개 모드
  const [brushSize, setBrushSize] = useState(30); // 큰 브러시 크기 (시니어 친화적)
  const [outlineImageData, setOutlineImageData] = useState<ImageData | null>(
    null
  );
  const [history, setHistory] = useState<ImageData[]>([]); // Undo 히스토리
  const [historyIndex, setHistoryIndex] = useState(-1); // 현재 히스토리 인덱스
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null); // 마우스 위치 (브러시 프리뷰용)
  const [showReference, setShowReference] = useState(true); // 참고용 이미지 표시 여부

  // 도안 및 그룹 데이터 로드
  useEffect(() => {
    fetchTemplatesAndGroups();
  }, []);

  const fetchTemplatesAndGroups = async () => {
    try {
      setLoading(true);
      const [templatesRes, groupsRes] = await Promise.all([
        fetch("/api/coloring/templates"),
        fetch("/api/coloring/groups"),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Canvas 초기화 및 도안 로드
  useEffect(() => {
    if (outlineImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Canvas 크기를 이미지에 맞춤
        canvas.width = img.width;
        canvas.height = img.height;

        // 흰색 배경
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 도안 이미지 그리기 (윤곽선)
        ctx.drawImage(img, 0, 0);

        // 원본 윤곽선 이미지 데이터 저장 (브러시 모드에서 윤곽선 체크용)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setOutlineImageData(imageData);

        // 초기 상태를 히스토리에 저장
        const initialState = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        setHistory([initialState]);
        setHistoryIndex(0);

        outlineImageRef.current = img;
      };
      img.src = outlineImage;
    }
  }, [outlineImage]);

  // Flood Fill 알고리즘 (영역 채우기) - 테두리까지 깔끔하게 채우기
  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: string,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (!outlineImageData) return;

    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    const outlineData = outlineImageData.data;

    const startXInt = Math.floor(startX);
    const startYInt = Math.floor(startY);
    const startPos = (startYInt * canvasWidth + startXInt) * 4;

    // 시작 픽셀의 색상 (RGBA)
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // 채울 색상 (RGB)
    const fillR = parseInt(fillColor.substring(1, 3), 16);
    const fillG = parseInt(fillColor.substring(3, 5), 16);
    const fillB = parseInt(fillColor.substring(5, 7), 16);

    // 이미 같은 색이면 리턴
    if (startR === fillR && startG === fillG && startB === fillB) {
      return;
    }

    // 시작 위치가 윤곽선이면 리턴
    if (isOutlinePixel(outlineImageData, startXInt, startYInt, canvasWidth)) {
      return;
    }

    // 색상 비교 함수 - 경계선까지 완벽하게 채우기 (매우 적극적)
    const isFillableColor = (pos: number, x: number, y: number) => {
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      // 알파 값이 너무 낮으면 스킵
      if (a < 20) return false;

      // 이미 채워진 색이면 스킵
      if (r === fillR && g === fillG && b === fillB) return false;

      // 원본 윤곽선 이미지에서 해당 위치 확인
      const outlineIndex = pos;
      const outlineR = outlineData[outlineIndex];
      const outlineG = outlineData[outlineIndex + 1];
      const outlineB = outlineData[outlineIndex + 2];
      const outlineA = outlineData[outlineIndex + 3];

      // 원본 이미지에서 순수 검은색 윤곽선만 제외
      // 매우 엄격한 기준: RGB 모두 50 이하만 윤곽선으로 판단
      const isPureBlackOutline =
        outlineA > 20 && outlineR <= 50 && outlineG <= 50 && outlineB <= 50;
      if (isPureBlackOutline) {
        return false;
      }

      // 원본 이미지가 순수 검은색이 아니면 모두 채울 수 있음
      // (경계선 근처의 밝은 픽셀, 회색 픽셀 모두 포함)
      if (!isPureBlackOutline) {
        // 현재 픽셀이 너무 어두운 색(거의 검은색)이 아니면 채우기
        const isCurrentVeryDark = r <= 50 && g <= 50 && b <= 50;
        if (!isCurrentVeryDark) {
          return true;
        }
      }

      // 흰색 배경 또는 밝은 색상 영역인지 확인
      const diffR = Math.abs(r - startR);
      const diffG = Math.abs(g - startG);
      const diffB = Math.abs(b - startB);
      const totalDiff = diffR + diffG + diffB;

      // 흰색 배경의 경우 매우 넓은 범위 허용
      const isWhite = startR > 150 && startG > 150 && startB > 150;
      const threshold = isWhite ? 150 : 100; // 임계값 대폭 증가

      // 차이가 작으면 같은 색으로 간주
      if (totalDiff < threshold) {
        return true;
      }

      // 현재 픽셀이 밝은 색이면 무조건 채울 수 있음 (경계선 근처 처리)
      const isCurrentBright = r > 80 || g > 80 || b > 80;
      if (isCurrentBright && !isPureBlackOutline) {
        return true;
      }

      return false;
    };

    // 큐를 사용한 BFS 방식 flood fill
    const queue: Array<[number, number]> = [[startXInt, startYInt]];
    const visited = new Set<string>();

    const getPixelKey = (x: number, y: number) => `${x},${y}`;

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = getPixelKey(x, y);

      if (visited.has(key)) continue;
      if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

      const pos = (y * canvasWidth + x) * 4;

      // 채울 수 있는 색상인지 확인
      if (!isFillableColor(pos, x, y)) continue;

      visited.add(key);

      // 픽셀 색상 변경
      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = 255; // 알파는 불투명

      // 인접 픽셀 추가 (4방향)
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    // 변경된 이미지 데이터를 캔버스에 적용
    ctx.putImageData(imageData, 0, 0);
  };

  // Canvas 상태를 히스토리에 저장
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    // 히스토리 크기 제한 (최대 50개)
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setHistory(newHistory);
  };

  // Undo 기능
  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  // Redo 기능
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  // 색칠하기 함수 (영역 채우기)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 작업 전 상태 저장
    saveToHistory();

    // Flood Fill로 영역 채우기
    const fillColor = isEraserMode ? "#FFFFFF" : selectedColor;
    floodFill(ctx, x, y, fillColor, canvas.width, canvas.height);
  };

  // 픽셀이 윤곽선(검은색)인지 확인하는 함수 - 매우 엄격한 버전
  const isOutlinePixel = (
    imageData: ImageData,
    x: number,
    y: number,
    width: number
  ): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= imageData.height) return true;

    const index = (y * width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const a = imageData.data[index + 3];

    // 투명한 경우는 윤곽선으로 간주
    if (a < 30) return true;

    // 검은색(윤곽선) 판단: RGB 값이 모두 매우 낮은 경우
    // 순수 검은색만 윤곽선으로 판단 (RGB 모두 50 이하)
    // 이렇게 하면 안티앨리어싱된 회색 픽셀은 윤곽선이 아닌 것으로 처리
    const isPureBlack = r <= 50 && g <= 50 && b <= 50;

    return isPureBlack;
  };

  // 브러시 모드 색칠하기 함수 (윤곽선을 넘지 않도록)
  const handleBrushPaint = (
    e: React.MouseEvent<HTMLCanvasElement>,
    isFirstPaint: boolean = false
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !outlineImageData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 첫 번째 브러시 그리기일 때만 히스토리 저장
    if (isFirstPaint) {
      saveToHistory();
    }

    // 브러시 크기만큼의 원형 영역을 확인하며 색칠
    const radius = brushSize;
    const minX = Math.max(0, x - radius);
    const maxX = Math.min(canvas.width - 1, x + radius);
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(canvas.height - 1, y + radius);

    // 현재 canvas의 이미지 데이터 가져오기
    const currentImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const data = currentImageData.data;

    // 색칠할 색상 (RGB) - 지우개 모드면 흰색
    const fillColor = isEraserMode ? "#FFFFFF" : selectedColor;
    const fillR = parseInt(fillColor.substring(1, 3), 16);
    const fillG = parseInt(fillColor.substring(3, 5), 16);
    const fillB = parseInt(fillColor.substring(5, 7), 16);

    // 브러시 영역 내의 각 픽셀 확인
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = px - x;
        const dy = py - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 브러시 반경 내에 있고, 윤곽선이 아닌 경우에만 색칠
        if (distance <= radius) {
          // 원본 윤곽선 이미지에서 해당 픽셀이 윤곽선인지 확인
          if (!isOutlinePixel(outlineImageData, px, py, canvas.width)) {
            const index = (py * canvas.width + px) * 4;
            data[index] = fillR;
            data[index + 1] = fillG;
            data[index + 2] = fillB;
            data[index + 3] = 255; // 알파는 불투명
          }
        }
      }
    }

    // 변경된 이미지 데이터를 canvas에 적용
    ctx.putImageData(currentImageData, 0, 0);
  };

  // 드래그로 색칠하기
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (fillMode) {
      // 영역 채우기 모드: 클릭만
      handleCanvasClick(e);
    } else {
      // 브러시 모드: 드래그 가능
      setIsDrawing(true);
      handleBrushPaint(e, true); // 첫 번째 그리기
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (!isDrawing || fillMode) return;
    handleBrushPaint(e, false); // 연속 그리기
  };

  const handleCanvasMouseLeave = () => {
    setMousePosition(null);
    setIsDrawing(false);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // 터치 이벤트 지원 (모바일)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvasRef.current?.dispatchEvent(mouseEvent);
  };

  const handleCanvasTouchEnd = () => {
    setIsDrawing(false);
  };

  // 초기화
  const handleReset = () => {
    if (outlineImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || !outlineImageRef.current) return;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(outlineImageRef.current, 0, 0);

      // 초기 상태를 히스토리에 저장
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  };

  // 이미지 다운로드
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    try {
      // 고해상도로 다운로드
      const scale = 2; // 2배 해상도
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) return;

      // 고해상도로 그리기
      tempCtx.scale(scale, scale);
      tempCtx.drawImage(canvas, 0, 0);

      // PNG로 다운로드
      const link = document.createElement("a");
      link.download = `${selectedTemplate.name}-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      // 기본 다운로드로 폴백
      const link = document.createElement("a");
      link.download = `coloring-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    }
  };

  // 프린트 기능
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedTemplate) return;

    try {
      // Canvas를 이미지로 변환
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // 새 창 열기
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
        return;
      }

      // 프린트용 HTML 작성
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedTemplate.name} - 색칠 도안</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: auto;
                }
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: white;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              }
              @media screen {
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f5f5f5;
                }
                img {
                  max-width: 100%;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="${selectedTemplate.name} 색칠 도안" />
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print failed:", error);
      alert("프린트 중 오류가 발생했습니다.");
    }
  };

  // 도안 선택
  const handleSelectTemplate = (template: ColoringTemplate) => {
    setSelectedTemplate(template);
    setOutlineImage(template.outline);
    setOriginalImage(template.original);

    // 관리자가 지정한 색상이 있으면 저장 (중복 제거)
    const adminColors: Array<{ name: string; hex: string }> = [];

    if (template.palette && template.palette.length > 0) {
      template.palette.forEach((adminColor) => {
        // 기본 색상과 중복되지 않는 관리자 색상만 추가
        const isDuplicate = COLOR_PALETTE.some(
          (color) => color.hex.toUpperCase() === adminColor.hex.toUpperCase()
        );
        if (!isDuplicate) {
          adminColors.push(adminColor);
        }
      });
    }

    setAdminPalette(adminColors);

    // 기본 색상과 관리자 색상을 합쳐서 전체 팔레트 생성
    const mergedPalette = [...COLOR_PALETTE, ...adminColors];
    setCurrentPalette(mergedPalette);
    setSelectedColor(mergedPalette[0].hex);
  };

  // 그룹별 필터링된 도안 목록
  const filteredTemplates = templates.filter((template) => {
    if (selectedGroup === "all") return true;
    return template.groupId === selectedGroup;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-900">
      {/* Header Section - Workbook Style */}
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            마음색칠
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            색으로 마음을 표현하는 디지털 색칠 활동 프로그램입니다. <br />
            다양한 도안을 선택하여 나만의 색으로 채워보세요.
          </p>

          {!selectedTemplate && (
            <div className="flex justify-center">
              <Link
                href="/"
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Home className="h-4 w-4" />
                메인으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 도안 선택 화면 */}
        {!selectedTemplate && (
          <>
            {/* Category Filter - Workbook Style */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="font-bold text-lg">
                  {selectedGroup === "all"
                    ? "전체"
                    : groups.find((g) => g.id === selectedGroup)?.name ||
                      "선택됨"}
                </span>
                <div className="text-gray-400 bg-gray-100 rounded-full px-2 py-1">
                  <span className="text-xs">Selected</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedGroup("all")}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    selectedGroup === "all"
                      ? "border-black ring-1 ring-black bg-white"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      selectedGroup === "all" ? "text-black" : "text-gray-600"
                    }`}
                  >
                    전체보기
                  </span>
                  {selectedGroup === "all" ? (
                    <div className="bg-black rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <div className="bg-gray-200 rounded-full p-0.5 w-4 h-4" />
                  )}
                </button>
                {groups.map((group) => {
                  const isActive = selectedGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        isActive
                          ? "border-black ring-1 ring-black bg-white"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-black" : "text-gray-600"
                        }`}
                      >
                        {group.name}
                      </span>
                      {isActive ? (
                        <div className="bg-black rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <div className="bg-gray-200 rounded-full p-0.5 w-4 h-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Header - Workbook Style */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b-2 border-teal-500">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedGroup === "all"
                    ? "전체 도안"
                    : groups.find((g) => g.id === selectedGroup)?.name ||
                      "선택된 그룹"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  총{" "}
                  <span className="text-pink-500 font-bold">
                    {filteredTemplates.length}
                  </span>
                  개의 도안이 있습니다.
                </p>
              </div>
            </div>

            {/* 도안 그리드 - Workbook Style */}
            {loading ? (
              <div className="text-center py-24">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-100 border-t-teal-600"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 text-lg">등록된 도안이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                  >
                    {/* Thumbnail Area */}
                    <div className="relative aspect-[4/3] bg-teal-50 p-4 flex items-center justify-center overflow-hidden">
                      <div className="relative w-full h-full shadow-sm transform group-hover:scale-105 transition-transform duration-300 bg-white flex items-center justify-center p-2 rounded-lg">
                        <img
                          src={template.outline}
                          alt={template.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      {template.groupName && (
                        <p className="text-xs text-gray-500 mb-4">
                          {template.groupName}
                        </p>
                      )}

                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors font-medium text-sm"
                      >
                        <PaintBucket className="w-4 h-4" />
                        <span>색칠하기</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 작업 화면 */}
        {selectedTemplate && (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
            {/* 좌측: 도구 및 팔레트 (데스크탑) */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 h-full overflow-hidden">
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-teal-600" />
                    색상 팔레트
                  </h3>
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {currentPalette.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => {
                          setSelectedColor(color.hex);
                          setIsEraserMode(false);
                        }}
                        className={`
                          relative flex flex-col items-center gap-2 p-2 rounded-xl border transition-all duration-200
                          ${
                            selectedColor === color.hex && !isEraserMode
                              ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }
                        `}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-inner border border-black/5"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <span className="text-xs font-medium text-gray-700">
                          {color.name}
                        </span>
                        {selectedColor === color.hex && !isEraserMode && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 중앙: 캔버스 */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center relative bg-dot-pattern">
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <div className="bg-white/95 backdrop-blur rounded-lg border border-gray-200 shadow-sm p-1 flex">
                  <button
                    onClick={() => setFillMode(true)}
                    className={`p-2 rounded-md transition-colors ${
                      fillMode && !isEraserMode
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title="채우기 (영역 클릭)"
                  >
                    <img
                      src="https://api.iconify.design/ri:paint-fill.svg"
                      alt="Fill"
                      className={`w-5 h-5 ${
                        fillMode && !isEraserMode ? "opacity-100" : "opacity-60"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setFillMode(false)}
                    className={`p-2 rounded-md transition-colors ${
                      !fillMode && !isEraserMode
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title="브러시 (직접 그리기)"
                  >
                    <img
                      src="https://api.iconify.design/ri:brush-fill.svg"
                      alt="Brush"
                      className={`w-5 h-5 ${
                        !fillMode && !isEraserMode
                          ? "opacity-100"
                          : "opacity-60"
                      }`}
                    />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
                  <button
                    onClick={() => setIsEraserMode(!isEraserMode)}
                    className={`p-2 rounded-md transition-colors ${
                      isEraserMode
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                    title="지우개"
                  >
                    <Eraser className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <div className="bg-white/95 backdrop-blur rounded-lg border border-gray-200 shadow-sm p-1 flex">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="실행 취소"
                  >
                    <Undo2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="다시 실행"
                  >
                    <Redo2 className="h-5 w-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
                  <button
                    onClick={() => setShowReference(!showReference)}
                    className={`p-2 rounded-md transition-colors ${
                      showReference
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title="원본 보기"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="초기화"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1 my-auto"></div>
                  <button
                    onClick={() => {
                      setSelectedTemplate(null);
                      setOutlineImage(null);
                      setOriginalImage(null);
                      setHistoryIndex(-1);
                      setHistory([]);
                    }}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                    title="나가기"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50/50 rounded-xl overflow-hidden border border-dashed border-gray-200">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseLeave}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  className={`max-w-full max-h-full object-contain shadow-lg bg-white cursor-crosshair touch-none
                    ${
                      isEraserMode
                        ? "cursor-eraser"
                        : fillMode
                        ? "cursor-paint-bucket"
                        : "cursor-brush"
                    }
                  `}
                />
              </div>

              {/* 하단 툴바 (다운로드/프린트) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 hover:-translate-y-1 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span className="font-medium text-sm">저장하기</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 hover:-translate-y-1 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span className="font-medium text-sm">인쇄하기</span>
                </button>
              </div>
            </div>

            {/* 우측: 참고용 이미지 (데스크탑) */}
            {showReference && originalImage && (
              <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 h-full overflow-hidden">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-teal-600" />
                      참고용 원본
                    </h3>
                  </div>
                  <div className="p-4 flex-1 flex items-center justify-center bg-gray-50/50">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={originalImage}
                        alt="Original Reference"
                        className="max-w-full max-h-full object-contain drop-shadow-md rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 모바일 참고용 이미지 (플로팅) */}
            {showReference && originalImage && (
              <div className="lg:hidden fixed top-24 right-4 w-32 aspect-[4/3] bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-hidden">
                <button
                  onClick={() => setShowReference(false)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                >
                  <span className="sr-only">닫기</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <img
                  src={originalImage}
                  alt="Original Reference"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* 모바일 팔레트 (화면 하단) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {currentPalette.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setSelectedColor(color.hex);
                      setIsEraserMode(false);
                    }}
                    title={color.name}
                    aria-label={color.name}
                    className={`
                          flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all
                          ${
                            selectedColor === color.hex && !isEraserMode
                              ? "border-teal-600 scale-110 shadow-md"
                              : "border-transparent"
                          }
                        `}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFillMode(!fillMode)}
                    className={`p-2 rounded-lg ${
                      fillMode
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title="채우기 모드"
                  >
                    <img
                      src="https://api.iconify.design/ri:paint-fill.svg"
                      alt="Fill"
                      className="w-5 h-5"
                    />
                  </button>
                  <button
                    onClick={() => setIsEraserMode(!isEraserMode)}
                    className={`p-2 rounded-lg ${
                      isEraserMode
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    title="지우개 모드"
                  >
                    <Eraser className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUndo}
                    className="p-2 bg-gray-100 rounded-lg text-gray-600"
                    title="실행 취소"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    className="p-2 bg-gray-100 rounded-lg text-gray-600"
                    title="다시 실행"
                  >
                    <Redo2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
