import { Calendar, Clock } from "lucide-react";
import { Assessment, ValidationErrors } from "../AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScheduleProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  errors: ValidationErrors;
}

export const Schedule: React.FC<ScheduleProps> = ({
  assessment,
  setAssessment,
  errors,
}) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Time
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="datetime-local"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.startTime ? "border-red-500" : ""
                }`}
                value={assessment.startTime}
                onChange={(e) =>
                  setAssessment({ ...assessment, startTime: e.target.value })
                }
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Time
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="datetime-local"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.endTime ? "border-red-500" : ""
                }`}
                value={assessment.endTime}
                onChange={(e) =>
                  setAssessment({ ...assessment, endTime: e.target.value })
                }
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <div className="relative">
              <Clock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="number"
                className={`w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5 ${
                  errors.duration ? "border-red-500" : ""
                }`}
                placeholder="120"
                value={assessment.duration}
                onChange={(e) =>
                  setAssessment({
                    ...assessment,
                    duration: Number(e.target.value),
                  })
                }
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
