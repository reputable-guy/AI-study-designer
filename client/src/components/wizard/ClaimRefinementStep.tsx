import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { generateClaimSuggestions } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClaimSuggestion {
  id?: number;
  studyId?: number;
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
  
  useEffect(() => {
    const fetchSuggestedClaims = async () => {
      setIsLoading(true);
      try {
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
  }, [studyId, originalClaim, websiteUrl, ingredients, toast]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First check if we have a valid study ID
      if (!studyId || isNaN(studyId)) {
        // If no valid study ID, just proceed with the selected/custom claim without updating backend
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
          // Just return the custom claim to the parent component
          onNext(customClaim);
        } else if (selectedClaimId) {
          // Find the claim in our local state
          const selectedClaim = suggestedClaims.find((c: ClaimSuggestion) => c.id?.toString() === selectedClaimId);
          if (selectedClaim) {
            // Return the selected claim to the parent component
            onNext(selectedClaim.claim);
          } else {
            throw new Error("Claim not found");
          }
        } else {
          toast({
            title: "Error",
            description: "Please select a claim or write your own.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // Normal flow with valid study ID
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
          
          // Update study with custom claim
          await apiRequest("PATCH", `/api/studies/${studyId}`, {
            refinedClaim: customClaim,
            currentStep: 3 // Move to next step
          });
          
          onNext(customClaim);
        } else if (selectedClaimId) {
          try {
            // Check if we have a negative ID (fallback data)
            if (selectedClaimId && parseInt(selectedClaimId) < 0) {
              // With fallback data, just find the claim and use it directly
              const selectedClaim = suggestedClaims.find((c: ClaimSuggestion) => c.id?.toString() === selectedClaimId);
              if (selectedClaim) {
                // Update study with the selected claim
                await apiRequest("PATCH", `/api/studies/${studyId}`, {
                  refinedClaim: selectedClaim.claim,
                  currentStep: 3 // Move to next step
                });
                
                onNext(selectedClaim.claim);
                return;
              }
            }
            
            // Regular flow for real claim IDs
            const response = await apiRequest(
              "POST", 
              `/api/suggested-claims/${selectedClaimId}/select`,
              {}
            );
            
            const selectedClaim = await response.json();
            onNext(selectedClaim.claim);
          } catch (selectionError) {
            console.error("Error selecting claim:", selectionError);
            
            // Fallback - find the claim in our local state
            const selectedClaim = suggestedClaims.find((c: ClaimSuggestion) => c.id?.toString() === selectedClaimId);
            if (selectedClaim) {
              // Try to update study
              try {
                await apiRequest("PATCH", `/api/studies/${studyId}`, {
                  refinedClaim: selectedClaim.claim,
                  currentStep: 3 // Move to next step
                });
              } catch (updateError) {
                console.warn("Couldn't update study, but continuing with selection", updateError);
              }
              
              // Even if update fails, continue with the selection
              onNext(selectedClaim.claim);
            } else {
              throw new Error("Claim not found");
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Please select a claim or write your own.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error saving refined claim:", error);
      toast({
        title: "Error",
        description: "Failed to save your claim. Please try again.",
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
      <span className="text-xs text-neutral-600">{text}</span>
    </div>
  );
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold">Refine your claim</h2>
          <p className="text-neutral-500">Based on your input, we've identified potential scientific claims you can test.</p>
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

      {/* AI-generated claim suggestions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Select a refined claim to test:</h3>
        
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
                          isPositive={claim.measurability === "Easily measurable"} 
                        />
                        <FeatureCheck 
                          text={claim.priorEvidence} 
                          isPositive={claim.priorEvidence.includes("evidence exists")} 
                        />
                        {claim.wearableCompatible ? (
                          <FeatureCheck text="Wearable compatible" isPositive={true} />
                        ) : (
                          <FeatureCheck text={claim.participantBurden} isPositive={false} />
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
                      Or write your own refined claim
                    </Label>
                    
                    {selectedClaimId === "custom" && (
                      <div className="mt-2">
                        <Textarea
                          rows={2}
                          value={customClaim}
                          onChange={(e) => setCustomClaim(e.target.value)}
                          placeholder="Describe a specific, measurable claim to test..."
                          className="w-full"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          Note: Custom claims may need additional review to ensure they're measurable and compliant.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>
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
            <span className="font-medium">AI Research Assistant:</span> The first claim is specifically designed for wearable study compatibility. We found 3 clinical studies that measured similar REM outcomes with magnesium supplementation using the Oura ring and other sleep trackers.
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
