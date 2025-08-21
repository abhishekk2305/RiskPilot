import { google } from 'googleapis';

interface ExportOptions {
  format: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  riskLevel?: string | null;
  country?: string | null;
}

interface AggregatedExportOptions {
  includeTimeDistribution: boolean;
  includeFeedbackStats: boolean;
  groupBy: string;
}

const SHEET_NAME = 'pilot_logs';

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

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCsvRow(row: any[]): string {
  return row.map(escapeCSVField).join(',');
}

export async function exportRawDataToCsv(options: ExportOptions): Promise<string> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return 'No data available for export';
    }

    // Header row
    const headers = [
      'ID',
      'Timestamp',
      'Email',
      'Country',
      'Contract Type',
      'Contract Value (USD)',
      'Data Processing',
      'Risk Score',
      'Risk Level',
      'Time to Result (ms)',
      'PDF Downloaded',
      'Feedback',
      'User Agent',
      'IP Last Octet',
      'Risk Reasons'
    ];

    // Apply filters
    let filteredRows = rows.slice(1); // Skip header row from sheets

    // Date filtering
    if (options.dateFrom) {
      const fromDate = new Date(options.dateFrom);
      filteredRows = filteredRows.filter(row => {
        const rowDate = new Date(row[1]);
        return rowDate >= fromDate;
      });
    }

    if (options.dateTo) {
      const toDate = new Date(options.dateTo);
      filteredRows = filteredRows.filter(row => {
        const rowDate = new Date(row[1]);
        return rowDate <= toDate;
      });
    }

    // Risk level filtering
    if (options.riskLevel) {
      filteredRows = filteredRows.filter(row => row[8] === options.riskLevel);
    }

    // Country filtering
    if (options.country) {
      filteredRows = filteredRows.filter(row => row[3] === options.country);
    }

    // Format data based on export format
    let csvRows: string[] = [];

    if (options.format === 'privacy-safe') {
      // Privacy-safe export with masked emails and no IP data
      const privacyHeaders = [
        'ID',
        'Timestamp',
        'Masked Email',
        'Country',
        'Contract Type',
        'Contract Value Range',
        'Data Processing',
        'Risk Score',
        'Risk Level',
        'Time to Result (ms)',
        'PDF Downloaded',
        'Feedback',
        'Risk Reasons'
      ];
      csvRows.push(formatCsvRow(privacyHeaders));

      filteredRows.forEach(row => {
        const maskedEmail = row[2] ? `${row[2].split('@')[0].slice(0, 3)}***@${row[2].split('@')[1]}` : '';
        const valueRange = getValueRange(Number(row[5]));
        
        csvRows.push(formatCsvRow([
          row[0], // ID
          row[1], // Timestamp
          maskedEmail,
          row[3], // Country
          row[4], // Contract Type
          valueRange,
          row[6], // Data Processing
          row[7], // Score
          row[8], // Level
          row[9], // Time to Result
          row[10], // PDF Downloaded
          row[11], // Feedback
          row[14] // Risk Reasons
        ]));
      });
    } else if (options.format === 'analytics') {
      // Analytics-focused export with computed fields
      const analyticsHeaders = [
        'ID',
        'Date',
        'Week',
        'Month',
        'Country',
        'Contract Type',
        'Value Category',
        'Risk Score',
        'Risk Level',
        'Time to Result (s)',
        'PDF Downloaded',
        'Feedback',
        'Processing Time Category',
        'Value Risk Category'
      ];
      csvRows.push(formatCsvRow(analyticsHeaders));

      filteredRows.forEach(row => {
        const date = new Date(row[1]);
        const week = getWeekNumber(date);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        const valueCategory = getValueCategory(Number(row[5]));
        const timeCategory = getTimeCategory(Number(row[9]));
        const valueRiskCategory = getValueRiskCategory(Number(row[5]), row[8]);

        csvRows.push(formatCsvRow([
          row[0], // ID
          date.toISOString().split('T')[0], // Date only
          week,
          month,
          row[3], // Country
          row[4], // Contract Type
          valueCategory,
          row[7], // Score
          row[8], // Level
          row[9] ? (Number(row[9]) / 1000).toFixed(1) : '', // Convert ms to seconds
          row[10], // PDF Downloaded
          row[11], // Feedback
          timeCategory,
          valueRiskCategory
        ]));
      });
    } else {
      // Standard export with all fields
      csvRows.push(formatCsvRow(headers));
      filteredRows.forEach(row => {
        csvRows.push(formatCsvRow(row));
      });
    }

    return csvRows.join('\n');

  } catch (error) {
    console.error('Error exporting raw data to CSV:', error);
    throw new Error('Failed to export data');
  }
}

export async function exportAggregatedDataToCsv(options: AggregatedExportOptions): Promise<string> {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get all data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return 'No data available for aggregation';
    }

    const dataRows = rows.slice(1); // Skip header

    // Group data by specified period
    const groupedData = groupDataByPeriod(dataRows, options.groupBy);
    
    // Build CSV headers
    const headers = ['Period', 'Total Submissions', 'Unique Users', 'Avg Risk Score', 'Low Risk %', 'Medium Risk %', 'High Risk %', 'Avg Time to Result (s)', 'PDF Download Rate %'];
    
    if (options.includeTimeDistribution) {
      headers.push('<15s %', '15-30s %', '30-60s %', '60-120s %', '>120s %');
    }
    
    if (options.includeFeedbackStats) {
      headers.push('Useful Feedback %', 'Not Useful %', 'No Feedback %');
    }

    let csvRows: string[] = [formatCsvRow(headers)];

    // Process each period
    Object.entries(groupedData).sort().forEach(([period, data]) => {
      const stats = calculatePeriodStats(data);
      
      let row = [
        period,
        stats.totalSubmissions,
        stats.uniqueUsers,
        stats.avgRiskScore.toFixed(1),
        stats.lowRiskPercent.toFixed(1),
        stats.mediumRiskPercent.toFixed(1),
        stats.highRiskPercent.toFixed(1),
        stats.avgTimeToResult.toFixed(1),
        stats.pdfDownloadRate.toFixed(1)
      ];

      if (options.includeTimeDistribution) {
        row.push(
          stats.timeDistribution.under15s.toFixed(1),
          stats.timeDistribution.from15to30s.toFixed(1),
          stats.timeDistribution.from30to60s.toFixed(1),
          stats.timeDistribution.from60to120s.toFixed(1),
          stats.timeDistribution.over120s.toFixed(1)
        );
      }

      if (options.includeFeedbackStats) {
        row.push(
          stats.feedbackStats.useful.toFixed(1),
          stats.feedbackStats.notUseful.toFixed(1),
          stats.feedbackStats.noFeedback.toFixed(1)
        );
      }

      csvRows.push(formatCsvRow(row));
    });

    return csvRows.join('\n');

  } catch (error) {
    console.error('Error exporting aggregated data to CSV:', error);
    throw new Error('Failed to export aggregated data');
  }
}

// Helper functions
function getValueRange(value: number): string {
  if (value < 10000) return '<$10K';
  if (value < 50000) return '$10K-$50K';
  if (value < 100000) return '$50K-$100K';
  if (value < 250000) return '$100K-$250K';
  return '>$250K';
}

function getValueCategory(value: number): string {
  if (value < 25000) return 'Small';
  if (value < 100000) return 'Medium';
  return 'Large';
}

function getTimeCategory(timeMs: number): string {
  if (!timeMs) return 'Unknown';
  const seconds = timeMs / 1000;
  if (seconds < 15) return 'Very Fast';
  if (seconds < 30) return 'Fast';
  if (seconds < 60) return 'Normal';
  return 'Slow';
}

function getValueRiskCategory(value: number, riskLevel: string): string {
  if (value > 100000 && riskLevel === 'High') return 'High Value High Risk';
  if (value > 100000) return 'High Value';
  if (riskLevel === 'High') return 'High Risk';
  return 'Standard';
}

function getWeekNumber(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

function groupDataByPeriod(rows: any[][], groupBy: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  rows.forEach(row => {
    const date = new Date(row[1]);
    let period: string;

    switch (groupBy) {
      case 'week':
        period = getWeekNumber(date);
        break;
      case 'month':
        period = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      case 'day':
      default:
        period = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
    }

    if (!grouped[period]) {
      grouped[period] = [];
    }
    grouped[period].push(row);
  });

  return grouped;
}

function calculatePeriodStats(rows: any[]) {
  const uniqueEmails = new Set(rows.map(row => row[2]));
  const scores = rows.map(row => Number(row[7])).filter(s => !isNaN(s));
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  
  const riskLevels = rows.map(row => row[8]);
  const lowCount = riskLevels.filter(level => level === 'Low').length;
  const mediumCount = riskLevels.filter(level => level === 'Medium').length;
  const highCount = riskLevels.filter(level => level === 'High').length;
  const total = rows.length;

  const times = rows.map(row => Number(row[9])).filter(t => !isNaN(t) && t > 0);
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;

  const pdfDownloads = rows.filter(row => row[10] === 'true' || row[10] === true).length;
  const pdfRate = total > 0 ? (pdfDownloads / total) * 100 : 0;

  const timeDistribution = {
    under15s: times.filter(t => t < 15000).length / Math.max(times.length, 1) * 100,
    from15to30s: times.filter(t => t >= 15000 && t < 30000).length / Math.max(times.length, 1) * 100,
    from30to60s: times.filter(t => t >= 30000 && t < 60000).length / Math.max(times.length, 1) * 100,
    from60to120s: times.filter(t => t >= 60000 && t < 120000).length / Math.max(times.length, 1) * 100,
    over120s: times.filter(t => t >= 120000).length / Math.max(times.length, 1) * 100,
  };

  const feedback = rows.map(row => row[11]);
  const feedbackStats = {
    useful: feedback.filter(f => f === 'yes').length / total * 100,
    notUseful: feedback.filter(f => f === 'no').length / total * 100,
    noFeedback: feedback.filter(f => !f || f === '').length / total * 100,
  };

  return {
    totalSubmissions: total,
    uniqueUsers: uniqueEmails.size,
    avgRiskScore: avgScore,
    lowRiskPercent: (lowCount / total) * 100,
    mediumRiskPercent: (mediumCount / total) * 100,
    highRiskPercent: (highCount / total) * 100,
    avgTimeToResult: avgTime,
    pdfDownloadRate: pdfRate,
    timeDistribution,
    feedbackStats,
  };
}