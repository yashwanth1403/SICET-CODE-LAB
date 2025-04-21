// app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { Status } from "@prisma/client";

/**
 * GET /api/submissions
 * Get submissions for a specific problem
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
    const studentId = searchParams.get("studentId");

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    // Build the query
    const query: any = {
      where: {
        problemId,
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // If studentId is provided, add it to the query
    if (studentId) {
      query.where.studentId = studentId;
    }

    // Get submissions
    const submissions = await prisma.submission.findMany(query);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error getting submissions:", error);
    return NextResponse.json(
      { error: "Failed to get submissions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submissions
 * Create a new submission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    if (
      !body.problemId ||
      !body.code ||
      !body.language ||
      body.score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get studentId from session or body
    const studentId = body.studentId || session.user.id;

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        code: body.code,
        language: body.language,
        status: body.status || Status.PENDING,
        score: body.score,
        studentId,
        problemId: body.problemId,
        executionTime: body.executionTime,
        memoryUsed: body.memoryUsed,
        errorMessage: body.errorMessage,
        testResults: body.testResults ? JSON.stringify(body.testResults) : null,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
