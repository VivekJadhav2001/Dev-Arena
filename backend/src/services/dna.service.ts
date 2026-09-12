import type { IGitHubStats } from "../models/user.model.js";
import type { Persona } from "../utils/constants.js";

export interface DeveloperDNA { persona: Persona; personaReason: string; scores: Record<string, number>; traits: Array<{ label: string; score: number }>; languageProfile: Record<string, number>; activityHeatmap: Array<{ day: string; count: number }>; updatedAt: Date }

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
export function calculateDNA(stats: IGitHubStats): DeveloperDNA {
  const languageCount = stats.languages instanceof Map ? stats.languages.size : Object.keys(stats.languages ?? {}).length;
  const consistency = clamp(stats.codingConsistency ?? stats.longestStreak * 3);
  const craft = clamp(stats.totalRepos * 5 + stats.totalCommits / 3);
  const community = clamp(stats.openSourceScore ?? stats.stars + stats.followers);
  const breadth = clamp(languageCount * 18);
  let persona: Persona = "The Explorer";
  let personaReason = "Your activity is growing across a range of developer signals.";
  if (languageCount >= 4) { persona = "The Polyglot"; personaReason = `You work across ${languageCount} languages.`; }
  else if (consistency >= 60) { persona = "The Consistent Coder"; personaReason = `Your ${stats.longestStreak}-day best streak shows a reliable coding rhythm.`; }
  else if (community >= 65) { persona = "The Open Source Warrior"; personaReason = "Your repositories, stars and followers show meaningful open-source impact."; }
  else if (craft >= 55) { persona = "The Builder"; personaReason = "Your repository and commit activity shows a strong habit of shipping."; }
  else if (stats.topLanguage) { persona = "The Specialist"; personaReason = `${stats.topLanguage} is the clearest signal in your current GitHub profile.`; }
  const source = Object.entries(stats.languages instanceof Map ? Object.fromEntries(stats.languages) : stats.languages ?? {});
  const total = source.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  return { persona, personaReason, scores: { consistency, craft, community, breadth }, traits: [{ label: "Consistency", score: consistency }, { label: "Craft", score: craft }, { label: "Community", score: community }, { label: "Breadth", score: breadth }], languageProfile: Object.fromEntries(source.map(([name, bytes]) => [name, clamp(bytes / total * 100)])), activityHeatmap: [], updatedAt: new Date() };
}
