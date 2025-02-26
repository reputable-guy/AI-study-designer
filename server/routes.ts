import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertStudySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Studies endpoints
  apiRouter.post("/studies", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStudySchema.parse(req.body);
      const study = await storage.createStudy(validatedData);
      res.status(201).json(study);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Failed to create study" });
      }
    }
  });
  
  apiRouter.get("/studies/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    const study = await storage.getStudy(id);
    if (!study) {
      return res.status(404).json({ message: "Study not found" });
    }
    
    res.json(study);
  });
  
  apiRouter.patch("/studies/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    try {
      const updatedStudy = await storage.updateStudy(id, req.body);
      if (!updatedStudy) {
        return res.status(404).json({ message: "Study not found" });
      }
      
      res.json(updatedStudy);
    } catch (err) {
      res.status(500).json({ message: "Failed to update study" });
    }
  });
  
  apiRouter.get("/studies/user/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const studies = await storage.listStudiesByUser(userId);
    res.json(studies);
  });
  
  // Literature Review endpoints
  apiRouter.get("/literature-reviews/study/:studyId", async (req: Request, res: Response) => {
    const studyId = parseInt(req.params.studyId);
    if (isNaN(studyId)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    const reviews = await storage.getLiteratureReviewsByStudy(studyId);
    res.json(reviews);
  });
  
  // Suggested Claims endpoints
  apiRouter.get("/suggested-claims/study/:studyId", async (req: Request, res: Response) => {
    const studyId = parseInt(req.params.studyId);
    if (isNaN(studyId)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    const claims = await storage.getSuggestedClaimsByStudy(studyId);
    res.json(claims);
  });
  
  // Claim generation endpoint using OpenAI
  apiRouter.post("/suggested-claims/generate", async (req: Request, res: Response) => {
    try {
      const { originalClaim, websiteUrl, ingredients } = req.body;
      
      if (!originalClaim) {
        return res.status(400).json({ message: "Original claim is required" });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not found, using fallback data");
        // Return static sample data when API key is not available
        const sampleClaims = [
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
        
        return res.json(sampleClaims);
      }
      
      // Import OpenAI only when needed to avoid errors when API key is not available
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
      
      // Build prompt context
      let context = `Original claim: ${originalClaim}`;
      if (websiteUrl) context += `\nProduct website: ${websiteUrl}`;
      if (ingredients) context += `\nIngredients: ${ingredients}`;
      
      // Send request to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert in clinical study design for wellness products. 
            You help refine product claims into testable, measurable claims that could be supported through clinical research. 
            Provide 3 alternative, refined versions of the product claim with these characteristics:
            1. More specific and measurable
            2. Focus on clear outcomes and durations
            3. Quantify effects where possible 
            
            For each claim, analyze:
            - Measurability (how easily it can be tested)
            - Prior evidence (existence of research supporting this type of claim)
            - Participant burden (how demanding the study would be for participants)
            - Whether it could be measured with a wearable device
            - Whether it is relatable to consumers
            
            Format response as JSON array of objects with these properties:
            { 
              "claim": "refined claim statement",
              "measurability": "description",
              "priorEvidence": "description",
              "participantBurden": "description",
              "wearableCompatible": boolean,
              "consumerRelatable": boolean 
            }`
          },
          {
            role: "user",
            content: context
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      
      // Parse and validate response
      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      
      if (!result.claims && !Array.isArray(result)) {
        console.error("Invalid OpenAI response format:", result);
        throw new Error("Invalid response format from AI service");
      }
      
      // Handle different possible response formats
      const claims = Array.isArray(result) ? result : (result.claims || []);
      
      res.json(claims);
    } catch (error) {
      console.error("Error generating claims with OpenAI:", error);
      res.status(500).json({ 
        message: "Failed to generate claim suggestions", 
        error: error.message 
      });
    }
  });

  // Create suggested claim
  apiRouter.post("/suggested-claims", async (req: Request, res: Response) => {
    try {
      // Validate that studyId is present
      if (!req.body.studyId || isNaN(parseInt(req.body.studyId))) {
        return res.status(400).json({ message: "Valid studyId is required" });
      }
      
      const claim = await storage.createSuggestedClaim(req.body);
      res.json(claim);
    } catch (err) {
      console.error("Error creating suggested claim:", err);
      res.status(500).json({ message: "Failed to create suggested claim" });
    }
  });
  
  apiRouter.post("/suggested-claims/:id/select", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid claim ID" });
    }
    
    const claim = await storage.selectSuggestedClaim(id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    
    // Also update the study with the selected claim
    const study = await storage.getStudy(claim.studyId);
    if (study) {
      await storage.updateStudy(study.id, {
        refinedClaim: claim.claim,
        currentStep: 3 // Move to next step (literature review)
      });
    }
    
    res.json(claim);
  });
  
  // Outcome Measures endpoints
  apiRouter.get("/outcome-measures/study/:studyId", async (req: Request, res: Response) => {
    const studyId = parseInt(req.params.studyId);
    if (isNaN(studyId)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    const measures = await storage.getOutcomeMeasuresByStudy(studyId);
    res.json(measures);
  });
  
  apiRouter.post("/outcome-measures/:id/select", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid outcome measure ID" });
    }
    
    const measure = await storage.selectOutcomeMeasure(id);
    if (!measure) {
      return res.status(404).json({ message: "Outcome measure not found" });
    }
    
    // Update the study to move to next step
    const study = await storage.getStudy(measure.studyId);
    if (study) {
      await storage.updateStudy(study.id, {
        currentStep: 5 // Move to next step (study design)
      });
    }
    
    res.json(measure);
  });
  
  // Generate Protocol endpoint (simulates AI completion)
  apiRouter.post("/studies/:id/generate-protocol", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid study ID" });
    }
    
    const study = await storage.getStudy(id);
    if (!study) {
      return res.status(404).json({ message: "Study not found" });
    }
    
    // Simulate protocol generation
    const protocol = {
      title: `Clinical Study Protocol: Evaluation of ${study.productName}`,
      version: "1.0",
      date: new Date().toISOString().split('T')[0],
      sections: [
        {
          title: "Study Objectives",
          content: `To evaluate the effectiveness of ${study.productName} in ${study.refinedClaim}`
        },
        {
          title: "Study Design",
          content: "Randomized, double-blind, placebo-controlled trial"
        },
        {
          title: "Statistical Plan",
          content: "Power analysis based on prior studies suggests a sample size of 60 participants would provide 80% power to detect the expected effect size."
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
    
    // Update the study with the generated protocol
    await storage.updateStudy(id, {
      protocol,
      currentStep: 6 // Move to next step (protocol)
    });
    
    res.json(protocol);
  });
  
  // Register all API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
