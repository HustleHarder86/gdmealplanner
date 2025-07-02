'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpWithEmail } from '@/lib/firebase-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';

export default function SignupPage() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    dueDate: '',
    height: '',
    prePregnancyWeight: '',
    termsAccepted: false,
    dataUsageAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && firebaseUser) {
      router.push('/dashboard');
    }
  }, [firebaseUser, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.termsAccepted || !formData.dataUsageAccepted) {
      setError('Please accept the terms and conditions to continue');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const pregnancyProfile = {
        dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
        height: parseFloat(formData.height),
        prePregnancyWeight: parseFloat(formData.prePregnancyWeight),
      };

      const gdprConsent = {
        termsAccepted: formData.termsAccepted,
        dataUsageAccepted: formData.dataUsageAccepted,
        acceptedAt: Timestamp.now(),
      };

      await signUpWithEmail(
        formData.email,
        formData.password,
        formData.displayName || undefined,
        pregnancyProfile,
        gdprConsent
      );

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Create Your Account</h1>
        <p className="text-neutral-600 mt-2">Start managing your gestational diabetes today</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700 mb-1">
            Full Name (Optional)
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Jane Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Create a strong password"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-neutral-500">Must be at least 6 characters</p>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Pregnancy Profile</h3>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-neutral-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                required
                min="100"
                max="250"
                step="0.1"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="165"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="prePregnancyWeight" className="block text-sm font-medium text-neutral-700 mb-1">
                Pre-pregnancy Weight (kg)
              </label>
              <input
                type="number"
                id="prePregnancyWeight"
                name="prePregnancyWeight"
                value={formData.prePregnancyWeight}
                onChange={handleChange}
                required
                min="30"
                max="300"
                step="0.1"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="60"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4 space-y-3">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">GDPR Compliance & Terms</h3>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
              className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-neutral-600">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </span>
          </label>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              name="dataUsageAccepted"
              checked={formData.dataUsageAccepted}
              onChange={handleChange}
              required
              className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-neutral-600">
              I understand and consent to the following data usage:
            </span>
          </label>
          
          <div className="ml-6 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-600 space-y-1">
            <p>• Your health data (glucose readings, weight, meals) will be stored securely</p>
            <p>• Data will be used to provide personalized meal plans and recommendations</p>
            <p>• Analytics may be used to improve the service (anonymized)</p>
            <p>• You can request data deletion at any time from your profile settings</p>
            <p>• We will never share your personal health data with third parties without explicit consent</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.termsAccepted || !formData.dataUsageAccepted}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}