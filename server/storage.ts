import { 
  users, type User, type InsertUser, 
  studies, type Study, type InsertStudy,
  literatureReviews, type LiteratureReview, type InsertLiteratureReview,
  suggestedClaims, type SuggestedClaim, type InsertSuggestedClaim,
  outcomesMeasures, type OutcomesMeasure, type InsertOutcomesMeasure
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Study methods
  createStudy(study: InsertStudy): Promise<Study>;
  getStudy(id: number): Promise<Study | undefined>;
  updateStudy(id: number, updates: Partial<Study>): Promise<Study | undefined>;
  listStudiesByUser(userId: number): Promise<Study[]>;
  
  // Literature Review methods
  createLiteratureReview(review: InsertLiteratureReview): Promise<LiteratureReview>;
  getLiteratureReviewsByStudy(studyId: number): Promise<LiteratureReview[]>;
  
  // Suggested Claims methods
  createSuggestedClaim(claim: InsertSuggestedClaim): Promise<SuggestedClaim>;
  getSuggestedClaimsByStudy(studyId: number): Promise<SuggestedClaim[]>;
  selectSuggestedClaim(id: number): Promise<SuggestedClaim | undefined>;
  
  // Outcome Measures methods
  createOutcomeMeasure(measure: InsertOutcomesMeasure): Promise<OutcomesMeasure>;
  getOutcomeMeasuresByStudy(studyId: number): Promise<OutcomesMeasure[]>;
  selectOutcomeMeasure(id: number): Promise<OutcomesMeasure | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private studies: Map<number, Study>;
  private literatureReviews: Map<number, LiteratureReview>;
  private suggestedClaims: Map<number, SuggestedClaim>;
  private outcomeMeasures: Map<number, OutcomesMeasure>;
  
  private userId: number;
  private studyId: number;
  private literatureReviewId: number;
  private suggestedClaimId: number;
  private outcomeMeasureId: number;

  constructor() {
    this.users = new Map();
    this.studies = new Map();
    this.literatureReviews = new Map();
    this.suggestedClaims = new Map();
    this.outcomeMeasures = new Map();
    
    this.userId = 1;
    this.studyId = 1;
    this.literatureReviewId = 1;
    this.suggestedClaimId = 1;
    this.outcomeMeasureId = 1;
    
    // Add sample data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Study methods
  async createStudy(insertStudy: InsertStudy): Promise<Study> {
    const id = this.studyId++;
    const now = new Date();
    const study: Study = {
      ...insertStudy,
      id,
      refinedClaim: null,
      currentStep: 1,
      outcomes: null,
      studyDesign: null,
      protocol: null,
      createdAt: now,
      updatedAt: now
    };
    this.studies.set(id, study);
    return study;
  }
  
  async getStudy(id: number): Promise<Study | undefined> {
    return this.studies.get(id);
  }
  
  async updateStudy(id: number, updates: Partial<Study>): Promise<Study | undefined> {
    const study = this.studies.get(id);
    if (!study) return undefined;
    
    const updatedStudy = { 
      ...study, 
      ...updates,
      updatedAt: new Date()
    };
    this.studies.set(id, updatedStudy);
    return updatedStudy;
  }
  
  async listStudiesByUser(userId: number): Promise<Study[]> {
    return Array.from(this.studies.values()).filter(
      (study) => study.userId === userId
    );
  }
  
  // Literature Review methods
  async createLiteratureReview(insertReview: InsertLiteratureReview): Promise<LiteratureReview> {
    const id = this.literatureReviewId++;
    const review: LiteratureReview = { ...insertReview, id };
    this.literatureReviews.set(id, review);
    return review;
  }
  
  async getLiteratureReviewsByStudy(studyId: number): Promise<LiteratureReview[]> {
    return Array.from(this.literatureReviews.values()).filter(
      (review) => review.studyId === studyId
    );
  }
  
  // Suggested Claims methods
  async createSuggestedClaim(insertClaim: InsertSuggestedClaim): Promise<SuggestedClaim> {
    const id = this.suggestedClaimId++;
    const claim: SuggestedClaim = { ...insertClaim, id };
    this.suggestedClaims.set(id, claim);
    return claim;
  }
  
  async getSuggestedClaimsByStudy(studyId: number): Promise<SuggestedClaim[]> {
    return Array.from(this.suggestedClaims.values()).filter(
      (claim) => claim.studyId === studyId
    );
  }
  
  async selectSuggestedClaim(id: number): Promise<SuggestedClaim | undefined> {
    const claim = this.suggestedClaims.get(id);
    if (!claim) return undefined;
    
    // Set all claims for this study to not selected
    const studyId = claim.studyId;
    const studyClaims = await this.getSuggestedClaimsByStudy(studyId);
    
    for (const c of studyClaims) {
      const updatedClaim = { ...c, selected: false };
      this.suggestedClaims.set(c.id, updatedClaim);
    }
    
    // Set this claim as selected
    const updatedClaim = { ...claim, selected: true };
    this.suggestedClaims.set(id, updatedClaim);
    return updatedClaim;
  }
  
  // Outcome Measures methods
  async createOutcomeMeasure(insertMeasure: InsertOutcomesMeasure): Promise<OutcomesMeasure> {
    const id = this.outcomeMeasureId++;
    const measure: OutcomesMeasure = { ...insertMeasure, id };
    this.outcomeMeasures.set(id, measure);
    return measure;
  }
  
  async getOutcomeMeasuresByStudy(studyId: number): Promise<OutcomesMeasure[]> {
    return Array.from(this.outcomeMeasures.values()).filter(
      (measure) => measure.studyId === studyId
    );
  }
  
  async selectOutcomeMeasure(id: number): Promise<OutcomesMeasure | undefined> {
    const measure = this.outcomeMeasures.get(id);
    if (!measure) return undefined;
    
    const updatedMeasure = { ...measure, selected: true };
    this.outcomeMeasures.set(id, updatedMeasure);
    return updatedMeasure;
  }
  
  // Initialize sample data for the application
  private async initializeSampleData() {
    // Create a test user
    const testUser = await this.createUser({
      username: "demouser",
      password: "password123"
    });
    
    // Create a sample study
    const sampleStudy = await this.createStudy({
      userId: testUser.id,
      productName: "MagSleep Premium",
      originalClaim: "Our magnesium supplement helps improve sleep quality and reduce stress.",
      websiteUrl: "https://magsleep.example.com",
      ingredients: "Magnesium bisglycinate (300mg), Zinc (15mg), Vitamin B6 (2mg)"
    });
    
    // Create suggested claims
    await this.createSuggestedClaim({
      studyId: sampleStudy.id,
      claim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
      measurability: "Easily measurable",
      priorEvidence: "Prior evidence exists",
      participantBurden: "Low",
      wearableCompatible: true,
      consumerRelatable: true,
      selected: false
    });
    
    await this.createSuggestedClaim({
      studyId: sampleStudy.id,
      claim: "Magnesium supplementation (300mg daily) improves sleep quality as measured by PSQI score improvement of 2+ points",
      measurability: "Moderate",
      priorEvidence: "Strong previous evidence",
      participantBurden: "Higher participant burden",
      wearableCompatible: false,
      consumerRelatable: true,
      selected: false
    });
    
    await this.createSuggestedClaim({
      studyId: sampleStudy.id,
      claim: "Regular magnesium supplementation reduces nighttime awakenings by 30% and decreases time to fall asleep by 10+ minutes",
      measurability: "Moderate",
      priorEvidence: "Limited previous studies",
      participantBurden: "Low",
      wearableCompatible: true,
      consumerRelatable: true,
      selected: false
    });
    
    // Create literature reviews
    await this.createLiteratureReview({
      studyId: sampleStudy.id,
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
      details: "Significant improvements were observed in REM sleep duration, sleep efficiency, and subjective sleep quality. Key findings: Magnesium supplementation significantly increased REM sleep percentage compared to placebo (p<0.01). Secondary outcomes included reduced sleep onset latency and improved sleep efficiency.",
      url: "https://example.com/study1"
    });
    
    await this.createLiteratureReview({
      studyId: sampleStudy.id,
      title: "Magnesium glycinate and sleep architecture: A wearable study",
      authors: "Johnson, KL. et al.",
      journal: "Sleep Medicine",
      year: 2020,
      sampleSize: 48,
      effectSize: "14.2% increase in REM",
      dosage: "300mg daily",
      duration: "4 weeks",
      evidenceGrade: "Moderate",
      summary: "Study using consumer wearable devices to track sleep changes with magnesium supplementation.",
      details: "Participants wore Oura rings to monitor sleep stages. Results showed moderate improvements in REM sleep duration and efficiency.",
      url: "https://example.com/study2"
    });
    
    await this.createLiteratureReview({
      studyId: sampleStudy.id,
      title: "Effects of mineral supplementation on sleep parameters",
      authors: "Tanaka, H. et al.",
      journal: "Sleep Science",
      year: 2019,
      sampleSize: 22,
      effectSize: "9.8% increase in REM",
      dosage: "250mg daily",
      duration: "3 weeks",
      evidenceGrade: "Low",
      summary: "Small pilot study on the effects of various minerals on sleep.",
      details: "Limited sample size but showed trends toward improved REM sleep with magnesium supplementation.",
      url: "https://example.com/study3"
    });
    
    // Create outcome measures
    await this.createOutcomeMeasure({
      studyId: sampleStudy.id,
      name: "REM Sleep Duration",
      description: "Percentage of time spent in REM sleep per night",
      feasibility: "High",
      regulatoryAcceptance: "Accepted",
      participantBurden: "Low",
      wearableCompatible: true,
      selected: false
    });
    
    await this.createOutcomeMeasure({
      studyId: sampleStudy.id,
      name: "Pittsburgh Sleep Quality Index (PSQI)",
      description: "Validated questionnaire measuring sleep quality",
      feasibility: "Medium",
      regulatoryAcceptance: "Widely accepted",
      participantBurden: "Medium",
      wearableCompatible: false,
      selected: false
    });
    
    await this.createOutcomeMeasure({
      studyId: sampleStudy.id,
      name: "Sleep Onset Latency",
      description: "Time to fall asleep after going to bed",
      feasibility: "High",
      regulatoryAcceptance: "Accepted",
      participantBurden: "Low",
      wearableCompatible: true,
      selected: false
    });
  }
}

export const storage = new MemStorage();
