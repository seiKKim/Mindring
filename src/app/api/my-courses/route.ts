import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userCourses = await prisma.userCourse.findMany({
      where: { userId: session.userId },
      include: {
        academyCourse: true,
      },
      orderBy: { lastAccessedAt: "desc" },
    });

    return NextResponse.json({ userCourses });
  } catch (error) {
    console.error("GET /api/my-courses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Check if already enrolled
    const existing = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: session.userId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already enrolled", userCourse: existing });
    }

    const userCourse = await prisma.userCourse.create({
      data: {
        userId: session.userId,
        courseId,
        status: "LEARNING",
      },
    });

    return NextResponse.json({ userCourse });
  } catch (error) {
    console.error("POST /api/my-courses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
