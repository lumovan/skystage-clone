"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  Globe,
  Shield,
  ArrowRight,
  Play,
  Star,
  CheckCircle,
  Users,
  Award,
  Rocket,
  Heart
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Design',
      description: 'Create stunning formations with our intelligent AI assistant that suggests optimal patterns and transitions.'
    },
    {
      icon: Globe,
      title: 'Global Library',
      description: 'Access thousands of professional formations from our extensive library, updated daily with new designs.'
    },
    {
      icon: Zap,
      title: 'Real-time Preview',
      description: 'See your drone show come to life with our advanced 3D preview engine before deployment.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Built-in safety checks ensure your formations comply with aviation regulations and safety standards.'
    }
  ];

  const stats = [
    { value: '2000+', label: 'Formations Available' },
    { value: '50K+', label: 'Shows Created' },
    { value: '98%', label: 'Customer Satisfaction' },
    { value: '24/7', label: 'Support Available' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Event Coordinator',
      company: 'Epic Events Co.',
      content: 'SkyStage transformed our event planning. The ease of designing custom drone shows is incredible!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Creative Director',
      company: 'Lumina Productions',
      content: 'The 3D preview feature saved us countless hours. We can perfect shows before any drone takes off.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'CEO',
      company: 'Skyline Entertainment',
      content: 'Professional-grade platform that delivers every time. Our clients are always amazed by the results.',
      rating: 5
    }
  ];

  if (!mounted) return null;

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white text-sm font-medium">New: AI Formation Generator Now Live!</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Design and Book the
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Drone Show of Your Dreams
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade platform for creating spectacular aerial displays.
              From weddings to corporate events, bring your vision to the sky.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/show-builder"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-xl"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Creating
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all"
              >
                <Play className="h-5 w-5 mr-2" />
                Browse Formations
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 pt-8">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
                <span className="text-white ml-2">4.9/5 Rating</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-white">
                <Users className="h-5 w-5" />
                <span>10,000+ Users</span>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-white">
                <Award className="h-5 w-5" />
                <span>Industry Leader</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Shows
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional tools and features designed for drone show creators of all levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Create your perfect drone show in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose or Design</h3>
              <p className="text-gray-600">
                Select from our library or create custom formations with our intuitive designer
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Preview & Perfect</h3>
              <p className="text-gray-600">
                See your show in stunning 3D and make adjustments in real-time
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Book & Fly</h3>
              <p className="text-gray-600">
                Schedule your show with certified operators and watch your vision come to life
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Event Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about SkyStage
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Create Something Amazing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of creators bringing their visions to the sky
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-white text-blue-600 rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-transparent text-white border-2 border-white rounded-lg hover:bg-white/10 transition-all"
            >
              Contact Sales
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            No credit card required • Free plan available
          </p>
        </div>
      </section>
    </div>
  );
}
