import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "workbook-menu.json");

async function readMenu() {
  try {
    const txt = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(txt);
  } catch {
    const defaultCategories = [
      "전체",
      "언어/한글",
      "숫자/수학",
      "계절",
      "동식물",
      "생활",
      "사고력",
      "음식",
      "안전",
      "가족",
      "미술",
      "색칠하기",
      "한자/천자문",
      "영어",
      "사자성어/속담",
      "특별한 날",
      "절기",
      "세계문화",
      "한국/역사/전통",
    ];

    const fallback = defaultCategories.map((name, index) => ({
      id: name === "전체" ? "all" : `cat-${index}`,
      name,
      slug: name === "전체" ? "all" : `cat-${index}`,
      order: index,
      visible: true,
    }));

    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export async function GET() {
  const data = await readMenu();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "배열 형태가 필요합니다." },
        { status: 400 }
      );
    }
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
