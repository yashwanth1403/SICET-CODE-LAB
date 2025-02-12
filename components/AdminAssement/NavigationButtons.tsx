import { ArrowRight } from "lucide-react";
interface NavigationButtonsProps {
  activeStep: number;
  steps: string[];
  handleNext: () => void;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
}
export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  activeStep,
  steps,
  handleNext,
  setActiveStep,
}) => {
  return (
    <div className="flex justify-between mt-8">
      <button
        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
        className={`px-4 py-2 rounded-lg ${
          activeStep === 0
            ? "bg-gray-700 text-gray-400"
            : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
        disabled={activeStep === 0}
      >
        Previous
      </button>
      <button
        onClick={handleNext}
        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
      >
        {activeStep === steps.length - 1 ? "Create Assessment" : "Next"}
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
