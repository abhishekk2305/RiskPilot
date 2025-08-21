import { z } from "zod";

// Risk Assessment Schema
export const riskAssessmentSchema = z.object({
  id: z.string(),
  timestamp_iso: z.string(),
  email: z.string().email(),
  country: z.string(),
  contract_type: z.enum(["independent", "agency", "eor"]),
  contract_value_usd: z.number().min(0),
  data_processing: z.boolean(),
  score: z.number().min(0).max(10),
  level: z.enum(["Low", "Medium", "High"]),
  time_to_result_ms: z.number().nullable(),
  downloaded_pdf: z.boolean().default(false),
  feedback: z.enum(["yes", "no"]).nullable().default(null),
  user_agent: z.string(),
  ip_last_octet: z.string(),
  reasons: z.array(z.string()),
});

export const insertRiskAssessmentSchema = riskAssessmentSchema.omit({
  id: true,
  timestamp_iso: true,
  time_to_result_ms: true,
  downloaded_pdf: true,
  feedback: true,
  user_agent: true,
  ip_last_octet: true,
  score: true,
  level: true,
  reasons: true,
});

// Form submission schema
export const formSubmissionSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(1, "Please select a country"),
  contract_type: z.enum(["independent", "agency", "eor"], {
    required_error: "Please select a contract type",
  }),
  contract_value_usd: z.number().min(0, "Contract value must be positive"),
  data_processing: z.boolean(),
  consent: z.boolean().refine(val => val === true, "You must agree to share your inputs"),
});

// Risk result schema
export const riskResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  level: z.enum(["Low", "Medium", "High"]),
  reasons: z.array(z.string()),
});

// Feedback schema
export const feedbackSchema = z.object({
  id: z.string(),
  feedback: z.enum(["yes", "no"]),
});

// Admin aggregates schema
export const adminAggregatesSchema = z.object({
  totalUsers: z.number(),
  totalSubmissions: z.number(),
  avgTimeToResult: z.number(),
  pdfDownloadRate: z.number(),
  feedbackUsefulRate: z.number(),
  timeDistribution: z.object({
    under15s: z.number(),
    from15to30s: z.number(),
    from30to60s: z.number(),
    from60to120s: z.number(),
    over120s: z.number(),
  }),
  feedbackDistribution: z.object({
    useful: z.number(),
    notUseful: z.number(),
    noResponse: z.number(),
  }),
});

export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type FormSubmission = z.infer<typeof formSubmissionSchema>;
export type RiskResult = z.infer<typeof riskResultSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type AdminAggregates = z.infer<typeof adminAggregatesSchema>;
