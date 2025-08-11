"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Book, HelpCircle, FileText, MessageCircle, Zap } from "lucide-react";
import Header from "@/components/Header";
import { categories, guides } from "@/data/help-guides";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return guides;

    return guides.filter((guide) => {
      const searchText = [
        guide.title,
        guide.summary,
        ...guide.sections.map(s => s.heading),
        ...guide.sections.map(s => s.content)
      ].join(" ").toLowerCase();

      return searchText.includes(query);
    });
  }, [searchQuery]);

  return (
    <>
      <Header />
      <div className="pt-[70px] min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
              <p className="text-xl mb-8 opacity-90">
                Search our knowledge base or browse guides below
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for guides, tutorials, and more..."
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/help/guides/intro-to-skystage" className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
              <div className="flex items-start">
                <Book className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
                  <p className="text-gray-600 text-sm">
                    Learn the basics of SkyStage and create your first drone show
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/help/guides/using-the-show-builder" className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
              <div className="flex items-start">
                <Zap className="h-8 w-8 text-purple-600 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Show Builder</h3>
                  <p className="text-gray-600 text-sm">
                    Master the timeline, effects, and 3D preview tools
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/help/guides/booking-a-drone-show" className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
              <div className="flex items-start">
                <MessageCircle className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Booking & Support</h3>
                  <p className="text-gray-600 text-sm">
                    Book shows, manage payments, and get help from our team
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="hidden md:block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-[90px]">
                <h2 className="font-semibold text-gray-900 mb-4">Browse by Category</h2>
                <nav className="space-y-4">
                  {categories.map((category) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
                      <ul className="space-y-1">
                        {guides
                          .filter((g) => g.category === category)
                          .map((guide) => (
                            <li key={guide.slug}>
                              <Link
                                href={`/help/guides/${guide.slug}`}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline block py-1"
                              >
                                {guide.title}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Search Results / Guide Grid */}
            <main>
              <div>
                {searchQuery && (
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {searchResults.length} results for "{searchQuery}"
                  </h2>
                )}

                {!searchQuery && (
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Popular Guides
                  </h2>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {searchResults.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/help/guides/${guide.slug}`}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 group"
                    >
                      <div className="flex items-start">
                        <FileText className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                            {guide.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {guide.summary}
                          </p>
                          <span className="text-xs text-gray-500 mt-2 inline-block">
                            {guide.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No guides found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search or browse categories on the left
                    </p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Still need help?
              </h2>
              <p className="text-gray-600 mb-6">
                Our support team is here to assist you
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="mailto:support@same.new"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </a>
                <Link
                  href="/help/guides/show-booking-faq"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
