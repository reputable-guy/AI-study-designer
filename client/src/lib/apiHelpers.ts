/**
 * API Helper Utilities for consistent API interactions
 */

import { apiRequest } from "@/lib/queryClient";
import { handleApiError, withErrorHandling } from "./errorHandling";
import { ClaimSuggestion } from "./types";

/**
 * Generate claim suggestions by calling the backend endpoint
 * 
 * @param studyId The ID of the study
 * @param originalClaim The original claim text
 * @param websiteUrl Optional website URL for additional context
 * @param ingredients Optional ingredients for additional context
 * @returns Promise containing an array of claim suggestions
 */
export async function getClaimSuggestions(
  studyId: number,
  originalClaim: string,
  websiteUrl?: string,
  ingredients?: string
): Promise<ClaimSuggestion[]> {
  try {
    console.log(`Fetching claim suggestions for study ${studyId}`);
    
    // First try to get existing claims from the API
    const response = await fetch(`/api/suggested-claims/study/${studyId}`);
    
    if (response.ok) {
      const claims = await response.json();
      
      if (claims && claims.length > 0) {
        console.log(`Found ${claims.length} existing claim suggestions`);
        return claims.map((claim: ClaimSuggestion) => ({
          ...claim,
          selected: false // Reset selected state for consistency
        }));
      }
    }
    
    // If no claims found, generate and save new ones
    console.log("No existing claims found, generating new ones");
    const generationResponse = await fetch(`/api/suggested-claims/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studyId,
        originalClaim,
        websiteUrl,
        ingredients
      })
    });
    
    if (!generationResponse.ok) {
      throw new Error(`Failed to generate claims: ${generationResponse.status}`);
    }
    
    const generatedClaims = await generationResponse.json();
    console.log(`Generated ${generatedClaims.length} new claim suggestions`);
    
    // Save the generated claims if we have a valid study ID
    const savedClaims = [];
    
    for (const claim of generatedClaims) {
      try {
        const savedClaimResponse = await apiRequest("POST", "/api/suggested-claims", {
          studyId,
          ...claim
        });
        
        const savedClaim = await savedClaimResponse.json();
        savedClaims.push(savedClaim);
      } catch (claimError) {
        console.error("Error saving individual claim:", claimError);
      }
    }
    
    if (savedClaims.length > 0) {
      console.log(`Successfully saved ${savedClaims.length} claims`);
      return savedClaims;
    }
    
    // If we couldn't save claims to the backend, return the generated ones with temporary IDs
    console.log("Returning generated claims with temporary IDs");
    return generatedClaims.map((claim: any, index: number) => ({
      ...claim,
      id: -(index + 1), // Use negative IDs for client-side only data
      studyId
    }));
  } catch (error) {
    console.error("Error in getClaimSuggestions:", error);
    throw error;
  }
}

/**
 * Select a specific claim suggestion
 * 
 * @param studyId The study ID
 * @param claimId The ID of the claim to select
 * @returns Promise containing the selected claim
 */
export async function selectClaimSuggestion(
  studyId: number,
  claimId: string | number
): Promise<ClaimSuggestion> {
  try {
    console.log(`Selecting claim ${claimId} for study ${studyId}`);
    
    // If we have a negative ID (fallback data), handle it differently
    if (typeof claimId === 'string' && parseInt(claimId) < 0 || 
        typeof claimId === 'number' && claimId < 0) {
      
      console.log("Using fallback claim selection flow");
      // Update the study with the claim text
      // We would need to get the claim text from state in the component
      // and update it there
      return {
        id: Number(claimId),
        studyId,
        claim: "Fallback claim text - replace with actual claim text from component state",
        measurability: "Unknown",
        priorEvidence: "Unknown",
        participantBurden: "Unknown",
        wearableCompatible: false,
        consumerRelatable: false,
        selected: true
      };
    }
    
    // For regular claim IDs, use the selection endpoint
    const response = await apiRequest(
      "POST", 
      `/api/suggested-claims/${claimId}/select`,
      {}
    );
    
    const selectedClaim = await response.json();
    console.log("Successfully selected claim:", selectedClaim);
    return selectedClaim;
  } catch (error) {
    console.error("Error in selectClaimSuggestion:", error);
    throw error;
  }
}

/**
 * Save a custom claim for a study
 * 
 * @param studyId The study ID
 * @param customClaim The custom claim text
 * @returns Promise indicating success
 */
export async function saveCustomClaim(
  studyId: number,
  customClaim: string
): Promise<boolean> {
  try {
    console.log(`Saving custom claim for study ${studyId}`);
    
    // Update study with custom claim
    await apiRequest("PATCH", `/api/studies/${studyId}`, {
      refinedClaim: customClaim,
      currentStep: 3 // Move to next step
    });
    
    console.log("Successfully saved custom claim");
    return true;
  } catch (error) {
    console.error("Error in saveCustomClaim:", error);
    throw error;
  }
}