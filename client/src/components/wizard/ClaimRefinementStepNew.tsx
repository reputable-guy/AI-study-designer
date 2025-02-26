import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Info, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClaimSuggestion } from "@/lib/types";
import { withErrorHandling, getFallbackClaims } from "@/lib/errorHandling";
import { getClaimSuggestions, selectClaimSuggestion, saveCustomClaim } from "@/lib/apiHelpers";

interface ClaimRefinementStepProps {
  studyId: number;
  originalClaim: string;
  websiteUrl?: string;
  ingredients?: string;
  onNext: (refinedClaim: string) => void;
  onBack: () => void;
}

export default function ClaimRefinementStep({
  studyId,
  originalClaim,
  websiteUrl,
  ingredients,
  onNext,
  onBack
}: ClaimRefinementStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedClaims, setSuggestedClaims] = useState<ClaimSuggestion[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [customClaim, setCustomClaim] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Fetch claim suggestions on component mount
  useEffect(() => {
    const fetchSuggestedClaims = async () => {
      setIsLoading(true);
      console.log("Fetching claim suggestions, studyId:", studyId);
      
      try {
        // Use withErrorHandling for consistent error handling and fallbacks
        const claims = await withErrorHandling(
          // API call
          async () => await getClaimSuggestions(studyId, originalClaim, websiteUrl, ingredients),
          // Fallback data
          getFallbackClaims(studyId),
          // Error message
          "Failed to fetch claim suggestions. Using fallback options instead."
        );
        
        setSuggestedClaims(claims);
        console.log("Successfully set claims:", claims);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestedClaims();
  }, [studyId, originalClaim, websiteUrl, ingredients, toast]);
  
  const handleSubmit = async () => {
    // Validation
    if (!selectedClaimId) {
      toast({
        title: "Required",
        description: "Please select a claim or write your own.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedClaimId === "custom" && !customClaim.trim()) {
      toast({
        title: "Required",
        description: "Please enter a custom claim.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Handle custom claim submission
      if (selectedClaimId === "custom") {
        // Use withErrorHandling for consistent error handling
        await withErrorHandling(
          async () => await saveCustomClaim(studyId, customClaim),
          true, // Fallback value
          "Failed to save custom claim. Proceeding anyway."
        );
        
        // Continue to next step
        onNext(customClaim);
        return;
      }
      
      // Handle selected claim submission
      const selectedClaim = suggestedClaims.find(
        claim => claim.id?.toString() === selectedClaimId
      );
      
      if (!selectedClaim) {
        throw new Error("Selected claim not found");
      }
      
      // For negative IDs (fallback data), we don't need to call the API
      if (typeof selectedClaim.id === 'number' && selectedClaim.id < 0) {
        // Just update the study with the selected claim text
        await withErrorHandling(
          async () => {
            await fetch(`/api/studies/${studyId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                refinedClaim: selectedClaim.claim,
                currentStep: 3 // Move to next step
              })
            });
            return true;
          },
          true, // Fallback value
          "Failed to update study with selected claim. Proceeding anyway."
        );
        
        // Continue to next step
        onNext(selectedClaim.claim);
        return;
      }
      
      // For real claim IDs, use the selectClaimSuggestion helper
      const result = await withErrorHandling(
        async () => await selectClaimSuggestion(studyId, selectedClaimId),
        { ...selectedClaim, selected: true }, // Fallback - use the local claim data
        "Failed to select claim in the backend. Proceeding anyway."
      );
      
      // Continue to next step with the selected claim
      onNext(result.claim);
    } catch (error) {
      console.error("Error submitting claim choice:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const FeatureCheck = ({ text, isPositive = true }: { text: string; isPositive?: boolean }) => (
    <div className="flex items-center">
      {isPositive ? (
        <Check className="h-4 w-4 text-green-500 mr-1" />
      ) : (
        <Info className="h-4 w-4 text-amber-500 mr-1" />
      )}
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-foreground">Refine your claim</h2>
          <p className="text-muted-foreground">Based on your input, we've identified potential scientific claims you can test.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium px-2 py-1 rounded-full">AI-Generated</span>
        </div>
      </div>

      {/* Original claim */}
      <div className="mb-6 p-4 bg-card rounded-lg border border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Your original input:</h3>
        <p className="text-foreground">{originalClaim}</p>
      </div>

      {/* AI-generated claim suggestions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Select a refined claim to test:</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm animate-pulse">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selectedClaimId || ""} onValueChange={setSelectedClaimId}>
            <div className="space-y-4">
              {suggestedClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  className="ai-suggestion p-4 bg-white border border-neutral-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedClaimId(claim.id?.toString() || "")}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <RadioGroupItem value={claim.id?.toString() || ""} id={`claim-${claim.id}`} />
                    </div>
                    <div className="flex-grow">
                      <Label 
                        htmlFor={`claim-${claim.id}`}
                        className="block font-medium text-neutral-800 cursor-pointer"
                      >
                        {claim.claim}
                      </Label>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <FeatureCheck 
                          text={claim.measurability} 
                          isPositive={claim.measurability.includes("High") || claim.measurability.includes("Easily")} 
                        />
                        <FeatureCheck 
                          text={claim.priorEvidence} 
                          isPositive={claim.priorEvidence.includes("exists") || claim.priorEvidence.includes("Strong")} 
                        />
                        {claim.wearableCompatible ? (
                          <FeatureCheck text="Wearable compatible" isPositive={true} />
                        ) : (
                          <FeatureCheck text={claim.participantBurden} isPositive={claim.participantBurden === "Low"} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Custom claim option */}
              <div 
                className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedClaimId("custom")}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <RadioGroupItem value="custom" id="customClaim" />
                  </div>
                  <div className="flex-grow">
                    <Label 
                      htmlFor="customClaim"
                      className="block font-medium text-neutral-800 cursor-pointer"
                    >
                      Write your own claim
                    </Label>
                    
                    {selectedClaimId === "custom" && (
                      <Textarea
                        className="mt-2"
                        placeholder="Enter your custom claim here..."
                        value={customClaim}
                        onChange={(e) => setCustomClaim(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
        )}
      </div>
      
      {/* Claim crafting tips */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0 mr-2">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Claim Crafting Tips</h4>
            <p className="text-sm text-blue-700 mt-1">
              The best scientific claims are specific, measurable, and have a reasonable basis in existing research. 
              Claims that can be measured with wearable devices generally reduce participant burden and increase data quality.
            </p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
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
          disabled={isSubmitting || !selectedClaimId}
        >
          {isSubmitting ? "Processing..." : "Continue to Literature Review"}
        </Button>
      </div>
    </div>
  );
}