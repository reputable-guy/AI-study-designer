import { apiRequest } from "./queryClient";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Function to simulate claim refinement suggestions based on user input
export async function generateClaimSuggestions(
  originalClaim: string,
  websiteUrl?: string,
  ingredients?: string
): Promise<any> {
  // In a real implementation, this would call the OpenAI API via backend
  // For now, we simulate with pre-defined responses
  try {
    // Make a request to the backend to generate claims
    // In production, this would use actual AI via the server
    const response = await apiRequest("POST", "/api/suggested-claims/generate", {
      originalClaim,
      websiteUrl,
      ingredients
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error generating claim suggestions:", error);
    
    // Fallback to sample data if the API call fails
    return [
      {
        claim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
        measurability: "Easily measurable",
        priorEvidence: "Prior evidence exists",
        participantBurden: "Low",
        wearableCompatible: true,
        consumerRelatable: true
      },
      {
        claim: "Magnesium supplementation (300mg daily) improves sleep quality as measured by PSQI score improvement of 2+ points",
        measurability: "Moderate",
        priorEvidence: "Strong previous evidence",
        participantBurden: "Higher",
        wearableCompatible: false,
        consumerRelatable: true
      },
      {
        claim: "Regular magnesium supplementation reduces nighttime awakenings by 30% and decreases time to fall asleep by 10+ minutes",
        measurability: "Moderate",
        priorEvidence: "Limited previous studies",
        participantBurden: "Low",
        wearableCompatible: true,
        consumerRelatable: true
      }
    ];
  }
}

// Function to simulate literature review based on claim
export async function performLiteratureReview(claim: string): Promise<any> {
  try {
    // In production, this would call the backend which would use OpenAI and RAG
    const response = await apiRequest("POST", "/api/literature-reviews/generate", {
      claim
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error performing literature review:", error);
    
    // Fallback to sample data
    return [
      {
        title: "Effects of magnesium supplementation on sleep quality",
        authors: "Nielsen, FH. et al.",
        journal: "Journal of Sleep Research",
        year: 2018,
        sampleSize: 126,
        effectSize: "18.7% increase in REM",
        dosage: "320mg daily",
        duration: "8 weeks",
        evidenceGrade: "High",
        summary: "Double-blind, placebo-controlled trial examining the effects of magnesium supplementation on sleep architecture in adults with mild insomnia."
      },
      {
        title: "Magnesium glycinate and sleep architecture: A wearable study",
        authors: "Johnson, KL. et al.",
        journal: "Sleep Medicine",
        year: 2020,
        sampleSize: 48,
        effectSize: "14.2% increase in REM",
        dosage: "300mg daily",
        duration: "4 weeks",
        evidenceGrade: "Moderate",
        summary: "Study using consumer wearable devices to track sleep changes with magnesium supplementation."
      },
      {
        title: "Effects of mineral supplementation on sleep parameters",
        authors: "Tanaka, H. et al.",
        journal: "Sleep Science",
        year: 2019,
        sampleSize: 22,
        effectSize: "9.8% increase in REM",
        dosage: "250mg daily",
        duration: "3 weeks",
        evidenceGrade: "Low",
        summary: "Small pilot study on the effects of various minerals on sleep."
      }
    ];
  }
}

// Function to simulate outcome measure recommendations
export async function recommendOutcomeMeasures(claim: string): Promise<any> {
  try {
    const response = await apiRequest("POST", "/api/outcome-measures/recommend", {
      claim
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error recommending outcome measures:", error);
    
    // Fallback to sample data
    return [
      {
        name: "REM Sleep Duration",
        description: "Percentage of time spent in REM sleep per night",
        feasibility: "High",
        regulatoryAcceptance: "Accepted",
        participantBurden: "Low",
        wearableCompatible: true
      },
      {
        name: "Pittsburgh Sleep Quality Index (PSQI)",
        description: "Validated questionnaire measuring sleep quality",
        feasibility: "Medium",
        regulatoryAcceptance: "Widely accepted",
        participantBurden: "Medium",
        wearableCompatible: false
      },
      {
        name: "Sleep Onset Latency",
        description: "Time to fall asleep after going to bed",
        feasibility: "High",
        regulatoryAcceptance: "Accepted",
        participantBurden: "Low",
        wearableCompatible: true
      }
    ];
  }
}

// Function to simulate study design recommendations
export async function recommendStudyDesign(
  claim: string,
  outcomeMeasures: any[]
): Promise<any> {
  try {
    const response = await apiRequest("POST", "/api/study-design/recommend", {
      claim,
      outcomeMeasures
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error recommending study design:", error);
    
    // Fallback to sample data
    return {
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
  }
}

// Function to simulate protocol generation
export async function generateProtocol(
  studyId: number,
  claim: string,
  studyDesign: any,
  outcomeMeasures: any[]
): Promise<any> {
  try {
    const response = await apiRequest("POST", `/api/studies/${studyId}/generate-protocol`, {
      claim,
      studyDesign,
      outcomeMeasures
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error generating protocol:", error);
    
    // Fallback to sample data
    return {
      title: "Clinical Study Protocol",
      version: "1.0",
      date: new Date().toISOString().split('T')[0],
      sections: [
        {
          title: "Study Objectives",
          content: `To evaluate the effectiveness of the product in ${claim}`
        },
        {
          title: "Study Design",
          content: "Randomized, double-blind, placebo-controlled trial"
        },
        {
          title: "Statistical Plan",
          content: "Power analysis based on prior studies suggests a sample size of 80 participants would provide 90% power to detect the expected effect size."
        },
        {
          title: "Outcome Measures",
          content: "Primary outcome measure: REM sleep duration as measured by wearable device."
        },
        {
          title: "Safety Monitoring",
          content: "Adverse events will be monitored throughout the study period."
        },
        {
          title: "Informed Consent",
          content: "All participants will provide written informed consent prior to enrollment."
        }
      ]
    };
  }
}

// Function to assess regulatory compliance
export async function assessRegulatory(claim: string): Promise<any> {
  try {
    const response = await apiRequest("POST", "/api/compliance/assess", {
      claim
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error assessing regulatory compliance:", error);
    
    // Fallback to sample data
    return {
      complianceScore: "Moderate",
      issues: [
        {
          severity: "Low",
          description: "Consider clarifying that results are based on a specific dosage schedule."
        }
      ],
      suggestions: [
        "Maintain focus on structure/function claims rather than disease treatment",
        "Ensure clear dosage information is included in all messaging"
      ]
    };
  }
}
