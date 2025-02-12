interface ProgressStepsProps {
  steps: string[];
  activeStep: number;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  activeStep,
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= activeStep
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gray-700"
              } text-white`}
            >
              {index + 1}
            </div>
            <div className="ml-2">
              <p
                className={`${
                  index <= activeStep ? "text-white" : "text-gray-500"
                }`}
              >
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-0.5 mx-4 ${
                  index < activeStep
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
