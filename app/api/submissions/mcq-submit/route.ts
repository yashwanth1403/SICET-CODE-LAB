import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Status, Role } from "@prisma/client";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[MCQ Submit API] Request body received:", body);

    // Get authenticated user from session
    const session = await auth();
    console.log("[MCQ Submit API] Auth session:", session?.user);

    // Extract request data
    let { studentId } = body;
    const { problemId, selectedChoiceId, questionNumber, questionPreview } =
      body;

    // Try to get studentId from session if not provided in request
    if (!studentId && session?.user?.id) {
      studentId = session.user.id;
      console.log(
        `[MCQ Submit API] Using student ID from session: ${studentId}`
      );
    } else if (studentId) {
      console.log(
        `[MCQ Submit API] Using student ID from request: ${studentId}`
      );
    }

    // Validate required fields
    if (!studentId) {
      console.error(
        "[MCQ Submit API] Missing studentId in request and not authenticated"
      );
      return NextResponse.json(
        { error: "You must be logged in to submit answers" },
        { status: 401 }
      );
    }

    if (!problemId) {
      console.error("[MCQ Submit API] Missing problemId in request");
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    if (!selectedChoiceId) {
      console.error("[MCQ Submit API] Missing selectedChoiceId in request");
      return NextResponse.json(
        { error: "Selected choice ID is required" },
        { status: 400 }
      );
    }

    // Check if student exists and create if not
    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true },
      });

      if (!student) {
        console.log(
          `[MCQ Submit API] Student ${studentId} not found, creating temporary record`
        );

        // If we have session info, use it to create a better record
        const studentName = session?.user?.name || "Anonymous Student";
        const studentEmail =
          session?.user?.email || `temp-${studentId}@example.com`;
        const studentDept = session?.user?.department || "Unknown";
        const studentBatch = session?.user?.batch || "Unknown";

        // Create a placeholder student record
        await prisma.student.create({
          data: {
            id: studentId,
            studentId: `temp-${studentId.substring(0, 8)}`,
            name: studentName,
            email: studentEmail,
            password: "temporary-password",
            department: studentDept,
            batch: studentBatch,
            role: Role.STUDENT,
          },
        });

        console.log(`[MCQ Submit API] Created temporary student: ${studentId}`);
      }
    } catch (studentError) {
      console.log(
        "[MCQ Submit API] Error checking/creating student:",
        studentError instanceof Error ? studentError.message : "Unknown error"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Student account not found or could not be created",
        },
        { status: 400 }
      );
    }

    console.log("[MCQ Submit API] Finding problem:", problemId);

    // Get the problem to check correct answer
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      include: { choices: true },
    });

    if (!problem) {
      console.error("[MCQ Submit API] Problem not found:", problemId);
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    console.log(
      "[MCQ Submit API] Problem found, finding selected choice:",
      selectedChoiceId
    );

    // Find the selected choice
    const selectedChoice = problem.choices.find(
      (c) => c.id === selectedChoiceId
    );
    if (!selectedChoice) {
      console.error(
        "[MCQ Submit API] Invalid choice selected:",
        selectedChoiceId
      );
      return NextResponse.json(
        { error: "Invalid choice selected" },
        { status: 400 }
      );
    }

    console.log("[MCQ Submit API] Choice found, creating/updating submission");

    // Create or update submission
    const submission = await prisma.submission.upsert({
      where: {
        studentId_problemId: {
          studentId,
          problemId,
        },
      },
      update: {
        selectedChoiceId,
        isSubmitted: true,
        isCorrect: selectedChoice.isCorrect,
        score: selectedChoice.isCorrect ? problem.score : 0,
        status: Status.COMPLETED,
        questionNumber,
        questionPreview,
      },
      create: {
        studentId,
        problemId,
        selectedChoiceId,
        isSubmitted: true,
        isCorrect: selectedChoice.isCorrect,
        score: selectedChoice.isCorrect ? problem.score : 0,
        status: Status.COMPLETED,
        questionNumber,
        questionPreview,
      },
    });

    console.log(
      "[MCQ Submit API] Submission created/updated successfully, updating assessment stats"
    );

    // Update assessment submission stats
    try {
      // First check if assessment submission exists
      const existingAssessmentSubmission =
        await prisma.assessmentSubmission.findUnique({
          where: {
            studentId_assessmentId: {
              studentId,
              assessmentId: problem.assessmentId,
            },
          },
        });

      if (existingAssessmentSubmission) {
        // Update existing assessment submission
        await prisma.assessmentSubmission.update({
          where: {
            id: existingAssessmentSubmission.id,
          },
          data: {
            mcqScore: {
              increment: submission.score,
            },
            totalScore: {
              increment: submission.score,
            },
          },
        });
      } else {
        // Create a new assessment submission
        await prisma.assessmentSubmission.create({
          data: {
            studentId,
            assessmentId: problem.assessmentId,
            totalScore: submission.score,
            maxScore: problem.score,
            codingScore: 0,
            mcqScore: submission.score,
            totalProblems: 1,
            problemsAttempted: 1,
            problemsCompleted: 1,
          },
        });
      }

      console.log("[MCQ Submit API] Assessment stats updated successfully");
    } catch (statsError) {
      // If updating stats fails, still return submission success
      console.log(
        "[MCQ Submit API] Warning: Could not update assessment stats:",
        statsError instanceof Error ? statsError.message : "Unknown error"
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
      message: "Answer submitted successfully",
    });
  } catch (error) {
    console.log("[MCQ Submit API] Error in submission");

    // Don't try to log the error object itself
    if (error instanceof Error) {
      console.log("[MCQ Submit API] Error message:", error.message);
    }

    // Clean error response
    return NextResponse.json(
      { success: false, error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
