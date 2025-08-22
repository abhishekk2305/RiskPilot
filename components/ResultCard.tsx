"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../client/src/components/ui/card';
import { Button } from '../client/src/components/ui/button';
import { Shield, Download, Plus, ThumbsUp, ThumbsDown, Check, Info } from 'lucide-react';
import type { RiskResult } from '../shared/schema';

interface ResultCardProps {
  result: RiskResult;
  onNewAssessment: () => void;
}

export default function ResultCard({ result, onNewAssessment }: ResultCardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [timingReported, setTimingReported] = useState(false);

  // Report timing when result is visible
  useEffect(() => {
    if (!timingReported && result.id) {
      const submitAt = sessionStorage.getItem(`submitAt:${result.id}`);
      if (submitAt) {
        const tFirstResultMs = Date.now() - Number(submitAt);
        
        // Send timing to server
        fetch('/api/result-ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: result.id, tFirstResultMs })
        }).then(() => {
          setTimingReported(true);
          // Clean up sessionStorage
          sessionStorage.removeItem(`submitAt:${result.id}`);
        }).catch(console.error);
      }
    }
  }, [result.id, timingReported]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/report?id=${result.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compliance-Risk-Report-${result.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFeedback = async (feedback: 'yes' | 'no') => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: result.id,
          feedback,
        }),
      });

      if (response.ok) {
        setFeedbackGiven(true);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const getRiskBadgeClass = () => {
    switch (result.level) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-lg border border-gray-200">
      <CardContent className="p-8">
        {/* Risk Level Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold mb-4 ${getRiskBadgeClass()}`}>
            <Shield className="mr-2 h-6 w-6" />
            Risk Level: {result.level}
          </div>
          <p className="text-gray-600">Assessment completed</p>
        </div>

        {/* Risk Reasons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Why we scored this way:</h3>
          <ul className="space-y-3">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start">
                <Check className="text-gray-400 mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                <span className="text-gray-700">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Generating...' : 'Download PDF Report'}
          </Button>
          <Button
            onClick={onNewAssessment}
            variant="outline"
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </div>

        {/* Feedback Section */}
        {!feedbackGiven ? (
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-700 mb-4">Was this useful?</p>
            <div className="flex space-x-4">
              <Button
                onClick={() => handleFeedback('yes')}
                className="px-6 py-2 bg-success text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Yes
              </Button>
              <Button
                onClick={() => handleFeedback('no')}
                variant="outline"
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                No
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600 flex items-center">
              <Check className="text-success mr-2 h-4 w-4" />
              Thank you for your feedback!
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <Info className="mr-2 h-4 w-4" />
            Pilot only—this is not legal advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
