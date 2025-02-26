import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Study schema
export const studies = pgTable("studies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  productName: text("product_name"),
  originalClaim: text("original_claim").notNull(),
  websiteUrl: text("website_url"),
  ingredients: text("ingredients"),
  refinedClaim: text("refined_claim"),
  currentStep: integer("current_step").default(1),
  outcomes: jsonb("outcomes"),
  studyDesign: jsonb("study_design"),
  protocol: jsonb("protocol"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudySchema = createInsertSchema(studies).pick({
  userId: true,
  productName: true,
  originalClaim: true,
  websiteUrl: true,
  ingredients: true,
});

export type InsertStudy = z.infer<typeof insertStudySchema>;
export type Study = typeof studies.$inferSelect;

// Literature review schema
export const literatureReviews = pgTable("literature_reviews", {
  id: serial("id").primaryKey(),
  studyId: integer("study_id").notNull(),
  title: text("title").notNull(),
  authors: text("authors").notNull(),
  journal: text("journal").notNull(),
  year: integer("year").notNull(),
  sampleSize: integer("sample_size"),
  effectSize: text("effect_size"),
  dosage: text("dosage"),
  duration: text("duration"),
  evidenceGrade: text("evidence_grade"),
  summary: text("summary"),
  details: text("details"),
  url: text("url"),
});

export const insertLiteratureReviewSchema = createInsertSchema(literatureReviews).pick({
  studyId: true,
  title: true,
  authors: true,
  journal: true,
  year: true,
  sampleSize: true,
  effectSize: true,
  dosage: true,
  duration: true,
  evidenceGrade: true,
  summary: true,
  details: true,
  url: true,
});

export type InsertLiteratureReview = z.infer<typeof insertLiteratureReviewSchema>;
export type LiteratureReview = typeof literatureReviews.$inferSelect;

// Suggested claims schema
export const suggestedClaims = pgTable("suggested_claims", {
  id: serial("id").primaryKey(),
  studyId: integer("study_id").notNull(),
  claim: text("claim").notNull(),
  measurability: text("measurability"),
  priorEvidence: text("prior_evidence"),
  participantBurden: text("participant_burden"),
  wearableCompatible: boolean("wearable_compatible"),
  consumerRelatable: boolean("consumer_relatable"),
  selected: boolean("selected").default(false),
});

export const insertSuggestedClaimSchema = createInsertSchema(suggestedClaims).pick({
  studyId: true,
  claim: true,
  measurability: true,
  priorEvidence: true,
  participantBurden: true,
  wearableCompatible: true,
  consumerRelatable: true,
  selected: true,
});

export type InsertSuggestedClaim = z.infer<typeof insertSuggestedClaimSchema>;
export type SuggestedClaim = typeof suggestedClaims.$inferSelect;

// Outcome measures schema
export const outcomesMeasures = pgTable("outcomes_measures", {
  id: serial("id").primaryKey(),
  studyId: integer("study_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  feasibility: text("feasibility"),
  regulatoryAcceptance: text("regulatory_acceptance"),
  participantBurden: text("participant_burden"),
  wearableCompatible: boolean("wearable_compatible"),
  selected: boolean("selected").default(false),
});

export const insertOutcomesMeasureSchema = createInsertSchema(outcomesMeasures).pick({
  studyId: true,
  name: true,
  description: true,
  feasibility: true,
  regulatoryAcceptance: true,
  participantBurden: true,
  wearableCompatible: true,
  selected: true,
});

export type InsertOutcomesMeasure = z.infer<typeof insertOutcomesMeasureSchema>;
export type OutcomesMeasure = typeof outcomesMeasures.$inferSelect;
