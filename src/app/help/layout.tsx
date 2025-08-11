"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { categories, guides } from "@/data/help-guides";
import Header from "@/components/Header";

// Attempt to load scraped index for enhanced search (optional)
let scrapedIndex: Array<{ slug: string; title: string; description?: string; plaintext?: string }> = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const idx = require("@/data/help/guides/index.json");
  scrapedIndex = idx;
} catch {}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return guides;
    // Merge seeded meta with scraped plaintext when available
    return guides.filter((g) => {
      const scraped = scrapedIndex.find((x) => x.slug === g.slug);
      const hay = [g.title, g.summary, ...g.sections.map((s) => s.heading), scraped?.description, scraped?.plaintext]
        .filter(Boolean)
        .join(" \n ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  return (
    <>
      <Header />
      <div className="pt-[70px] min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          <aside className="md:sticky md:top-[90px] h-max border border-gray-200 rounded-xl p-4 bg-gray-50">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search help..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 skystage-text-body"
            />
            <div className="h-4" />
            <nav className="space-y-4">
              {categories.map((cat) => (
                <div key={cat}>
                  <div className="text-sm font-semibold text-gray-700 skystage-text-body">{cat}</div>
                  <ul className="mt-2 space-y-1">
                    {guides
                      .filter((g) => g.category === cat)
                      .map((g) => (
                        <li key={g.slug}>
                          <Link
                            href={`/help/guides/${g.slug}`}
                            className="text-sm text-blue-600 hover:text-blue-800 skystage-text-body"
                          >
                            {g.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
          <main>{children ?? (
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold skystage-text-body">Help Center</h1>
              <p className="text-gray-600 skystage-text-body">Search results</p>
              <div className="grid md:grid-cols-2 gap-6">
                {results.map((g) => (
                  <Link key={g.slug} href={`/help/guides/${g.slug}`} className="block border border-gray-200 rounded-lg p-5 hover:shadow-sm">
                    <div className="text-lg font-medium skystage-text-body text-gray-900">{g.title}</div>
                    <p className="text-sm text-gray-600 mt-1 skystage-text-body">{g.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}</main>
        </div>
      </div>
    </>
  );
}
