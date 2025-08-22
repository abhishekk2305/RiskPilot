"use client";

import React, { useState, useEffect } from 'react';
import { Shield, X, Users, FileText, Clock, Download } from 'lucide-react';
import { Link } from 'wouter';
import AdminMetricCard from '../../../components/MetricCard';
import AdminChart from '../../../components/Chart';
import type { AdminAggregates } from '../../../shared/schema';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aggregates, setAggregates] = useState<AdminAggregates | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState('submissions');
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<any>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/aggregates', {
        headers: {
          'Authorization': `Bearer ${adminKey}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        await loadData();
      } else {
        alert('Invalid admin key');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [aggregatesRes, rowsRes, timeSeriesRes, trendsRes, notificationsRes] = await Promise.all([
        fetch('/api/admin/aggregates', {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
        fetch('/api/admin/rows', {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
        fetch(`/api/admin/time-series?metric=${selectedMetric}&period=${selectedPeriod}&days=30`, {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
        fetch('/api/admin/trends?type=overview&period=day', {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
        fetch('/api/admin/notifications', {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
      ]);

      if (aggregatesRes.ok) {
        const aggregatesData = await aggregatesRes.json();
        setAggregates(aggregatesData);
      }

      if (rowsRes.ok) {
        const rowsData = await rowsRes.json();
        setRecentSubmissions(rowsData);
      }

      if (timeSeriesRes.ok) {
        const timeSeriesData = await timeSeriesRes.json();
        setTimeSeriesData(timeSeriesData);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrendsData(trendsData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotificationConfig(notificationsData.config);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExportCSV = async (format: string) => {
    try {
      setShowExportMenu(false);
      const response = await fetch(`/api/admin/export-csv?format=${format}`, {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-data-${format}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleExportAggregated = async () => {
    try {
      setShowExportMenu(false);
      const response = await fetch('/api/admin/export-aggregated', {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Aggregates.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Aggregated export error:', error);
    }
  };

  const handleMetricChange = async (metric: string) => {
    setSelectedMetric(metric);
    try {
      const response = await fetch(`/api/admin/time-series?metric=${metric}&period=${selectedPeriod}&days=30`, {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error('Error loading time series:', error);
    }
  };

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    try {
      const response = await fetch(`/api/admin/time-series?metric=${selectedMetric}&period=${period}&days=30`, {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error('Error loading time series:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-notification' }),
      });
      
      if (response.ok) {
        alert('Test notification sent successfully! Check your configured channels.');
      } else {
        alert('Failed to send test notification');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      alert('Error sending test notification');
    }
  };

  const handleGenerateCaseStudy = async () => {
    try {
      const response = await fetch('/api/admin/case-study', {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Case-Study-Micro-Pilot.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Case study error:', error);
    }
  };

  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-6">
              <i className="fas fa-lock text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900">Admin Access</h3>
              <p className="text-gray-600 mt-2">Enter admin key to continue</p>
            </div>
            <form onSubmit={handleAuth}>
              <input 
                type="password" 
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                required
              />
              <div className="flex space-x-3">
                <Link href="/">
                  <button 
                    type="button" 
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3 h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">Compliance Risk Pilot - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a><X className="h-5 w-5" /></a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-2">Pilot metrics and analytics</p>
        </div>

        {aggregates && (
          <>
            {/* Pilot Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Avg time-to-result</h3>
                    <p className="text-3xl font-bold text-blue-600">{Math.round(aggregates.avgTimeToResultMs / 1000)} sec</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">% downloaded reports</h3>
                    <p className="text-3xl font-bold text-green-600">{aggregates.pctDownloaded}%</p>
                  </div>
                  <Download className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">% said "useful"</h3>
                    <p className="text-3xl font-bold text-purple-600">{aggregates.pctUseful}%</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Compact Charts for Screenshots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Download & Feedback Rates</h3>
                <AdminChart
                  type="bar"
                  data={{
                    labels: ['% Downloaded', '% Useful'],
                    datasets: [{
                      label: 'Percentage',
                      data: [aggregates.pctDownloaded, aggregates.pctUseful],
                      backgroundColor: ['#10b981', '#8b5cf6'],
                      borderColor: ['#059669', '#7c3aed'],
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, max: 100 }
                    }
                  }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Gauge</h3>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{Math.round(aggregates.avgTimeToResultMs / 1000)}s</div>
                    <div className="text-sm text-gray-500">Average Response</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AdminMetricCard
                title="Total Users"
                value={aggregates.distinctUsers.toString()}
                icon={<Users className="h-6 w-6" />}
                trend=""
                color="blue"
              />
              <AdminMetricCard
                title="Submissions"
                value={aggregates.submissions.toString()}
                icon={<FileText className="h-6 w-6" />}
                trend=""
                color="green"
              />
              <AdminMetricCard
                title="Repeat Users"
                value={aggregates.repeatUsers.toString()}
                icon={<Users className="h-6 w-6" />}
                trend=""
                color="yellow"
              />
              <AdminMetricCard
                title="Download Rate"
                value={`${aggregates.pctDownloaded}%`}
                icon={<Download className="h-6 w-6" />}
                trend=""
                color="purple"
              />
            </div>

            {/* Time Series Analytics */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Time Series Analytics</h3>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <select 
                        value={selectedMetric} 
                        onChange={(e) => handleMetricChange(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="submissions">Submissions</option>
                        <option value="risk-levels">Risk Levels</option>
                        <option value="countries">Countries</option>
                        <option value="contract-types">Contract Types</option>
                        <option value="performance">Performance</option>
                      </select>
                      <select 
                        value={selectedPeriod} 
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="hour">Hourly</option>
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {timeSeriesData && (
                    <AdminChart
                      type="line"
                      title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends`}
                      data={timeSeriesData}
                      options={{
                        responsive: true,
                        scales: selectedMetric === 'performance' ? {
                          y: { type: 'linear', display: true, position: 'left' },
                          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
                        } : undefined
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pilot Data Charts - Only show if we have data */}
            {aggregates.submissions > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-semibold">{Math.round(aggregates.avgTimeToResultMs / 1000)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Download Rate:</span>
                      <span className="font-semibold">{aggregates.pctDownloaded}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Feedback Rate:</span>
                      <span className="font-semibold">{aggregates.pctUseful}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Submissions:</span>
                      <span className="font-semibold">{aggregates.submissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unique Users:</span>
                      <span className="font-semibold">{aggregates.distinctUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repeat Users:</span>
                      <span className="font-semibold">{aggregates.repeatUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No Data State */}
            {aggregates.submissions === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center mb-8">
                <div className="text-gray-400 mb-4">
                  <Shield className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No pilot data yet</h3>
                <p className="text-gray-500">Start using the risk assessment form to see pilot metrics here.</p>
              </div>
            )}

            {/* Insights Panel */}
            {trendsData && trendsData.insights && trendsData.insights.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trendsData.insights.map((insight: any, index: number) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <i className={`fas ${
                              insight.type === 'growth' ? 'fa-chart-line' :
                              insight.type === 'behavior' ? 'fa-users' :
                              insight.type === 'geographical' ? 'fa-globe' :
                              'fa-info-circle'
                            } text-blue-600 mt-0.5 mr-3`}></i>
                            <p className="text-sm text-blue-800">{insight.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings Panel */}
            {showNotificationSettings && notificationConfig && (
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Email Alert Configuration</h3>
                      <button 
                        onClick={() => setShowNotificationSettings(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Current Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${notificationConfig.enabled ? 'text-green-600' : 'text-red-600'}`}>
                              {notificationConfig.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">High Risk Threshold:</span>
                            <span className="font-medium">{notificationConfig.highRiskThreshold}/15</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Admin Emails:</span>
                            <span className="font-medium">{notificationConfig.adminEmails.length} configured</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rate Limit:</span>
                            <span className="font-medium">{notificationConfig.rateLimit}/hour</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Slack Webhook:</span>
                            <span className="font-medium">{notificationConfig.webhookUrl ? 'Configured' : 'Not set'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                        <div className="space-y-3">
                          <button 
                            onClick={handleTestNotification}
                            className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            <i className="fas fa-paper-plane mr-2"></i>Send Test Alert
                          </button>
                          <div className="text-xs text-gray-500">
                            <p><strong>Test alert will trigger a high-risk notification to all configured channels.</strong></p>
                            <p className="mt-2">To configure notification settings, update your environment variables:</p>
                            <ul className="mt-1 space-y-1 list-disc list-inside">
                              <li><code>EMAIL_NOTIFICATIONS_ENABLED</code></li>
                              <li><code>ADMIN_NOTIFICATION_EMAILS</code></li>
                              <li><code>HIGH_RISK_THRESHOLD</code></li>
                              <li><code>SLACK_WEBHOOK_URL</code></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <i className="fas fa-exclamation-triangle text-yellow-600 mt-0.5 mr-3"></i>
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">Notification Triggers</p>
                          <p className="text-yellow-700 mt-1">
                            Automatic alerts are sent when assessments result in High risk level or score ≥ {notificationConfig.highRiskThreshold}.
                            This helps ensure prompt review of potentially problematic contractor arrangements.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recent Submissions Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                  >
                    <i className="fas fa-download mr-2"></i>Export Data
                    <i className="fas fa-chevron-down ml-1"></i>
                  </button>
                  {showExportMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button 
                        onClick={() => handleExportCSV('standard')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        <i className="fas fa-table mr-2"></i>Raw Data (Standard)
                      </button>
                      <button 
                        onClick={() => handleExportCSV('privacy-safe')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        <i className="fas fa-shield-alt mr-2"></i>Raw Data (Privacy-Safe)
                      </button>
                      <button 
                        onClick={() => handleExportCSV('analytics')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        <i className="fas fa-chart-line mr-2"></i>Analytics Format
                      </button>
                      <hr className="my-1" />
                      <button 
                        onClick={handleExportAggregated}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        <i className="fas fa-chart-bar mr-2"></i>Aggregated Analytics
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleGenerateCaseStudy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <i className="fas fa-file-pdf mr-2"></i>Case Study PDF
                </button>
                <button 
                  onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  <i className="fas fa-bell mr-2"></i>Alerts
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSubmissions.map((submission, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.maskedEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {submission.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {submission.contract_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${submission.contract_value_usd?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.level === 'Low' ? 'bg-green-100 text-green-800' :
                        submission.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {submission.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {submission.time_to_result_ms ? `${(submission.time_to_result_ms / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <i className={`fas ${submission.downloaded_pdf ? 'fa-check text-success' : 'fa-times text-gray-400'}`}></i>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.feedback === 'yes' && <i className="fas fa-thumbs-up text-success"></i>}
                      {submission.feedback === 'no' && <i className="fas fa-thumbs-down text-danger"></i>}
                      {!submission.feedback && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}