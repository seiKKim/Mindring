// app/api/auth/me/route.ts
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
        where: { userId: session.userId },
        include: {
            socialAccounts: {
                select: {
                    provider: true,
                    providerUserId: true,
                    email: true,
                }
            }
        }
    });

    if (!user) {
         return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        socialAccounts: user.socialAccounts,
      }
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

