import { google } from 'googleapis';
import { getAllAssessments } from './localStorage';
import type { AdminAggregates, LegacyAdminAggregates } from '../shared/schema';

const SHEET_NAME = 'pilot_logs';

interface SheetRow {
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

// In-memory cache for row index mapping (id -> row index)
const rowIndexCache = new Map<string, number>();

function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SA_EMAIL,
      private_key: process.env.GOOGLE_SA_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return auth;
}

function getSheets() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export async function appendToSheet(rowData: SheetRow): Promise<void> {
  try {
    // Check if Google Sheets is configured
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const googleServiceAccount = process.env.GOOGLE_SA_EMAIL;
    
    if (!spreadsheetId || !googleServiceAccount) {
      console.log('Google Sheets not configured, skipping logging. Set GOOGLE_SHEET_ID and GOOGLE_SA_EMAIL to enable.');
      return; // Don't fail the request if Google Sheets isn't configured
    }

    const sheets = getSheets();

    const values = [
      [
        rowData.id,
        rowData.timestamp_iso,
        rowData.email,
        rowData.country,
        rowData.contract_type,
        rowData.contract_value_usd,
        rowData.data_processing,
        rowData.score,
        rowData.level,
        rowData.t_backend_ms,
        rowData.time_to_result_ms,
        rowData.downloaded_pdf,
        rowData.feedback,
        rowData.user_agent,
        rowData.ip_last_octet,
        rowData.reasons,
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log('Successfully appended to Google Sheets');
  } catch (error) {
    console.error('Error appending to sheet:', error);
    // Don't throw error - log it and continue. This prevents Google Sheets issues from breaking the core functionality
    console.log('Continuing without Google Sheets logging...');
  }
}

export async function updateRowById(id: string, updates: Partial<SheetRow>): Promise<void> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Try to get row index from cache first
    let rowIndex = rowIndexCache.get(id);

    if (!rowIndex) {
      // Find row by scanning (limit to last 500 rows for performance)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:A`,
      });

      const rows = response.data.values || [];
      const foundIndex = rows.findIndex(row => row[0] === id);
      
      if (foundIndex === -1) {
        throw new Error(`Row with ID ${id} not found`);
      }

      rowIndex = foundIndex + 1; // Convert to 1-based index
      rowIndexCache.set(id, rowIndex);
    }

    // Column mapping
    const columnMap: Record<string, string> = {
      t_backend_ms: 'J',
      time_to_result_ms: 'K',
      downloaded_pdf: 'L',
      feedback: 'M',
    };

    // Update specific columns
    for (const [field, value] of Object.entries(updates)) {
      const column = columnMap[field];
      if (column) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!${column}${rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[value]],
          },
        });
      }
    }

  } catch (error) {
    console.error('Error updating sheet row:', error);
    throw new Error('Failed to update data in Google Sheets');
  }
}

export async function getRowById(id: string): Promise<SheetRow | null> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
    });

    const rows = response.data.values || [];
    const foundRow = rows.find(row => row[0] === id);

    if (!foundRow) {
      return null;
    }

    return {
      id: foundRow[0],
      timestamp_iso: foundRow[1],
      email: foundRow[2],
      country: foundRow[3],
      contract_type: foundRow[4],
      contract_value_usd: parseInt(foundRow[5]) || 0,
      data_processing: foundRow[6] === 'true',
      score: parseInt(foundRow[7]) || 0,
      level: foundRow[8],
      t_backend_ms: foundRow[9] ? parseInt(foundRow[9]) : null,
      time_to_result_ms: foundRow[10] ? parseInt(foundRow[10]) : null,
      downloaded_pdf: foundRow[11] === 'true',
      feedback: foundRow[12] || null,
      user_agent: foundRow[13] || '',
      ip_last_octet: foundRow[14] || '',
      reasons: foundRow[15] || '',
    };

  } catch (error) {
    console.error('Error getting row by ID:', error);
    throw new Error('Failed to retrieve data from Google Sheets');
  }
}

export async function getRecentRows(limit: number = 20): Promise<SheetRow[]> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
    });

    const rows = response.data.values || [];
    
    // Skip header row and get last N rows
    const dataRows = rows.slice(1).slice(-limit).reverse();

    return dataRows.map(row => ({
      id: row[0] || '',
      timestamp_iso: row[1] || '',
      email: row[2] || '',
      country: row[3] || '',
      contract_type: row[4] || '',
      contract_value_usd: parseInt(row[5]) || 0,
      data_processing: row[6] === 'true',
      score: parseInt(row[7]) || 0,
      level: row[8] || '',
      t_backend_ms: row[9] ? parseInt(row[9]) : null,
      time_to_result_ms: row[10] ? parseInt(row[10]) : null,
      downloaded_pdf: row[11] === 'true',
      feedback: row[12] || null,
      user_agent: row[13] || '',
      ip_last_octet: row[14] || '',
      reasons: row[15] || '',
    }));

  } catch (error) {
    console.error('Error getting recent rows:', error);
    throw new Error('Failed to retrieve data from Google Sheets');
  }
}

// New pilot aggregates function for the specific format required
export async function getPilotAggregates(): Promise<AdminAggregates> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      // Fall back to local storage if sheets not configured
      console.log('Google Sheets not configured, using local storage');
      const localAssessments = getAllAssessments();
      return calculatePilotAggregatesFromData(localAssessments);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1); // Skip header

    if (dataRows.length === 0) {
      return {
        submissions: 0,
        distinctUsers: 0,
        repeatUsers: 0,
        avgTimeToResultMs: 0,
        pctDownloaded: 0,
        pctUseful: 0,
      };
    }

    const emailCounts = new Map<string, number>();
    let totalTimeToResult = 0;
    let timeToResultCount = 0;
    let pdfDownloads = 0;
    let feedbackYes = 0;
    let feedbackNo = 0;

    dataRows.forEach(row => {
      // Email (column 2) - count occurrences
      if (row[2]) {
        emailCounts.set(row[2], (emailCounts.get(row[2]) || 0) + 1);
      }

      // Time to result (column 10)
      if (row[10]) {
        const timeMs = parseInt(row[10]);
        if (!isNaN(timeMs)) {
          totalTimeToResult += timeMs;
          timeToResultCount++;
        }
      }

      // PDF downloads (column 11)
      if (row[11] === 'true') pdfDownloads++;

      // Feedback (column 12)
      if (row[12] === 'yes') feedbackYes++;
      else if (row[12] === 'no') feedbackNo++;
    });

    const submissions = dataRows.length;
    const distinctUsers = emailCounts.size;
    const repeatUsers = Array.from(emailCounts.values()).filter(count => count >= 2).length;
    const avgTimeToResultMs = timeToResultCount > 0 ? Math.round(totalTimeToResult / timeToResultCount) : 0;
    const pctDownloaded = Math.round((pdfDownloads / submissions) * 100);
    const pctUseful = (feedbackYes + feedbackNo) > 0 ? Math.round((feedbackYes / (feedbackYes + feedbackNo)) * 100) : 0;

    return {
      submissions,
      distinctUsers,
      repeatUsers,
      avgTimeToResultMs,
      pctDownloaded,
      pctUseful,
    };

  } catch (error) {
    console.error('Error getting pilot aggregates from sheets:', error);
    // Fall back to local storage
    try {
      const localAssessments = getAllAssessments();
      return calculatePilotAggregatesFromData(localAssessments);
    } catch (localError) {
      console.error('Local storage fallback failed:', localError);
      // Return empty data as last resort
      return {
        submissions: 0,
        distinctUsers: 0,
        repeatUsers: 0,
      avgTimeToResultMs: 0,
      pctDownloaded: 0,
      pctUseful: 0,
    };
  }
  }
}

// Legacy aggregates function for existing features
export async function getLegacyAggregates(): Promise<LegacyAdminAggregates> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
    });

    const rows = response.data.values || [];
    const dataRows = rows.slice(1); // Skip header

    if (dataRows.length === 0) {
      return {
        totalUsers: 0,
        totalSubmissions: 0,
        avgTimeToResult: 0,
        pdfDownloadRate: 0,
        feedbackUsefulRate: 0,
        timeDistribution: {
          under15s: 0,
          from15to30s: 0,
          from30to60s: 0,
          from60to120s: 0,
          over120s: 0,
        },
        feedbackDistribution: {
          useful: 0,
          notUseful: 0,
          noResponse: 0,
        },
      };
    }

    const uniqueEmails = new Set();
    let totalTimeToResult = 0;
    let timeToResultCount = 0;
    let pdfDownloads = 0;
    let feedbackYes = 0;
    let feedbackNo = 0;
    let feedbackNull = 0;

    const timeDistribution = {
      under15s: 0,
      from15to30s: 0,
      from30to60s: 0,
      from60to120s: 0,
      over120s: 0,
    };

    dataRows.forEach(row => {
      // Email (column 2)
      if (row[2]) uniqueEmails.add(row[2]);

      // Time to result (column 10 - updated for new schema)
      if (row[10]) {
        const timeMs = parseInt(row[10]);
        const timeSec = timeMs / 1000;
        totalTimeToResult += timeSec;
        timeToResultCount++;

        // Time distribution
        if (timeSec < 15) timeDistribution.under15s++;
        else if (timeSec < 30) timeDistribution.from15to30s++;
        else if (timeSec < 60) timeDistribution.from30to60s++;
        else if (timeSec < 120) timeDistribution.from60to120s++;
        else timeDistribution.over120s++;
      }

      // PDF downloads (column 11 - updated for new schema)
      if (row[11] === 'true') pdfDownloads++;

      // Feedback (column 12 - updated for new schema)
      if (row[12] === 'yes') feedbackYes++;
      else if (row[12] === 'no') feedbackNo++;
      else feedbackNull++;
    });

    const totalSubmissions = dataRows.length;
    const avgTimeToResult = timeToResultCount > 0 ? totalTimeToResult / timeToResultCount : 0;
    const pdfDownloadRate = Math.round((pdfDownloads / totalSubmissions) * 100);
    const feedbackUsefulRate = Math.round((feedbackYes / (feedbackYes + feedbackNo)) * 100) || 0;

    return {
      totalUsers: uniqueEmails.size,
      totalSubmissions,
      avgTimeToResult,
      pdfDownloadRate,
      feedbackUsefulRate,
      timeDistribution,
      feedbackDistribution: {
        useful: feedbackYes,
        notUseful: feedbackNo,
        noResponse: feedbackNull,
      },
    };

  } catch (error) {
    console.error('Error getting aggregates:', error);
    throw new Error('Failed to calculate aggregates from Google Sheets');
  }
}
