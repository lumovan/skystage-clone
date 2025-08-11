'use client';

import { useState } from 'react';
import { X, CreditCard, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createCheckoutSession,
  bookShow,
  SHOW_PRICING,
  SUBSCRIPTION_TIERS
} from '@/lib/stripe-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'booking' | 'subscription';
  data?: any;
}

export default function PaymentModal({ isOpen, onClose, mode, data }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState('medium');
  const [selectedTier, setSelectedTier] = useState('grow');

  if (!isOpen) return null;

  const handleBookingPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await bookShow({
        showType: selectedPackage as keyof typeof SHOW_PRICING,
        date: data?.date || new Date().toISOString(),
        location: data?.location || 'TBD',
        duration: data?.duration || 10,
        formations: data?.formations || [],
        extras: data?.extras,
      });
    } catch (error: unknown) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await createCheckoutSession({
        priceId: SUBSCRIPTION_TIERS[selectedTier as keyof typeof SUBSCRIPTION_TIERS].priceId!,
        mode: 'subscription',
        successUrl: `${window.location.origin}/dashboard?subscription=success`,
        cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
        metadata: {
          tier: selectedTier,
        },
      });
    } catch (error: unknown) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {mode === 'booking' ? 'Book Your Drone Show' : 'Choose Your Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {mode === 'booking' ? (
            <>
              {/* Show Package Selection */}
              <div className="mb-6">
                <Label className="text-lg font-semibold mb-3 block">Select Package</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(SHOW_PRICING).map(([key, pkg]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPackage(key)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPackage === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{pkg.name}</div>
                      <div className="text-sm text-gray-600">{pkg.drones} drones</div>
                      <div className="text-2xl font-bold mt-2">
                        {pkg.basePrice ? `$${pkg.basePrice.toLocaleString()}` : 'Contact us'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{pkg.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Show Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{data?.date || 'To be determined'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>{data?.location || 'To be determined'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{data?.duration || 10} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formations:</span>
                    <span>{data?.formations?.length || 0} selected</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Subscription Tier Selection */}
              <div className="mb-6">
                <Label className="text-lg font-semibold mb-3 block">Select Plan</Label>
                <div className="space-y-4">
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTier(key)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedTier === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-lg">{tier.name}</div>
                          <div className="text-2xl font-bold">
                            {tier.price ? `$${tier.price}/month` : tier.price === 0 ? 'Free' : 'Contact us'}
                          </div>
                        </div>
                        {selectedTier === key && (
                          <div className="bg-blue-500 text-white p-1 rounded-full">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {tier.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center mb-6 text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-2" />
            Secure payment powered by Stripe
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={mode === 'booking' ? handleBookingPayment : handleSubscriptionPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {mode === 'booking' ? 'Book & Pay' : 'Subscribe'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
