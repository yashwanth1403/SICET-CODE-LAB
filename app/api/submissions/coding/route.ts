import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Ignore studentId from request body and only use authenticated session
    const {
      problemId,
      code,
      language,
      status,
      score,
      executionTime,
      memoryUsed,
      errorMessage,
      testResults,
      questionNumber,
      questionPreview,
    } = body;

    // Always get studentId from the session
    const session = await auth();
    const studentId = session?.user?.id;

    // Validate studentId from session
    if (!studentId) {
      console.error("No authenticated user found in session");
      return NextResponse.json(
        { error: "Authentication required. Please log in and try again." },
        { status: 401 }
      );
    }

    console.log("Using authenticated user ID:", studentId);

    if (!problemId) {
      console.error("Missing problemId for submission");
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    // Get the problem to verify and get assessment info
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        score: true,
        assessmentId: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Verify that the student exists before attempting to create submission
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      console.error(`Student with ID ${studentId} not found`);
      return NextResponse.json(
        { error: "Student not found. Please ensure you are logged in." },
        { status: 404 }
      );
    }

    // Create or update submission
    const submission = await prisma.submission.upsert({
      where: {
        studentId_problemId: {
          studentId,
          problemId,
        },
      },
      update: {
        code,
        language,
        status,
        score,
        executionTime,
        memoryUsed,
        errorMessage,
        testResults,
        isSubmitted: true,
        questionNumber,
        questionPreview,
      },
      create: {
        studentId,
        problemId,
        code,
        language,
        status,
        score,
        executionTime,
        memoryUsed,
        errorMessage,
        testResults,
        isSubmitted: true,
        questionNumber,
        questionPreview,
      },
    });

    // Update assessment submission stats
    await prisma.assessmentSubmission.upsert({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId: problem.assessmentId,
        },
      },
      update: {
        problemsCompleted: {
          increment: 1,
        },
        codingScore: {
          increment: submission.score,
        },
        totalScore: {
          increment: submission.score,
        },
      },
      create: {
        studentId,
        assessmentId: problem.assessmentId,
        totalScore: submission.score,
        maxScore: problem.score,
        codingScore: submission.score,
        mcqScore: 0,
        totalProblems: 1,
        problemsAttempted: 1,
        problemsCompleted: 1,
      },
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error: unknown) {
    // Safe error handling with fallback for non-serializable errors
    let errorMessage = "Failed to submit solution";
    try {
      console.error("[Coding] Error in submission:", error);
      // Try to extract a more specific error message if available
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
    } catch (logError) {
      // Fallback if the error logging itself fails
      console.error("[Coding] Error while logging submission error:", logError);
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
