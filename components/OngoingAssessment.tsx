"use client";
export interface AssessmentType {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  status: string;
}

// RealTimeAssessment.tsx
import { useEffect, useState, useCallback } from "react";
import { OngoingAssessments } from "@/actions/AssessmentFetch";
import Assessment from "./assement";

interface RealTimeAssessmentProps {
  initialAssessments: AssessmentType[];
  batch: string;
  department: string;
}

export function RealTimeAssessment({
  initialAssessments,
  batch,
  department,
}: RealTimeAssessmentProps) {
  const [assessments, setAssessments] =
    useState<AssessmentType[]>(initialAssessments);

  const fetchLatestAssessments = useCallback(async () => {
    try {
      const data = await OngoingAssessments(batch, department);
      setAssessments(data);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  }, [batch, department]);

  useEffect(() => {
    const intervalId = setInterval(fetchLatestAssessments, 5000);
    return () => clearInterval(intervalId);
  }, [fetchLatestAssessments]);

  return <Assessment OngoingAssessments={assessments} />;
}
