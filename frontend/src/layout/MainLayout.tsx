import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Code2,
  Swords,
  Trophy,
  Sparkles,
  UserRound,
  Inbox,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChallengeNotifications } from "../components/challenges/ChallengeNotifications";
import { LeetCodeUsernameModal } from "../components/leetcode/LeetCodeUsernameModal";
import { useAppStore } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";

const navItems = [
  { to: "/dashboard", label: "My proof", icon: BarChart3 },
  { to: "/wrapped", label: "Wrapped", icon: Sparkles },
  { to: "/arena", label: "Battle", icon: Swords },
  { to: "/challenges", label: "Requests", icon: Inbox },
  { to: "/leaderboard", label: "Rankings", icon: Trophy },
];

export function MainLayout() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const bootstrap = useAppStore((s) => s.bootstrap);
  // The layout persists across route changes, so the session is validated
  // once here instead of on every page. Heavy app data (DNA, dashboard,
  // battle history) is bootstrapped right after authentication.
  useEffect(() => {
    void useAuthStore.getState().checkSession();
  }, []);
  useEffect(() => {
    if (user) void bootstrap(user.id);
  }, [user, bootstrap]);
  // Auto-prompt for the LeetCode username once per session when it is missing.
  const [leetcodeDismissed, setLeetcodeDismissed] = useState(false);
  const showLeetCodePrompt = !loading && !!user && !user.leetcodeUsername && !leetcodeDismissed;
  const profilePath = user ? `/u/${user.userName}` : "/dashboard";
  const items = [...navItems, { to: profilePath, label: "Profile", icon: UserRound }];
  return (
    <div className="min-h-screen text-text">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-background">
              <Code2 size={20} />
            </span>
            DevArena
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-surfaceRaised text-primary" : "text-textMuted hover:bg-surface hover:text-text"}`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to={profilePath}
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-bold text-white">
                {(user?.userName?.[0] ?? 'D').toUpperCase()}
              </span>
            )}
            <span className="hidden sm:block">Level {user?.level ?? '–'}</span>
          </NavLink>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-surfaceRaised text-primary" : "text-textMuted"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <ChallengeNotifications />
      {showLeetCodePrompt && (
        <LeetCodeUsernameModal onClose={() => setLeetcodeDismissed(true)} />
      )}
    </div>
  );
}
