import React from 'react';
import { Shield, X } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3 h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">Compliance Risk Pilot</h1>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Collection</h3>
              <p className="text-gray-700 mb-6">
                This pilot tool collects minimal data necessary for compliance risk assessment and pilot analytics:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Work email address (used as unique identifier)</li>
                <li>Contractor details (country, contract type, value, data processing needs)</li>
                <li>Usage metrics (time to complete assessment, PDF downloads, feedback)</li>
                <li>Last octet of IP address only (privacy-preserving analytics)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Usage</h3>
              <p className="text-gray-700 mb-6">
                Your data is used exclusively for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Generating your compliance risk assessment</li>
                <li>Creating your downloadable PDF report</li>
                <li>Improving the pilot tool through aggregated analytics</li>
                <li>Research and development of compliance tools</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Storage & Security</h3>
              <p className="text-gray-700 mb-6">
                Data is stored securely in Google Sheets with restricted access. We implement industry-standard security measures and retain data only for the duration of the pilot program.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h3>
              <p className="text-gray-700 mb-6">
                You have the right to request deletion of your data at any time. Contact us to exercise this right or for any privacy-related questions.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                <p className="text-sm text-blue-800">
                  <i className="fas fa-info-circle mr-2"></i>
                  This is a pilot tool for research purposes. No legal advice is provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}