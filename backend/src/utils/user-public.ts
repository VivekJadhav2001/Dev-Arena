import type { IUser } from "../models/user.model.js";

/** Deliberately excludes OAuth tokens and provider internals from all API responses. */
export function toPublicUser(user: IUser & { _id: { toString(): string } }) {
  return {
    id: user._id.toString(),
    userName: user.userName,
    username: user.userName,
    email: user.settings.showEmail ? user.email ?? null : null,
    avatarUrl: user.avatarUrl ?? null,
    provider: user.provider,
    githubId: user.githubId ?? null,
    googleId: user.googleId ?? null,
    persona: user.persona,
    personaReason: user.personaReason,
    level: user.level,
    xp: user.xp,
    totalXp: user.totalXp,
    rank: user.rank,
    githubStats: user.githubStats,
    battleStats: user.battleStats,
    badges: user.badges,
    settings: user.settings,
    nearbyLocation: user.nearbyLocation,
    lastActiveAt: user.lastActiveAt,
    joinedAt: user.joinedAt,
  };
}
