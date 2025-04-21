import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { finalizeAssessment } from "@/actions/CreateAssessment";

// GET route to fetch submissions for an assessment
export async function GET(req: Request) {
  try {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const assessmentId = url.searchParams.get("assessmentId");
    let studentId = url.searchParams.get("studentId");
    const type = url.searchParams.get("type");

    // Try to get student ID from auth session if not provided
    if (!studentId) {
      const session = await auth();
      if (session?.user?.id) {
        studentId = session.user.id;
      }
    }

    // Validate required parameters
    if (!assessmentId) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get MCQ submissions if requested
    if (type === "MCQ") {
      return await getMcqSubmissions(studentId, assessmentId);
    }

    // Get coding submissions if requested
    if (type === "CODING") {
      return await getCodingSubmissions(studentId, assessmentId);
    }

    // Otherwise, return all submissions
    return await getAllSubmissions(studentId, assessmentId);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST route to submit an assessment
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assessmentId, isTimeExpired = false } = body;

    // Get student ID from session for security
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const studentId = session.user.id;

    // Validate required fields
    if (!assessmentId) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    console.log("Processing assessment submission:", {
      studentId,
      assessmentId,
      isTimeExpired,
    });

    // Check if attempt exists for this assessment
    const attemptExists = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    if (!attemptExists) {
      return NextResponse.json(
        { error: "No attempt found for this assessment" },
        { status: 404 }
      );
    }

    // Process the assessment submission using the server action
    const result = await finalizeAssessment(
      studentId,
      assessmentId,
      isTimeExpired
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to process submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assessment submitted successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Get all MCQ submissions for a student and assessment
async function getMcqSubmissions(studentId: string, assessmentId: string) {
  try {
    // Find all MCQ problems for this assessment
    const mcqProblems = await prisma.problems.findMany({
      where: {
        assessmentId,
        questionType: "MULTIPLE_CHOICE",
      },
      select: { id: true },
    });

    // Get all submissions for these problems
    const problemIds = mcqProblems.map((p) => p.id);

    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: problemIds },
      },
      include: {
        problem: {
          select: {
            questionType: true,
            title: true,
            score: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching MCQ submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch MCQ submissions" },
      { status: 500 }
    );
  }
}

// Get all coding submissions for a student and assessment
async function getCodingSubmissions(studentId: string, assessmentId: string) {
  try {
    // Find all coding problems for this assessment
    const codingProblems = await prisma.problems.findMany({
      where: {
        assessmentId,
        questionType: "CODING",
      },
      select: { id: true },
    });

    // Get all submissions for these problems
    const problemIds = codingProblems.map((p) => p.id);

    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: problemIds },
      },
      include: {
        problem: {
          select: {
            questionType: true,
            title: true,
            score: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching coding submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch coding submissions" },
      { status: 500 }
    );
  }
}

// Get all submissions for a student and assessment
async function getAllSubmissions(studentId: string, assessmentId: string) {
  try {
    // Find all problems for this assessment
    const problems = await prisma.problems.findMany({
      where: { assessmentId },
      select: { id: true },
    });

    // Get all submissions for these problems
    const problemIds = problems.map((p) => p.id);

    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        problemId: { in: problemIds },
      },
      include: {
        problem: {
          select: {
            questionType: true,
            title: true,
            score: true,
          },
        },
      },
    });

    // Get assessment submission stats
    const stats = await prisma.assessmentSubmission.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      submissions,
      stats: stats || null,
    });
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
