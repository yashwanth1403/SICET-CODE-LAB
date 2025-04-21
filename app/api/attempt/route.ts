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
