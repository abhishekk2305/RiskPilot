import * as fs from 'fs';
import * as path from 'path';

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
  t_backend_ms: number | null;
  time_to_result_ms: number | null;
  downloaded_pdf: boolean;
  feedback: string | null;
  user_agent: string;
  ip_last_octet: string;
  reasons: string;
}

// File-based storage path
const DATA_DIR = path.join(process.cwd(), 'data');
const ASSESSMENTS_FILE = path.join(DATA_DIR, 'assessments.json');

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load assessments from file
function loadAssessments(): AssessmentData[] {
  try {
    ensureDataDir();
    if (fs.existsSync(ASSESSMENTS_FILE)) {
      const data = fs.readFileSync(ASSESSMENTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading assessments:', error);
  }
  return [];
}

// Save assessments to file
function saveAssessments(assessments: AssessmentData[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2));
  } catch (error) {
    console.error('Error saving assessments:', error);
  }
}

export function storeAssessment(data: AssessmentData): void {
  const assessments = loadAssessments();
  // Remove existing entry with same ID
  const filtered = assessments.filter(a => a.id !== data.id);
  // Add new entry
  filtered.push(data);
  saveAssessments(filtered);
  console.log(`Stored assessment data to file for ID: ${data.id}`);
}

export function getAssessment(id: string): AssessmentData | null {
  const assessments = loadAssessments();
  const data = assessments.find(a => a.id === id);
  if (data) {
    console.log(`Retrieved assessment data from file for ID: ${id}`);
    return data;
  }
  console.log(`Assessment data not found in file for ID: ${id}`);
  return null;
}

export function updateAssessment(id: string, updates: Partial<AssessmentData>): boolean {
  const assessments = loadAssessments();
  const index = assessments.findIndex(a => a.id === id);
  if (index !== -1) {
    assessments[index] = { ...assessments[index], ...updates };
    saveAssessments(assessments);
    console.log(`Updated assessment data in file for ID: ${id}`);
    return true;
  }
  return false;
}

export function getAllAssessments(): AssessmentData[] {
  const assessments = loadAssessments();
  return assessments.sort((a, b) => {
    const aTime = a.timestamp_iso || a.timestamp || '1970-01-01';
    const bTime = b.timestamp_iso || b.timestamp || '1970-01-01';
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function getRecentAssessments(limit: number = 20): AssessmentData[] {
  const all = getAllAssessments();
  return all.slice(0, limit);
}