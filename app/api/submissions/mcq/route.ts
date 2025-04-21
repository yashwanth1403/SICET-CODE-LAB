import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Status } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[MCQ API] Request body received:", body);

    const {
      studentId,
      problemId,
      selectedChoiceId,
      questionNumber,
      questionPreview,
    } = body;

    // Validate required fields
    if (!studentId) {
      console.error("[MCQ API] Missing studentId in request");
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!problemId) {
      console.error("[MCQ API] Missing problemId in request");
      return NextResponse.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    if (!selectedChoiceId) {
      console.error("[MCQ API] Missing selectedChoiceId in request");
      return NextResponse.json(
        { error: "Selected choice ID is required" },
        { status: 400 }
      );
    }

    console.log("[MCQ API] Finding problem:", problemId);

    // Get the problem to check correct answer
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      include: { choices: true },
    });

    if (!problem) {
      console.error("[MCQ API] Problem not found:", problemId);
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Find the selected choice
    const selectedChoice = problem.choices.find(
      (c) => c.id === selectedChoiceId
    );
    if (!selectedChoice) {
      console.error("[MCQ API] Invalid choice selected:", selectedChoiceId);
      return NextResponse.json(
        { error: "Invalid choice selected" },
        { status: 400 }
      );
    }

    console.log("[MCQ API] Choice found, creating/updating submission");

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
      "[MCQ API] Submission created/updated successfully, updating assessment stats"
    );

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
        mcqScore: {
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
        codingScore: 0,
        mcqScore: submission.score,
        totalProblems: 1,
        problemsAttempted: 1,
        problemsCompleted: 1,
      },
    });

    console.log("[MCQ API] Assessment stats updated successfully");

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error("[MCQ API] Error in submission:", error);

    // Clean error response
    return NextResponse.json(
      { success: false, error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
