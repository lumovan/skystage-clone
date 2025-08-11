export type GuideSection = {
  heading: string;
  content: string;
};

export type Guide = {
  title: string;
  slug: string;
  summary: string;
  sections: GuideSection[];
  related?: string[]; // slugs
  category: string;
};

export const guides: Guide[] = [
  {
    title: "Introduction to SkyStage",
    slug: "intro-to-skystage",
    summary: "Overview of the SkyStage platform, core concepts, and how to get started quickly.",
    category: "Introduction to SkyStage",
    sections: [
      { heading: "What is SkyStage?", content: "SkyStage is a platform to design, preview, and book professional drone light shows. Use the library of formations, the Show Builder, and the 3D WebGL preview to assemble a show in minutes." },
      { heading: "Key features", content: "Formation library, Show Builder timeline, real-time 3D preview, Stripe payments, WebSocket collaboration, and export to Blender/DSS/Skybrush." },
      { heading: "Next steps", content: "Create an account, explore Discover, try the Show Builder, and review exporting and booking docs." }
    ],
    related: ["booking-a-drone-show", "using-the-show-builder"]
  },
  {
    title: "Booking a Drone Show",
    slug: "booking-a-drone-show",
    summary: "How to book a SkyStage drone show and manage payments.",
    category: "Introduction to SkyStage",
    sections: [
      { heading: "Choose formations and duration", content: "Use the Show Builder to assemble your show timeline. The price updates as you add formations and duration." },
      { heading: "Payments", content: "Checkout securely with Stripe. You will receive a confirmation and invoice automatically." },
      { heading: "After booking", content: "Our team reviews flight permissions, insurance, and logistics. You can track status from your dashboard." }
    ],
    related: ["show-booking-faq", "exporting-your-show"]
  },
  {
    title: "Show Booking FAQ",
    slug: "show-booking-faq",
    summary: "Frequently asked questions about booking, pricing, logistics, and compliance.",
    category: "Introduction to SkyStage",
    sections: [
      { heading: "Pricing", content: "Pricing varies by drone count, duration, and location. Quotes are shown before checkout and itemized on your invoice." },
      { heading: "Compliance", content: "We handle FAA/CAA permissions with our licensed pilots. Weather and NOTAMs are monitored up to show time." },
      { heading: "Cancellations", content: "Refer to your booking terms. Shows can be rescheduled due to weather; refunds are processed per contract." }
    ],
    related: ["booking-a-drone-show"]
  },
  {
    title: "Using the SkyStage Show Builder",
    slug: "using-the-show-builder",
    summary: "Build a complete drone show with a drag-and-drop timeline, effects, and real-time preview.",
    category: "Using the SkyStage Show Builder",
    sections: [
      { heading: "Timeline", content: "Drag formations to the timeline, set durations, and insert transitions. Scrub the playhead to preview." },
      { heading: "Effects", content: "Apply lighting and motion effects. Stack multiple effects per formation and adjust parameters." },
      { heading: "3D Preview", content: "Use orbit, pan, and zoom. Toggle ground grid and safety cages. Sync playback with an audio track." }
    ],
    related: ["how-to-use-formation-effects", "exporting-your-show"]
  },
  {
    title: "Exporting your Show",
    slug: "exporting-your-show",
    summary: "Export to Blender, DSS, and Skybrush. Download CSV formation data and media thumbnails.",
    category: "Using the SkyStage Platform",
    sections: [
      { heading: "Supported formats", content: "Blender .blend, DSS compatible formats, Skybrush JSON/CSV, and raw CSV for custom pipelines." },
      { heading: "Coordinate systems", content: "Choose units and axes to match your ground control software. Validate in simulator before flight." },
      { heading: "Troubleshooting", content: "If paths don’t align, verify scale, origin, and altitude offsets. Use the Mapping Tool to calibrate." }
    ],
    related: ["using-the-show-builder", "intro-to-canvassing"]
  },
  {
    title: "Create formations in 2D",
    slug: "2d-formation-creation",
    summary: "Create custom logos, text, and vector art as 2D formations.",
    category: "Create formations in 2D",
    sections: [
      { heading: "SVG import", content: "Import clean SVGs (flattened, outlines). Limit points for optimal drone counts and timing." },
      { heading: "Figma", content: "Export vector paths from Figma. Use strokes expanded to fills to maintain consistent geometry." },
      { heading: "Optimization", content: "Use simplify tools to reduce nodes; target your drone count and spacing for legibility." }
    ],
    related: ["create-a-2d-formation-using-figma", "svg-quickstart-guide"]
  }
];

export const categories = Array.from(
  new Set(guides.map((g) => g.category))
);
