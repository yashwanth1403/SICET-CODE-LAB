import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { submitSolution } from "@/actions/CreateAssessment";

/**
 * POST /api/submissions/solution
 * Submit a problem solution and save to the database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { code, language, assessmentId, problemId, selectedChoiceId } = body;

    // Validate submission
    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    if (!assessmentId) {
      return NextResponse.json(
        { error: "Missing assessmentId" },
        { status: 400 }
      );
    }

    // Check if this is a code submission or MCQ submission based on provided fields
    const isCodeSubmission = Boolean(code && language);
    const isMCQSubmission = Boolean(selectedChoiceId);

    if (!isCodeSubmission && !isMCQSubmission) {
      return NextResponse.json(
        {
          error:
            "Invalid submission: must provide either code+language or selectedChoiceId",
        },
        { status: 400 }
      );
    }

    // Verify this is a valid attempt
    const attempt = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId: session.user.id,
          assessmentId: assessmentId,
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "No active attempt found for this assessment" },
        { status: 403 }
      );
    }

    // Submit solution using server action
    const result = await submitSolution(
      session.user.id,
      problemId,
      code,
      language,
      selectedChoiceId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to submit solution" },
        { status: 500 }
      );
    }

    // Return the submission ID for tracking
    return NextResponse.json({
      success: true,
      data: {
        submissionId: result.data?.id || "unknown",
        problemId,
        assessmentId,
      },
    });
  } catch (error) {
    console.error("Error submitting solution:", error);
    return NextResponse.json(
      { error: "Failed to submit solution" },
      { status: 500 }
    );
  }
}
