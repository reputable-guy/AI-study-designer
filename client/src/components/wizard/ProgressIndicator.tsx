interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps,
  stepNames 
}: ProgressIndicatorProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="mb-8 max-w-4xl mx-auto">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-primary">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm font-medium text-neutral-400">{stepNames[currentStep - 1]}</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-1">
        <div 
          className="step-indicator bg-primary rounded-full" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-xs">
        {stepNames.map((name, index) => {
          const stepWidth = 100 / totalSteps;
          return (
            <span 
              key={index}
              className={`text-center ${index + 1 === currentStep ? 'text-primary font-medium' : 'text-neutral-400'}`} 
              style={{ width: `${stepWidth}%` }}
            >
              {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
