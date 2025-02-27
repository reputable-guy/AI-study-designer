import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { generateClaimSuggestions } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTestMode } from "@/lib/TestModeContext";
import { getFallbackClaims } from "@/lib/errorHandling";

interface ClaimSuggestion {
  id?: number;
  studyId?: number | null; // Allow null study ID for fallback claims
  claim: string;
  measurability: string;
  priorEvidence: string;
  participantBurden: string;
  wearableCompatible: boolean;
  consumerRelatable: boolean;
  selected?: boolean;
}

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
  const { isTestMode } = useTestMode();
  
  useEffect(() => {
    const fetchSuggestedClaims = async () => {
      setIsLoading(true);
      try {
        // Use fallback data when test mode is enabled
        if (isTestMode) {
          console.log("Test mode enabled, using fallback claims data");
          const fallbackClaims = getFallbackClaims(studyId || 0);
          setSuggestedClaims(fallbackClaims);
          console.log("Successfully set claims:", fallbackClaims);
          setIsLoading(false);
          return;
        }

        // First check if the studyId is valid before proceeding
        if (!studyId || isNaN(studyId)) {
          console.warn("Missing or invalid study ID, using fallback data only");
          // Use fallback data when studyId is invalid
          const fallbackClaims = [
            {
              id: -1,
              studyId: null, // No valid study ID
              claim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
              measurability: "Easily measurable",
              priorEvidence: "Prior evidence exists",
              participantBurden: "Low",
              wearableCompatible: true,
              consumerRelatable: true
            },
            {
              id: -2,
              studyId: null, // No valid study ID
              claim: "Magnesium supplementation (300mg daily) improves sleep quality as measured by PSQI score improvement of 2+ points",
              measurability: "Moderate",
              priorEvidence: "Strong previous evidence",
              participantBurden: "Higher",
              wearableCompatible: false,
              consumerRelatable: true
            },
            {
              id: -3,
              studyId: null, // No valid study ID
              claim: "Regular magnesium supplementation reduces nighttime awakenings by 30% and decreases time to fall asleep by 10+ minutes",
              measurability: "Moderate",
              priorEvidence: "Limited previous studies",
              participantBurden: "Low",
              wearableCompatible: true,
              consumerRelatable: true
            }
          ];
          setSuggestedClaims(fallbackClaims);
          setIsLoading(false);
          return;
        }
        
        // First try to get suggested claims from the API
        const response = await fetch(`/api/suggested-claims/study/${studyId}`);
        
        if (response.ok) {
          const claims = await response.json();
          
          if (claims && claims.length > 0) {
            setSuggestedClaims(claims);
            // If there's a selected claim, set it
            const selectedClaim = claims.find((c: ClaimSuggestion) => c.selected);
            if (selectedClaim) {
              setSelectedClaimId(selectedClaim.id?.toString() || "");
            }
            setIsLoading(false);
            return;
          }
        }
        
        // If no claims found, generate new ones
        const generatedClaims = await generateClaimSuggestions(
          originalClaim,
          websiteUrl,
          ingredients
        );
        
        // Create a new array to hold all claims with IDs
        const newClaimsWithIds = [];
        
        // Save the generated claims to the backend if we have a valid studyId
        if (studyId) {
          for (const claim of generatedClaims) {
            try {
              const savedClaim = await apiRequest("POST", "/api/suggested-claims", {
                studyId,
                ...claim
              });
              
              const claimWithId = await savedClaim.json();
              newClaimsWithIds.push(claimWithId);
            } catch (claimError) {
              console.error("Error saving individual claim:", claimError);
            }
          }
          
          setSuggestedClaims(newClaimsWithIds);
        } else {
          // If no studyId, just use the generated claims with temporary IDs
          const claimsWithTempIds = generatedClaims.map((claim, index) => ({
            ...claim,
            id: -(index + 1), // Use negative IDs for client-side only data
            studyId: null
          }));
          setSuggestedClaims(claimsWithTempIds);
        }
      } catch (error) {
        console.error("Error fetching claim suggestions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch claim suggestions. Using fallback data.",
          variant: "destructive",
        });
        
        // Fallback claims if API fails
        setSuggestedClaims([
          {
            id: -1,
            studyId,
            claim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
            measurability: "Easily measurable",
            priorEvidence: "Prior evidence exists",
            participantBurden: "Low",
            wearableCompatible: true,
            consumerRelatable: true
          },
          {
            id: -2,
            studyId,
            claim: "Magnesium supplementation (300mg daily) improves sleep quality as measured by PSQI score improvement of 2+ points",
            measurability: "Moderate",
            priorEvidence: "Strong previous evidence",
            participantBurden: "Higher",
            wearableCompatible: false,
            consumerRelatable: true
          },
          {
            id: -3,
            studyId,
            claim: "Regular magnesium supplementation reduces nighttime awakenings by 30% and decreases time to fall asleep by 10+ minutes",
            measurability: "Moderate",
            priorEvidence: "Limited previous studies",
            participantBurden: "Low",
            wearableCompatible: true,
            consumerRelatable: true
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestedClaims();
  }, [studyId, originalClaim, websiteUrl, ingredients, toast, isTestMode]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log("Starting claim selection process");
      
      // First check if user has selected a claim or provided a custom one
      if (!selectedClaimId && (!customClaim || !customClaim.trim())) {
        toast({
          title: "Selection Required",
          description: "Please select a claim or write your own.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Handle custom claim
      if (selectedClaimId === "custom") {
        if (!customClaim.trim()) {
          toast({
            title: "Error",
            description: "Please enter a custom claim.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        console.log("Using custom claim:", customClaim);
        
        // If we have a valid study ID, update it in the backend
        if (studyId && !isNaN(studyId)) {
          try {
            await apiRequest("PATCH", `/api/studies/${studyId}`, {
              refinedClaim: customClaim,
              currentStep: 3 // Move to next step
            });
            console.log("Successfully updated study with custom claim");
          } catch (updateError) {
            console.warn("Failed to update study with custom claim:", updateError);
            // Continue even if update fails
          }
        }
        
        // Move to next step with the custom claim
        onNext(customClaim);
        return;
      }
      
      // Handle selected claim from suggestions
      if (selectedClaimId) {
        console.log(`Selected claim ID: ${selectedClaimId}`);
        
        // Find the claim in our local state first as a fallback
        const selectedClaimObject = suggestedClaims.find(
          (c: ClaimSuggestion) => c.id?.toString() === selectedClaimId
        );
        
        if (!selectedClaimObject) {
          console.error("Selected claim not found in local state");
          toast({
            title: "Error",
            description: "Selected claim not found. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Store the claim text for use later
        const claimText = selectedClaimObject.claim;
        console.log("Found claim in local state:", claimText);
        
        // If we have a valid study ID, try to update the backend
        if (studyId && !isNaN(studyId)) {
          try {
            // For negative IDs (fallback data), we need a different approach
            if (parseInt(selectedClaimId) < 0) {
              console.log("Using fallback claim with negative ID");
              // Just update the study with the claim text
              await apiRequest("PATCH", `/api/studies/${studyId}`, {
                refinedClaim: claimText,
                currentStep: 3 // Move to next step
              });
            } else {
              // For regular IDs, use the selection endpoint
              console.log("Using regular claim selection endpoint");
              try {
                const response = await apiRequest(
                  "POST", 
                  `/api/suggested-claims/${selectedClaimId}/select`,
                  {}
                );
                
                // Check if the response has the expected shape
                const apiClaim = await response.json();
                
                if (!apiClaim || !apiClaim.claim) {
                  console.warn("Invalid response from claim selection API:", apiClaim);
                  // Fall back to updating the study directly
                  await apiRequest("PATCH", `/api/studies/${studyId}`, {
                    refinedClaim: claimText,
                    currentStep: 3 // Move to next step
                  });
                }
              } catch (selectionError) {
                console.error("Error selecting claim through API:", selectionError);
                // Fall back to updating the study directly
                await apiRequest("PATCH", `/api/studies/${studyId}`, {
                  refinedClaim: claimText,
                  currentStep: 3 // Move to next step
                });
              }
            }
          } catch (allUpdateError) {
            console.error("All update attempts failed:", allUpdateError);
            // Continue with the frontend flow even if all backend updates fail
          }
        }
        
        // Move to next step with the selected claim text
        // This ensures we continue even if backend operations fail
        console.log("Moving to next step with claim:", claimText);
        onNext(claimText);
        return;
      }
      
      // If we get here, something unexpected happened
      toast({
        title: "Error",
        description: "Please select a claim or write your own.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    } catch (error) {
      // Catch-all error handler for any unexpected issues
      console.error("Unexpected error in claim selection process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    } finally {
      // Always clean up loading state
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
      <span className="text-xs text-neutral-600">{text}</span>
    </div>
  );
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold">Refined Testable Claim</h2>
          <p className="text-neutral-500">Based on your input, we've created a scientifically testable version of your claim.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium text-white px-2 py-1 rounded-full">AI-Generated</span>
        </div>
      </div>

      {/* Original claim */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-500 mb-2">Your original input:</h3>
        <p className="text-neutral-700">{originalClaim}</p>
      </div>

      {/* AI-generated claim suggestion */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">AI-Refined Claim:</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {suggestedClaims.length > 0 && (
              <div className="ai-suggestion p-4 bg-white border border-neutral-100 rounded-lg shadow-sm">
                <div className="flex-grow">
                  <div className="block font-medium text-neutral-800 mb-3">
                    {suggestedClaims[0].claim}
                  </div>
                  
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <FeatureCheck 
                      text={`Measurability: ${suggestedClaims[0].measurability.length > 30 ? 
                        suggestedClaims[0].measurability.substring(0, 30) + '...' : 
                        suggestedClaims[0].measurability}`} 
                    />
                    <FeatureCheck 
                      text={`Prior Evidence: ${suggestedClaims[0].priorEvidence.length > 30 ? 
                        suggestedClaims[0].priorEvidence.substring(0, 30) + '...' : 
                        suggestedClaims[0].priorEvidence}`} 
                    />
                    {suggestedClaims[0].wearableCompatible ? (
                      <FeatureCheck text="Wearable compatible" isPositive={true} />
                    ) : (
                      <FeatureCheck text={`Burden: ${suggestedClaims[0].participantBurden}`} isPositive={false} />
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="default" 
                onClick={() => {
                  if (suggestedClaims.length > 0) {
                    setSelectedClaimId(suggestedClaims[0].id?.toString() || "");
                    setCustomClaim("");
                  }
                }}
                className="font-medium"
              >
                Use This Claim
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedClaimId("custom");
                  if (suggestedClaims.length > 0) {
                    setCustomClaim(suggestedClaims[0].claim);
                  }
                }}
                className="font-medium"
              >
                Edit This Claim
              </Button>
            </div>
            
            {/* Custom claim input */}
            {selectedClaimId === "custom" && (
              <div className="mt-4 p-4 bg-white border border-neutral-100 rounded-lg shadow-sm">
                <Label 
                  htmlFor="customClaimText"
                  className="block font-medium text-neutral-800 mb-2"
                >
                  Edit your claim:
                </Label>
                <Textarea
                  id="customClaimText"
                  rows={3}
                  value={customClaim}
                  onChange={(e) => setCustomClaim(e.target.value)}
                  placeholder="Describe a specific, measurable claim to test..."
                  className="w-full"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Your claim should be specific and measurable, without predicting exact percentages or numerical outcomes.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI assistant chat bubble */}
      <div className="mt-8 flex items-start">
        <div className="flex-shrink-0 mr-3 mt-1">
          <div className="w-8 h-8 rounded-full ai-badge bubble-pulse flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="p-3 bg-neutral-50 rounded-lg max-w-lg shadow-sm">
          <p className="text-sm text-neutral-700">
            <span className="font-medium">AI Research Assistant:</span> This refined claim has been carefully structured to be scientifically testable. It focuses on what will be measured without predicting specific numerical outcomes, making it more appropriate for rigorous research.
          </p>
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
          disabled={isSubmitting || !selectedClaimId || (selectedClaimId === "custom" && !customClaim.trim())}
        >
          {isSubmitting ? "Processing..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
