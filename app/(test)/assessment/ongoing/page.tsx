"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { dracula } from "@uiw/codemirror-theme-dracula";

const mockProblems = [
  {
    id: "prob1",
    title: "Array Reversal",
    difficulty: "Easy",
    description: `Write a function that reverses an array in-place.
    
Example:
Input: [1, 2, 3, 4, 5]
Output: [5, 4, 3, 2, 1]

Constraints:
• Do not create a new array
• Modify the input array in-place
• Return the modified array`,
    startingCode: `function reverseArray(arr) {
    // Your code here
    
}`,
    testCases: [
      { input: "[1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" },
      { input: "[1]", output: "[1]" },
      { input: "[]", output: "[]" },
    ],
  },
  {
    id: "prob2",
    title: "Find Maximum",
    difficulty: "Easy",
    description: `Write a function to find the maximum element in an array.

Example:
Input: [3, 7, 2, 9, 1]
Output: 9`,
    startingCode: `function findMax(arr) {
    // Your code here
    
}`,
    testCases: [
      { input: "[3, 7, 2, 9, 1]", output: "9" },
      { input: "[1]", output: "1" },
      { input: "[-1, -5, -2]", output: "-1" },
    ],
  },
];

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const AssessmentInterface = () => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState(mockProblems[0].startingCode);
  const [testResults, setTestResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 300 && !showTimeWarning) {
          // 5 minutes warning
          setShowTimeWarning(true);
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRunTests = () => {
    setTestResults({
      status: "success",
      runtime: "76 ms",
      memory: "42.1 MB",
      cases: [
        {
          status: "passed",
          input: mockProblems[currentProblemIndex].testCases[0].input,
          output: mockProblems[currentProblemIndex].testCases[0].output,
          runtime: "76 ms",
        },
        {
          status: "passed",
          input: mockProblems[currentProblemIndex].testCases[1].input,
          output: mockProblems[currentProblemIndex].testCases[1].output,
          runtime: "82 ms",
        },
        {
          status: "failed",
          input: mockProblems[currentProblemIndex].testCases[2].input,
          output: "null",
          runtime: "70 ms",
        },
      ],
    });
  };

  const navigateProblem = (direction) => {
    const newIndex = currentProblemIndex + direction;
    if (newIndex >= 0 && newIndex < mockProblems.length) {
      setCurrentProblemIndex(newIndex);
      setCode(mockProblems[newIndex].startingCode);
      setTestResults(null);
    }
  };

  const currentProblem = mockProblems[currentProblemIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium">Coding Assessment</h1>
            <Progress
              value={((currentProblemIndex + 1) / mockProblems.length) * 100}
              className="w-32"
            />
            <span className="text-sm text-gray-500">
              Problem {currentProblemIndex + 1} of {mockProblems.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                timeLeft <= 300 ? "text-red-600 animate-pulse" : "text-blue-600"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsSubmitDialogOpen(true)}
            >
              End Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* Left Panel */}
        <div className="w-5/12 flex flex-col gap-4">
          <Card className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{currentProblem.title}</h2>
              <Badge
                variant={
                  currentProblem.difficulty === "Easy"
                    ? "success"
                    : currentProblem.difficulty === "Medium"
                    ? "warning"
                    : "destructive"
                }
              >
                {currentProblem.difficulty}
              </Badge>
            </div>
            <div className="prose max-w-none">
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {currentProblem.description}
              </pre>
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <div className="border-b p-2 flex items-center gap-2">
              <select className="text-sm p-1 border rounded">
                <option>JavaScript</option>
                <option>Python</option>
                <option>Java</option>
              </select>
            </div>
            <div className="flex-1">
              <CodeMirror
                value={code}
                height="100%"
                theme={dracula}
                extensions={[javascript({ jsx: true })]}
                onChange={(value) => setCode(value)}
                className="h-full"
              />
            </div>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card className="p-4">
              <div className="space-y-2">
                {testResults.cases.map((test, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
                    {test.status === "passed" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Test Case {idx + 1}: </span>
                    <span className="font-mono">{test.input}</span>
                    <span className="text-gray-500">({test.runtime})</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              className="flex-1"
              onClick={handleRunTests}
              variant="outline"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Tests
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigateProblem(1)}
              disabled={currentProblemIndex === mockProblems.length - 1}
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-between max-w-7xl mx-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigateProblem(-1)}
            disabled={currentProblemIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Problem
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => navigateProblem(1)}
            disabled={currentProblemIndex === mockProblems.length - 1}
          >
            Next Problem
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Time Warning Dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>5 Minutes Remaining!</AlertDialogTitle>
            <AlertDialogDescription>
              You have 5 minutes left to complete the assessment. Please make
              sure to submit your solutions before time runs out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue Working</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Assessment Dialog */}
      <AlertDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your assessment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Submit Assessment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssessmentInterface;
