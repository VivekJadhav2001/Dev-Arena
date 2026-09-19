import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Code2,
  Swords,
  Trophy,
  Sparkles,
  UserRound,
  LogOut,
  Radio,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { JoinRequestNotifications } from "../components/live/JoinRequestNotifications";
import { LiveBattleNotifications } from "../components/live/LiveBattleNotifications";
import { LeetCodeUsernameModal } from "../components/leetcode/LeetCodeUsernameModal";
import { arenaService } from "../services/arena.service";
import { useAppStore } from "../store/app.store";
import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";

const navItems = [
  { to: "/dashboard", label: "My proof", icon: BarChart3 },
  { to: "/wrapped", label: "Wrapped", icon: Sparkles },
  { to: "/arena", label: "Battle", icon: Swords },
  { to: "/live", label: "Live", icon: Radio },
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
  // Theme gallery loads once; the saved user theme wins over local state.
  useEffect(() => {
    void useThemeStore.getState().loadThemes();
  }, []);
  useEffect(() => {
    if (user) useThemeStore.getState().syncWithUser(user.settings?.themeId);
  }, [user]);
  // Auto-prompt for the LeetCode username once per session when it is missing.
  const [leetcodeDismissed, setLeetcodeDismissed] = useState(false);
  const showLeetCodePrompt = !loading && !!user && !user.leetcodeUsername && !leetcodeDismissed;
  const profilePath = user ? `/u/${user.userName}` : "/dashboard";
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };
  // Navbar "Live" badge: best-effort count of watchable battles, polled quietly.
  const [liveCount, setLiveCount] = useState<number | null>(null);
  useEffect(() => {
    if (!user) {
      // Best-effort navbar badge reset on logout (external live-count cache).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiveCount(null);
      return;
    }
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const data = await arenaService.getLiveBattles();
        if (!cancelled) setLiveCount(data.total);
      } catch {
        if (!cancelled) setLiveCount(null);
      }
    };
    void fetchLive();
    const timer = window.setInterval(() => void fetchLive(), 20000);
    // A just-started battle bumps the badge instantly instead of waiting
    // for the next poll (best-effort; the poll stays the source of truth).
    const onLiveStarted = () =>
      setLiveCount((prev) => (prev == null ? prev : prev + 1));
    window.addEventListener("live:battle-started", onLiveStarted);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("live:battle-started", onLiveStarted);
    };
  }, [user]);
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
                  `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-surfaceRaised text-primary" : "text-textMuted hover:bg-surface hover:text-text"}`
                }
              >
                <Icon size={16} />
                {label}
                {to === "/live" && liveCount != null && liveCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {liveCount > 9 ? "9+" : liveCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm hover:border-borderHover"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-bold text-white">
                  {(user?.userName?.[0] ?? 'D').toUpperCase()}
                </span>
              )}
              <span className="hidden sm:block">Level {user?.level ?? '–'}</span>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surfaceElevated py-1 shadow-card"
              >
                <NavLink
                  to={profilePath}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-textMuted hover:bg-surface hover:text-text"
                >
                  <UserRound size={15} /> Profile
                </NavLink>
                <NavLink
                  to="/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-textMuted hover:bg-surface hover:text-text"
                >
                  <SettingsIcon size={15} /> Settings
                </NavLink>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-textMuted hover:bg-surface hover:text-text"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
          <NavLink
            to="/settings"
            title="Settings"
            aria-label="Settings"
            className={({ isActive }) =>
              `grid h-9 w-9 place-items-center rounded-xl border transition ${isActive ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-surface text-textMuted hover:border-borderHover hover:text-text"}`
            }
          >
            <SettingsIcon size={17} />
          </NavLink>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-surfaceRaised text-primary" : "text-textMuted"}`
              }
            >
              {label}
              {to === "/live" && liveCount != null && liveCount > 0 && (
                <span className="ml-1 inline-grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 align-middle text-[10px] font-bold text-white">
                  {liveCount > 9 ? "9+" : liveCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <JoinRequestNotifications />
      <LiveBattleNotifications />
      {showLeetCodePrompt && (
        <LeetCodeUsernameModal onClose={() => setLeetcodeDismissed(true)} />
      )}
    </div>
  );
}
