import { Assessment } from "../AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface ReviewProps {
  assessment: Assessment;
}

export const Review: React.FC<ReviewProps> = ({ assessment }) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Review Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 text-white">
          <div>
            <h3 className="font-medium mb-2">Basic Details</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p>
                <span className="text-gray-400">Title:</span> {assessment.title}
              </p>
              <p>
                <span className="text-gray-400">Batch:</span>{" "}
                {assessment.batches}
              </p>
              <p>
                <span className="text-gray-400">Topics:</span>{" "}
                {assessment.topics.join(", ")}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              Problems ({assessment.problems.length})
            </h3>
            <div className="space-y-4">
              {assessment.problems.map((problem, index) => (
                <div key={problem.id} className="bg-gray-700 p-4 rounded-lg">
                  <p>
                    <span className="text-gray-400">Problem {index + 1}:</span>{" "}
                    {problem.title}
                  </p>
                  <p>
                    <span className="text-gray-400">Difficulty:</span>{" "}
                    {problem.difficulty}
                  </p>
                  <p>
                    <span className="text-gray-400">Test Cases:</span>{" "}
                    {problem.testCases.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Schedule</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p>
                <span className="text-gray-400">Start Time:</span>{" "}
                {new Date(assessment.startTime).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-400">End Time:</span>{" "}
                {new Date(assessment.endTime).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-400">Duration:</span>{" "}
                {assessment.duration} minutes
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
