import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Code2,
  Swords,
  Trophy,
  Sparkles,
  UserRound,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "My proof", icon: BarChart3 },
  { to: "/wrapped", label: "Wrapped", icon: Sparkles },
  { to: "/arena", label: "Battle", icon: Swords },
  { to: "/leaderboard", label: "Rankings", icon: Trophy },
  { to: "/u/vivek", label: "Profile", icon: UserRound },
];

export function MainLayout() {
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
            {navItems.map(({ to, label, icon: Icon }) => (
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
            to="/u/vivek"
            className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-bold text-white">
              VJ
            </span>
            <span className="hidden sm:block">Level 12</span>
          </NavLink>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
          {navItems.map(({ to, label }) => (
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
    </div>
  );
}
