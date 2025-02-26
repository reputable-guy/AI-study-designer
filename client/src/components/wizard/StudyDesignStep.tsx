import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { recommendStudyDesign } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Info, Check } from "lucide-react";
import { useTestMode } from "@/lib/TestModeContext";
import { getFallbackStudyDesign } from "@/lib/errorHandling";

interface StudyDesign {
  type: string;
  sampleSize: {
    min: number;
    recommended: number;
    max: number;
  };
  duration: string;
  blindingType: string;
  controlType: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  powerAnalysis: string;
}

interface StudyDesignStepProps {
  studyId: number;
  refinedClaim: string;
  outcomeMeasures: any[]; // This would be the selected outcome measures
  onNext: () => void;
  onBack: () => void;
}

export default function StudyDesignStep({
  studyId,
  refinedClaim,
  outcomeMeasures = [],
  onNext,
  onBack
}: StudyDesignStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [studyDesign, setStudyDesign] = useState<StudyDesign | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchStudyDesign = async () => {
      setIsLoading(true);
      try {
        const design = await recommendStudyDesign(refinedClaim, outcomeMeasures);
        setStudyDesign(design);
        setSampleSize(design.sampleSize.recommended);
      } catch (error) {
        console.error("Error fetching study design recommendations:", error);
        toast({
          title: "Error",
          description: "Failed to fetch study design recommendations. Using default design.",
          variant: "destructive",
        });
        
        // Fallback data
        const fallbackDesign: StudyDesign = {
          type: "Randomized Controlled Trial",
          sampleSize: {
            min: 60,
            recommended: 80,
            max: 120
          },
          duration: "8 weeks",
          blindingType: "Double-blind",
          controlType: "Placebo-controlled",
          inclusionCriteria: [
            "Adults aged 18-65",
            "Self-reported sleep difficulties",
            "No current use of sleep medications"
          ],
          exclusionCriteria: [
            "Diagnosed sleep disorders requiring treatment",
            "Current use of supplements containing magnesium",
            "Pregnancy or breastfeeding"
          ],
          powerAnalysis: "Based on previous studies, a sample size of 80 participants provides 90% power to detect a 15% increase in REM sleep at a significance level of 0.05."
        };
        
        setStudyDesign(fallbackDesign);
        setSampleSize(fallbackDesign.sampleSize.recommended);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudyDesign();
  }, [refinedClaim, outcomeMeasures, toast]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update the study with the design information
      await fetch(`/api/studies/${studyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studyDesign: {
            ...studyDesign,
            sampleSize: {
              ...studyDesign?.sampleSize,
              selected: sampleSize
            }
          },
          currentStep: 6 // Move to protocol generation step
        })
      });
      
      onNext();
    } catch (error) {
      console.error("Error saving study design:", error);
      toast({
        title: "Error",
        description: "Failed to save your study design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !studyDesign) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Study Design</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mb-3"></div>
              <div className="h-24 bg-neutral-200 rounded w-full mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold">Study Design</h2>
          <p className="text-neutral-500">We've designed an optimal study to test your claim.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium text-white px-2 py-1 rounded-full">AI-Optimized</span>
        </div>
      </div>

      {/* Selected claim display */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-500 mb-2">Your selected claim:</h3>
        <p className="text-neutral-800 font-medium">{refinedClaim}</p>
      </div>
      
      <div className="space-y-6">
        {/* Study type */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg text-neutral-800 mb-2">Recommended Study Design</h3>
            <p className="text-neutral-600 mb-4">Based on your claim and selected outcome measures, we recommend:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-3 rounded-md">
                <span className="text-sm text-neutral-500">Study Type:</span>
                <p className="font-medium">{studyDesign.type}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-md">
                <span className="text-sm text-neutral-500">Duration:</span>
                <p className="font-medium">{studyDesign.duration}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-md">
                <span className="text-sm text-neutral-500">Blinding:</span>
                <p className="font-medium">{studyDesign.blindingType}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-md">
                <span className="text-sm text-neutral-500">Control:</span>
                <p className="font-medium">{studyDesign.controlType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sample size */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg text-neutral-800 mb-2">Sample Size</h3>
            <p className="text-sm text-neutral-600 mb-3">{studyDesign.powerAnalysis}</p>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Adjust sample size:</span>
                <span className="text-lg font-bold text-primary">{sampleSize} participants</span>
              </div>
              <Slider
                value={[sampleSize]}
                min={studyDesign.sampleSize.min}
                max={studyDesign.sampleSize.max}
                step={5}
                onValueChange={(value) => setSampleSize(value[0])}
              />
              <div className="flex justify-between mt-1 text-xs text-neutral-500">
                <span>Minimum: {studyDesign.sampleSize.min}</span>
                <span>Recommended: {studyDesign.sampleSize.recommended}</span>
                <span>Maximum: {studyDesign.sampleSize.max}</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-blue-700">
                  A sample size of <strong>{sampleSize}</strong> participants provides approximately 
                  {sampleSize >= studyDesign.sampleSize.recommended ? " 90%" : " 80%"} power to detect 
                  the expected effect. {sampleSize < studyDesign.sampleSize.recommended && 
                  "Consider increasing the sample size for more reliable results."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Inclusion and exclusion criteria */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg text-neutral-800 mb-4">Participant Criteria</h3>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Inclusion Criteria (must meet all):</h4>
              <ul className="space-y-2">
                {studyDesign.inclusionCriteria.map((criterion, index) => (
                  <li key={`inclusion-${index}`} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span className="text-sm">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Exclusion Criteria (must not meet any):</h4>
              <ul className="space-y-2">
                {studyDesign.exclusionCriteria.map((criterion, index) => (
                  <li key={`exclusion-${index}`} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                    <span className="text-sm">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Advanced options (disabled in this version) */}
        <Card className="opacity-60">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg text-neutral-800">Advanced Design Options</h3>
              <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded">Coming Soon</span>
            </div>
            
            <p className="text-sm text-neutral-600 mb-4">These advanced study design options will be available in a future release.</p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox id="crossover" disabled />
                <label htmlFor="crossover" className="ml-2 text-sm text-neutral-500">
                  Crossover design (participants receive both treatment and control)
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox id="multiarm" disabled />
                <label htmlFor="multiarm" className="ml-2 text-sm text-neutral-500">
                  Multi-arm trial (test multiple dosages or formulations)
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox id="adaptive" disabled />
                <label htmlFor="adaptive" className="ml-2 text-sm text-neutral-500">
                  Adaptive design (modify parameters based on interim results)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Generate Protocol"}
        </Button>
      </div>
    </div>
  );
}
