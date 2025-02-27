import { toast as toastFn } from "@/hooks/use-toast";
import { ClaimSuggestion, StudyEvidence, OutcomeMeasure, StudyDesign } from "./types";

/**
 * Utility for consistent error handling and fallback data management
 * Using a centralized approach to error handling and fallbacks improves reliability
 */

// Fallback data for claims
export const getFallbackClaims = (studyId: number): ClaimSuggestion[] => [
  {
    id: 1001,
    studyId,
    claim: "Daily consumption of magnesium bisglycinate affects REM sleep duration over a 4-week period",
    measurability: "REM sleep duration can be measured using polysomnography or consumer sleep tracking devices",
    priorEvidence: "Several studies have investigated the relationship between magnesium and sleep quality",
    participantBurden: "Requires consistent supplement usage and sleep monitoring",
    wearableCompatible: true,
    consumerRelatable: true,
    selected: false
  }
];

// Fallback data for literature reviews
export const getFallbackLiteratureReviews = (studyId: number): StudyEvidence[] => [
  {
    id: 101,
    studyId,
    title: "Effects of magnesium supplementation on sleep quality",
    authors: "Nielsen, FH. et al.",
    journal: "Journal of Sleep Research",
    year: 2018,
    sampleSize: 126,
    effectSize: "18.7% increase in REM",
    dosage: "320mg daily",
    duration: "8 weeks",
    evidenceGrade: "High",
    summary: "Double-blind, placebo-controlled trial examining the effects of magnesium supplementation on sleep architecture in adults with mild insomnia.",
    details: "Significant improvements were observed in REM sleep duration, sleep efficiency, and subjective sleep quality. Key findings: Magnesium supplementation significantly increased REM sleep percentage compared to placebo (p<0.01). Secondary outcomes included reduced sleep onset latency and improved sleep efficiency."
  },
  {
    id: 102,
    studyId,
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
    id: 103,
    studyId,
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

// Fallback data for outcome measures
export const getFallbackOutcomeMeasures = (studyId: number): OutcomeMeasure[] => [
  {
    id: 201,
    studyId,
    name: "REM Sleep Duration",
    description: "Percentage of time spent in REM sleep per night",
    feasibility: "High",
    regulatoryAcceptance: "Accepted",
    participantBurden: "Low",
    wearableCompatible: true,
    selected: false
  },
  {
    id: 202,
    studyId,
    name: "Pittsburgh Sleep Quality Index (PSQI)",
    description: "Validated questionnaire measuring sleep quality",
    feasibility: "Medium",
    regulatoryAcceptance: "Widely accepted",
    participantBurden: "Medium",
    wearableCompatible: false,
    selected: false
  },
  {
    id: 203,
    studyId,
    name: "Sleep Onset Latency",
    description: "Time to fall asleep after going to bed",
    feasibility: "High",
    regulatoryAcceptance: "Accepted",
    participantBurden: "Low",
    wearableCompatible: true,
    selected: false
  }
];

// Fallback study design
export const getFallbackStudyDesign = (): StudyDesign => ({
  type: "Randomized Controlled Trial",
  sampleSize: {
    min: 60,
    recommended: 120,
    max: 200
  },
  duration: "8 weeks",
  blindingType: "Double-blind",
  controlType: "Placebo",
  inclusionCriteria: [
    "Adults 18-65 years old",
    "Self-reported sleep issues",
    "No current use of sleep medication"
  ],
  exclusionCriteria: [
    "Diagnosed sleep disorders",
    "Current use of medications affecting sleep",
    "Shift workers"
  ],
  powerAnalysis: "Sample size of 120 provides 80% power to detect 15% improvement in primary outcome",
  recruitmentDifficulty: 4 // Moderate difficulty (scale of 1-10)
});

// Standard error handler for API requests
export const handleApiError = (
  error: any, 
  errorTitle: string,
  errorMessage: string
) => {
  console.error(`${errorTitle}:`, error);
  toastFn({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};

// Utility to ensure consistent app state even when API fails
export const withErrorHandling = async <T,>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  errorMessage: string,
  studyId?: number
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    handleApiError(error, "API Error", errorMessage);
    return fallbackData;
  }
};