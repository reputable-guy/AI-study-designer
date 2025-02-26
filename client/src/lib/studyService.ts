import { apiRequest } from "./queryClient";

// Define types for our study data
export interface StudyData {
  id: number | null;
  userId: number;
  productName: string;
  originalClaim: string;
  websiteUrl?: string;
  ingredients?: string;
  refinedClaim: string | null;
  currentStep: number;
  outcomeMeasures: any[] | null;
  studyDesign: any | null;
  protocol: any | null;
}

// Default study data
export const defaultStudy: StudyData = {
  id: null,
  userId: 1, // Assume user is logged in with ID 1
  productName: "",
  originalClaim: "",
  websiteUrl: "",
  ingredients: "",
  refinedClaim: null,
  currentStep: 1,
  outcomeMeasures: null,
  studyDesign: null,
  protocol: null
};

export const StudyService = {
  // Create a new study
  async createStudy(data: Partial<StudyData>): Promise<StudyData> {
    try {
      // Prepare data for API
      const studyData = {
        ...defaultStudy,
        ...data,
      };
      
      // Create new study
      const response = await apiRequest("POST", "/api/studies", studyData);
      return await response.json();
    } catch (error) {
      console.error("Error creating study:", error);
      throw error;
    }
  },

  // Get study by ID
  async getStudy(id: number): Promise<StudyData> {
    try {
      const response = await fetch(`/api/studies/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load study: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error loading study:", error);
      throw error;
    }
  },

  // Update study
  async updateStudy(id: number, data: Partial<StudyData>): Promise<StudyData> {
    try {
      if (!id) {
        throw new Error("Cannot update: No study ID provided");
      }
      
      const response = await apiRequest("PATCH", `/api/studies/${id}`, data);
      return await response.json();
    } catch (error) {
      console.error("Error updating study:", error);
      throw error;
    }
  },

  // Update study step
  async updateStudyStep(id: number, step: number): Promise<void> {
    try {
      if (!id) {
        throw new Error("Cannot update step: No study ID provided");
      }
      
      await apiRequest("PATCH", `/api/studies/${id}`, {
        currentStep: step
      });
    } catch (error) {
      console.error("Error updating study step:", error);
      throw error;
    }
  },

  // Get all studies for a user
  async getStudiesByUser(userId: number): Promise<StudyData[]> {
    try {
      const response = await fetch(`/api/studies/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load studies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error loading user studies:", error);
      throw error;
    }
  }
};