// app/api/submissions/latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

/**
 * GET /api/submissions/latest
 * Get the latest submission for a specific problem and student
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");
    const studentId = searchParams.get("studentId") || session.user.id;

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    // Get the latest submission
    const submission = await prisma.submission.findFirst({
      where: {
        problemId,
        studentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!submission) {
      return NextResponse.json(null);
    }

    // Parse JSON test results if they exist
    const parsedSubmission = {
      ...submission,
      testResults: submission.testResults
        ? JSON.parse(submission.testResults as string)
        : null,
    };

    return NextResponse.json(parsedSubmission);
  } catch (error) {
    console.error("Error getting latest submission:", error);
    return NextResponse.json(
      { error: "Failed to get latest submission" },
      { status: 500 }
    );
  }
}
