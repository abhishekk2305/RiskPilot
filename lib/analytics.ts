import { google } from 'googleapis';

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

export async function getTimeSeriesData(metric: string, period: string, days: number) {
  try {
    const sheets = getSheets();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return { labels: [], datasets: [] };
    }

    const dataRows = rows.slice(1); // Skip header

    // Filter data by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredRows = dataRows.filter(row => {
      const rowDate = new Date(row[1]);
      return rowDate >= cutoffDate;
    });

    // Group data by period
    const groupedData = groupDataByTimePeriod(filteredRows, period);
    
    // Generate time series based on metric
    let timeSeriesResult;
    switch (metric) {
      case 'submissions':
        timeSeriesResult = generateSubmissionsTimeSeries(groupedData);
        break;
      case 'risk-levels':
        timeSeriesResult = generateRiskLevelsTimeSeries(groupedData);
        break;
      case 'countries':
        timeSeriesResult = generateCountriesTimeSeries(groupedData);
        break;
      case 'contract-types':
        timeSeriesResult = generateContractTypesTimeSeries(groupedData);
        break;
      case 'performance':
        timeSeriesResult = generatePerformanceTimeSeries(groupedData);
        break;
      default:
        timeSeriesResult = generateSubmissionsTimeSeries(groupedData);
    }

    return timeSeriesResult;

  } catch (error) {
    console.error('Error getting time series data:', error);
    throw new Error('Failed to get time series data');
  }
}

export async function getTrendAnalysis(analysisType: string, period: string) {
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
      return { trends: [], insights: [] };
    }

    const dataRows = rows.slice(1);

    // Analyze trends based on type
    let trendAnalysis;
    switch (analysisType) {
      case 'growth':
        trendAnalysis = analyzeGrowthTrends(dataRows, period);
        break;
      case 'risk-patterns':
        trendAnalysis = analyzeRiskPatterns(dataRows);
        break;
      case 'user-behavior':
        trendAnalysis = analyzeUserBehavior(dataRows);
        break;
      case 'geographical':
        trendAnalysis = analyzeGeographicalTrends(dataRows);
        break;
      default:
        trendAnalysis = analyzeOverviewTrends(dataRows, period);
    }

    return trendAnalysis;

  } catch (error) {
    console.error('Error getting trend analysis:', error);
    throw new Error('Failed to get trend analysis');
  }
}

// Helper functions
function groupDataByTimePeriod(rows: any[][], period: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  rows.forEach(row => {
    const date = new Date(row[1]);
    let periodKey: string;

    switch (period) {
      case 'hour':
        periodKey = date.toISOString().slice(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH
        break;
      case 'day':
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = date.toISOString().slice(0, 7); // YYYY-MM
        break;
      default:
        periodKey = date.toISOString().split('T')[0];
    }

    if (!grouped[periodKey]) {
      grouped[periodKey] = [];
    }
    grouped[periodKey].push(row);
  });

  return grouped;
}

function generateSubmissionsTimeSeries(groupedData: Record<string, any[]>) {
  const sortedPeriods = Object.keys(groupedData).sort();
  const labels = sortedPeriods.map(period => new Date(period).toLocaleDateString());
  const submissionCounts = sortedPeriods.map(period => groupedData[period].length);
  const uniqueUsers = sortedPeriods.map(period => {
    const emails = new Set(groupedData[period].map(row => row[2]));
    return emails.size;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Total Submissions',
        data: submissionCounts,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Unique Users',
        data: uniqueUsers,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  };
}

function generateRiskLevelsTimeSeries(groupedData: Record<string, any[]>) {
  const sortedPeriods = Object.keys(groupedData).sort();
  const labels = sortedPeriods.map(period => new Date(period).toLocaleDateString());
  
  const lowRisk = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[8] === 'Low').length
  );
  const mediumRisk = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[8] === 'Medium').length
  );
  const highRisk = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[8] === 'High').length
  );

  return {
    labels,
    datasets: [
      {
        label: 'Low Risk',
        data: lowRisk,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Medium Risk',
        data: mediumRisk,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
      {
        label: 'High Risk',
        data: highRisk,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      }
    ]
  };
}

function generateCountriesTimeSeries(groupedData: Record<string, any[]>) {
  const sortedPeriods = Object.keys(groupedData).sort();
  const labels = sortedPeriods.map(period => new Date(period).toLocaleDateString());
  
  // Get top 5 countries overall
  const allCountries: Record<string, number> = {};
  Object.values(groupedData).flat().forEach(row => {
    allCountries[row[3]] = (allCountries[row[3]] || 0) + 1;
  });
  
  const topCountries = Object.entries(allCountries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([country]) => country);

  const datasets = topCountries.map((country, index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const data = sortedPeriods.map(period => 
      groupedData[period].filter(row => row[3] === country).length
    );

    return {
      label: country,
      data,
      borderColor: colors[index],
      backgroundColor: colors[index] + '20',
      tension: 0.4,
    };
  });

  return { labels, datasets };
}

function generateContractTypesTimeSeries(groupedData: Record<string, any[]>) {
  const sortedPeriods = Object.keys(groupedData).sort();
  const labels = sortedPeriods.map(period => new Date(period).toLocaleDateString());
  
  const independent = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[4] === 'independent').length
  );
  const agency = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[4] === 'agency').length
  );
  const eor = sortedPeriods.map(period => 
    groupedData[period].filter(row => row[4] === 'eor').length
  );

  return {
    labels,
    datasets: [
      {
        label: 'Independent',
        data: independent,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Agency',
        data: agency,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
      {
        label: 'EOR',
        data: eor,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  };
}

function generatePerformanceTimeSeries(groupedData: Record<string, any[]>) {
  const sortedPeriods = Object.keys(groupedData).sort();
  const labels = sortedPeriods.map(period => new Date(period).toLocaleDateString());
  
  const avgResponseTimes = sortedPeriods.map(period => {
    const times = groupedData[period]
      .map(row => Number(row[9]))
      .filter(time => !isNaN(time) && time > 0);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;
  });

  const pdfDownloadRates = sortedPeriods.map(period => {
    const total = groupedData[period].length;
    const downloads = groupedData[period].filter(row => row[10] === 'true' || row[10] === true).length;
    return total > 0 ? (downloads / total) * 100 : 0;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Avg Response Time (s)',
        data: avgResponseTimes,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'PDF Download Rate (%)',
        data: pdfDownloadRates,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };
}

// Trend analysis functions
function analyzeGrowthTrends(rows: any[][], period: string) {
  const groupedData = groupDataByTimePeriod(rows, period);
  const sortedPeriods = Object.keys(groupedData).sort();
  
  const growth = [];
  for (let i = 1; i < sortedPeriods.length; i++) {
    const current = groupedData[sortedPeriods[i]].length;
    const previous = groupedData[sortedPeriods[i - 1]].length;
    const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    growth.push({
      period: sortedPeriods[i],
      growthRate: growthRate.toFixed(1),
      submissions: current,
    });
  }

  const insights = [
    {
      type: 'growth',
      message: growth.length > 0 ? 
        `Average growth rate: ${(growth.reduce((sum, g) => sum + parseFloat(g.growthRate), 0) / growth.length).toFixed(1)}%` :
        'Insufficient data for growth analysis',
    }
  ];

  return { trends: growth, insights };
}

function analyzeRiskPatterns(rows: any[][]) {
  const riskLevels = rows.map(row => row[8]);
  const riskCounts = {
    Low: riskLevels.filter(level => level === 'Low').length,
    Medium: riskLevels.filter(level => level === 'Medium').length,
    High: riskLevels.filter(level => level === 'High').length,
  };

  const total = rows.length;
  const highRiskPercentage = (riskCounts.High / total) * 100;

  const insights = [
    {
      type: 'risk',
      message: `${highRiskPercentage.toFixed(1)}% of assessments result in High risk`,
    },
    {
      type: 'risk',
      message: riskCounts.Low > riskCounts.High ? 
        'Most assessments are classified as Low risk' : 
        'High risk assessments are common',
    }
  ];

  return { trends: Object.entries(riskCounts).map(([level, count]) => ({ level, count })), insights };
}

function analyzeUserBehavior(rows: any[][]) {
  const pdfDownloads = rows.filter(row => row[10] === 'true' || row[10] === true).length;
  const feedbackProvided = rows.filter(row => row[11] && row[11] !== '').length;
  const total = rows.length;

  const downloadRate = (pdfDownloads / total) * 100;
  const feedbackRate = (feedbackProvided / total) * 100;

  const insights = [
    {
      type: 'behavior',
      message: `${downloadRate.toFixed(1)}% of users download the PDF report`,
    },
    {
      type: 'behavior',
      message: `${feedbackRate.toFixed(1)}% of users provide feedback`,
    }
  ];

  return { 
    trends: [
      { metric: 'PDF Downloads', percentage: downloadRate },
      { metric: 'Feedback Rate', percentage: feedbackRate }
    ], 
    insights 
  };
}

function analyzeGeographicalTrends(rows: any[][]) {
  const countries: Record<string, number> = {};
  rows.forEach(row => {
    countries[row[3]] = (countries[row[3]] || 0) + 1;
  });

  const sortedCountries = Object.entries(countries)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const insights = [
    {
      type: 'geographical',
      message: `Top country: ${sortedCountries[0]?.[0]} (${sortedCountries[0]?.[1]} submissions)`,
    },
    {
      type: 'geographical',
      message: `${Object.keys(countries).length} countries represented`,
    }
  ];

  return { 
    trends: sortedCountries.map(([country, count]) => ({ country, count })), 
    insights 
  };
}

function analyzeOverviewTrends(rows: any[][], period: string) {
  const groupedData = groupDataByTimePeriod(rows, period);
  const recentPeriods = Object.keys(groupedData).sort().slice(-7); // Last 7 periods
  
  const avgSubmissions = recentPeriods.reduce((sum, period) => 
    sum + groupedData[period].length, 0) / recentPeriods.length;

  const avgRiskScore = rows.reduce((sum, row) => 
    sum + Number(row[7]), 0) / rows.length;

  const insights = [
    {
      type: 'overview',
      message: `Average ${avgSubmissions.toFixed(1)} submissions per ${period}`,
    },
    {
      type: 'overview',
      message: `Average risk score: ${avgRiskScore.toFixed(1)}/15`,
    }
  ];

  return { 
    trends: recentPeriods.map(period => ({
      period,
      submissions: groupedData[period].length,
      avgRiskScore: groupedData[period].reduce((sum, row) => sum + Number(row[7]), 0) / groupedData[period].length
    })), 
    insights 
  };
}