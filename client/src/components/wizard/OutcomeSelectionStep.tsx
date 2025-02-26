import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { recommendOutcomeMeasures } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Check, Info, AlertTriangle } from "lucide-react";
import { OutcomeMeasure } from "@/lib/types";
import { withErrorHandling, getFallbackOutcomeMeasures } from "@/lib/errorHandling";
import { useTestMode } from "@/lib/TestModeContext";

interface OutcomeSelectionStepProps {
  studyId: number;
  refinedClaim: string;
  onNext: () => void;
  onBack: () => void;
}

export default function OutcomeSelectionStep({
  studyId,
  refinedClaim,
  onNext,
  onBack
}: OutcomeSelectionStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [outcomeMeasures, setOutcomeMeasures] = useState<OutcomeMeasure[]>([]);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isTestMode } = useTestMode();
  
  useEffect(() => {
    const fetchOutcomeMeasures = async () => {
      setIsLoading(true);
      try {
        // If test mode is enabled, use fallback data immediately
        if (isTestMode) {
          console.log("Test mode enabled, using fallback outcome measures data");
          const fallbackMeasures = getFallbackOutcomeMeasures(studyId);
          setOutcomeMeasures(fallbackMeasures);
          setIsLoading(false);
          return;
        }
        
        // First try to get outcome measures from the API
        const response = await fetch(`/api/outcome-measures/study/${studyId}`);
        
        if (response.ok) {
          const measures = await response.json();
          
          if (measures && measures.length > 0) {
            // Make sure measures are not pre-selected
            const cleanedMeasures = measures.map((m: OutcomeMeasure) => ({
              ...m,
              selected: false // Reset selection status
            }));
            
            setOutcomeMeasures(cleanedMeasures);
            setIsLoading(false);
            return;
          }
        }
        
        // If no measures found, generate new ones through our error-handling utility
        const measures = await withErrorHandling(
          // API call
          async () => {
            const recommendedMeasures = await recommendOutcomeMeasures(refinedClaim);
            return recommendedMeasures.map((m: OutcomeMeasure) => ({
              ...m,
              selected: false
            }));
          },
          // Fallback data
          getFallbackOutcomeMeasures(studyId),
          // Error message
          "Failed to generate outcome measures. Using fallback options instead."
        );
        
        setOutcomeMeasures(measures);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOutcomeMeasures();
  }, [studyId, refinedClaim, toast, isTestMode]);
  
  const handleSubmit = async () => {
    if (!selectedMeasureId) {
      toast({
        title: "Required",
        description: "Please select an outcome measure before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // In test mode, skip the API call
      if (isTestMode) {
        console.log("Test mode enabled, skipping API call for outcome measure selection");
        // Simulate a brief delay for better user experience
        await new Promise(resolve => setTimeout(resolve, 300));
        onNext();
        return;
      }
      
      // Use the error handling utility to make the API call in regular mode
      const success = await withErrorHandling(
        async () => {
          const response = await fetch(`/api/outcome-measures/${selectedMeasureId}/select`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          return true;
        },
        false, // Fallback value if API fails
        "Failed to save your selection. Proceeding anyway."
      );
      
      // Even if the API call fails, we can still proceed
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const OutcomeIcon = ({ type }: { type: string }) => {
    if (type === "High" || type === "Accepted" || type === "Low") {
      return <Check className="h-4 w-4 text-green-500 mr-1" />;
    }
    if (type === "Medium" || type === "Moderately accepted") {
      return <Info className="h-4 w-4 text-amber-500 mr-1" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />;
  };
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-foreground">Select Outcome Measures</h2>
          <p className="text-muted-foreground">Choose how you'll measure the effectiveness of your product.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium px-2 py-1 rounded-full">AI-Recommended</span>
        </div>
      </div>

      {/* Selected claim display */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Your selected claim:</h3>
        <p className="text-foreground font-medium">{refinedClaim}</p>
      </div>

      {/* Outcome measures selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Choose a primary outcome measure:</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-lg shadow-sm animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selectedMeasureId || ""} onValueChange={setSelectedMeasureId}>
            <div className="space-y-4">
              {outcomeMeasures.map((measure) => (
                <div 
                  key={measure.id}
                  className={`card-reputable ${measure.wearableCompatible ? 'border-l-green-500 border-l-4' : ''} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setSelectedMeasureId(measure.id?.toString() || "")}
                >
                  <div className="p-4">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <RadioGroupItem 
                          value={measure.id?.toString() || ""} 
                          id={`measure-${measure.id}`} 
                        />
                      </div>
                      <div className="flex-grow">
                        <Label 
                          htmlFor={`measure-${measure.id}`}
                          className="text-base font-medium text-foreground cursor-pointer"
                        >
                          {measure.name}
                        </Label>
                        
                        <p className="text-sm text-muted-foreground mt-1 mb-3">{measure.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="flex items-center">
                            <OutcomeIcon type={measure.feasibility} />
                            <span className="text-xs text-muted-foreground">Feasibility: {measure.feasibility}</span>
                          </div>
                          <div className="flex items-center">
                            <OutcomeIcon type={measure.regulatoryAcceptance} />
                            <span className="text-xs text-muted-foreground">{measure.regulatoryAcceptance}</span>
                          </div>
                          <div className="flex items-center">
                            {measure.wearableCompatible ? (
                              <>
                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-xs text-muted-foreground">Wearable compatible</span>
                              </>
                            ) : (
                              <>
                                <Info className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs text-muted-foreground">Participant burden: {measure.participantBurden}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
      
      {/* Measurement methodology note */}
      <div className="mb-6 p-4 bg-muted/30 border border-border rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0 mr-2">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Measurement Best Practices</h4>
            <p className="text-sm text-muted-foreground mt-1">
              The recommended measures are prioritized based on scientific validity, regulatory acceptance, and participant burden. Wearable-compatible measures (highlighted in green) generally provide more objective data and reduce participant burden.
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button 
          className="btn-outline-reputable px-4 py-2 rounded"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>
        <button 
          className="btn-reputable px-4 py-2 rounded"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedMeasureId}
        >
          {isSubmitting ? "Processing..." : "Continue to Study Design"}
        </button>
      </div>
    </div>
  );
}
