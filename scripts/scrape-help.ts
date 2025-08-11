
// Type definitions for better type safety
interface FormationData {
  id: string;
  name: string;
  description: string;
  category: string;
  drone_count: number;
  duration: number;
  thumbnail_url: string;
  file_url: string | null;
  price: number | null;
  created_by: string;
  is_public: boolean;
  tags: string;
  formation_data: string;
  metadata: string;
  source: string;
  source_id: string;
  sync_status: string;
  download_count: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

interface DronePosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AdminDashboardData {
  overview: {
    total_users: number;
    total_organizations: number;
    total_formations: number;
    total_bookings: number;
    total_sync_jobs: number;
  };
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
    by_type: Array<{ user_type: string; count: number }>;
  };
  formations: {
    total: number;
    by_category: Array<{ category: string; count: number }>;
    most_popular: Array<{ id: string; name: string; downloads: number; rating: number }>;
  };
  bookings: {
    total: number;
    pending: number;
    by_status: Array<{ status: string; count: number }>;
  };
  activity: {
    recent_events: unknown[];
    daily_active_users: number;
  };
}


#!/usr/bin/env bun
/**
 * Scrape public SkyStage help guides and save normalized JSON into src/data/help/guides.
 * Non-fatal on 404s. Follows internal links up to depth=2 additionally.
 */
import fs from "fs-extra";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const ROOT = "https://www.skystage.com";
const OUT_DIR = path.join(process.cwd(), "src/data/help/guides");

const SEED_GUIDE_PATHS = [
  "/guides/intro-to-skystage",
  "/guides/booking-a-drone-show",
  "/guides/show-booking-faq",
  "/guides/make-drone-show-skystage-10-minutes",
  "/guides/custom-formations-text-logos-2d",
  "/guides/add-effects-to-formations",
  "/guides/import-blender-file-to-skytage",
  "/guides/fly-skystage-show-skybrush-dss",
  "/guides/using-the-platform",
  "/guides/using-teams",
  "/guides/setting-up-an-artist-profile",
  "/guides/using-libraries",
  "/guides/sharing-formations-libraries-and-shows",
  "/guides/embedding-libraries-on-your-website",
  "/guides/manage-your-formation-library-and-shows-public-access-settings",
  "/guides/pinning-formations",
  "/guides/custom-formation-requests",
  "/guides/selling-your-formations",
  "/guides/enabling-payouts",
  "/guides/exporting-your-show",
  "/guides/using-the-show-builder",
  "/guides/reordering-formations",
  "/guides/adding-new-formations-to-a-show",
  "/guides/how-to-use-formation-effects",
  "/guides/intro-to-canvassing",
  "/guides/how-to-use-the-mapping-tool",
  "/guides/2d-formation-creation",
  "/guides/create-a-2d-formation-using-figma",
  "/guides/svg-quickstart-guide"
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function get(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(String(res.status));
  return await res.text();
}

function extract($: cheerio.CheerioAPI, url: string) {
  const title = $("title").first().text().trim() || $("h1").first().text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") || "";

  // Gather headings and sections
  const sections: { heading: string; html: string }[] = [];
  const body = $("main, body").first();
  const nodes = body.find("h1, h2, h3, p, ul, ol, pre, code, img, blockquote");
  let current: { heading: string; html: string } | null = null;
  nodes.each((_, el) => {
    const tag = (el as any).tagName?.toLowerCase?.() ?? "";
    if (["h1", "h2", "h3"].includes(tag)) {
      if (current) sections.push(current);
      current = { heading: $(el).text().trim() || "", html: "" };
    } else if (current) {
      current.html += $.html(el);
    }
  });
  if (current) sections.push(current);
  if (sections.length === 0) {
    sections.push({ heading: "Overview", html: body.html() || "" });
  }

  // Images
  const images = new Set<string>();
  body.find("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src) images.add(src.startsWith("http") ? src : new URL(src, url).toString());
  });

  const links = new Set<string>();
  body.find("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    try {
      const u = new URL(href, url);
      if (u.hostname === new URL(ROOT).hostname && u.pathname.startsWith("/guides/")) links.add(u.toString());
    } catch {}
  });

  const plaintext = body.text().replace(/\s+/g, " ").trim();

  return { title, description: metaDesc, sections, images: Array.from(images), links: Array.from(links), plaintext };
}

async function scrape() {
  await fs.ensureDir(OUT_DIR);
  const index: unknown[] = [];
  const queue: string[] = Array.from(new Set(SEED_GUIDE_PATHS.map((p) => new URL(p, ROOT).toString())));
  const seen = new Set<string>();
  const depthMap = new Map<string, number>();
  queue.forEach((u) => depthMap.set(u, 0));
  const MAX_DEPTH = 3;

  for (let i = 0; i < queue.length; i++) {
    const url = queue[i];
    if (seen.has(url)) continue;
    const depth = depthMap.get(url) ?? 0;
    seen.add(url);
    try {
      const html = await get(url);
      const $ = cheerio.load(html);
      const data = extract($, url);
      const slug = slugify(data.title || url.split("/").pop() || "guide");
      const file = path.join(OUT_DIR, `${slug}.json`);
      await fs.writeJson(file, { url, ...data, slug }, { spaces: 2 });
      index.push({ slug, title: data.title, description: data.description });
      console.log("Scraped", url, "->", slug, "depth", depth);
      if (depth < MAX_DEPTH) {
        for (const link of data.links) {
          if (!seen.has(link) && !queue.includes(link)) {
            queue.push(link);
            depthMap.set(link, depth + 1);
          }
        }
      }
    } catch (e) {
      console.warn("Skip", url, "status:", String(e));
    }
  }

  await fs.writeJson(path.join(OUT_DIR, "index.json"), index, { spaces: 2 });
  console.log(`Saved ${index.length} guides to ${OUT_DIR}`);
}

scrape().catch((e) => {
  console.error(e);
  process.exit(1);
});
