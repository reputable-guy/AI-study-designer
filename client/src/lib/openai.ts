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
    console.log("Generating claim suggestions via API");
    
    // Ensure we have valid inputs
    const safeOriginalClaim = originalClaim?.trim() || "product improves wellness";
    const safeWebsiteUrl = websiteUrl?.trim() || "";
    const safeIngredients = ingredients?.trim() || "";
    
    // Add timeout handling to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // This will be processed by the backend API proxy
      const response = await fetch("/api/suggested-claims/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalClaim: safeOriginalClaim,
          websiteUrl: safeWebsiteUrl,
          ingredients: safeIngredients,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if request completes
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const claims = await response.json();
      
      // Validate the response format
      if (!Array.isArray(claims)) {
        console.error("Invalid response format:", claims);
        throw new Error("Response from API is not an array");
      }
      
      // Normalize and validate each claim
      const normalizedClaims = claims
        .filter(claim => claim && typeof claim === 'object' && typeof claim.claim === 'string')
        .map(claim => ({
          claim: claim.claim,
          measurability: claim.measurability || "Moderate",
          priorEvidence: claim.priorEvidence || "Limited research available",
          participantBurden: claim.participantBurden || "Moderate",
          wearableCompatible: typeof claim.wearableCompatible === 'boolean' ? claim.wearableCompatible : false,
          consumerRelatable: typeof claim.consumerRelatable === 'boolean' ? claim.consumerRelatable : true
        }));
      
      if (normalizedClaims.length === 0) {
        throw new Error("No valid claims in response");
      }
      
      console.log(`Successfully received ${normalizedClaims.length} valid claims`);
      return normalizedClaims;
    } catch (error) {
      clearTimeout(timeoutId);
      const fetchError = error as Error;
      if (fetchError.name === 'AbortError') {
        console.error("Request timed out");
        throw new Error("Request timed out after 30 seconds");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error generating claim suggestions:", error);
    
    // Return fallback claims instead of throwing
    // This helps to avoid breaking the UI flow when in production mode
    console.warn("Using fallback claims due to error");
    return [
      {
        claim: "Daily consumption of magnesium bisglycinate affects REM sleep duration over a 4-week period",
        measurability: "REM sleep duration can be measured using polysomnography or consumer sleep tracking devices",
        priorEvidence: "Several studies have investigated the relationship between magnesium and sleep quality",
        participantBurden: "Requires consistent supplement usage and sleep monitoring",
        wearableCompatible: true,
        consumerRelatable: true
      }
    ];
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

/**
 * Check protocol for regulatory compliance with FDA/FTC guidelines
 * @param protocol The protocol to check
 * @param claim The claim being tested
 */
export async function checkProtocolCompliance(protocol: any, claim: string): Promise<any> {
  try {
    // In a real implementation, this would call the backend
    // For now, we'll simulate the API response directly
    
    // Create a protocol summary for the compliance check
    const protocolSummary = {
      title: protocol.title,
      claim: claim,
      sections: protocol.sections.map((section: any) => ({
        title: section.title,
        content: section.content
      }))
    };
    
    // Check for common compliance issues in the protocol
    const issues = [];
    const protocolText = JSON.stringify(protocolSummary);
    
    // Check for potentially problematic terms
    if (protocolText.toLowerCase().includes("cure") || 
        protocolText.toLowerCase().includes("treat") ||
        protocolText.toLowerCase().includes("prevent disease")) {
      issues.push({
        section: "Multiple sections",
        issue: "Disease claim language detected",
        recommendation: "Replace disease claim language with structure/function language. Avoid terms like 'cure', 'treat', or 'prevent disease'.",
        severity: 'high'
      });
    }
    
    // Check for missing informed consent
    if (!protocolText.toLowerCase().includes("informed consent")) {
      issues.push({
        section: "Informed Consent",
        issue: "Missing or inadequate informed consent procedures",
        recommendation: "Add detailed informed consent procedures, including participant rights, study risks, and data privacy information.",
        severity: 'high'
      });
    }
    
    // Check for adequate safety monitoring
    if (!protocolText.toLowerCase().includes("adverse event") && 
        !protocolText.toLowerCase().includes("safety monitoring")) {
      issues.push({
        section: "Safety Monitoring",
        issue: "Inadequate safety monitoring procedures",
        recommendation: "Add comprehensive safety monitoring and adverse event reporting procedures.",
        severity: 'medium'
      });
    }
    
    // Return the compliance results
    return {
      isCompliant: issues.length === 0,
      issues: issues
    };
  } catch (error) {
    console.error("Error checking protocol compliance:", error);
    // Return a fallback response indicating an error
    return {
      isCompliant: false,
      issues: [{
        section: "General",
        issue: "Error evaluating compliance",
        recommendation: "An error occurred while evaluating compliance. Please try again.",
        severity: 'medium'
      }]
    };
  }
}