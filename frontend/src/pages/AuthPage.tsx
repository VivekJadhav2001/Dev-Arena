import { Github, Chrome, Check } from "lucide-react";
import { Link } from "react-router-dom";
const api = import.meta.env.VITE_BACKEND_URL || "http://localhost:2001/api/v1";
export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="flex flex-col justify-between p-8 lg:p-14">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl font-bold"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-background">
              &lt;/&gt;
            </span>{" "}
            DevArena
          </Link>
          <div className="max-w-md">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-primary">
              Start your journey
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
              Make every commit count.
            </h1>
            <p className="mt-5 text-lg leading-8 text-textMuted">
              Connect your developer profile, uncover your coding DNA, and
              compete with people who love building as much as you do.
            </p>
            <ul className="mt-9 space-y-3 text-sm text-textMuted">
              {[
                "Personal developer DNA",
                "Live coding battles",
                "XP, badges, and rankings",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check size={17} className="text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-textSubtle">
            We use your session cookie; DevArena never exposes OAuth tokens to
            the browser.
          </p>
        </section>
        <section className="flex items-center justify-center bg-surface p-8 lg:p-14">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surfaceElevated p-7 shadow-card sm:p-9">
            <p className="text-sm font-medium text-primary">WELCOME</p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              Join DevArena
            </h2>
            <p className="mt-2 text-textMuted">
              Choose an account to sign in or create your profile.
            </p>
            <div className="mt-8 space-y-3">
              <a
                href={`${api}/auth/github`}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-text px-4 py-3.5 font-semibold text-background"
              >
                <Github size={20} />
                Continue with GitHub
              </a>
              <a
                href={`${api}/auth/google`}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border px-4 py-3.5 font-semibold hover:bg-surfaceRaised"
              >
                <Chrome size={20} />
                Continue with Google
              </a>
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-textSubtle">
              GitHub analysis is available after signing in with a
              GitHub-connected account.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
