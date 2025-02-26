import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { recommendOutcomeMeasures } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Check, Info, AlertTriangle } from "lucide-react";

interface OutcomeMeasure {
  id?: number;
  studyId?: number;
  name: string;
  description: string;
  feasibility: string;
  regulatoryAcceptance: string;
  participantBurden: string;
  wearableCompatible: boolean;
  selected?: boolean;
}

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
  
  useEffect(() => {
    const fetchOutcomeMeasures = async () => {
      setIsLoading(true);
      try {
        // First try to get outcome measures from the API
        const response = await fetch(`/api/outcome-measures/study/${studyId}`);
        
        if (response.ok) {
          const measures = await response.json();
          
          if (measures && measures.length > 0) {
            setOutcomeMeasures(measures);
            
            // If there's a selected measure, set it
            const selectedMeasure = measures.find(m => m.selected);
            if (selectedMeasure) {
              setSelectedMeasureId(selectedMeasure.id.toString());
            }
            
            setIsLoading(false);
            return;
          }
        }
        
        // If no measures found, recommend new ones
        const recommendedMeasures = await recommendOutcomeMeasures(refinedClaim);
        setOutcomeMeasures(recommendedMeasures);
      } catch (error) {
        console.error("Error fetching outcome measures:", error);
        toast({
          title: "Error",
          description: "Failed to fetch outcome measures. Using fallback data.",
          variant: "destructive",
        });
        
        // Fallback data
        const fallbackMeasures = [
          {
            id: 1,
            studyId: 1,
            name: "REM Sleep Duration",
            description: "Percentage of time spent in REM sleep per night",
            feasibility: "High",
            regulatoryAcceptance: "Accepted",
            participantBurden: "Low",
            wearableCompatible: true
          },
          {
            id: 2,
            studyId: 1,
            name: "Pittsburgh Sleep Quality Index (PSQI)",
            description: "Validated questionnaire measuring sleep quality",
            feasibility: "Medium",
            regulatoryAcceptance: "Widely accepted",
            participantBurden: "Medium",
            wearableCompatible: false
          },
          {
            id: 3,
            studyId: 1,
            name: "Sleep Onset Latency",
            description: "Time to fall asleep after going to bed",
            feasibility: "High",
            regulatoryAcceptance: "Accepted",
            participantBurden: "Low",
            wearableCompatible: true
          }
        ];
        
        setOutcomeMeasures(fallbackMeasures);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOutcomeMeasures();
  }, [studyId, refinedClaim, toast]);
  
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
      // Select the outcome measure in the backend
      await fetch(`/api/outcome-measures/${selectedMeasureId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      onNext();
    } catch (error) {
      console.error("Error selecting outcome measure:", error);
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
        variant: "destructive",
      });
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
          <h2 className="text-xl font-semibold">Select Outcome Measures</h2>
          <p className="text-neutral-500">Choose how you'll measure the effectiveness of your product.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium text-white px-2 py-1 rounded-full">AI-Recommended</span>
        </div>
      </div>

      {/* Selected claim display */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-500 mb-2">Your selected claim:</h3>
        <p className="text-neutral-800 font-medium">{refinedClaim}</p>
      </div>

      {/* Outcome measures selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Choose a primary outcome measure:</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm animate-pulse">
                <div className="h-6 bg-neutral-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="h-4 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selectedMeasureId || ""} onValueChange={setSelectedMeasureId}>
            <div className="space-y-4">
              {outcomeMeasures.map((measure) => (
                <Card 
                  key={measure.id}
                  className={`border ${measure.wearableCompatible ? 'border-l-green-500 border-l-4' : ''} hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setSelectedMeasureId(measure.id?.toString() || "")}
                >
                  <CardContent className="p-4">
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
                          className="text-base font-medium text-neutral-800 cursor-pointer"
                        >
                          {measure.name}
                        </Label>
                        
                        <p className="text-sm text-neutral-600 mt-1 mb-3">{measure.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="flex items-center">
                            <OutcomeIcon type={measure.feasibility} />
                            <span className="text-xs text-neutral-600">Feasibility: {measure.feasibility}</span>
                          </div>
                          <div className="flex items-center">
                            <OutcomeIcon type={measure.regulatoryAcceptance} />
                            <span className="text-xs text-neutral-600">{measure.regulatoryAcceptance}</span>
                          </div>
                          <div className="flex items-center">
                            {measure.wearableCompatible ? (
                              <>
                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-xs text-neutral-600">Wearable compatible</span>
                              </>
                            ) : (
                              <>
                                <Info className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-xs text-neutral-600">Participant burden: {measure.participantBurden}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
      
      {/* Measurement methodology note */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0 mr-2">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Measurement Best Practices</h4>
            <p className="text-sm text-blue-700 mt-1">
              The recommended measures are prioritized based on scientific validity, regulatory acceptance, and participant burden. Wearable-compatible measures (highlighted in green) generally provide more objective data and reduce participant burden.
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedMeasureId}
        >
          {isSubmitting ? "Processing..." : "Continue to Study Design"}
        </Button>
      </div>
    </div>
  );
}
