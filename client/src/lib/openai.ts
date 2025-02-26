import { ClaimSuggestion } from "./claimService";

// Functions for OpenAI API interactions

/**
 * Generate claim suggestions using OpenAI
 * @param originalClaim The original claim provided by the user
 * @param websiteUrl Optional website URL for additional context
 * @param ingredients Optional ingredients list
 */
export async function generateClaimSuggestions(
  originalClaim: string,
  websiteUrl?: string,
  ingredients?: string
): Promise<ClaimSuggestion[]> {
  try {
    // This will be processed by the backend API proxy
    const response = await fetch("/api/suggested-claims/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalClaim,
        websiteUrl,
        ingredients,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to generate claim suggestions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating claim suggestions:", error);
    throw error;
  }
}

/**
 * Perform literature review using OpenAI
 * @param claim The selected claim to research
 */
export async function performLiteratureReview(claim: string): Promise<any> {
  try {
    const response = await fetch("/api/literature-review/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to perform literature review");
    }

    return await response.json();
  } catch (error) {
    console.error("Error performing literature review:", error);
    throw error;
  }
}

/**
 * Recommend outcome measures using OpenAI
 * @param claim The selected claim for which to generate outcome measures
 */
export async function recommendOutcomeMeasures(claim: string): Promise<any> {
  try {
    const response = await fetch("/api/outcome-measures/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to recommend outcome measures");
    }

    return await response.json();
  } catch (error) {
    console.error("Error recommending outcome measures:", error);
    throw error;
  }
}

/**
 * Recommend study design using OpenAI
 * @param claim The selected claim
 * @param outcomeMeasures The selected outcome measures
 */
export async function recommendStudyDesign(
  claim: string,
  outcomeMeasures: any[]
): Promise<any> {
  try {
    const response = await fetch("/api/study-design/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claim, outcomeMeasures }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to recommend study design");
    }

    return await response.json();
  } catch (error) {
    console.error("Error recommending study design:", error);
    throw error;
  }
}

/**
 * Generate study protocol using OpenAI
 * @param studyId The ID of the study
 * @param claim The selected claim
 * @param studyDesign The selected study design
 * @param outcomeMeasures The selected outcome measures
 */
export async function generateProtocol(
  studyId: number,
  claim: string,
  studyDesign: any,
  outcomeMeasures: any[]
): Promise<any> {
  try {
    const response = await fetch(`/api/studies/${studyId}/generate-protocol`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claim, studyDesign, outcomeMeasures }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to generate protocol");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating protocol:", error);
    throw error;
  }
}

/**
 * Assess regulatory considerations using OpenAI
 * @param claim The selected claim
 */
export async function assessRegulatory(claim: string): Promise<any> {
  try {
    const response = await fetch("/api/regulatory/assess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to assess regulatory considerations");
    }

    return await response.json();
  } catch (error) {
    console.error("Error assessing regulatory considerations:", error);
    throw error;
  }
}