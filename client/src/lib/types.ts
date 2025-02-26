/**
 * Centralized type definitions for the application
 * This ensures consistent types across components and helps prevent type errors
 */

export interface StudyEvidence {
  id?: number;
  studyId?: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  sampleSize: number;
  effectSize: string;
  dosage: string;
  duration: string;
  evidenceGrade: "High" | "Moderate" | "Low";
  summary: string;
  details?: string;
  url?: string;
}

export interface OutcomeMeasure {
  id?: number;
  studyId?: number;
  name: string;
  description: string;
  feasibility: string;
  regulatoryAcceptance: string;
  participantBurden: string;
  wearableCompatible: boolean;
  selected?: boolean;
}

export interface ClaimSuggestion {
  id?: number;
  studyId?: number | null;
  claim: string;
  measurability: string;
  priorEvidence: string;
  participantBurden: string;
  wearableCompatible: boolean;
  consumerRelatable: boolean;
  selected?: boolean;
}

export interface StudyDesign {
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

export interface StudyData {
  id: number | null;
  userId: number;
  productName: string;
  originalClaim: string;
  websiteUrl?: string;
  ingredients?: string;
  refinedClaim: string | null;
  currentStep: number;
  outcomeMeasures: OutcomeMeasure[] | null;
  studyDesign: StudyDesign | null;
  protocol: any | null;
}