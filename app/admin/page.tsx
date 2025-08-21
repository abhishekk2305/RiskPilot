"use client";

import React, { useState, useEffect } from 'react';
import { Shield, X, Users, FileText, Clock, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MetricCard from '../../components/MetricCard';
import Chart from '../../components/Chart';
import type { AdminAggregates } from '../../shared/schema';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aggregates, setAggregates] = useState<AdminAggregates | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

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
      const [aggregatesRes, rowsRes] = await Promise.all([
        fetch('/api/admin/aggregates', {
          headers: { 'Authorization': `Bearer ${adminKey}` },
        }),
        fetch('/api/admin/rows', {
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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export-csv', {
        headers: { 'Authorization': `Bearer ${adminKey}` },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pilot-submissions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
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
                <button 
                  type="button" 
                  onClick={() => router.push('/')}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
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
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                <X className="h-5 w-5" />
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
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Users"
                value={aggregates.totalUsers.toString()}
                icon={<Users className="h-6 w-6" />}
                trend="+12% from last week"
                color="blue"
              />
              <MetricCard
                title="Submissions"
                value={aggregates.totalSubmissions.toString()}
                icon={<FileText className="h-6 w-6" />}
                trend="+8% from last week"
                color="green"
              />
              <MetricCard
                title="Avg Time to Result"
                value={`${aggregates.avgTimeToResult.toFixed(1)}s`}
                icon={<Clock className="h-6 w-6" />}
                trend="-0.3s improvement"
                color="yellow"
              />
              <MetricCard
                title="PDF Downloads"
                value={`${aggregates.pdfDownloadRate}%`}
                icon={<Download className="h-6 w-6" />}
                trend="+5% from last week"
                color="purple"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Chart
                type="bar"
                title="Time to Result Distribution"
                data={{
                  labels: ['<15s', '15-30s', '30-60s', '60-120s', '>120s'],
                  datasets: [{
                    label: 'Assessments',
                    data: [
                      aggregates.timeDistribution.under15s,
                      aggregates.timeDistribution.from15to30s,
                      aggregates.timeDistribution.from30to60s,
                      aggregates.timeDistribution.from60to120s,
                      aggregates.timeDistribution.over120s,
                    ],
                    backgroundColor: '#2563eb',
                  }]
                }}
              />
              <Chart
                type="doughnut"
                title="User Feedback"
                data={{
                  labels: ['Useful', 'Not Useful', 'No Response'],
                  datasets: [{
                    data: [
                      aggregates.feedbackDistribution.useful,
                      aggregates.feedbackDistribution.notUseful,
                      aggregates.feedbackDistribution.noResponse,
                    ],
                    backgroundColor: ['#059669', '#dc2626', '#6b7280'],
                  }]
                }}
              />
            </div>
          </>
        )}

        {/* Recent Submissions Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <i className="fas fa-download mr-2"></i>Export CSV
                </button>
                <button 
                  onClick={handleGenerateCaseStudy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <i className="fas fa-file-pdf mr-2"></i>Case Study PDF
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
                      ${submission.contract_value_usd.toLocaleString()}
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
