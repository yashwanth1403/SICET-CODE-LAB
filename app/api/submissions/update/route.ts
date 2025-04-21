import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { updateSubmissionStatus } from "@/actions/CreateAssessment";

/**
 * POST /api/submissions/update
 * Update a problem submission with test results
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      submissionId,
      status,
      score,
      executionTime,
      memoryUsed,
      errorMessage,
      testResults,
    } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Make sure submission exists
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Update the submission
    const result = await updateSubmissionStatus(
      submissionId,
      status,
      score,
      executionTime,
      memoryUsed,
      errorMessage,
      testResults
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
