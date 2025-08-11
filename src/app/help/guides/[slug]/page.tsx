"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { guides } from "@/data/help-guides";
import { ChevronLeft, Copy, Printer, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function GuidePage() {
  const params = useParams();
  // next/navigation useParams returns undefined client-side until hydration
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!slug) {
    // Loading state for initial hydration
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      </>
    );
  }

  const guide = guides.find((g) => g.slug === slug);
  if (!guide) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-xl shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Guide Not Found</h2>
            <p className="text-gray-600 mb-4">Sorry, this guide does not exist.</p>
            <Link href="/help" className="text-blue-600 hover:text-blue-800">Back to Help Center</Link>
          </div>
        </div>
      </>
    );
  }

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handlePrint = () => window.print();

  // Generate table of contents
  const toc = guide.sections.map((section, index) => ({
    id: `section-${index}`,
    text: section.heading,
  }));

  return (
    <>
      <Header />
      <div className="pt-[70px] min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link href="/help" className="hover:text-gray-700 flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Help Center
            </Link>
            <span>/</span>
            <Link href="/help" className="hover:text-gray-700">
              {guide.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{guide.title}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_240px] gap-10">
            {/* Main Content */}
            <article className="prose prose-lg max-w-none">
              {/* Header */}
              <div className="not-prose mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {guide.title}
                    </h1>
                    <p className="text-xl text-gray-600">
                      {guide.summary}
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="hidden lg:flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors no-print"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-12">
                {guide.sections.map((section, index) => {
                  const sectionId = `section-${index}`;
                  return (
                    <section key={index} id={sectionId} className="scroll-mt-20">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        <a href={`#${sectionId}`} className="hover:text-blue-600 transition-colors">
                          {section.heading}
                        </a>
                      </h2>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </div>
                      <div className="mt-4 flex justify-end no-print">
                        <button
                          onClick={() => handleCopy(section.content, sectionId)}
                          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {copiedSection === sectionId ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                              <span className="text-green-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy section
                            </>
                          )}
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Related Guides */}
              {guide.related && guide.related.length > 0 && (
                <div className="mt-16 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Related Guides
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {guide.related.map((relatedSlug) => {
                      const relatedGuide = guides.find((g) => g.slug === relatedSlug);
                      if (!relatedGuide) return null;
                      return (
                        <Link key={relatedSlug} href={`/help/guides/${relatedSlug}`} className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-1">{relatedGuide.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{relatedGuide.summary}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>

            {/* Table of Contents Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[90px]">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">On this page</h3>
                  <nav className="space-y-2">
                    {toc.map((item) => (
                      <a key={item.id} href={`#${item.id}`} className="block text-sm text-gray-600 hover:text-blue-600 transition-colors py-1">
                        {item.text}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <button onClick={handlePrint} className="w-full flex items-center justify-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors">
                      <Printer className="h-4 w-4 mr-2" />
                      Print / Save PDF
                    </button>
                  </div>
                </div>
                <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Need more help?</h4>
                  <p className="text-sm text-blue-700 mb-4">Our support team is available 24/7</p>
                  <a href="mailto:support@same.new" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">Contact Support →</a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
