import type { Request, Response } from "express";
import { Battle } from "../models/battle.model.js";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { buildRecap } from "./wrapped.controller.js";

// Primary public frontend origin. FRONTEND_URL may be a comma-separated
// allowlist — previews always point at the first entry.
const primaryFrontendUrl = env.FRONTEND_URL.split(",")[0]!.trim().replace(/\/$/, "");
const defaultCover = `${primaryFrontendUrl}/og-cover.png`;

/** Minimal HTML escaping for tag content and quoted attributes. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Preview {
  title: string;
  description: string;
  image: string;
  canonical: string;
  heading: string;
  sub: string;
}

/**
 * Crawler-first HTML page. Link scrapers (LinkedIn, X, WhatsApp) read only
 * the static `<head>` — they never run the SPA bundle — so the per-item
 * title/description/image must be in the initial HTML served at the shared
 * URL. Humans are redirected instantly to the real frontend page.
 */
function previewHtml(preview: Preview): string {
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const image = escapeHtml(preview.image);
  const canonical = escapeHtml(preview.canonical);
  const heading = escapeHtml(preview.heading);
  const sub = escapeHtml(preview.sub);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="DevArena" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<link rel="canonical" href="${canonical}" />
<meta http-equiv="refresh" content="0;url=${canonical}" />
<script>window.location.replace(${JSON.stringify(preview.canonical)});</script>
<style>body{background:#070b16;color:#e8edf7;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0}a{color:#22c55e}</style>
</head>
<body>
<main style="text-align:center;padding:24px">
<h1>${heading}</h1>
<p>${sub}</p>
<p><a href="${canonical}">Continue to DevArena</a></p>
</main>
</body>
</html>`;
}

function notFoundHtml(kind: string): string {
  return previewHtml({
    title: "DevArena — proof of skill, not just a profile",
    description: "Developer battles, DNA, rankings and season Wrapped. Make every commit count.",
    image: defaultCover,
    canonical: primaryFrontendUrl,
    heading: "DevArena",
    sub: `${kind} not found or private.`,
  });
}

/** GET /s/u/:username — link preview for a public developer profile. */
export async function getProfilePreview(req: Request, res: Response): Promise<void> {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(`^${escapeRegex(username)}$`, "i"),
    });
    if (!user || !user.settings.publicProfile) {
      res.status(404).type("html").send(notFoundHtml("Profile"));
      return;
    }
    const wins = user.battleStats?.wins ?? 0;
    const topLanguage = user.githubStats?.topLanguage;
    const description = [
      user.persona ?? "Developer",
      `Level ${user.level} · ${user.totalXp} XP`,
      `${wins} battle wins`,
      topLanguage ? `Top language: ${topLanguage}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    res
      .status(200)
      .set("Cache-Control", "public, max-age=300")
      .type("html")
      .send(
        previewHtml({
          title: `${user.userName} on DevArena`,
          description,
          image: user.avatarUrl ?? defaultCover,
          canonical: `${primaryFrontendUrl}/u/${encodeURIComponent(user.userName)}`,
          heading: `${user.userName} on DevArena`,
          sub: description,
        }),
      );
  } catch {
    res.status(404).type("html").send(notFoundHtml("Profile"));
  }
}

/** GET /s/wrapped/:username — link preview for a public season recap. */
export async function getWrappedPreview(req: Request, res: Response): Promise<void> {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({
      userName: new RegExp(`^${escapeRegex(username)}$`, "i"),
    });
    if (!user || !user.settings.publicProfile) {
      res.status(404).type("html").send(notFoundHtml("Wrapped recap"));
      return;
    }
    const recap = await buildRecap(user);
    const description =
      `${recap.totalBattles} battles · ${recap.winRate}% win rate · ` +
      `best streak ${recap.longestWinStreak}` +
      (recap.topLanguage ? ` · top language ${recap.topLanguage}` : "") +
      (recap.totalCommits > 0 ? ` · ${recap.totalCommits} commits` : "");
    res
      .status(200)
      .set("Cache-Control", "public, max-age=300")
      .type("html")
      .send(
        previewHtml({
          title: `${recap.userName}'s DevArena Wrapped`,
          description,
          image: recap.avatarUrl ?? defaultCover,
          canonical: `${primaryFrontendUrl}/wrapped/${encodeURIComponent(recap.userName)}`,
          heading: `${recap.userName}'s DevArena Wrapped`,
          sub: description,
        }),
      );
  } catch {
    res.status(404).type("html").send(notFoundHtml("Wrapped recap"));
  }
}

/** GET /s/battle/:roomCode — link preview for a finished battle. Questions stay private. */
export async function getBattlePreview(req: Request, res: Response): Promise<void> {
  try {
    const roomCode = String(req.params.roomCode).toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
      res.status(404).type("html").send(notFoundHtml("Battle"));
      return;
    }
    const battle = await Battle.findOne({ roomCode }).lean();
    if (!battle || battle.status !== "finished") {
      res.status(404).type("html").send(notFoundHtml("Battle"));
      return;
    }
    const users = await User.find({
      _id: { $in: battle.players.map((player) => player.userId) },
    }).lean();
    const nameOf = (id: unknown) =>
      users.find((candidate) => String(candidate._id) === String(id))?.userName ?? "Developer";
    const avatarOf = (id: unknown): string | null =>
      users.find((candidate) => String(candidate._id) === String(id))?.avatarUrl ?? null;
    const ranked = [...battle.players].sort((a, b) => b.score - a.score);
    const winnerName =
      battle.winnerId != null ? nameOf(battle.winnerId) : null;
    const title =
      winnerName != null
        ? `${winnerName} won battle ${battle.roomCode} on DevArena`
        : `Battle ${battle.roomCode} ended in a draw on DevArena`;
    const headline = ranked
      .slice(0, 3)
      .map((player) => `${nameOf(player.userId)} ${player.score} XP`)
      .join(" · ");
    const description =
      `${battle.mode === "royale" ? "1-vs-many royale" : "1-vs-1 duel"} · ` +
      `${battle.difficulty} · ${battle.questions.length} questions` +
      (headline ? ` · ${headline}` : "");
    const image =
      (winnerName != null && battle.winnerId != null ? avatarOf(battle.winnerId) : null) ??
      avatarOf(ranked[0]?.userId) ??
      defaultCover;
    res
      .status(200)
      .set("Cache-Control", "public, max-age=300")
      .type("html")
      .send(
        previewHtml({
          title,
          description,
          image,
          canonical: `${primaryFrontendUrl}/battle/${battle.roomCode}/details`,
          heading: title,
          sub: description,
        }),
      );
  } catch {
    res.status(404).type("html").send(notFoundHtml("Battle"));
  }
}
