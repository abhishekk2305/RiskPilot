// Local storage for assessment data when Google Sheets isn't available
interface AssessmentData {
  id: string;
  timestamp_iso: string;
  email: string;
  country: string;
  contract_type: string;
  contract_value_usd: number;
  data_processing: boolean;
  score: number;
  level: string;
  time_to_result_ms: number | null;
  downloaded_pdf: boolean;
  feedback: string | null;
  user_agent: string;
  ip_last_octet: string;
  reasons: string;
}

// In-memory storage (in production, use Redis or a database)
const assessmentStore = new Map<string, AssessmentData>();

export function storeAssessment(data: AssessmentData): void {
  assessmentStore.set(data.id, data);
  console.log(`Stored assessment data locally for ID: ${data.id}`);
}

export function getAssessment(id: string): AssessmentData | null {
  const data = assessmentStore.get(id);
  if (data) {
    console.log(`Retrieved assessment data locally for ID: ${id}`);
    return data;
  }
  console.log(`Assessment data not found locally for ID: ${id}`);
  return null;
}

export function updateAssessment(id: string, updates: Partial<AssessmentData>): boolean {
  const existing = assessmentStore.get(id);
  if (existing) {
    const updated = { ...existing, ...updates };
    assessmentStore.set(id, updated);
    console.log(`Updated assessment data locally for ID: ${id}`);
    return true;
  }
  return false;
}

export function getAllAssessments(): AssessmentData[] {
  return Array.from(assessmentStore.values()).sort((a, b) => 
    new Date(b.timestamp_iso).getTime() - new Date(a.timestamp_iso).getTime()
  );
}

export function getRecentAssessments(limit: number = 20): AssessmentData[] {
  const all = getAllAssessments();
  return all.slice(0, limit);
}