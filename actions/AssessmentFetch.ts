"use server";
import prisma from "@/lib/db";
import { AssessmentStatus } from "@prisma/client";

interface Assessment {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  status: AssessmentStatus;
}

export async function fetchAssessments(): Promise<Assessment[]> {
  try {
    const currentDate = new Date();

    const assessments = await prisma.assessments.findMany({
      where: {
        startTime: {
          gt: currentDate,
        },
      },
      include: {
        problems: {
          include: {
            testCases: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
    }));
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function deleteAllAssessments() {
  try {
    // Use transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all test cases first
      await tx.testCases.deleteMany({});

      // Delete all problems
      await tx.problems.deleteMany({});

      // Finally delete all assessments
      await tx.assessments.deleteMany({});
    });

    return {
      success: true,
      message: "All assessments deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting assessments:", error);
    return {
      success: false,
      message: "Failed to delete assessments",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function UpcomingAssessments(batch: string, department: string) {
  try {
    const currentDate = new Date();

    const assessments = await prisma.assessments.findMany({
      where: {
        startTime: {
          gt: currentDate,
        },
        batch: {
          has: batch,
        },
        departments: {
          has: department,
        },
      },
      include: {
        problems: {
          include: {
            testCases: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    console.log("Assessments:", assessments);

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
    }));
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function OngoingAssessments(batch: string, department: string) {
  try {
    const currentDate = new Date();

    const assessments = await prisma.assessments.findMany({
      where: {
        AND: [
          {
            startTime: {
              lte: currentDate, // Started before or at current time
            },
            endTime: {
              gt: currentDate, // Ends after current time
            },
          },
          {
            batch: {
              has: batch,
            },
            departments: {
              has: department,
            },
          },
          {
            status: AssessmentStatus.PUBLISHED,
          },
        ],
      },
      include: {
        problems: {
          include: {
            testCases: true,
          },
        },
      },
      orderBy: {
        endTime: "asc", // Order by end time so closest to ending comes first
      },
    });

    console.log("assessments", assessments);

    return assessments.map((assessment) => ({
      id: assessment.id,
      title: assessment.title,
      batch: assessment.batch,
      departments: assessment.departments,
      startTime: assessment.startTime.toISOString(),
      endTime: assessment.endTime.toISOString(),
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      topics: assessment.topics,
      status: assessment.status,
    }));
  } catch (error) {
    console.error("Error fetching ongoing assessments:", error);
    throw new Error("Failed to fetch ongoing assessments");
  }
}
