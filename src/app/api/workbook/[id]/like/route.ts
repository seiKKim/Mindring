import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { increment } = await req.json();

    const workbook = await prisma.workbookResource.update({
      where: { id },
      data: {
        likes: {
          [increment ? "increment" : "decrement"]: 1,
        },
      },
    });

    return NextResponse.json(workbook);
  } catch (error) {
    console.error("Failed to update likes:", error);
    return NextResponse.json(
      { error: "Failed to update likes" },
      { status: 500 }
    );
  }
}
