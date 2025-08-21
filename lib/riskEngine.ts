export interface RiskEngineInput {
  country: string;
  contractType: string;
  contractValue: number;
  dataProcessing: boolean;
  industry?: string;
  contractDuration?: number; // months
  hasIntellectualProperty?: boolean;
  involvesFinancialData?: boolean;
  requiresSecurityClearance?: boolean;
  isPublicSector?: boolean;
}

export interface RiskEngineResult {
  score: number;
  level: "Low" | "Medium" | "High";
  reasons: string[];
}

// Enhanced country risk classifications
const countryRiskProfiles = {
  veryLow: ["CH", "SG", "LU", "NZ"], // Very stable, simple compliance
  low: ["US", "CA", "AU", "DK", "SE", "NO", "NL", "DE"], // Stable with good frameworks
  medium: ["GB", "FR", "IT", "ES", "PT", "IE", "BE", "AT"], // Moderate complexity
  high: ["BR", "MX", "IN", "CN", "RU", "TR", "EG", "ZA"], // Complex regulations
  veryHigh: ["IQ", "AF", "SY", "LY", "VE", "IR", "KP"] // High instability/sanctions
};

// Industry-specific risk factors
const industryRiskFactors = {
  finance: { multiplier: 1.5, reasons: ["Financial services require enhanced regulatory compliance"] },
  healthcare: { multiplier: 1.4, reasons: ["Healthcare data involves strict privacy regulations"] },
  defense: { multiplier: 1.8, reasons: ["Defense contracts involve national security considerations"] },
  crypto: { multiplier: 1.6, reasons: ["Cryptocurrency sector has evolving regulatory landscape"] },
  gaming: { multiplier: 1.2, reasons: ["Gaming industry has varying international regulations"] },
  ecommerce: { multiplier: 1.0, reasons: ["E-commerce has moderate compliance requirements"] },
  saas: { multiplier: 0.9, reasons: ["SaaS typically has lower compliance complexity"] },
  consulting: { multiplier: 0.8, reasons: ["Professional consulting has standard compliance patterns"] }
};

function getCountryRiskScore(country: string): { score: number; reason: string } {
  if (countryRiskProfiles.veryLow.includes(country)) {
    return { score: 0, reason: "Very low regulatory complexity jurisdiction" };
  } else if (countryRiskProfiles.low.includes(country)) {
    return { score: 1, reason: "Stable jurisdiction with established frameworks" };
  } else if (countryRiskProfiles.medium.includes(country)) {
    return { score: 2, reason: "Moderate regulatory complexity" };
  } else if (countryRiskProfiles.high.includes(country)) {
    return { score: 3, reason: "Complex regulatory environment requires careful navigation" };
  } else if (countryRiskProfiles.veryHigh.includes(country)) {
    return { score: 5, reason: "High-risk jurisdiction with sanctions or instability concerns" };
  } else {
    return { score: 2, reason: "Unknown jurisdiction requires research and due diligence" };
  }
}

export function riskEngine(input: RiskEngineInput): RiskEngineResult {
  let score = 0;
  const reasons: string[] = [];

  // Enhanced country risk assessment
  const countryRisk = getCountryRiskScore(input.country);
  score += countryRisk.score;
  reasons.push(countryRisk.reason);

  // EU/EEA/UK countries for GDPR consideration
  const euCountries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "IS", "LI", "NO"];
  
  // Enhanced GDPR and data processing assessment
  if (euCountries.includes(input.country) && input.dataProcessing) {
    score += 2;
    reasons.push("GDPR compliance required for EU data processing");
    
    // Additional risk for financial or healthcare data in EU
    if (input.involvesFinancialData) {
      score += 1;
      reasons.push("Financial data in EU requires additional privacy safeguards");
    }
  }

  // Contract type assessment with enhanced logic
  switch (input.contractType) {
    case "independent":
      score += 2;
      reasons.push("Independent contractor classification requires careful documentation");
      
      // Additional risk for high-value independent contracts
      if (input.contractValue > 75000) {
        score += 1;
        reasons.push("High-value independent contracts increase misclassification risk");
      }
      break;
    case "agency":
      score += 1;
      reasons.push("Agency arrangement requires clear liability boundaries");
      break;
    case "eor":
      // EOR reduces risk
      score -= 1;
      reasons.push("Employer of Record structure provides compliance protection");
      break;
  }

  // Enhanced contract value assessment with tiers
  if (input.contractValue > 250000) {
    score += 3;
    reasons.push("Very high contract value (>$250k) requires enhanced due diligence");
  } else if (input.contractValue > 100000) {
    score += 2;
    reasons.push("High contract value (>$100k) increases commercial exposure");
  } else if (input.contractValue > 50000) {
    score += 1;
    reasons.push("Moderate contract value requires standard compliance measures");
  }

  // Industry-specific risk assessment
  if (input.industry && industryRiskFactors[input.industry as keyof typeof industryRiskFactors]) {
    const industryFactor = industryRiskFactors[input.industry as keyof typeof industryRiskFactors];
    const industryRiskPoints = Math.round((score * industryFactor.multiplier) - score);
    score += Math.max(0, industryRiskPoints);
    reasons.push(...industryFactor.reasons);
  }

  // Contract duration risk assessment
  if (input.contractDuration) {
    if (input.contractDuration > 24) {
      score += 2;
      reasons.push("Long-term contracts (>2 years) increase regulatory change risk");
    } else if (input.contractDuration > 12) {
      score += 1;
      reasons.push("Extended contracts require periodic compliance review");
    }
  }

  // Intellectual property risk
  if (input.hasIntellectualProperty) {
    score += 1;
    reasons.push("Intellectual property involvement requires IP protection measures");
  }

  // Financial data handling risk
  if (input.involvesFinancialData) {
    score += 2;
    reasons.push("Financial data handling requires enhanced security and compliance");
  }

  // Security clearance requirements
  if (input.requiresSecurityClearance) {
    score += 3;
    reasons.push("Security clearance requirements involve national security compliance");
  }

  // Public sector additional requirements
  if (input.isPublicSector) {
    score += 1;
    reasons.push("Public sector contracts require transparency and audit compliance");
  }

  // Multi-factor risk interactions
  if (input.contractType === "independent" && input.contractValue > 100000 && input.hasIntellectualProperty) {
    score += 1;
    reasons.push("High-value independent IP work creates compound compliance risks");
  }

  if (euCountries.includes(input.country) && input.involvesFinancialData && input.dataProcessing) {
    score += 1;
    reasons.push("EU financial data processing requires multiple regulatory frameworks");
  }

  // Ensure we have reasonable number of reasons (remove duplicates and limit)
  const uniqueReasons = [...new Set(reasons)];
  const finalReasons = uniqueReasons.slice(0, 6);

  // Apply floor and ceiling with enhanced scale
  score = Math.max(0, Math.min(15, score));

  // Enhanced risk level determination with more granular thresholds
  let level: "Low" | "Medium" | "High";
  if (score <= 3) {
    level = "Low";
  } else if (score <= 8) {
    level = "Medium";
  } else {
    level = "High";
  }

  return {
    score,
    level,
    reasons: finalReasons,
  };
}
