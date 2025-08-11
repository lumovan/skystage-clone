"use client";

import React from 'react';
import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Send,
  Heart,
  ExternalLink
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Show Builder', href: '/show-builder' },
      { name: 'Formation Library', href: '/discover' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'API Documentation', href: '/api-docs' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press Kit', href: '/press' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Help Center', href: '/help' },
      { name: 'Tutorials', href: '/tutorials' },
      { name: 'Community Forum', href: '/community' },
      { name: 'Developer Guide', href: '/developers' },
      { name: 'Status Page', href: '/status' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Licenses', href: '/licenses' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/skystage' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/skystage' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/skystage' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/skystage' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/skystage' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Stay Updated with SkyStage
              </h3>
              <p className="text-gray-400">
                Get the latest news, updates, and exclusive offers delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2">
                <span>Subscribe</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="font-bold text-xl text-white">SkyStage</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-xs">
              Design and book the drone show of your dreams. Professional-grade platform for creating spectacular aerial displays.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-1"
                  >
                    <span>{link.name}</span>
                    {link.href.startsWith('http') && (
                      <ExternalLink className="h-3 w-3" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Email Us</p>
                <a href="mailto:hello@skystage.com" className="text-sm text-white hover:text-blue-400">
                  hello@skystage.com
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Call Us</p>
                <a href="tel:+15551234567" className="text-sm text-white hover:text-blue-400">
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Visit Us</p>
                <p className="text-sm text-white">
                  123 Innovation St, Tech City, TC 12345
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <span>© {currentYear} SkyStage. All rights reserved.</span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                Made with <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" /> by SkyStage Team
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                Sitemap
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                Accessibility
              </Link>
              <select
                className="bg-gray-800 text-gray-400 px-3 py-1 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                defaultValue="en"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
