"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSubmissionSchema, type FormSubmission, type RiskResult } from '../shared/schema';
import { Button } from '../client/src/components/ui/button';
import { Input } from '../client/src/components/ui/input';
import { Label } from '../client/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../client/src/components/ui/select';
import { RadioGroup, RadioGroupItem } from '../client/src/components/ui/radio-group';
import { Checkbox } from '../client/src/components/ui/checkbox';
import { Card, CardContent } from '../client/src/components/ui/card';
import { Loader2 } from 'lucide-react';

interface FormProps {
  onSuccess: (result: RiskResult) => void;
}

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'SG', label: 'Singapore' },
  { value: 'IN', label: 'India' },
  { value: 'PH', label: 'Philippines' },
  { value: 'Other', label: 'Other' },
];

const contractTypes = [
  { value: 'independent', label: 'Independent Contractor' },
  { value: 'agency', label: 'Agency' },
  { value: 'eor', label: 'Employee of Record' },
];

export default function Form({ onSuccess }: FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  const form = useForm<FormSubmission>({
    resolver: zodResolver(formSubmissionSchema),
    defaultValues: {
      email: '',
      country: '',
      contract_type: 'independent',
      contract_value_usd: 0,
      data_processing: false,
      consent: false,
    },
  });

  const onSubmit = async (data: FormSubmission) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get risk score');
      }

      const result: RiskResult = await response.json();
      setResultId(result.id);
      
      // Notify that results are ready (for time tracking)
      await fetch('/api/result_ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: result.id }),
      });

      onSuccess(result);

    } catch (error) {
      console.error('Form submission error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border border-gray-200">
      <CardContent className="p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Work Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Work Email <span className="text-danger">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              {...form.register('email')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-danger mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Contractor Country */}
          <div>
            <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Contractor Country <span className="text-danger">*</span>
            </Label>
            <Select onValueChange={(value) => form.setValue('country', value)}>
              <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.country && (
              <p className="text-sm text-danger mt-1">{form.formState.errors.country.message}</p>
            )}
          </div>

          {/* Contract Type */}
          <div>
            <Label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-2">
              Contract Type <span className="text-danger">*</span>
            </Label>
            <Select onValueChange={(value) => form.setValue('contract_type', value as 'independent' | 'agency' | 'eor')}>
              <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.contract_type && (
              <p className="text-sm text-danger mt-1">{form.formState.errors.contract_type.message}</p>
            )}
          </div>

          {/* Contract Value */}
          <div>
            <Label htmlFor="contractValue" className="block text-sm font-medium text-gray-700 mb-2">
              Contract Value (USD) <span className="text-danger">*</span>
            </Label>
            <Input
              id="contractValue"
              type="number"
              min="0"
              step="1000"
              placeholder="50000"
              {...form.register('contract_value_usd', { valueAsNumber: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
            {form.formState.errors.contract_value_usd && (
              <p className="text-sm text-danger mt-1">{form.formState.errors.contract_value_usd.message}</p>
            )}
          </div>

          {/* Data Processing */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Data Processing Needed? <span className="text-danger">*</span>
            </Label>
            <RadioGroup 
              onValueChange={(value) => form.setValue('data_processing', value === 'yes')}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="data-yes" />
                <Label htmlFor="data-yes" className="text-sm text-gray-700">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="data-no" />
                <Label htmlFor="data-no" className="text-sm text-gray-700">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={form.watch('consent')}
              onCheckedChange={(checked) => form.setValue('consent', !!checked)}
              className="mt-1"
            />
            <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
              I agree to share my inputs for pilot analysis. <span className="text-danger">*</span>
            </Label>
          </div>
          {form.formState.errors.consent && (
            <p className="text-sm text-danger">{form.formState.errors.consent.message}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Get Risk Score'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
