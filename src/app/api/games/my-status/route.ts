import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all successfully completed games for the user
    const completedGames = await prisma.gameScore.findMany({
      where: {
        userId: session.userId,
        success: true, // Assuming success=true means completed
      },
      select: {
        gameId: true,
      },
    });

    // Extract unique game IDs
    const completedGameIds = Array.from(new Set(completedGames.map((g) => g.gameId)));

    return NextResponse.json({ completedGameIds });
  } catch (error) {
    console.error("GET /api/games/my-status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
