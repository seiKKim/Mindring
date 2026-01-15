import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "8");
  const category = searchParams.get("category") || "전체";
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "latest"; // 'latest', 'popular'

  const skip = (page - 1) * limit;

  const where: Prisma.WorkbookResourceWhereInput = {
    visible: true,
    ...(category !== "전체" && { category }), // Only filter if not "전체"
    ...(query && {
      OR: [
        { title: { contains: query } },
        // Add other fields if needed
      ],
    }),
  };

  const orderBy: Prisma.WorkbookResourceOrderByWithRelationInput =
    sort === "popular" ? { downloads: "desc" } : { createdAt: "desc" };

  try {
    const [total, items] = await Promise.all([
      prisma.workbookResource.count({ where }),
      prisma.workbookResource.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch workbooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch workbooks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, fileUrl, thumbnail } = body;

    if (!title || !category || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const workbook = await prisma.workbookResource.create({
      data: {
        title,
        category,
        fileUrl,
        thumbnail: thumbnail || "/img/cover-fallback.png", // Default thumbnail
      },
    });

    return NextResponse.json(workbook);
  } catch (error) {
    console.error("Failed to create workbook:", error);
    return NextResponse.json(
      { error: "Failed to create workbook" },
      { status: 500 }
    );
  }
}
