import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Status } from "@prisma/client";
import { auth } from "@/auth";

/**
 * POST /api/submissions/code
 * Handles saving coding problem submissions to the database
 * It processes code submissions, updates assessment stats, and
 * ensures consistent tracking of student progress
 */
export async function POST(req: Request) {
  try {
    console.log("Submission API route called at", new Date().toISOString());

    // First try to get the authenticated user
    const session = await auth();
    console.log(
      "Auth session:",
      session?.user?.id ? "Authenticated" : "Not authenticated"
    );

    // Parse the submission data from the request body
    const body = await req.json();
    console.log("Submission request body:", {
      problemId: body.problemId,
      studentId: body.studentId,
      language: body.language,
      status: body.status,
      bodyLength: body.code?.length || 0,
    });
    const {
      code,
      language,
      status,
      score,
      studentId: providedStudentId,
      problemId,
      executionTime,
      memoryUsed,
      errorMessage,
      testResults,
      questionNumber,
      questionPreview,
      assessmentId: providedAssessmentId,
    } = body;

    // Use authenticated user ID if available and no studentId provided
    const studentId = providedStudentId || session?.user?.id;

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (!language) {
      return NextResponse.json(
        { error: "Programming language is required" },
        { status: 400 }
      );
    }

    // Get the problem to verify it exists and to retrieve assessment info
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        score: true,
        assessmentId: true,
        title: true,
        difficulty: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Use provided assessmentId or get it from the problem
    const assessmentId = providedAssessmentId || problem.assessmentId;

    // Prepare test results data for storage
    let formattedTestResults = null;
    if (testResults) {
      if (typeof testResults === "string") {
        formattedTestResults = testResults;
      } else {
        formattedTestResults = JSON.stringify(testResults);
      }
    }

    // Create or update the submission
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
        ...(formattedTestResults ? { testResults: formattedTestResults } : {}),
        isSubmitted: true,
        questionNumber,
        questionPreview: questionPreview || problem.title,
        isCorrect: status === Status.COMPLETED,
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
        ...(formattedTestResults ? { testResults: formattedTestResults } : {}),
        isSubmitted: true,
        questionNumber,
        questionPreview: questionPreview || problem.title,
        isCorrect: status === Status.COMPLETED,
      },
    });

    // Update or create an attempt record
    await prisma.attemptTracker.upsert({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
      update: {
        // Only update endTime if not already set
        endTime: undefined,
        isCompleted: true,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        assessmentId,
        startTime: new Date(),
        isCompleted: false,
      },
    });

    // Get all problems for this assessment
    const assessmentProblems = await prisma.problems.findMany({
      where: { assessmentId },
      select: { id: true, score: true },
    });

    // Get all submissions for this student and assessment
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: assessmentProblems.map((p) => p.id) },
      },
    });

    // Calculate assessment stats
    const totalProblems = assessmentProblems.length;
    const problemsAttempted = new Set(submissions.map((s) => s.problemId)).size;
    const problemsCompleted = submissions.filter(
      (s) => s.status === Status.COMPLETED
    ).length;

    // Calculate scores
    const maxScore = assessmentProblems.reduce(
      (total, p) => total + p.score,
      0
    );
    const codingScore =
      submissions
        .filter((s) => s.problemId !== problem.id)
        .reduce((total, s) => total + (s.score || 0), 0) +
      (submission.score || 0);

    // Get MCQ score if available
    const mcqSubmissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: assessmentProblems.map((p) => p.id) },
        isCorrect: true,
        selectedChoiceId: { not: null },
      },
    });

    const mcqScore = mcqSubmissions.reduce(
      (total, s) => total + (s.score || 0),
      0
    );
    const totalScore = codingScore + mcqScore;

    // Update assessment submission stats
    await prisma.assessmentSubmission.upsert({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
      update: {
        totalScore,
        codingScore,
        mcqScore,
        problemsAttempted,
        problemsCompleted,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        assessmentId,
        totalScore,
        maxScore,
        codingScore,
        mcqScore,
        totalProblems,
        problemsAttempted,
        problemsCompleted,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        submission,
        stats: {
          totalScore,
          maxScore,
          problemsAttempted,
          problemsCompleted,
          totalProblems,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Error submitting coding solution:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.stack : "Unknown error"
    );

    // Check if it's a Prisma error and provide specific error messaging
    const isPrismaError =
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "PrismaClientKnownRequestError";

    const errorCode =
      isPrismaError && typeof error === "object" && "code" in error
        ? error.code
        : null;

    const errorName =
      error && typeof error === "object" && "name" in error
        ? error.name
        : "UnknownError";

    return NextResponse.json(
      {
        error: "Failed to submit solution",
        details: error instanceof Error ? error.message : "Unknown error",
        code: errorCode,
        type: errorName,
      },
      { status: 500 }
    );
  }
}
