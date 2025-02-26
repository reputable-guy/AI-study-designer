import { apiRequest } from "./queryClient";

// Define types for claim data
export interface ClaimSuggestion {
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

export const ClaimService = {
  // Get claims for a study
  async getClaimsByStudyId(studyId: number | null): Promise<ClaimSuggestion[]> {
    try {
      if (!studyId) {
        throw new Error("Study ID is required to fetch claims");
      }
      
      const response = await fetch(`/api/suggested-claims/study/${studyId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching claims:", error);
      throw error;
    }
  },

  // Generate new claim suggestions
  async generateClaimSuggestions(
    originalClaim: string,
    websiteUrl?: string,
    ingredients?: string
  ): Promise<ClaimSuggestion[]> {
    try {
      const response = await apiRequest("POST", "/api/suggested-claims/generate", {
        originalClaim,
        websiteUrl,
        ingredients
      });
      
      return await response.json();
    } catch (error) {
      console.error("Error generating claim suggestions:", error);
      throw error;
    }
  },

  // Save a claim suggestion to the database
  async saveClaimSuggestion(claim: Partial<ClaimSuggestion>): Promise<ClaimSuggestion> {
    try {
      if (!claim.studyId) {
        throw new Error("Study ID is required to save a claim");
      }
      
      const response = await apiRequest("POST", "/api/suggested-claims", claim);
      return await response.json();
    } catch (error) {
      console.error("Error saving claim suggestion:", error);
      throw error;
    }
  },

  // Select a claim
  async selectClaim(id: number | string): Promise<ClaimSuggestion> {
    try {
      // Handle negative IDs (fallback data)
      if (typeof id === 'string' && parseInt(id) < 0) {
        throw new Error("Cannot select a fallback claim with a negative ID");
      }
      
      const response = await apiRequest("POST", `/api/suggested-claims/${id}/select`, {});
      return await response.json();
    } catch (error) {
      console.error("Error selecting claim:", error);
      throw error;
    }
  },

  // Get fallback claims (used when API fails)
  getFallbackClaims(studyId: number | null): ClaimSuggestion[] {
    return [
      {
        id: -1,
        studyId: studyId || undefined,
        claim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
        measurability: "Easily measurable",
        priorEvidence: "Prior evidence exists",
        participantBurden: "Low",
        wearableCompatible: true,
        consumerRelatable: true
      },
      {
        id: -2,
        studyId: studyId || undefined,
        claim: "Magnesium supplementation (300mg daily) improves sleep quality as measured by PSQI score improvement of 2+ points",
        measurability: "Moderate",
        priorEvidence: "Strong previous evidence",
        participantBurden: "Higher",
        wearableCompatible: false,
        consumerRelatable: true
      },
      {
        id: -3,
        studyId: studyId || undefined,
        claim: "Regular magnesium supplementation reduces nighttime awakenings by 30% and decreases time to fall asleep by 10+ minutes",
        measurability: "Moderate",
        priorEvidence: "Limited previous studies",
        participantBurden: "Low",
        wearableCompatible: true,
        consumerRelatable: true
      }
    ];
  }
};