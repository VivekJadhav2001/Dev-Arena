import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Crown,
  Dna,
  Flame,
  Github,
  Share2,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { setPageMeta } from '../lib/share'
import { ArenaBackdrop } from '../components/landing/ArenaBackdrop'
import { LiveDuelCard } from '../components/landing/LiveDuelCard'

const api = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2001/api/v1'

// Illustrative recent receipts — fixed copy, not a live feed.
const TICKER = [
  'KX7Q2P · anu 340 — ravi 310 · verified',
  'room 8F3N1A · royale · 7 survivors · verified',
  'Q5/5 · closures · answered in 0.8s',
  'mira +48 XP · crown secured',
  'dna minted · “Night Owl” · 214 pushes',
  'royale N2P9QK · fills 6/8 · starts soon',
  'git rebase · 1,204 devs tested this week',
  'receipt #4821 · signed by server',
]

const LOOP = [
  {
    n: '01',
    title: 'Connect GitHub',
    text: 'OAuth in seconds. DevArena reads your repos, languages, streaks and stars — never your code.',
  },
  {
    n: '02',
    title: 'Mint your DNA',
    text: 'Deterministic backend rules turn raw activity into a persona. Same data, same identity. No black box.',
  },
  {
    n: '03',
    title: 'Battle live',
    text: 'Drop a six-character code, gather rivals, and answer server-scored multiple-choice under pressure.',
  },
  {
    n: '04',
    title: 'Flex the proof',
    text: 'Wins, ranks and heat walls land on a public profile you can share anywhere.',
  },
]

const FEATURES = [
  { icon: Dna, title: 'Developer DNA', text: 'Architect, Night Owl, Polyglot — your persona, derived in the open.' },
  { icon: Swords, title: '1v1s & Royales', text: 'Duel one rival or survive an 8-developer free-for-all.' },
  { icon: Sparkles, title: 'Wrapped', text: 'Your year of building as an animated story with PNG export.' },
  { icon: Flame, title: 'Heat walls', text: 'GitHub pushes and LeetCode solves fused into glowing streak maps.' },
  { icon: Trophy, title: 'Rankings', text: 'Server-verified wins only. No selfies, no self-reported stats.' },
  { icon: Share2, title: 'Public proof', text: 'Shareable profiles and battle receipts for LinkedIn and beyond.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  useEffect(() => {
    setPageMeta({
      title: 'DevArena — Proof of Skill, Not Just a Profile',
      description:
        'DevArena turns your GitHub history into Developer DNA, then lets you defend it in live 1v1 coding battles. Server-verified wins, XP, badges and rankings.',
      image: 'https://dev-arena-plum.vercel.app/og-cover.png',
      url: 'https://dev-arena-plum.vercel.app/',
    })
  }, [])

  return (
    <div className="min-h-screen overflow-hidden text-text">
      {/* ── Nav ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="hover-target flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-background shadow-glow">
              <Braces size={20} />
            </span>
            DevArena
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-textMuted md:flex">
            <Link to="/arena" className="hover-target transition hover:text-text">Arena</Link>
            <Link to="/leaderboard" className="hover-target transition hover:text-text">Rankings</Link>
            <Link to="/wrapped" className="hover-target transition hover:text-text">Wrapped</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hover-target hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-textMuted transition hover:text-text sm:block"
            >
              Login
            </Link>
            <a
              href={`${api}/auth/github`}
              className="hover-target inline-flex items-center gap-2 rounded-xl bg-text px-4 py-2.5 text-sm font-bold text-background transition hover:brightness-110"
            >
              <Github size={16} />
              Sign in
            </a>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pb-14 pt-28">
        <ArenaBackdrop />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
          {/* Left: copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="hover-target inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-[.2em] text-primary">
                <Zap size={13} />
                SEASON 01 — PROOF OF SKILL
              </span>
              <span className="hidden items-center gap-2 font-mono text-[11px] tracking-wider text-textSubtle sm:inline-flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                servers nominal · 42ms median verify
              </span>
            </motion.div>

            <h1 className="mt-7 font-display font-extrabold leading-[.92] tracking-tight">
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="block text-[13vw] text-text sm:text-7xl lg:text-8xl"
              >
                YOUR COMMITS
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.37, ease: [0.22, 1, 0.36, 1] }}
                className="relative block w-fit text-[13vw] text-primary sm:text-7xl lg:text-8xl"
              >
                ARE THE ARENA.
                {/* hand-drawn underline — the one imperfect detail */}
                <svg
                  viewBox="0 0 320 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-primary/60"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5 C 60 3, 140 10, 200 6.5 S 290 4, 317 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-7 max-w-xl text-lg leading-8 text-textMuted"
            >
              DevArena turns GitHub history and LeetCode grind into a living battle
              record — then lets you defend it live against other developers.
              Five questions. Sixty seconds. Winner signed by the server.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.62 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <a
                href={`${api}/auth/github`}
                className="hover-target group inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-4 font-bold text-background shadow-glow transition hover:brightness-110"
              >
                <Github size={19} />
                Connect GitHub
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                to="/arena"
                className="hover-target inline-flex items-center gap-2 rounded-2xl border border-border bg-surface/70 px-7 py-4 font-semibold backdrop-blur transition hover:border-primary/50 hover:text-primary"
              >
                <Swords size={18} />
                Enter the Arena
              </Link>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.72 }}
              className="mt-4 font-mono text-[11.5px] tracking-wide text-textSubtle"
            >
              * free · ~40s setup · tokens never touch the browser
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border/60 pt-7"
            >
              {[
                ['5', 'MCQs per battle'],
                ['8', 'player royales'],
                ['100%', 'server-verified'],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="font-mono text-3xl font-bold text-text sm:text-4xl">{n}</p>
                  <p className="mt-1 text-[13px] text-textMuted">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: live duel receipt */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
          >
            {/* soft pool of light under the card */}
            <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/[0.07] blur-2xl" aria-hidden="true" />
            <div className="animate-float">
              <LiveDuelCard />
            </div>
            {/* hand-placed sticky chips */}
            <div className="absolute -left-4 -top-4 -rotate-3 rounded-xl border border-border bg-surfaceElevated/95 px-3 py-2 font-mono text-[11px] text-textMuted shadow-card backdrop-blur sm:-left-8">
              <span className="text-primary">▲</span> dna minted · “Night Owl”
            </div>
            <div className="absolute -bottom-4 -right-2 rotate-2 rounded-xl border border-primary/30 bg-surfaceElevated/95 px-3 py-2 font-mono text-[11px] text-text shadow-card backdrop-blur sm:-right-6">
              +48 XP · crown secured
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] font-medium tracking-[.3em] text-textSubtle md:flex"
        >
          SCROLL
          <span className="block h-8 w-px bg-gradient-to-b from-primary to-transparent" />
        </motion.div>
      </section>

      {/* ── Battle ticker ───────────────────────────────── */}
      <div className="group relative overflow-hidden border-y border-border/60 bg-surface/50 py-3 backdrop-blur">
        <div className="landing-ticker flex w-max gap-10 whitespace-nowrap group-hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="flex items-center gap-10 font-mono text-xs tracking-wide text-textMuted">
              {item}
              <span className="text-primary/60">◆</span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* ── The loop ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="flex items-center gap-3 font-mono text-xs font-medium tracking-[.25em] text-primary">
            <span className="h-px w-8 bg-primary/60" /> THE LOOP
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            From quiet pushes to loud victories.
          </h2>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((step, i) => (
            <motion.div
              key={step.n}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="hover-target group relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-7 backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="font-mono text-sm font-medium tracking-widest text-textSubtle transition-colors group-hover:text-primary">
                /{step.n}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-textMuted">{step.text}</p>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition-colors duration-500 group-hover:bg-primary/20" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Modes ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="hover-target group relative overflow-hidden rounded-3xl border border-border bg-surface p-9 sm:p-12"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <p className="font-mono text-xs tracking-[.25em] text-textSubtle">MODE — 1V1</p>
            <h3 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Duels.</h3>
            <p className="mt-4 max-w-md leading-7 text-textMuted">
              You against one rival. One room code, five questions, sixty seconds
              of reputation on the line.
            </p>
            <Link to="/arena" className="mt-7 inline-flex items-center gap-2 font-bold text-primary">
              Start a duel <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="hover-target group relative overflow-hidden rounded-3xl border border-border bg-surface p-9 sm:p-12"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <p className="font-mono text-xs tracking-[.25em] text-textSubtle">MODE — UP TO 8</p>
            <h3 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Royales.</h3>
            <p className="mt-4 max-w-md leading-7 text-textMuted">
              Up to eight developers. Live standings. One survivor at the top of
              the leaderboard.
            </p>
            <Link to="/arena" className="mt-7 inline-flex items-center gap-2 font-bold text-secondary">
              Start a royale <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <Users size={120} className="pointer-events-none absolute -bottom-6 -right-6 text-text/[0.04]" />
          </motion.div>
        </div>
      </section>

      {/* ── Arsenal ─────────────────────────────────────── */}
      <section className="border-t border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="flex items-center gap-3 font-mono text-xs font-medium tracking-[.25em] text-primary">
              <span className="h-px w-8 bg-primary/60" /> THE ARSENAL
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Everything proof needs.
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="hover-target rounded-3xl border border-border bg-background/60 p-7 transition-colors hover:border-primary/40"
              >
                <feature.icon size={22} className="text-primary" />
                <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-textMuted">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="hover-target relative overflow-hidden rounded-[2.5rem] border border-border bg-surface px-8 py-16 text-center sm:px-16 sm:py-24"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgb(232 234 242 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(232 234 242 / 0.04) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent 75%)',
            }}
          />
          <Crown size={34} className="relative mx-auto text-primary" />
          <h2 className="relative mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            Stop pushing to the void. Start collecting crowns.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-textMuted">
            Your work already tells a story. DevArena just gives it a scoreboard.
          </p>
          <a
            href={`${api}/auth/github`}
            className="hover-target relative mt-9 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-background shadow-glow transition hover:brightness-110"
          >
            <Github size={19} />
            Connect GitHub — it&apos;s free
          </a>
          <p className="relative mt-4 font-mono text-[11px] tracking-wide text-textSubtle">OAuth-ready · tokens never touch the browser</p>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <span className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm text-background">{'</>'}</span>
            DevArena
          </span>
          <div className="flex gap-6 text-sm text-textMuted">
            <Link to="/arena" className="hover-target transition hover:text-text">Arena</Link>
            <Link to="/leaderboard" className="hover-target transition hover:text-text">Rankings</Link>
            <Link to="/dashboard" className="hover-target transition hover:text-text">Dashboard</Link>
          </div>
          <p className="font-mono text-[11px] tracking-wide text-textSubtle">proof of skill, not just a profile · s01</p>
        </div>
      </footer>
    </div>
  )
}
