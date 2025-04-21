import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SubmissionsClient from "@/components/submissions/SubmissionsClient";
import prisma from "@/lib/db";

export default async function SubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch all assessment submissions for this student
  const submissions = await prisma.assessmentSubmission.findMany({
    where: {
      studentId: session.user.id,
    },
    include: {
      assessment: {
        select: {
          title: true,
          problems: {
            select: {
              id: true,
              title: true,
              questionType: true,
              score: true,
            },
          },
        },
      },
      student: {
        select: {
          name: true,
          studentId: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get detailed submission information for each assessment
  const submissionsWithDetails = await Promise.all(
    submissions.map(async (submission) => {
      // Get all problem submissions for each assessment
      const problemSubmissions = await prisma.submission.findMany({
        where: {
          studentId: session.user.id,
          problem: {
            assessmentId: submission.assessmentId,
          },
        },
        include: {
          problem: {
            select: {
              title: true,
              questionType: true,
              score: true,
            },
          },
        },
      });

      return {
        ...submission,
        problemSubmissions,
      };
    })
  );

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-white">My Submissions</h1>
      <SubmissionsClient submissions={submissionsWithDetails} />
    </main>
  );
}
