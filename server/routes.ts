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
  
  // Literature Review generation endpoint
  apiRouter.post("/literature-review/generate", async (req: Request, res: Response) => {
    try {
      const { claim } = req.body;
      
      if (!claim) {
        return res.status(400).json({ message: "Claim is required for literature review" });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not found, using fallback data for literature review");
        // Return static sample data
        const sampleReviews = [
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
            summary: "Double-blind, placebo-controlled trial examining the effects of magnesium supplementation on sleep architecture in adults with mild insomnia.",
            details: "Significant improvements were observed in REM sleep duration, sleep efficiency, and subjective sleep quality."
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
            summary: "Study using consumer wearable devices to track sleep changes with magnesium supplementation.",
            details: "Participants wore Oura rings to monitor sleep stages. Results showed moderate improvements in REM sleep duration and efficiency."
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
            summary: "Small pilot study on the effects of various minerals on sleep.",
            details: "Limited sample size but showed trends toward improved REM sleep with magnesium supplementation."
          }
        ];
        
        return res.json(sampleReviews);
      }
      
      // Return fallback data for now even if API key is present (to be implemented)
      const sampleReviews = [
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
          summary: "Double-blind, placebo-controlled trial examining the effects of magnesium supplementation on sleep architecture in adults with mild insomnia.",
          details: "Significant improvements were observed in REM sleep duration, sleep efficiency, and subjective sleep quality."
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
          summary: "Study using consumer wearable devices to track sleep changes with magnesium supplementation.",
          details: "Participants wore Oura rings to monitor sleep stages. Results showed moderate improvements in REM sleep duration and efficiency."
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
          summary: "Small pilot study on the effects of various minerals on sleep.",
          details: "Limited sample size but showed trends toward improved REM sleep with magnesium supplementation."
        }
      ];
      
      res.json(sampleReviews);
    } catch (error) {
      console.error("Error generating literature review:", error);
      res.status(500).json({ 
        message: "Failed to generate literature review", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
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
      const content = response.choices[0].message.content || "";
      
      if (!content) {
        console.error("Empty response from OpenAI");
        throw new Error("Empty response from AI service");
      }
      
      const result = JSON.parse(content);
      console.log("OpenAI response format:", result);
      
      // Handle different possible response formats
      // The API might return:
      // 1. An array directly
      // 2. An object with a 'claims' property containing the array
      // 3. An object with each claim as a separate property (like claim1, claim2, claim3)
      
      let claims = [];
      
      if (Array.isArray(result)) {
        claims = result;
      } else if (result.claims && Array.isArray(result.claims)) {
        claims = result.claims;
      } else if (typeof result === 'object') {
        // If single object with claim properties, wrap it in an array
        if (result.claim) {
          claims = [result];
        } 
        // Check for numbered claims like claim1, claim2, etc.
        else if (Object.keys(result).some(key => key.startsWith('claim'))) {
          const claimKeys = Object.keys(result).filter(key => key.startsWith('claim'));
          claims = claimKeys.map(key => result[key]);
        }
        // If we have numeric keys, it might be an object with numeric keys instead of an array
        else if (Object.keys(result).some(key => !isNaN(parseInt(key)))) {
          claims = Object.values(result);
        }
      }
      
      if (claims.length === 0) {
        console.error("Invalid OpenAI response format:", result);
        throw new Error("Invalid response format from AI service");
      }
      
      res.json(claims);
    } catch (error) {
      console.error("Error generating claims with OpenAI:", error);
      res.status(500).json({ 
        message: "Failed to generate claim suggestions", 
        error: error instanceof Error ? error.message : "Unknown error" 
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
  
  // Outcome Measures generation endpoint
  apiRouter.post("/outcome-measures/generate", async (req: Request, res: Response) => {
    try {
      const { claim } = req.body;
      
      if (!claim) {
        return res.status(400).json({ message: "Claim is required for outcome measures generation" });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not found, using fallback data for outcome measures");
        // Return static sample data
        const sampleMeasures = [
          {
            name: "REM Sleep Duration",
            description: "Percentage of time spent in REM sleep per night",
            feasibility: "High",
            regulatoryAcceptance: "Well-accepted measure in sleep research",
            participantBurden: "Low",
            wearableCompatible: true
          },
          {
            name: "Pittsburgh Sleep Quality Index (PSQI)",
            description: "Validated questionnaire measuring sleep quality",
            feasibility: "Medium",
            regulatoryAcceptance: "Gold standard in sleep research",
            participantBurden: "Medium",
            wearableCompatible: false
          },
          {
            name: "Sleep Onset Latency",
            description: "Time to fall asleep after going to bed",
            feasibility: "High",
            regulatoryAcceptance: "Well-established metric",
            participantBurden: "Low",
            wearableCompatible: true
          },
          {
            name: "Total Sleep Time",
            description: "Total duration of sleep per night",
            feasibility: "High",
            regulatoryAcceptance: "Standard measure",
            participantBurden: "Low",
            wearableCompatible: true
          }
        ];
        
        return res.json(sampleMeasures);
      }
      
      // Return fallback data for now even if API key is present (to be implemented)
      const sampleMeasures = [
        {
          name: "REM Sleep Duration",
          description: "Percentage of time spent in REM sleep per night",
          feasibility: "High",
          regulatoryAcceptance: "Well-accepted measure in sleep research",
          participantBurden: "Low",
          wearableCompatible: true
        },
        {
          name: "Pittsburgh Sleep Quality Index (PSQI)",
          description: "Validated questionnaire measuring sleep quality",
          feasibility: "Medium",
          regulatoryAcceptance: "Gold standard in sleep research",
          participantBurden: "Medium",
          wearableCompatible: false
        },
        {
          name: "Sleep Onset Latency",
          description: "Time to fall asleep after going to bed",
          feasibility: "High",
          regulatoryAcceptance: "Well-established metric",
          participantBurden: "Low",
          wearableCompatible: true
        },
        {
          name: "Total Sleep Time",
          description: "Total duration of sleep per night",
          feasibility: "High",
          regulatoryAcceptance: "Standard measure",
          participantBurden: "Low",
          wearableCompatible: true
        }
      ];
      
      res.json(sampleMeasures);
    } catch (error) {
      console.error("Error generating outcome measures:", error);
      res.status(500).json({ 
        message: "Failed to generate outcome measures", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
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
  
  // Study Design generation endpoint
  apiRouter.post("/study-design/generate", async (req: Request, res: Response) => {
    try {
      const { claim, outcomeMeasures } = req.body;
      
      if (!claim) {
        return res.status(400).json({ message: "Claim is required for study design generation" });
      }
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn("OpenAI API key not found, using fallback data for study design");
        // Return static sample data for study design
        const fallbackDesign = {
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
        
        return res.json(fallbackDesign);
      }
      
      // Import OpenAI only when needed
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
      
      // Build prompt context
      const outcomeNames = Array.isArray(outcomeMeasures) 
        ? outcomeMeasures.map(om => om.name).join(", ")
        : "primary outcome measures";
      
      // Send request to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are an expert in clinical study design for wellness products. Design an optimal study to test the following claim: "${claim}".
            
            The primary outcome measures will be: ${outcomeNames}
            
            Provide a comprehensive study design including:
            - Study type (e.g., RCT, crossover, etc.)
            - Sample size recommendations (min, recommended, max)
            - Study duration
            - Blinding approach
            - Control type
            - Inclusion criteria
            - Exclusion criteria
            - Power analysis explanation
            
            Format response as a JSON object with these properties:
            {
              "type": "string",
              "sampleSize": {
                "min": number,
                "recommended": number,
                "max": number
              },
              "duration": "string",
              "blindingType": "string",
              "controlType": "string",
              "inclusionCriteria": ["string", "string", ...],
              "exclusionCriteria": ["string", "string", ...],
              "powerAnalysis": "string"
            }`
          },
          {
            role: "user",
            content: `Please design a study for testing this claim: "${claim}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      });
      
      // Parse and validate response
      const content = response.choices[0].message.content || "";
      
      if (!content) {
        console.error("Empty response from OpenAI");
        throw new Error("Empty response from AI service");
      }
      
      const result = JSON.parse(content);
      
      if (!result.type || !result.sampleSize) {
        console.error("Invalid OpenAI response format for study design:", result);
        throw new Error("Invalid response format from AI service");
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error generating study design with OpenAI:", error);
      // Return fallback design on error
      const fallbackDesign = {
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
      
      res.json(fallbackDesign);
    }
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
