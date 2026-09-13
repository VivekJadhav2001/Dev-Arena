import type { ITheme } from "../models/theme.model.js";

interface Seed {
  themeId: string;
  name: string;
  description: string;
  vars: ITheme["vars"];
  isLight: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export const SEEDS: Seed[] = [
  {
    themeId: "midnight",
    name: "Midnight",
    description: "The default DevArena dark — teal spark on deep navy.",
    vars: { bg: "#07080d", surface: "#0e1016", surfaceElevated: "#151824", surfaceRaised: "#1b1f2e", border: "#232738", borderHover: "#343a52", text: "#e8eaf2", textMuted: "#9aa1b5", textSubtle: "#5d6478", primary: "#00d4aa", secondary: "#7c5cff", accent: "#ff5c8a", shadow: "#000000" },
    isLight: false, isDefault: true, sortOrder: 1,
  },
  {
    themeId: "aurora",
    name: "Aurora",
    description: "Northern lights over deep pine.",
    vars: { bg: "#06231f", surface: "#0b352e", surfaceElevated: "#0f4239", surfaceRaised: "#145044", border: "#1d5c50", borderHover: "#2a7466", text: "#eafff6", textMuted: "#8fc0b5", textSubtle: "#5d857c", primary: "#34d399", secondary: "#22d3ee", accent: "#a3e635", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 2,
  },
  {
    themeId: "sunset",
    name: "Sunset",
    description: "Ember orange melting into dusk.",
    vars: { bg: "#201109", surface: "#33200f", surfaceElevated: "#402818", surfaceRaised: "#4f3120", border: "#5c3a24", borderHover: "#7a4c2e", text: "#fff4e8", textMuted: "#d8a97e", textSubtle: "#96704f", primary: "#fb923c", secondary: "#f43f5e", accent: "#facc15", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 3,
  },
  {
    themeId: "mono",
    name: "Mono",
    description: "Strict black-on-white minimalism.",
    vars: { bg: "#fafafa", surface: "#ffffff", surfaceElevated: "#f4f4f5", surfaceRaised: "#e9e9ec", border: "#e2e2e6", borderHover: "#c9c9d1", text: "#161616", textMuted: "#6f6f6f", textSubtle: "#a3a3a3", primary: "#161616", secondary: "#525252", accent: "#737373", shadow: "#0f172a" },
    isLight: true, isDefault: false, sortOrder: 4,
  },
  {
    themeId: "forest",
    name: "Forest",
    description: "Moss, bark and a crack of sky.",
    vars: { bg: "#0d1a0f", surface: "#16281a", surfaceElevated: "#1c3321", surfaceRaised: "#24402a", border: "#2c4f34", borderHover: "#3c6a46", text: "#eef7ee", textMuted: "#93b198", textSubtle: "#5f7d66", primary: "#58b368", secondary: "#d9c27a", accent: "#7dd3fc", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 5,
  },
  {
    themeId: "neon",
    name: "Neon",
    description: "Arc II arcade — hot pink meets ice cyan.",
    vars: { bg: "#0b0713", surface: "#170f27", surfaceElevated: "#1f1433", surfaceRaised: "#281b42", border: "#35245a", borderHover: "#4a3180", text: "#f5f0ff", textMuted: "#a493c7", textSubtle: "#6f5f96", primary: "#ff2ea6", secondary: "#00e5ff", accent: "#ccff00", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 6,
  },
  {
    themeId: "ocean",
    name: "Ocean",
    description: "Deep-sea blues with a bioluminescent glow.",
    vars: { bg: "#04121f", surface: "#0a2233", surfaceElevated: "#0e2c42", surfaceRaised: "#143852", border: "#1d4a68", borderHover: "#2a5f85", text: "#eaf6ff", textMuted: "#8fb8d1", textSubtle: "#5b7f99", primary: "#38bdf8", secondary: "#6366f1", accent: "#2dd4bf", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 7,
  },
  {
    themeId: "crimson",
    name: "Crimson",
    description: "Dark romance — wine, ember and orchid.",
    vars: { bg: "#180a0e", surface: "#261016", surfaceElevated: "#32141c", surfaceRaised: "#401a24", border: "#52222e", borderHover: "#6e2e3e", text: "#fdeef1", textMuted: "#c99aa4", textSubtle: "#8a5f69", primary: "#f43f5e", secondary: "#fb923c", accent: "#e879f9", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 8,
  },
  {
    themeId: "lavender",
    name: "Lavender",
    description: "Soft ultraviolet dusk.",
    vars: { bg: "#14131f", surface: "#1e1d2e", surfaceElevated: "#26253a", surfaceRaised: "#302f48", border: "#3b3a58", borderHover: "#4f4e75", text: "#efedfb", textMuted: "#a5a3c7", textSubtle: "#6f6e94", primary: "#a78bfa", secondary: "#f0abfc", accent: "#67e8f9", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 9,
  },
  {
    themeId: "sand",
    name: "Sand",
    description: "Warm paper light mode — terracotta ink.",
    vars: { bg: "#faf7f0", surface: "#ffffff", surfaceElevated: "#f3eee2", surfaceRaised: "#e9e1cf", border: "#e3dac4", borderHover: "#c9bb9c", text: "#292524", textMuted: "#78716c", textSubtle: "#a8a29e", primary: "#c2410c", secondary: "#0f766e", accent: "#be123c", shadow: "#0f172a" },
    isLight: true, isDefault: false, sortOrder: 10,
  },
  {
    themeId: "slate",
    name: "Slate",
    description: "Cool corporate steel with electric blue.",
    vars: { bg: "#0b0e14", surface: "#12161f", surfaceElevated: "#1a2030", surfaceRaised: "#232b40", border: "#2c354d", borderHover: "#3f4b68", text: "#e2e8f0", textMuted: "#94a3b8", textSubtle: "#5b6b84", primary: "#60a5fa", secondary: "#94a3b8", accent: "#f472b6", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 11,
  },
  {
    themeId: "candy",
    name: "Candy",
    description: "Grape soda — playful pinks and gold.",
    vars: { bg: "#1c0f1e", surface: "#2c1530", surfaceElevated: "#3a1b40", surfaceRaised: "#4a2350", border: "#5c2c66", borderHover: "#7a3d88", text: "#fceffd", textMuted: "#d0a3d8", textSubtle: "#96689e", primary: "#f472b6", secondary: "#a78bfa", accent: "#facc15", shadow: "#000000" },
    isLight: false, isDefault: false, sortOrder: 12,
  },
];

/**
 * Inserts seed themes missing from the database. Never overwrites existing
 * documents, so theme edits made directly in MongoDB survive restarts.
 */
export async function ensureThemeSeeds(): Promise<{ inserted: number; total: number }> {
  const { Theme } = await import("../models/theme.model.js");
  let inserted = 0;
  for (const seed of SEEDS) {
    const exists = await Theme.exists({ themeId: seed.themeId });
    if (!exists) {
      await Theme.create(seed);
      inserted += 1;
    }
  }
  const total = await Theme.countDocuments({});
  return { inserted, total };
}

export const DEFAULT_THEME_ID = "midnight";
