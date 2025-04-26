import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";

// GET route to fetch attempt info for an assessment
export async function GET(req: Request) {
  try {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const assessmentId = url.searchParams.get("assessmentId");
    let studentId = url.searchParams.get("studentId");

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

    // Get attempt information from database
    const attempt = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "No attempt found for this assessment and student" },
        { status: 404 }
      );
    }

    // Also get assessment submission for duration
    const assessmentSubmission = await prisma.assessmentSubmission.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
      select: {
        duration: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...attempt,
        duration: assessmentSubmission?.duration || null,
        submissionStatus: assessmentSubmission?.status || null,
      },
    });
  } catch (error) {
    console.error("Error fetching attempt info:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempt information" },
      { status: 500 }
    );
  }
}

// POST route to create a new attempt
export async function POST(req: Request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const studentId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { assessmentId, duration } = body;

    // Validate required fields
    if (!assessmentId) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    // Check if attempt already exists
    const existingAttempt = await prisma.attemptTracker.findUnique({
      where: {
        studentId_assessmentId: {
          studentId,
          assessmentId,
        },
      },
    });

    // If attempt exists, return it
    if (existingAttempt) {
      return NextResponse.json({
        success: true,
        message: "Attempt already exists",
        data: existingAttempt,
      });
    }

    // Get assessment details to calculate endTime properly
    const assessment = await prisma.assessments.findUnique({
      where: { id: assessmentId },
      select: { duration: true },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Use specified duration or assessment duration or default to 60 minutes
    const durationInMinutes = duration || assessment.duration || 60;

    // Create a new attempt
    const now = new Date();
    const endTime = new Date(now.getTime() + durationInMinutes * 60000);

    const newAttempt = await prisma.attemptTracker.create({
      data: {
        studentId,
        assessmentId,
        startTime: now,
        endTime,
        isCompleted: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New attempt created",
      data: newAttempt,
    });
  } catch (error) {
    console.error("Error creating attempt:", error);
    return NextResponse.json(
      { error: "Failed to create attempt" },
      { status: 500 }
    );
  }
}
