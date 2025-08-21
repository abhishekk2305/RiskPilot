export interface RiskEngineInput {
  country: string;
  contractType: string;
  contractValue: number;
  dataProcessing: boolean;
}

export interface RiskEngineResult {
  score: number;
  level: "Low" | "Medium" | "High";
  reasons: string[];
}

export function riskEngine(input: RiskEngineInput): RiskEngineResult {
  let score = 0;
  const reasons: string[] = [];

  // EU/EEA/UK countries for GDPR consideration
  const euCountries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "IS", "LI", "NO"];
  
  // Low-risk countries for certain contract values
  const lowRiskCountries = ["US", "CA", "AU", "NZ", "SG"];

  // GDPR exposure check
  if (euCountries.includes(input.country) && input.dataProcessing) {
    score += 3;
    reasons.push("Data processing in EU/UK jurisdiction requires GDPR compliance");
  }

  // Country and contract value assessment
  if (lowRiskCountries.includes(input.country) && input.contractValue <= 50000) {
    // No additional points for low-risk scenario
    reasons.push("Low commercial exposure in stable jurisdiction");
  } else if (input.contractValue > 50000) {
    score += 2;
    reasons.push("Higher contract value increases commercial exposure");
  }

  // Contract type assessment
  switch (input.contractType) {
    case "independent":
      score += 2;
      reasons.push("Independent contractor status increases misclassification risk");
      break;
    case "agency":
      score += 1;
      reasons.push("Agency arrangement requires careful contract structuring");
      break;
    case "eor":
      reasons.push("Employee of Record provides good compliance protection");
      break;
  }

  // Additional scoring for very high contract values
  if (input.contractValue > 100000) {
    score += 2;
    reasons.push("Very high contract value requires enhanced due diligence");
  }

  // Ensure we have minimum reasons
  if (reasons.length < 3) {
    reasons.push("Regular compliance monitoring recommended");
  }

  // Limit to reasonable number of reasons
  const finalReasons = reasons.slice(0, 5);

  // Apply floor and ceiling
  score = Math.max(0, Math.min(10, score));

  // Determine risk level
  let level: "Low" | "Medium" | "High";
  if (score <= 2) {
    level = "Low";
  } else if (score <= 5) {
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
