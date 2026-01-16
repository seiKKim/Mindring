import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.workbookResource.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Workbook deleted successfully" });
  } catch (error) {
    console.error("Failed to delete workbook:", error);
    return NextResponse.json(
      { error: "Failed to delete workbook" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, category, fileUrl, thumbnail } = body;

    const workbook = await prisma.workbookResource.update({
      where: { id },
      data: {
        title,
        category,
        fileUrl,
        thumbnail,
        // Don't update 'downloads' or 'visible' here unless intended
      },
    });

    return NextResponse.json(workbook);
  } catch (error) {
    console.error("Failed to update workbook:", error);
    return NextResponse.json(
      { error: "Failed to update workbook" },
      { status: 500 }
    );
  }
}
