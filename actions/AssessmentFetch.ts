import prisma from "@/lib/db";
import { AssessmentStatus } from "@prisma/client";

interface Assessment {
  id: string;
  title: string;
  year: string;
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
      year: assessment.year,
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
