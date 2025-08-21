"use client";

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'wouter';
import ComplianceForm from '../../../components/Form';
import ComplianceResultCard from '../../../components/ResultCard';
import type { RiskResult } from '../../../shared/schema';

export default function ComplianceTool() {
  const [showResults, setShowResults] = useState(false);
  const [resultData, setResultData] = useState<RiskResult | null>(null);

  const handleFormSuccess = (result: RiskResult) => {
    setResultData(result);
    setShowResults(true);
  };

  const handleNewAssessment = () => {
    setShowResults(false);
    setResultData(null);
  };

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
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                <i className="fas fa-cog mr-1"></i>Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Contractor Compliance Risk — in 60 seconds.
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Instant risk score and PDF report. Pilot tool for HR/Compliance teams.
              </p>
              <img 
                src="https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=400" 
                alt="Professional office environment" 
                className="rounded-xl shadow-lg w-full h-64 object-cover mb-8" 
              />
            </div>

            {/* Form Component */}
            <ComplianceForm onSuccess={handleFormSuccess} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <ComplianceResultCard 
              result={resultData!} 
              onNewAssessment={handleNewAssessment}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 Compliance Risk Pilot. This is a research tool and does not constitute legal advice.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}